const express = require('express');
const router = express.Router();
const { authService } = require('../services');
const { authenticateToken } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

// Register new customer
router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      error: { message: 'email, password, and name are required' }
    });
  }

  const result = await authService.registerCustomer(email, password, name);

  res.status(201).json({
    success: true,
    data: {
      message: 'Customer registered successfully',
      customer: result.customer,
      token: result.token
    }
  });
}));

// Login customer
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: { message: 'email and password are required' }
    });
  }

  const result = await authService.loginCustomer(email, password);

  res.json({
    success: true,
    data: {
      message: 'Login successful',
      customer: result.customer,
      token: result.token
    }
  });
}));

// Get current customer profile
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const profile = await authService.getCustomerProfile(req.customerId);

  res.json({
    success: true,
    data: {
      customer: profile
    }
  });
}));

// Update customer profile
router.put('/me', authenticateToken, asyncHandler(async (req, res) => {
  const { name, phone, address } = req.body;

  const updatedProfile = await authService.updateCustomerProfile(req.customerId, {
    name,
    phone,
    address
  });

  res.json({
    success: true,
    data: {
      message: 'Profile updated successfully',
      customer: updatedProfile
    }
  });
}));

// Refresh token
router.post('/refresh', authenticateToken, asyncHandler(async (req, res) => {
  const newToken = authService.generateToken(req.customerId);

  res.json({
    success: true,
    data: {
      message: 'Token refreshed successfully',
      token: newToken
    }
  });
}));

module.exports = router;
