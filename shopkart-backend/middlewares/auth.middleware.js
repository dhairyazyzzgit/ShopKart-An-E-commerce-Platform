import jwt from 'jsonwebtoken';
import Customer from '../models/customer.model.js';

export const protectRoute = async (req, res, next) => {
  try {
    // Look for JWT token in cookies ('jwt' or 'token') or Authorization Header
    let token = req.cookies?.jwt || req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const userId = decoded.id || decoded.userId || decoded._id;

    req.user = await Customer.findById(userId).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed.'
    });
  }
};

// Aliases to prevent import/export mismatches
export const protect = protectRoute;
export const verifyToken = protectRoute;