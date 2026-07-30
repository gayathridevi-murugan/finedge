const express = require('express');
const router = express.Router();
const { loyaltyService } = require('../services');
const { asyncHandler } = require('../middleware/errorHandler');

router.post('/add-points', asyncHandler(async (req, res) => {
  const { customer_id, order_id, points } = req.body;

  if (!customer_id || !points) {
    return res.status(400).json({
      success: false,
      error: { message: 'customer_id and points are required' }
    });
  }

  const customer = await loyaltyService.addLoyaltyPoints(customer_id, order_id, points);

  res.json({
    success: true,
    data: {
      message: 'Loyalty points added',
      customer: {
        id: customer.id,
        points: customer.loyalty_points,
        tier: customer.loyalty_tier
      }
    }
  });
}));

router.get('/balance/:customer_id', asyncHandler(async (req, res) => {
  const { customer_id } = req.params;
  const balance = await loyaltyService.getLoyaltyBalance(customer_id);

  res.json({
    success: true,
    data: {
      customer_id,
      points: balance.points,
      tier: balance.tier
    }
  });
}));

module.exports = router;
