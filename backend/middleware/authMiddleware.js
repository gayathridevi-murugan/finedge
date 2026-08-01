const authService = require('../services/authService');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Access token required' }
    });
  }

  try {
    const decoded = authService.verifyToken(token);
    req.customerId = decoded.customer_id;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: { message: 'Invalid or expired token' }
    });
  }
};

module.exports = { authenticateToken };
