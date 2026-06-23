import * as authService from '../services/authService.js';
import * as userRepository from '../repositories/userRepository.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '';
    const result = await authService.loginUser(email, password, ipAddress);
    return res.status(200).json(result);
  } catch (error) {
    // Known auth failures (invalid credentials, inactive account) return 401
    const authErrors = [
      'Invalid email or inactive user account.',
      'Invalid password credential.'
    ];
    if (authErrors.includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }

    // Handle unexpected auth errors gracefully so frontend receives JSON
    console.error('[Auth Login Error]', error.message, error.stack);
    return res.status(500).json({ message: 'Login failed due to a server error. Please try again.' });
  }
};

export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await authService.logoutUser(req.user.id);
    }
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    return next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }
    const result = await authService.refreshSession(refreshToken);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await userRepository.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User profile not found.' });
    }
    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
};

export const getFaculty = async (req, res, next) => {
  try {
    let deptId = req.user.departmentId;

    // If departmentId wasn't in the JWT payload, fetch it from DB
    if (!deptId) {
      const userRecord = await userRepository.findById(req.user.id);
      deptId = userRecord?.departmentId?._id || userRecord?.departmentId;
    }

    if (!deptId) {
      return res.status(400).json({ message: 'Department context required. HOD must be assigned to a department.' });
    }
    const faculty = await userRepository.findFacultyByDepartment(deptId);
    return res.status(200).json({ faculty });
  } catch (error) {
    return next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required.' });
    }

    const user = await userRepository.findByIdWithPassword(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    // Assign new password, Mongoose pre-save hook will hash it automatically
    user.password = newPassword;
    await user.save();

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    return next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }
    const result = await authService.forgotPassword(email);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
    }
    const result = await authService.resetPassword(email, otp, newPassword);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

