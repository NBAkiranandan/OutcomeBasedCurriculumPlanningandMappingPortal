import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'aditya_university_secret_obcpm_portal_2026_xyz';

// Authenticate JWT Token Middleware
export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required. Access denied.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      role: decoded.role,
      departmentId: decoded.departmentId,
      programId: decoded.programId,
      email: decoded.email,
      name: decoded.name
    };
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token. Access denied.' });
  }
};

// Role-Based Access Control (RBAC) Guard Middleware
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: Access restricted. Required roles: [${roles.join(', ')}]. Current role: ${req.user.role}` 
      });
    }

    next();
  };
};
