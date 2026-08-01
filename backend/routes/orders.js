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

  const cart = await cartService.getCart(cart_id);
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

// Get all orders (with optional customer_id filter)
router.get('/', asyncHandler(async (req, res) => {
  const { Order, Customer } = require('../models');
  const { customer_id, page = 1, limit = 10 } = req.query;

  const where = {};
  if (customer_id) where.customer_id = customer_id;

  const offset = (page - 1) * limit;
  const { count, rows } = await Order.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
    include: [{ model: Customer, as: 'Customer' }]
  });

  res.json({
    success: true,
    data: {
      orders: rows.map(order => ({
        id: order.id,
        order_number: order.order_number,
        customer_name: order.Customer?.name,
        total_amount: parseFloat(order.total_amount),
        payment_status: order.payment_status,
        exit_status: order.exit_status,
        created_at: order.createdAt
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    }
  });
}));

// Get order by ID
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
        exit_status: order.exit_status,
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

// Cancel order
router.post('/:order_id/cancel', asyncHandler(async (req, res) => {
  const { Order } = require('../models');
  const { order_id } = req.params;

  const order = await Order.findByPk(order_id);
  if (!order) {
    return res.status(404).json({
      success: false,
      error: { message: 'Order not found' }
    });
  }

  if (order.payment_status === 'PAID' && order.exit_status === 'APPROVED') {
    return res.status(400).json({
      success: false,
      error: { message: 'Cannot cancel an order that has been completed' }
    });
  }

  order.payment_status = 'CANCELLED';
  order.exit_status = 'CANCELLED';
  await order.save();

  res.json({
    success: true,
    data: {
      message: 'Order cancelled successfully',
      order: {
        id: order.id,
        order_number: order.order_number,
        payment_status: order.payment_status
      }
    }
  });
}));

// Refund order
router.post('/:order_id/refund', asyncHandler(async (req, res) => {
  const { Order, Payment } = require('../models');
  const { order_id } = req.params;
  const { reason } = req.body;

  const order = await Order.findByPk(order_id);
  if (!order) {
    return res.status(404).json({
      success: false,
      error: { message: 'Order not found' }
    });
  }

  if (order.payment_status !== 'PAID') {
    return res.status(400).json({
      success: false,
      error: { message: 'Can only refund paid orders' }
    });
  }

  // Update payment status
  const payment = await Payment.findOne({ where: { order_id } });
  if (payment) {
    payment.status = 'REFUNDED';
    payment.refund_reason = reason || 'Customer requested refund';
    await payment.save();
  }

  // Update order
  order.payment_status = 'REFUNDED';
  await order.save();

  res.json({
    success: true,
    data: {
      message: 'Order refunded successfully',
      order: {
        id: order.id,
        order_number: order.order_number,
        total_amount: parseFloat(order.total_amount),
        payment_status: order.payment_status,
        refund_reason: reason || 'Customer requested refund'
      }
    }
  });
}));

module.exports = router;
