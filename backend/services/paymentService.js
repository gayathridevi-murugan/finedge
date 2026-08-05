const axios = require('axios');
const { Payment, Order, OrderItem, SecurityTag } = require('../models');
const crypto = require('crypto');

class PaymentService {
  constructor() {
    this.surfboardEnabled = !!(process.env.SURFBOARD_API_KEY && process.env.SURFBOARD_SECRET_KEY);
    this.surfboardUrl = process.env.SURFBOARD_BASE_URL || 'https://api.surfboardpayments.com';
    // Hosted checkout (Payment Page) additionally requires a merchant id and a Payment Page terminal id
    this.surfboardCheckoutEnabled = !!(
      process.env.SURFBOARD_API_KEY &&
      process.env.SURFBOARD_SECRET_KEY &&
      process.env.SURFBOARD_MERCHANT_ID &&
      process.env.SURFBOARD_TERMINAL_ID
    );
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

  // Creates a Surfboard-hosted Payment Page session (POST /merchants/:merchantId/orders)
  // and returns the checkout URL the customer must be redirected to.
  async createSurfboardCheckout(orderId, amount, orderItems, returnUrl, cancelUrl) {
    const order = await Order.findByPk(orderId);
    if (!order) throw new Error(`Order not found: ${orderId}`);

    const payment = await this.initiatePayment(orderId, amount, 'CARD');

    if (!this.surfboardCheckoutEnabled) {
      const err = new Error(
        'Surfboard checkout is not fully configured (missing SURFBOARD_TERMINAL_ID, or another SURFBOARD_* env var, in backend/.env). Cannot create a real Surfboard TEST payment session.'
      );
      err.statusCode = 503;
      throw err;
    }

    const amountMinor = Math.round(amount * 100);
    // Surfboard requires both `total` and `regular` on each line's amount - omitting `regular`
    // fails with "Mandatory Properties missing regular" even though it's undocumented.
    const orderLines = (orderItems && orderItems.length > 0)
      ? orderItems.map((item, idx) => {
          const lineTotal = Math.round((item.subtotal ?? item.unit_price * (item.quantity || 1)) * 100);
          return {
            id: item.product_id || `LINE-${idx + 1}`,
            name: item.product_name || item.name || `Item ${idx + 1}`,
            quantity: item.quantity || 1,
            amount: { total: lineTotal, regular: lineTotal, currency: '752' } // SEK
          };
        })
      : [{
          id: 'ORDER-TOTAL',
          name: `Order ${order.order_number}`,
          quantity: 1,
          amount: { total: amountMinor, regular: amountMinor, currency: '752' }
        }];

    const payload = {
      'terminal$id': process.env.SURFBOARD_TERMINAL_ID,
      orderLines,
      controlFunctions: {
        initiatePaymentsOptions: { paymentMethod: 'CARD', amount: amountMinor },
        redirectUrl: returnUrl,
        failureRedirectUrl: cancelUrl
      }
    };

    // NOTE: this endpoint is flat (/orders) - the merchant is identified by the MERCHANT-ID
    // header, not a path segment. A nested /merchants/:id/orders path 404s on the real API.
    const response = await axios.post(
      `${this.surfboardUrl}/orders`,
      payload,
      {
        headers: {
          'API-KEY': process.env.SURFBOARD_API_KEY,
          'API-SECRET': process.env.SURFBOARD_SECRET_KEY,
          'MERCHANT-ID': process.env.SURFBOARD_MERCHANT_ID,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    if (response.data?.status === 'ERROR') {
      const err = new Error(response.data.message || 'Surfboard rejected the order creation request');
      err.statusCode = 400;
      throw err;
    }

    const data = response.data?.data || {};
    const checkoutUrl = data.paymentPageLink || data.paymentPageUrl || data.checkoutUrl || data.url || data.link || data.shortLink || data.paymentLink;
    const surfboardOrderId = data.orderId || data.id;

    if (!checkoutUrl) {
      console.error('Unexpected Surfboard create-order response shape:', JSON.stringify(response.data));
      const err = new Error(
        'Surfboard did not return a recognizable checkout URL. Check backend logs for the raw response shape.'
      );
      err.statusCode = 502;
      throw err;
    }

    if (surfboardOrderId) {
      await payment.update({ transaction_id: surfboardOrderId });
    }

    return { checkoutUrl, surfboardOrderId, paymentId: payment.id };
  }

  // GET /orders/:orderId/status - flat endpoint, merchant identified via MERCHANT-ID header.
  async getSurfboardOrderStatus(surfboardOrderId) {
    const response = await axios.get(
      `${this.surfboardUrl}/orders/${surfboardOrderId}/status`,
      {
        headers: {
          'API-KEY': process.env.SURFBOARD_API_KEY,
          'API-SECRET': process.env.SURFBOARD_SECRET_KEY,
          'MERCHANT-ID': process.env.SURFBOARD_MERCHANT_ID
        },
        timeout: 15000
      }
    );
    if (response.data?.status === 'ERROR') {
      const err = new Error(response.data.message || 'Surfboard rejected the order status request');
      err.statusCode = 400;
      throw err;
    }
    return response.data?.data || {};
  }

  async findOrderIdBySurfboardOrderId(surfboardOrderId) {
    const payment = await Payment.findOne({ where: { transaction_id: surfboardOrderId } });
    return payment ? payment.order_id : null;
  }

  // Re-verifies the real payment status with Surfboard and finalizes our local Payment/Order.
  // Idempotent: safe to call multiple times (e.g. if the success page is refreshed).
  async finalizePaymentFromOrder(orderId) {
    const payment = await Payment.findOne({ where: { order_id: orderId } });
    if (!payment) throw new Error(`Payment not found for order: ${orderId}`);

    if (payment.status === 'CAPTURED' || payment.status === 'FAILED') {
      const order = await Order.findByPk(orderId);
      return { payment, order };
    }

    if (!this.surfboardCheckoutEnabled || !payment.transaction_id) {
      const err = new Error('Cannot verify payment: Surfboard checkout was not used for this order.');
      err.statusCode = 400;
      throw err;
    }

    const status = await this.getSurfboardOrderStatus(payment.transaction_id);
    const orderStatus = status.orderStatus;
    const surfboardPaymentId = status.payments?.[0]?.paymentId || payment.transaction_id;

    if (orderStatus === 'PAYMENT_COMPLETED' || orderStatus === 'PARTIAL_PAYMENT_COMPLETED') {
      await this.capturePayment(orderId, surfboardPaymentId);
    } else if (orderStatus === 'PAYMENT_FAILED' || orderStatus === 'PAYMENT_CANCELLED') {
      await this.failPayment(orderId, `Surfboard order status: ${orderStatus}`);
    }
    // Otherwise (PENDING / PAYMENT_PROCESSED) the payment isn't final yet - leave it PENDING.

    const finalPayment = await Payment.findOne({ where: { order_id: orderId } });
    const order = await Order.findByPk(orderId);
    return { payment: finalPayment, order };
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

    await this.deactivateSecurityTags(orderId);

    return payment;
  }

  /**
   * Clears the security tags for everything in an order.
   *
   * exitSecurityService blocks an exit when any item in the order still has an
   * ACTIVE tag, so this has to run on every path that marks an order PAID.
   * Extracted from capturePayment because the demo verification route marked
   * orders paid without it, and those orders were then refused at the gate.
   */
  async deactivateSecurityTags(orderId) {
    const orderItems = await OrderItem.findAll({ where: { order_id: orderId } });
    let cleared = 0;

    for (const item of orderItems) {
      const securityTag = await SecurityTag.findOne({
        where: { product_id: item.product_id }
      });
      if (securityTag && securityTag.status !== 'DEACTIVATED') {
        await securityTag.update({ status: 'DEACTIVATED' });
        cleared++;
      }
    }

    return cleared;
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
