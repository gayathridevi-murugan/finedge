const express = require('express');
const router = express.Router();
const { paymentService, orderService } = require('../services');
const { asyncHandler } = require('../middleware/errorHandler');
const axios = require('axios');

// Create payment session (returns checkout URL for Surfboard hosted page)
router.post('/create-session', asyncHandler(async (req, res) => {
  const { order_id, amount, payment_method, return_url, cancel_url } = req.body;

  if (!order_id || !amount) {
    return res.status(400).json({
      success: false,
      error: { message: 'order_id and amount are required' }
    });
  }

  const order = await orderService.getOrder(order_id);
  if (!order) {
    return res.status(404).json({
      success: false,
      error: { message: 'Order not found' }
    });
  }

  // Initialize payment in database
  const payment = await paymentService.initiatePayment(
    order_id,
    amount,
    payment_method || 'CREDIT_CARD'
  );

  // If Surfboard is enabled, create hosted checkout session
  if (process.env.SURFBOARD_API_KEY) {
    try {
      console.log('Creating Surfboard hosted payment session...');

      const surfboardResponse = await axios.post(
        `${process.env.SURFBOARD_BASE_URL}/api/v1/checkout-sessions`,
        {
          merchant_id: process.env.SURFBOARD_MERCHANT_ID,
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'SEK',
          order_id: order_id,
          payment_method: payment_method || 'CREDIT_CARD',
          return_url: return_url || `http://localhost:3000/checkout/success?order_id=${order_id}`,
          cancel_url: cancel_url || `http://localhost:3000/checkout/cancel?order_id=${order_id}`,
          metadata: {
            order_number: order.order_number,
            timestamp: new Date().toISOString()
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.SURFBOARD_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (surfboardResponse.data.checkout_url) {
        return res.json({
          success: true,
          data: {
            message: 'Payment session created - redirect to Surfboard',
            payment_id: payment.id,
            checkout_url: surfboardResponse.data.checkout_url,
            session_id: surfboardResponse.data.session_id,
            redirect: true
          }
        });
      }
    } catch (error) {
      console.warn('Surfboard hosted checkout failed:', error.message);
      // Fall through to simulated payment
    }
  }

  // Fallback: return demo checkout URL
  const demoCheckoutUrl = `http://localhost:3000/checkout/demo?payment_id=${payment.id}&order_id=${order_id}&amount=${amount}`;

  res.json({
    success: true,
    data: {
      message: 'Demo payment session created - Surfboard API not configured',
      payment_id: payment.id,
      checkout_url: demoCheckoutUrl,
      mode: 'DEMO',
      redirect: true
    }
  });
}));

// Process payment (called after customer completes payment on Surfboard)
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
      transaction_id: payment.transaction_id,
      payment_method: payment.payment_method,
      created_at: payment.createdAt
    }
  });
}));

// Refund payment
router.post('/:order_id/refund', asyncHandler(async (req, res) => {
  const { order_id } = req.params;
  const { reason } = req.body;

  const payment = await paymentService.refundPayment(order_id, reason);

  res.json({
    success: true,
    data: {
      message: 'Payment refunded successfully',
      payment: {
        id: payment.id,
        order_id: payment.order_id,
        amount: parseFloat(payment.amount),
        status: payment.status,
        transaction_id: payment.transaction_id,
        refund_reason: payment.refund_reason
      }
    }
  });
}));

// Get Surfboard integration status
router.get('/status/surfboard', asyncHandler(async (req, res) => {
  const status = paymentService.getSurfboardStatus();

  res.json({
    success: true,
    data: {
      surfboard_status: status,
      message: status.enabled
        ? 'Connected to real Surfboard API'
        : 'Using simulated payments (Surfboard API keys not configured)'
    }
  });
}));

module.exports = router;
