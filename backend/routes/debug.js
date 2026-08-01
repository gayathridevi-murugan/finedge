const express = require('express');
const router = express.Router();
const { SecurityTag, Order, OrderItem } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');

// Debug endpoint to check security tag statuses for an order
router.get('/order/:order_id/security-tags', asyncHandler(async (req, res) => {
  const { order_id } = req.params;

  const order = await Order.findByPk(order_id, {
    include: [{ model: OrderItem, as: 'items' }]
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      error: { message: 'Order not found' }
    });
  }

  const itemsWithTags = [];
  for (const item of order.items || []) {
    const tag = await SecurityTag.findOne({
      where: { product_id: item.product_id }
    });

    itemsWithTags.push({
      product_id: item.product_id,
      security_tag_id: tag?.id,
      security_tag_status: tag?.status || 'NO_TAG'
    });
  }

  res.json({
    success: true,
    data: {
      order_id: order.id,
      order_payment_status: order.payment_status,
      items_count: order.items?.length || 0,
      items_with_tags: itemsWithTags
    }
  });
}));

module.exports = router;
