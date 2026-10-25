const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

/**
 * JWT Authentication Middleware
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'college-erp-super-secret-jwt-key-2024');

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId || decoded.id },
      include: {
        student: true,
        staff: true,
        alumni: true,
        companyUser: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User account not found or deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Role-Based Access Control Middleware
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access forbidden: requires role [${roles.join(', ')}]` });
    }
    next();
  };
};

module.exports = {
  authenticate,
  requireRole
};
