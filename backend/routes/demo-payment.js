const express = require('express');
const router = express.Router();
const { Payment, Order } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');

// Demo payment verification endpoint
// This simulates what Surfboard would call after customer completes payment
router.post('/verify-demo', asyncHandler(async (req, res) => {
  const { payment_id, order_id, amount, status } = req.body;

  if (!payment_id || !order_id) {
    return res.status(400).json({
      success: false,
      message: 'payment_id and order_id are required'
    });
  }

  const payment = await Payment.findByPk(payment_id);
  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  const order = await Order.findByPk(order_id);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Simulate payment success/failure
  const isSuccess = status === 'SUCCESS' || Math.random() < 0.9;
  const transactionId = `SIM_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  if (isSuccess) {
    await payment.update({
      status: 'CAPTURED',
      transaction_id: transactionId
    });

    await order.update({
      payment_status: 'PAID',
      transaction_id: transactionId
    });

    return res.json({
      success: true,
      message: 'Demo payment verified successfully',
      data: {
        payment_id: payment.id,
        order_id: order.id,
        status: 'CAPTURED',
        transaction_id: transactionId
      }
    });
  } else {
    await payment.update({
      status: 'FAILED',
      error_message: 'Demo payment declined'
    });

    await order.update({
      payment_status: 'FAILED'
    });

    return res.json({
      success: false,
      message: 'Demo payment declined',
      data: {
        payment_id: payment.id,
        order_id: order.id,
        status: 'FAILED',
        error_message: 'Payment declined'
      }
    });
  }
}));

// Webhook endpoint for Surfboard to call (in production)
router.post('/webhook', asyncHandler(async (req, res) => {
  const { event_type, data } = req.body;

  console.log('Payment webhook received:', event_type);

  if (event_type === 'payment.completed') {
    const { payment_id, transaction_id, order_id, amount, status } = data;

    const payment = await Payment.findByPk(payment_id);
    if (payment) {
      await payment.update({
        status: status === 'completed' ? 'CAPTURED' : 'FAILED',
        transaction_id: transaction_id
      });

      const order = await Order.findByPk(order_id);
      if (order) {
        await order.update({
          payment_status: status === 'completed' ? 'PAID' : 'FAILED',
          transaction_id: transaction_id
        });
      }
    }

    return res.json({
      success: true,
      message: 'Webhook processed'
    });
  }

  res.json({
    success: true,
    message: 'Webhook received'
  });
}));

module.exports = router;
