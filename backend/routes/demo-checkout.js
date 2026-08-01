const express = require('express');
const router = express.Router();
const { paymentService, orderService } = require('../services');
const { Order, OrderItem, SecurityTag, Product } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');

// Special endpoint for unpaid-item demo scenario
// Creates order with items but only deactivates security tags for paid items
router.post('/unpaid-item-setup', asyncHandler(async (req, res) => {
  const { orderId, paid_item_count } = req.body;

  if (!orderId || paid_item_count === undefined) {
    return res.status(400).json({
      success: false,
      error: { message: 'orderId and paid_item_count are required' }
    });
  }

  try {
    // Get order with items
    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderItem, as: 'items', include: [Product] }]
    });

    if (!order) throw new Error(`Order not found: ${orderId}`);

    // Update order status to PAID (simulating successful payment)
    await order.update({ payment_status: 'PAID' });

    // Re-activate security tags for unpaid items and deactivate for paid items
    const orderItems = order.items || [];
    console.log(`[DEMO] Processing ${orderItems.length} items: ${paid_item_count} paid, ${orderItems.length - paid_item_count} unpaid`);

    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      const securityTag = await SecurityTag.findOne({
        where: { product_id: item.product_id }
      });

      console.log(`[DEMO] Item ${i+1}: product_id=${item.product_id}, security_tag=${securityTag?.id || 'NONE'}`);

      if (!securityTag) continue;

      if (i < paid_item_count) {
        // This item was paid - make sure security tag is deactivated
        await securityTag.update({ status: 'DEACTIVATED' });
        console.log(`[DEMO]   → DEACTIVATED (paid)`);
      } else {
        // This item is unpaid - re-activate its security tag
        await securityTag.update({ status: 'ACTIVE' });
        console.log(`[DEMO]   → ACTIVATED (unpaid)`);
      }
    }

    res.json({
      success: true,
      data: {
        message: 'Demo unpaid-item setup complete',
        order: {
          id: order.id,
          payment_status: order.payment_status,
          total_items: orderItems.length,
          paid_items: paid_item_count,
          unpaid_items: orderItems.length - paid_item_count
        }
      }
    });
  } catch (error) {
    throw new Error(`Failed to setup unpaid-item demo: ${error.message}`);
  }
}));

module.exports = router;
