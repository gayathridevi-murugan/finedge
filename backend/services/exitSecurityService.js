const { Order, OrderItem, SecurityTag, ExitVerification, Product } = require('../models');

class ExitSecurityService {
  async verifyExit(orderId) {
    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderItem, as: 'items', include: [Product] }]
    });

    if (!order) throw new Error(`Order not found: ${orderId}`);

    // Check if payment is complete
    if (order.payment_status !== 'PAID') {
      return await this.blockExit(orderId, 'Payment not completed', []);
    }

    // Check security tag statuses and collect unpaid items with details
    const unpaidItems = [];

    for (const item of order.items) {
      const securityTag = await SecurityTag.findOne({
        where: { product_id: item.product_id }
      });

      if (securityTag && securityTag.status === 'ACTIVE') {
        unpaidItems.push({
          product_id: item.product_id,
          product_name: item.Product?.name || 'Unknown Product',
          price: item.unit_price || item.Product?.price || 0,
          quantity: item.quantity || 1,
          security_tag_id: securityTag.tag_id,
          security_tag_status: 'ACTIVE'
        });
      }
    }

    if (unpaidItems.length > 0) {
      const itemNames = unpaidItems.map(i => i.product_name).join(', ');
      const reason = `Unpaid items detected: ${itemNames}`;
      return await this.blockExit(orderId, reason, unpaidItems);
    }

    return await this.approveExit(orderId);
  }

  async approveExit(orderId) {
    let exitVerification = await ExitVerification.findOne({ where: { order_id: orderId } });

    if (!exitVerification) {
      exitVerification = await ExitVerification.create({
        order_id: orderId,
        exit_status: 'APPROVED',
        gate_status: 'GREEN',
        unpaid_items: JSON.stringify([]),
        simulation_note: 'Software simulation - not physical gate'
      });
    } else {
      await exitVerification.update({
        exit_status: 'APPROVED',
        gate_status: 'GREEN',
        unpaid_items: JSON.stringify([])
      });
    }

    const order = await Order.findByPk(orderId);
    await order.update({ exit_status: 'APPROVED' });

    return exitVerification;
  }

  async blockExit(orderId, reason, unpaidItems = []) {
    let exitVerification = await ExitVerification.findOne({ where: { order_id: orderId } });

    if (!exitVerification) {
      exitVerification = await ExitVerification.create({
        order_id: orderId,
        exit_status: 'BLOCKED',
        gate_status: 'RED',
        unpaid_items: JSON.stringify(unpaidItems),
        simulation_note: `Software simulation - not physical gate. Reason: ${reason}`
      });
    } else {
      await exitVerification.update({
        exit_status: 'BLOCKED',
        gate_status: 'RED',
        unpaid_items: JSON.stringify(unpaidItems)
      });
    }

    const order = await Order.findByPk(orderId);
    await order.update({ exit_status: 'BLOCKED' });

    return exitVerification;
  }

  async getExitVerification(orderId) {
    return await ExitVerification.findOne({ where: { order_id: orderId } });
  }
}

module.exports = new ExitSecurityService();
