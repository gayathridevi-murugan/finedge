const express = require('express');
const router = express.Router();
const { Customer, Order, Loyalty } = require('../models');
const { authenticateToken } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

// Get customer profile
router.get('/:customer_id', authenticateToken, asyncHandler(async (req, res) => {
  const { customer_id } = req.params;

  const customer = await Customer.findByPk(customer_id);
  if (!customer) {
    return res.status(404).json({
      success: false,
      error: { message: 'Customer not found' }
    });
  }

  res.json({
    success: true,
    data: {
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        tier: customer.tier,
        loyalty_points: customer.loyalty_points,
        total_spent: parseFloat(customer.total_spent),
        created_at: customer.createdAt
      }
    }
  });
}));

// Update customer profile
router.put('/:customer_id', authenticateToken, asyncHandler(async (req, res) => {
  const { customer_id } = req.params;
  const { name, phone, address } = req.body;

  const customer = await Customer.findByPk(customer_id);
  if (!customer) {
    return res.status(404).json({
      success: false,
      error: { message: 'Customer not found' }
    });
  }

  if (name) customer.name = name;
  if (phone) customer.phone = phone;
  if (address) customer.address = address;

  await customer.save();

  res.json({
    success: true,
    data: {
      message: 'Customer updated successfully',
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        tier: customer.tier
      }
    }
  });
}));

// Get customer order history
router.get('/:customer_id/orders', authenticateToken, asyncHandler(async (req, res) => {
  const { customer_id } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const customer = await Customer.findByPk(customer_id);
  if (!customer) {
    return res.status(404).json({
      success: false,
      error: { message: 'Customer not found' }
    });
  }

  const offset = (page - 1) * limit;
  const { count, rows } = await Order.findAndCountAll({
    where: { customer_id },
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      orders: rows.map(order => ({
        id: order.id,
        order_number: order.order_number,
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

// Get customer loyalty information
router.get('/:customer_id/loyalty', authenticateToken, asyncHandler(async (req, res) => {
  const { customer_id } = req.params;

  const customer = await Customer.findByPk(customer_id);
  if (!customer) {
    return res.status(404).json({
      success: false,
      error: { message: 'Customer not found' }
    });
  }

  const loyalty = await Loyalty.findOne({
    where: { customer_id }
  });

  res.json({
    success: true,
    data: {
      loyalty: {
        customer_id: customer.id,
        tier: customer.tier,
        points: customer.loyalty_points,
        total_spent: parseFloat(customer.total_spent),
        loyalty_details: loyalty ? {
          id: loyalty.id,
          transaction_count: loyalty.transaction_count || 0,
          last_transaction: loyalty.updatedAt
        } : null
      }
    }
  });
}));

module.exports = router;
