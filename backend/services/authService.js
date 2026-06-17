import jwt from 'jsonwebtoken';
import * as userRepository from '../repositories/userRepository.js';
import AuditLog from '../models/AuditLog.js';

const JWT_SECRET = process.env.JWT_SECRET || 'aditya_university_secret_obcpm_portal_2026_xyz';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'aditya_university_refresh_secret_obcpm_portal_2026_abc';

export const loginUser = async (email, password, ipAddress = '') => {
  try {
    const user = await userRepository.findByEmail(email);
    if (!user || !user.isActive) {
      throw new Error('Invalid email or inactive user account.');
    }

    let isMatch = false;
    try {
      isMatch = await user.comparePassword(password);
    } catch (error) {
      console.error('[AuthService] Password compare failed:', error.message);
      throw new Error('Invalid password credential.');
    }

    if (!isMatch) {
      throw new Error('Invalid password credential.');
    }

    // Generate tokens
    const payload = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId ? user.departmentId._id : null,
      programId: user.programId ? user.programId._id : null
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
    const refreshToken = jwt.sign({ id: user._id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    // Save refresh token in database
    await userRepository.updateRefreshToken(user._id, refreshToken);

    // Log audit
    try {
      await AuditLog.create({
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        action: 'USER_LOGIN',
        details: `User ${user.name} logged in successfully as role [${user.role}]`,
        ipAddress,
        category: 'Security'
      });
    } catch (auditError) {
      console.warn('[AuthService] Audit log creation failed (non-critical):', auditError.message);
      // Don't throw - audit logging is non-critical
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.departmentId ? { id: user.departmentId._id, name: user.departmentId.name, code: user.departmentId.code } : null,
        program: user.programId ? { id: user.programId._id, name: user.programId.name } : null
      }
    };
  } catch (error) {
    console.error('[AuthService loginUser] Unexpected error:', error);
    throw error;
  }
};

export const logoutUser = async (userId) => {
  await userRepository.updateRefreshToken(userId, null);
  return { message: 'Logged out successfully' };
};

export const refreshSession = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await userRepository.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken || !user.isActive) {
      throw new Error('Session expired or user inactive');
    }

    const payload = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId ? user.departmentId._id : null,
      programId: user.programId ? user.programId._id : null
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
    return { accessToken };
  } catch (error) {
    throw new Error('Session verification failed.');
  }
};
