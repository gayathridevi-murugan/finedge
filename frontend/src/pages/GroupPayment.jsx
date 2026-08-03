import React, { useState, useEffect } from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import DashboardLayout from '../components/DashboardLayout';
import apiClient from '../services/api';
import '../styles/Receipt.css';

export default function GroupPayment() {
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [paymentId, setPaymentId] = useState(null);

  useEffect(() => {
    // Get payment data from sessionStorage
    const data = sessionStorage.getItem('groupPaymentData');
    if (data) {
      const parsedData = JSON.parse(data);
      setPaymentData(parsedData);
      setLoading(false);
    } else {
      alert('No payment data found');
      setCurrentScreen('overview');
    }
  }, [setCurrentScreen]);

  const handlePayNow = async () => {
    if (!paymentData) return;

    setProcessing(true);

    try {
      // Create order from cart
      const orderResponse = await apiClient.post('/orders/create', {
        cart_id: paymentData.cartId,
        customer_id: null
      });

      if (orderResponse.data.success) {
        const createdOrderId = orderResponse.data.data.order.id;
        setOrderId(createdOrderId);

        // Simulate payment success for demo purposes
        const amount = paymentData.cartTotal * 1.1; // Including tax
        const simulatedPaymentId = `PAY-${Date.now()}`;
        setPaymentId(simulatedPaymentId);

        // Auto-redirect to group shopping to continue with next person after 3 seconds
        setTimeout(() => {
          sessionStorage.removeItem('groupPaymentData');
          setCurrentScreen('group-shopping');
        }, 3000);
      } else {
        alert('Order creation failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment processing error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout pageTitle="Payment">
        <div className="receipt-container">
          <div className="receipt-content">
            <div className="receipt-header">
              <h1>Loading Payment Details...</h1>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!paymentData) {
    return null;
  }

  const subtotal = paymentData.cartTotal;
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  if (orderId && paymentId) {
    return (
      <DashboardLayout pageTitle="Payment Successful">
        <div className="receipt-container">
          <div className="receipt-content">
            <div className="receipt-header success">
              <div className="success-icon">✓</div>
              <h1>Payment Successful!</h1>
              <p>Person {paymentData.personNumber}</p>
              <p>Order ID: {orderId}</p>
              <p>Amount Paid: ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                Continuing to next person...
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Group Payment">
      <div className="receipt-container">
        <div className="receipt-content">
          <div className="receipt-header">
            <h1>Person {paymentData.personNumber}'s Payment</h1>
            <p className="group-payment-subtitle">Group Shopping - Individual Checkout</p>

            {/* Order Summary */}
            <div className="receipt-items" style={{ marginTop: '24px' }}>
              <h3>Items</h3>
              {paymentData.cartItems.map((item) => (
                <div key={item.id} className="receipt-item-row">
                  <div className="item-details">
                    <span className="item-name">{item.name}</span>
                    <span className="item-qty">Qty: {item.quantity}</span>
                  </div>
                  <span className="item-price">₹{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Order Totals */}
            <div className="receipt-summary" style={{ marginTop: '24px' }}>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span>Tax (10%)</span>
                <span>₹{tax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="summary-row total">
                <span>Total Amount</span>
                <span>₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div style={{ marginTop: '24px', padding: '16px', background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Payment Method</p>
              <p style={{ margin: '0', fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: 'var(--weight-semibold)' }}>💳 Credit Card</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: 'var(--color-text-secondary)' }}>Demo Mode - Simulated Payment</p>
            </div>

            {/* Action Buttons */}
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <button
                className="action-btn secondary"
                onClick={() => setCurrentScreen('group-shopping')}
                disabled={processing}
                style={{ flex: 1 }}
              >
                Back to Shopping
              </button>
              <button
                className="action-btn primary"
                onClick={handlePayNow}
                disabled={processing}
                style={{ flex: 1 }}
              >
                {processing ? '⏳ Processing...' : 'PAY NOW'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
