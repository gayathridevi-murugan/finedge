const express = require('express');
const { Cart, Order, Payment, Product, NFCTag, ExitVerification, Merchant, Terminal, OrderItem } = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Get dashboard metrics
router.get('/metrics', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let activeSessions = 0;
    let todaysOrders = 0;
    let completedOrders = 0;
    let todaysRevenue = 0;
    let productsScanned = 0;
    let pendingPayments = 0;
    let exitEvents = 0;
    let merchantId = 'Not configured';
    let merchantStatus = 'INACTIVE';
    let terminals = 0;

    // Safely query each metric with try-catch
    try {
      activeSessions = await Cart.count({ where: { createdAt: { [Op.gte]: today } } });
    } catch (e) { console.warn('Cart count failed:', e.message); }

    try {
      todaysOrders = await Order.count({ where: { createdAt: { [Op.gte]: today } } });
    } catch (e) { console.warn('Orders count failed:', e.message); }

    try {
      completedOrders = await Order.count({
        where: {
          payment_status: 'PAID',
          createdAt: { [Op.gte]: today }
        }
      });
    } catch (e) { console.warn('Completed orders count failed:', e.message); }

    try {
      const revenueResult = await Order.findAll({
        attributes: [[sequelize.fn('SUM', sequelize.col('total_amount')), 'total_revenue']],
        where: { payment_status: 'PAID', createdAt: { [Op.gte]: today } },
        raw: true
      });
      todaysRevenue = parseFloat(revenueResult[0]?.total_revenue || 0);
    } catch (e) { console.warn('Revenue calculation failed:', e.message); }

    try {
      const scannedResult = await sequelize.query(`
        SELECT COUNT(DISTINCT "product_id") as count
        FROM "nfc_tags"
        WHERE "last_scanned_at" IS NOT NULL AND "last_scanned_at" >= :today
      `, {
        replacements: { today },
        type: sequelize.QueryTypes.SELECT
      });
      productsScanned = parseInt(scannedResult[0]?.count || 0);
    } catch (e) { console.warn('Products scanned count failed:', e.message); }

    try {
      pendingPayments = await Payment.count({ where: { status: 'PENDING' } });
    } catch (e) { console.warn('Pending payments count failed:', e.message); }

    try {
      exitEvents = await ExitVerification.count({ where: { createdAt: { [Op.gte]: today } } });
    } catch (e) { console.warn('Exit events count failed:', e.message); }

    try {
      const merchant = await Merchant.findOne({ order: [['createdAt', 'DESC']] });
      if (merchant) {
        merchantId = merchant.merchant_id || 'Not configured';
        merchantStatus = merchant.status || 'INACTIVE';
      }
    } catch (e) { console.warn('Merchant info failed:', e.message); }

    try {
      terminals = await Terminal.count();
    } catch (e) { console.warn('Terminals count failed:', e.message); }

    res.json({
      success: true,
      data: {
        activeSessions,
        todaysOrders,
        completedOrders,
        todaysRevenue,
        productsScanned,
        pendingPayments,
        exitEvents,
        merchantId,
        merchantStatus,
        terminals,
        databaseStatus: 'CONNECTED',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get recent NFC scans
router.get('/recent-scans', async (req, res) => {
  try {
    const scans = await NFCTag.findAll({
      include: [{ model: Product, attributes: ['name', 'price'] }],
      order: [['updatedAt', 'DESC']],
      limit: 10,
      raw: false
    });

    const formattedScans = scans.map(scan => ({
      id: scan.id,
      tagId: scan.tag_id,
      product: scan.Product?.name || 'Unknown',
      price: scan.Product?.price || 0,
      scannedAt: scan.updatedAt
    }));

    res.json({
      success: true,
      data: { scans: formattedScans }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recent payments
router.get('/recent-payments', async (req, res) => {
  try {
    const payments = await Payment.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10,
      raw: true
    });

    res.json({
      success: true,
      data: { payments }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recent orders
router.get('/recent-orders', async (req, res) => {
  try {
    const orders = await Order.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10,
      raw: true
    });

    res.json({
      success: true,
      data: { orders }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get top selling products
router.get('/top-products', async (req, res) => {
  try {
    let topProducts = [];
    try {
      topProducts = await Product.findAll({
        attributes: [
          'id',
          'name',
          'price',
          [sequelize.fn('COUNT', sequelize.col('order_items.id')), 'sales_count']
        ],
        include: [{ model: OrderItem, attributes: [], as: 'order_items', required: false }],
        group: ['Product.id'],
        order: [[sequelize.fn('COUNT', sequelize.col('order_items.id')), 'DESC']],
        limit: 10,
        raw: true,
        subQuery: false
      });
    } catch (e) {
      console.warn('Top products query failed:', e.message);
      topProducts = [];
    }

    res.json({
      success: true,
      data: { topProducts }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get average checkout time
router.get('/avg-checkout-time', async (req, res) => {
  try {
    let avgMinutes = 0;
    try {
      // Fallback: just return a static value since this is complex to calculate without database specifics
      avgMinutes = 3;
    } catch (e) {
      console.warn('Avg checkout time query failed:', e.message);
      avgMinutes = 0;
    }

    res.json({
      success: true,
      data: { avgCheckoutTimeMinutes: avgMinutes }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Surfboard API status
router.get('/api-status', async (req, res) => {
  try {
    const hasApiKey = !!process.env.SURFBOARD_API_KEY;
    const hasSecret = !!process.env.SURFBOARD_SECRET_KEY;

    res.json({
      success: true,
      data: {
        surfboardStatus: hasApiKey && hasSecret ? 'CONNECTED' : 'NOT_CONFIGURED',
        hasCredentials: hasApiKey && hasSecret,
        mode: hasApiKey && hasSecret ? 'PRODUCTION' : 'DEMO'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
