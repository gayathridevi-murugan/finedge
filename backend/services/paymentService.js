const { Payment, Order, OrderItem, SecurityTag } = require('../models');

class PaymentService {
  async initiatePayment(orderId, amount, method = 'CREDIT_CARD') {
    const order = await Order.findByPk(orderId);
    if (!order) throw new Error(`Order not found: ${orderId}`);

    const payment = await Payment.create({
      order_id: orderId,
      amount: amount,
      status: 'PENDING',
      payment_gateway: 'SURFBOARD'
    });

    await order.update({ payment_status: 'PENDING' });
    return payment;
  }

  async processPaymentWithSurfboard(orderId, amount, method) {
    const order = await Order.findByPk(orderId);
    if (!order) throw new Error(`Order not found: ${orderId}`);

    const payment = await this.initiatePayment(orderId, amount, method);

    // Simulate Surfboard API call (90% success rate)
    const isSuccess = Math.random() < 0.9;
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    if (isSuccess) {
      return await this.capturePayment(orderId, transactionId);
    } else {
      return await this.failPayment(orderId, 'Payment declined by processor');
    }
  }

  async capturePayment(orderId, transactionId) {
    const payment = await Payment.findOne({ where: { order_id: orderId } });
    if (!payment) throw new Error(`Payment not found for order: ${orderId}`);

    await payment.update({
      status: 'CAPTURED',
      transaction_id: transactionId
    });

    const order = await Order.findByPk(orderId);
    await order.update({
      payment_status: 'PAID',
      transaction_id: transactionId
    });

    // Deactivate security tags
    const orderItems = await OrderItem.findAll({ where: { order_id: orderId } });
    for (const item of orderItems) {
      const product = await item.getProduct();
      if (product && product.security_tag) {
        await product.security_tag.update({ status: 'DEACTIVATED' });
      }
    }

    return payment;
  }

  async failPayment(orderId, errorMessage) {
    const payment = await Payment.findOne({ where: { order_id: orderId } });
    if (!payment) throw new Error(`Payment not found for order: ${orderId}`);

    await payment.update({
      status: 'FAILED'
    });

    const order = await Order.findByPk(orderId);
    await order.update({ payment_status: 'FAILED' });

    return payment;
  }

  async getPayment(orderId) {
    return await Payment.findOne({ where: { order_id: orderId } });
  }
}

module.exports = new PaymentService();
