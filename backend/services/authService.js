import jwt from 'jsonwebtoken';
import * as userRepository from '../repositories/userRepository.js';
import AuditLog from '../models/AuditLog.js';
import { sendEmail } from '../utils/emailService.js';

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

export const forgotPassword = async (email) => {
  const user = await userRepository.findByEmail(email);
  if (!user || !user.isActive) {
    throw new Error('User not found or inactive');
  }

  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  user.resetPasswordToken = otp;
  // Set expiry to 1 hour from now
  user.resetPasswordExpires = Date.now() + 3600000;
  await user.save();

  console.log(`\n=========================================`);
  console.log(`[MOCK EMAIL] Password Reset OTP for ${email}: ${otp}`);
  console.log(`=========================================\n`);

  try {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #F97316;">OBCP Portal - Password Reset</h2>
        <p>Hello ${user.name},</p>
        <p>You recently requested to reset your password for your OBCP Portal account.</p>
        <p>Your 6-digit OTP is:</p>
        <h1 style="font-size: 32px; letter-spacing: 5px; color: #1e293b; background: #f1f5f9; padding: 10px 20px; border-radius: 8px; display: inline-block;">${otp}</h1>
        <p>This OTP will expire in 1 hour.</p>
        <p>If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
        <p>Thanks,<br>OBCP Portal Team</p>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: 'Password Reset OTP - OBCP Portal',
      message: `Your OTP for password reset is ${otp}. It will expire in 1 hour.`,
      html: emailHtml
    });
  } catch (err) {
    // If email sending fails, we might want to clear the token and throw
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    throw new Error('There was an error sending the OTP email. Please try again later.');
  }

  return { message: 'OTP sent to your email' };
};

export const resetPassword = async (email, otp, newPassword) => {
  const user = await userRepository.findByEmail(email);
  if (!user || !user.isActive) {
    throw new Error('User not found or inactive');
  }

  if (user.resetPasswordToken !== otp) {
    throw new Error('Invalid OTP');
  }

  if (user.resetPasswordExpires < Date.now()) {
    throw new Error('OTP has expired');
  }

  user.password = newPassword;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  return { message: 'Password has been reset successfully' };
};
