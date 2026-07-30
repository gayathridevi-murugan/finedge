const express = require('express');
const router = express.Router();
const { paymentService, orderService } = require('../services');
const { asyncHandler } = require('../middleware/errorHandler');

router.post('/process', asyncHandler(async (req, res) => {
  const { order_id, amount, payment_method } = req.body;

  if (!order_id || !amount) {
    return res.status(400).json({
      success: false,
      error: { message: 'order_id and amount are required' }
    });
  }

  const payment = await paymentService.processPaymentWithSurfboard(
    order_id,
    amount,
    payment_method || 'CREDIT_CARD'
  );

  const order = await orderService.getOrder(order_id);

  res.json({
    success: payment.status === 'CAPTURED',
    data: {
      message: payment.status === 'CAPTURED' ? 'Payment successful' : 'Payment failed',
      payment: {
        id: payment.id,
        order_id: payment.order_id,
        amount: parseFloat(payment.amount),
        status: payment.status,
        transaction_id: payment.transaction_id
      },
      order: {
        id: order.id,
        order_number: order.order_number,
        payment_status: order.payment_status,
        total_amount: parseFloat(order.total_amount)
      }
    }
  });
}));

router.get('/:order_id', asyncHandler(async (req, res) => {
  const { order_id } = req.params;
  const payment = await paymentService.getPayment(order_id);

  if (!payment) {
    return res.status(404).json({
      success: false,
      error: { message: 'Payment not found' }
    });
  }

  res.json({
    success: true,
    data: {
      id: payment.id,
      order_id: payment.order_id,
      amount: parseFloat(payment.amount),
      status: payment.status,
      transaction_id: payment.transaction_id
    }
  });
}));

module.exports = router;
