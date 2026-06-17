import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

export const getUsers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'HOD') {
      filter.departmentId = req.user.departmentId;
      filter.role = { $in: ['Coordinator', 'Faculty'] }; // HOD can only view coordinators/faculty
    }

    const users = await User.find(filter)
      .populate('departmentId')
      .populate('programId')
      .select('-password')
      .sort({ createdAt: -1 });
    return res.status(200).json({ users });
  } catch (error) {
    return next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, departmentId, programId } = req.body;

    if (req.user.role === 'HOD') {
      if (role !== 'Faculty' && role !== 'Coordinator') {
        return res.status(403).json({ message: 'Forbidden: HOD can only create Faculty or Coordinator accounts.' });
      }
      if (departmentId && departmentId.toString() !== req.user.departmentId?.toString()) {
        return res.status(403).json({ message: 'Forbidden: HOD can only create users in their own department.' });
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const newUser = new User({
      name,
      email,
      password, // Hashed in pre-save hook of model
      role,
      departmentId: req.user.role === 'HOD' ? req.user.departmentId : (departmentId || null),
      programId: req.user.role === 'HOD' ? req.user.programId : (programId || null),
      isActive: true
    });

    await newUser.save();

    // Log action
    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'CREATE_USER',
      details: `Created new user: ${name} (${email}) with role [${role}]`,
      category: 'Security'
    });

    const userObj = newUser.toObject();
    delete userObj.password;

    return res.status(201).json({ user: userObj, message: 'User created successfully.' });
  } catch (error) {
    return next(error);
  }
};

export const createBulkUsers = async (req, res, next) => {
  try {
    const usersData = req.body.users; // Array of user objects
    if (!Array.isArray(usersData) || usersData.length === 0) {
      return res.status(400).json({ message: 'Invalid or empty users array.' });
    }

    if (req.user.role === 'HOD') {
      return res.status(403).json({ message: 'Forbidden: Only Admins can perform bulk user uploads.' });
    }

    const createdUsers = [];
    const errors = [];

    // Process sequentially to properly trigger pre-save hooks and handle duplicates cleanly
    for (let i = 0; i < usersData.length; i++) {
      const { name, email, password, role, departmentId, programId } = usersData[i];
      try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          errors.push(`Row ${i + 1}: User with email ${email} already exists.`);
          continue;
        }

        const newUser = new User({
          name,
          email,
          password: password || 'temp123', // Default temporary password
          role: role || 'Faculty',
          departmentId: departmentId || null,
          programId: programId || null,
          isActive: true
        });

        await newUser.save();
        createdUsers.push(newUser.email);
      } catch (err) {
        errors.push(`Row ${i + 1} (${email}): ${err.message}`);
      }
    }

    // Log action
    if (createdUsers.length > 0) {
      await AuditLog.create({
        userId: req.user.id,
        userName: req.user.name,
        userEmail: req.user.email,
        action: 'CREATE_BULK_USERS',
        details: `Bulk created ${createdUsers.length} users.`,
        category: 'Security'
      });
    }

    return res.status(201).json({
      message: `Successfully created ${createdUsers.length} users.`,
      createdCount: createdUsers.length,
      errors
    });
  } catch (error) {
    return next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, departmentId, programId, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (req.user.role === 'HOD') {
      if (user.departmentId?.toString() !== req.user.departmentId?.toString()) {
        return res.status(403).json({ message: 'Forbidden: HOD can only manage users in their own department.' });
      }
      if (role && role !== 'Faculty' && role !== 'Coordinator') {
        return res.status(403).json({ message: 'Forbidden: HOD can only assign Faculty or Coordinator roles.' });
      }
      if (departmentId && departmentId.toString() !== req.user.departmentId?.toString()) {
        return res.status(403).json({ message: 'Forbidden: HOD cannot reassign departments.' });
      }
    }

    user.name = name ?? user.name;
    user.email = email ?? user.email;
    user.role = role ?? user.role;
    user.departmentId = departmentId !== undefined ? departmentId : user.departmentId;
    user.programId = programId !== undefined ? programId : user.programId;
    user.isActive = isActive !== undefined ? isActive : user.isActive;

    if (req.body.password) {
      user.password = req.body.password; // Triggers pre-save hash hook
    }

    await user.save();

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'UPDATE_USER',
      details: `Updated user profile: ${user.name} (${user.email})`,
      category: 'Security'
    });

    const userObj = user.toObject();
    delete userObj.password;

    return res.status(200).json({ user: userObj, message: 'User profile updated successfully.' });
  } catch (error) {
    return next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (req.user.role === 'HOD') {
      if (user.departmentId?.toString() !== req.user.departmentId?.toString()) {
        return res.status(403).json({ message: 'Forbidden: HOD can only manage users in their own department.' });
      }
    }

    // Toggle active status
    user.isActive = !user.isActive;
    await user.save();

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: user.isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
      details: `${user.isActive ? 'Activated' : 'Deactivated'} user: ${user.name} (${user.email})`,
      category: 'Security'
    });

    return res.status(200).json({ 
      user: { id: user._id, isActive: user.isActive }, 
      message: `User accounts successfully ${user.isActive ? 'activated' : 'deactivated'}.` 
    });
  } catch (error) {
    return next(error);
  }
};
