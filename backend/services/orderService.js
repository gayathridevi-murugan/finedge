const { Order, OrderItem, Product } = require('../models');
const { v4: uuidv4 } = require('uuid');

class OrderService {
  generateOrderNumber() {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${Date.now().toString().slice(-6)}-${random}`;
  }

  async createOrderFromCart(cartId, cartItems, totalAmount, customerId = null) {
    const orderNumber = this.generateOrderNumber();

    const order = await Order.create({
      order_number: orderNumber,
      customer_id: customerId || null,
      total_amount: totalAmount || 0,
      payment_status: 'PENDING',
      security_status: 'ACTIVE',
      exit_status: 'PENDING'
    });

    if (Array.isArray(cartItems) && cartItems.length > 0) {
      for (const item of cartItems) {
        await OrderItem.create({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          subtotal: item.subtotal || 0
        });
      }
    }

    return order;
  }

  async getOrder(orderId) {
    return await Order.findByPk(orderId, {
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{ model: Product }]
      }]
    });
  }

  async updateOrderPaymentStatus(orderId, status, transactionId = null) {
    const order = await Order.findByPk(orderId);
    if (!order) throw new Error(`Order not found: ${orderId}`);

    order.payment_status = status;
    if (transactionId) order.transaction_id = transactionId;
    await order.save();
    return order;
  }

  async updateOrderSecurityStatus(orderId, status) {
    const order = await Order.findByPk(orderId);
    if (!order) throw new Error(`Order not found: ${orderId}`);

    order.security_status = status;
    await order.save();
    return order;
  }

  async updateOrderExitStatus(orderId, status) {
    const order = await Order.findByPk(orderId);
    if (!order) throw new Error(`Order not found: ${orderId}`);

    order.exit_status = status;
    await order.save();
    return order;
  }
}

module.exports = new OrderService();
