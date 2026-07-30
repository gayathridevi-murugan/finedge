const express = require('express');
const router = express.Router();
const { receiptService } = require('../services');
const { asyncHandler } = require('../middleware/errorHandler');

router.post('/generate', asyncHandler(async (req, res) => {
  const { order_id, customer_id } = req.body;

  if (!order_id) {
    return res.status(400).json({
      success: false,
      error: { message: 'order_id is required' }
    });
  }

  const receipt = await receiptService.generateReceipt(order_id, customer_id);

  res.json({
    success: true,
    data: {
      message: 'Receipt generated',
      receipt: {
        id: receipt.id,
        number: receipt.receipt_number,
        receipt_number: receipt.receipt_number,
        order_id: receipt.order_id,
        subtotal: parseFloat(receipt.subtotal),
        tax: parseFloat(receipt.tax),
        total_amount: parseFloat(receipt.total_amount),
        loyalty_points_earned: receipt.loyalty_points_earned,
        created_at: receipt.createdAt
      }
    }
  });
}));

router.get('/:receipt_id', asyncHandler(async (req, res) => {
  const { receipt_id } = req.params;
  const receipt = await receiptService.getReceipt(receipt_id);

  if (!receipt) {
    return res.status(404).json({
      success: false,
      error: { message: 'Receipt not found' }
    });
  }

  res.json({
    success: true,
    data: {
      id: receipt.id,
      receipt_number: receipt.receipt_number,
      total_amount: parseFloat(receipt.total_amount)
    }
  });
}));

module.exports = router;
