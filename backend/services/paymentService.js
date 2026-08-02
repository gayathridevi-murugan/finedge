const axios = require('axios');
const { Payment, Order, OrderItem, SecurityTag } = require('../models');
const crypto = require('crypto');

class PaymentService {
  constructor() {
    this.surfboardEnabled = !!(process.env.SURFBOARD_API_KEY && process.env.SURFBOARD_SECRET_KEY);
    this.surfboardUrl = process.env.SURFBOARD_BASE_URL || 'https://api.surfboardpayments.com';
  }

  generateSignature(payload, secret) {
    return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
  }

  async initiatePayment(orderId, amount, method = 'CREDIT_CARD') {
    const order = await Order.findByPk(orderId);
    if (!order) throw new Error(`Order not found: ${orderId}`);

    const payment = await Payment.create({
      order_id: orderId,
      amount: amount,
      status: 'PENDING',
      payment_method: method,
      payment_gateway: 'SURFBOARD'
    });

    await order.update({ payment_status: 'PENDING' });
    return payment;
  }

  async processPaymentWithSurfboard(orderId, amount, method = 'CREDIT_CARD') {
    const order = await Order.findByPk(orderId);
    if (!order) throw new Error(`Order not found: ${orderId}`);

    const payment = await this.initiatePayment(orderId, amount, method);

    try {
      if (this.surfboardEnabled) {
        // REAL Surfboard API integration
        const payload = {
          merchant_id: process.env.SURFBOARD_MERCHANT_ID || 'merchant_demo',
          order_id: orderId,
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'SEK',
          payment_method: method,
          timestamp: new Date().toISOString()
        };

        // Generate signature for secure requests
        const signature = this.generateSignature(payload, process.env.SURFBOARD_SECRET_KEY);

        const response = await axios.post(
          `${this.surfboardUrl}/api/v1/charges`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${process.env.SURFBOARD_API_KEY}`,
              'X-Signature': signature,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        if (response.data.status === 'SUCCESS' || response.data.status === 'APPROVED') {
          return await this.capturePayment(orderId, response.data.transaction_id);
        } else {
          return await this.failPayment(orderId, response.data.message || 'Payment declined');
        }
      } else {
        // FALLBACK: Simulated payment (100% success for demo) - only used for testing
        console.warn('⚠️  SURFBOARD_API_KEY not configured. Using simulated payments for testing only.');
        const transactionId = `SIM_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        return await this.capturePayment(orderId, transactionId);
      }
    } catch (error) {
      console.error('Payment processing error:', error.message);
      return await this.failPayment(orderId, error.message || 'Payment processing failed');
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

    // Deactivate security tags for paid items
    const orderItems = await OrderItem.findAll({ where: { order_id: orderId } });
    for (const item of orderItems) {
      const securityTag = await SecurityTag.findOne({
        where: { product_id: item.product_id }
      });
      if (securityTag) {
        await securityTag.update({ status: 'DEACTIVATED' });
      }
    }

    return payment;
  }

  async failPayment(orderId, errorMessage) {
    const payment = await Payment.findOne({ where: { order_id: orderId } });
    if (!payment) throw new Error(`Payment not found for order: ${orderId}`);

    await payment.update({
      status: 'FAILED',
      error_message: errorMessage
    });

    const order = await Order.findByPk(orderId);
    await order.update({ payment_status: 'FAILED' });

    return payment;
  }

  async refundPayment(orderId, refundReason = 'Customer requested') {
    const payment = await Payment.findOne({ where: { order_id: orderId } });
    if (!payment) throw new Error(`Payment not found for order: ${orderId}`);

    if (payment.status !== 'CAPTURED') {
      throw new Error('Can only refund captured payments');
    }

    try {
      if (this.surfboardEnabled) {
        // REAL Surfboard refund API
        const response = await axios.post(
          `${this.surfboardUrl}/api/v1/refunds`,
          {
            transaction_id: payment.transaction_id,
            amount: Math.round(payment.amount * 100),
            reason: refundReason
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.SURFBOARD_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        if (response.data.status === 'SUCCESS') {
          await payment.update({
            status: 'REFUNDED',
            refund_reason: refundReason
          });

          const order = await Order.findByPk(orderId);
          await order.update({ payment_status: 'REFUNDED' });
        } else {
          throw new Error(response.data.message || 'Refund failed');
        }
      } else {
        // Simulated refund
        await payment.update({
          status: 'REFUNDED',
          refund_reason: refundReason
        });

        const order = await Order.findByPk(orderId);
        await order.update({ payment_status: 'REFUNDED' });
      }
    } catch (error) {
      console.error('Refund error:', error.message);
      throw new Error(`Refund failed: ${error.message}`);
    }

    return payment;
  }

  async getPayment(orderId) {
    return await Payment.findOne({ where: { order_id: orderId } });
  }

  getSurfboardStatus() {
    return {
      enabled: this.surfboardEnabled,
      url: this.surfboardUrl,
      mode: this.surfboardEnabled ? 'PRODUCTION' : 'SIMULATED'
    };
  }
}

module.exports = new PaymentService();
