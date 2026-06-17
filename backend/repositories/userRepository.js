import User from '../models/User.js';

export const findByEmail = async (email) => {
  try {
    return await User.findOne({ email }).populate('departmentId').populate('programId');
  } catch (error) {
    console.error('[UserRepository findByEmail] Database query failed:', error.message);
    throw new Error(`Database error: Unable to find user. ${error.message}`);
  }
};

export const findById = async (id) => {
  return User.findById(id).select('-password').populate('departmentId').populate('programId');
};

export const updateRefreshToken = async (id, refreshToken) => {
  try {
    return await User.findByIdAndUpdate(id, { refreshToken }, { new: true });
  } catch (error) {
    console.error('[UserRepository updateRefreshToken] Update failed:', error.message);
    throw new Error(`Failed to update refresh token: ${error.message}`);
  }
};

export const create = async (userData) => {
  const user = new User(userData);
  return user.save();
};

export const findFacultyByDepartment = async (departmentId) => {
  return User.find({ departmentId, role: { $in: ['Coordinator', 'Faculty'] } }).select('-password');
};

export const findHods = async () => {
  return User.find({ role: 'HOD' }).populate('departmentId').select('-password');
};

export const findByIdWithPassword = async (id) => {
  return User.findById(id).populate('departmentId').populate('programId');
};

