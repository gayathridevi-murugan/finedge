const express = require('express');
const router = express.Router();
const { paymentService, orderService } = require('../services');
const { asyncHandler } = require('../middleware/errorHandler');

// Create a Surfboard-hosted checkout session (Payment Page) and return its checkout URL.
router.post('/create-session', asyncHandler(async (req, res) => {
  const { order_id, amount, return_url, cancel_url } = req.body;

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

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const returnUrl = return_url || `${frontendUrl}/?checkout_result=success&local_order_id=${order_id}`;
  const cancelUrl = cancel_url || `${frontendUrl}/?checkout_result=cancelled&local_order_id=${order_id}`;

  const orderItems = (order.items || []).map(item => ({
    product_id: item.product_id,
    product_name: item.Product?.name,
    quantity: item.quantity,
    unit_price: parseFloat(item.unit_price),
    subtotal: parseFloat(item.subtotal)
  }));

  const session = await paymentService.createSurfboardCheckout(order_id, amount, orderItems, returnUrl, cancelUrl);

  res.json({
    success: true,
    data: {
      message: 'Surfboard checkout session created - redirect to Surfboard',
      payment_id: session.paymentId,
      checkout_url: session.checkoutUrl,
      surfboard_order_id: session.surfboardOrderId
    }
  });
}));

// Resolve our local order id from Surfboard's own order id - used as a fallback on the
// return redirect in case Surfboard's redirect strips our custom query params.
router.get('/lookup/:surfboard_order_id', asyncHandler(async (req, res) => {
  const { surfboard_order_id } = req.params;
  const orderId = await paymentService.findOrderIdBySurfboardOrderId(surfboard_order_id);

  if (!orderId) {
    return res.status(404).json({
      success: false,
      error: { message: 'No local order found for that Surfboard order id' }
    });
  }

  res.json({ success: true, data: { order_id: orderId } });
}));

// Re-verify payment status with Surfboard and finalize the local order/payment.
router.get('/verify/:order_id', asyncHandler(async (req, res) => {
  const { order_id } = req.params;
  const { payment, order } = await paymentService.finalizePaymentFromOrder(order_id);

  res.json({
    success: true,
    data: {
      order_status: order.payment_status,
      payment: {
        id: payment.id,
        amount: parseFloat(payment.amount),
        status: payment.status,
        transaction_id: payment.transaction_id
      },
      order: {
        id: order.id,
        order_number: order.order_number,
        total_amount: parseFloat(order.total_amount),
        payment_status: order.payment_status
      }
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
