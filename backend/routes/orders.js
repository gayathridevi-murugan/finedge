const express = require('express');
const router = express.Router();
const { orderService, cartService } = require('../services');
const { asyncHandler } = require('../middleware/errorHandler');

router.post('/create', asyncHandler(async (req, res) => {
  const { cart_id, customer_id } = req.body;

  if (!cart_id) {
    return res.status(400).json({
      success: false,
      error: { message: 'cart_id is required' }
    });
  }

  const cart = cartService.getCart(cart_id);
  const order = await orderService.createOrderFromCart(cart_id, cart.items, cart.total_amount, customer_id);

  res.status(201).json({
    success: true,
    data: {
      message: 'Order created successfully',
      order: {
        id: order.id,
        order_number: order.order_number,
        total_amount: parseFloat(order.total_amount),
        payment_status: order.payment_status,
        security_status: order.security_status,
        exit_status: order.exit_status
      }
    }
  });
}));

router.get('/:order_id', asyncHandler(async (req, res) => {
  const { order_id } = req.params;
  const order = await orderService.getOrder(order_id);

  if (!order) {
    return res.status(404).json({
      success: false,
      error: { message: 'Order not found' }
    });
  }

  res.json({
    success: true,
    data: {
      order: {
        id: order.id,
        order_number: order.order_number,
        total_amount: parseFloat(order.total_amount),
        payment_status: order.payment_status,
        items: order.items.map(item => ({
          product_id: item.product_id,
          product_name: item.Product?.name,
          quantity: item.quantity,
          unit_price: parseFloat(item.unit_price),
          subtotal: parseFloat(item.subtotal)
        }))
      }
    }
  });
}));

module.exports = router;
