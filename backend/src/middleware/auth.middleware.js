import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized - No token provided' } });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized - Invalid token' } });
    }

    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log('Error in requireAuth middleware: ', error.message);
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
      }
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } });
      }
      next();
    } catch (error) {
      console.log('Error in requireRole middleware: ', error.message);
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } });
    }
  };
};

// Backward compatibility export
export const protectRoute = requireAuth;