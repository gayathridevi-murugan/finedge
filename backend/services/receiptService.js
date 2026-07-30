const { Receipt, Order, OrderItem } = require('../models');

class ReceiptService {
  async generateReceipt(orderId, customerId = null) {
    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderItem, as: 'items' }]
    });

    if (!order) throw new Error(`Order not found: ${orderId}`);
    if (order.payment_status !== 'PAID') {
      throw new Error('Receipt can only be generated for paid orders');
    }

    const existingReceipt = await Receipt.findOne({ where: { order_id: orderId } });
    if (existingReceipt) return existingReceipt;

    const subtotal = parseFloat(order.total_amount);
    const tax = parseFloat((subtotal * 0.1).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));
    const loyaltyPointsEarned = Math.floor(subtotal);

    const receiptNumber = `RCP-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const receipt = await Receipt.create({
      order_id: orderId,
      receipt_number: receiptNumber,
      customer_id: customerId || order.customer_id,
      subtotal: subtotal,
      tax: tax,
      total_amount: total,
      loyalty_points_earned: loyaltyPointsEarned,
      format: 'DIGITAL'
    });

    return receipt;
  }

  async getReceipt(receiptId) {
    return await Receipt.findByPk(receiptId);
  }

  async getReceiptByOrder(orderId) {
    return await Receipt.findOne({ where: { order_id: orderId } });
  }
}

module.exports = new ReceiptService();
