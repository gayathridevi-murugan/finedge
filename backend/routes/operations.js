const express = require('express');
const router = express.Router();
const { Order, ExitVerification, Payment } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

// Get active checkouts (last 30 minutes)
router.get('/active-checkouts', asyncHandler(async (req, res) => {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  const checkouts = await Order.findAll({
    where: {
      payment_status: ['PENDING', 'PAID'],
      createdAt: { [Op.gte]: thirtyMinutesAgo }
    },
    attributes: ['id', 'total_amount', 'payment_status', 'createdAt'],
    limit: 20,
    order: [['createdAt', 'DESC']]
  });

  // Count items for each order
  const checkoutsWithItems = await Promise.all(
    checkouts.map(async (order) => {
      const itemCount = await order.countItems();
      return {
        order_id: order.id,
        amount: order.total_amount || 0,
        status: order.payment_status,
        item_count: itemCount,
        created_at: order.createdAt
      };
    })
  );

  res.json({
    success: true,
    data: { checkouts: checkoutsWithItems }
  });
}));

// Get blocked exits and suspicious activity
router.get('/blocked-exits', asyncHandler(async (req, res) => {
  const blockedExits = await ExitVerification.findAll({
    where: { exit_status: 'BLOCKED' },
    limit: 20,
    order: [['createdAt', 'DESC']]
  });

  const exits = blockedExits.map((exit) => ({
    order_id: exit.order_id,
    exit_status: exit.exit_status,
    gate_status: exit.gate_status,
    unpaid_items: exit.unpaid_items ? JSON.parse(exit.unpaid_items) : [],
    created_at: exit.createdAt
  }));

  // Detect suspicious patterns
  const suspicious = [];
  const failureRate = (await ExitVerification.count({ where: { exit_status: 'BLOCKED' } })) /
    (await ExitVerification.count()) || 0;

  if (failureRate > 0.1) {
    suspicious.push({
      description: `High exit failure rate: ${(failureRate * 100).toFixed(1)}%`
    });
  }

  const failedPaymentsToday = await Payment.count({
    where: {
      status: 'FAILED',
      createdAt: {
        [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
      }
    }
  });

  if (failedPaymentsToday > 5) {
    suspicious.push({
      description: `${failedPaymentsToday} failed payments today - possible system issue`
    });
  }

  res.json({
    success: true,
    data: {
      exits: exits,
      suspicious: suspicious
    }
  });
}));

// Get revenue and order statistics
router.get('/revenue', asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const orders = await Order.findAll({
    where: {
      payment_status: 'PAID',
      createdAt: { [Op.gte]: today }
    }
  });

  const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const totalOrders = orders.length;

  const failedPayments = await Payment.count({
    where: {
      status: 'FAILED',
      createdAt: { [Op.gte]: today }
    }
  });

  res.json({
    success: true,
    data: {
      total_revenue: totalRevenue * 1.1, // Include 10% tax
      total_orders: totalOrders,
      failed_payments: failedPayments
    }
  });
}));

// Mark exit as resolved (customer assisted)
router.post('/resolve-exit', asyncHandler(async (req, res) => {
  const { order_id } = req.body;

  const exitVerification = await ExitVerification.findOne({
    where: { order_id: order_id }
  });

  if (!exitVerification) {
    return res.status(404).json({
      success: false,
      error: { message: 'Exit verification not found' }
    });
  }

  await exitVerification.update({
    exit_status: 'RESOLVED',
    gate_status: 'GREEN'
  });

  res.json({
    success: true,
    data: { message: 'Exit marked as resolved' }
  });
}));

module.exports = router;
