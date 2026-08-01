import React, { useState, useEffect } from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import { api, processPayment, createOrderFromCart } from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import '../styles/Payment.css';

export default function Payment() {
  const cartId = useCheckoutStore((state) => state.cartId);
  const cartTotal = useCheckoutStore((state) => state.cartTotal);
  const cartItems = useCheckoutStore((state) => state.cartItems);
  const orderId = useCheckoutStore((state) => state.orderId);
  const orderNumber = useCheckoutStore((state) => state.orderNumber);
  const demoMode = useCheckoutStore((state) => state.demoMode);
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);
  const setOrderId = useCheckoutStore((state) => state.setOrderId);
  const setOrderNumber = useCheckoutStore((state) => state.setOrderNumber);
  const setPaymentStatus = useCheckoutStore((state) => state.setPaymentStatus);
  const setError = useCheckoutStore((state) => state.setError);

  const [isProcessing, setIsProcessing] = useState(false);

  const taxRate = 0.1;
  const safeCartTotal = parseFloat(cartTotal || 0);
  const tax = parseFloat((safeCartTotal * taxRate).toFixed(2));
  const finalTotal = parseFloat((safeCartTotal + tax).toFixed(2));

  const handlePayNow = async () => {
    try {
      setIsProcessing(true);

      let finalOrderId = orderId;
      let finalOrderNumber = orderNumber;

      // Create order only if it doesn't exist
      if (!finalOrderId) {
        try {
          const orderResponse = await createOrderFromCart(cartId, null);
          finalOrderId = orderResponse.data.data.order.id;
          finalOrderNumber = orderResponse.data.data.order.order_number;
          setOrderId(finalOrderId);
          setOrderNumber(finalOrderNumber);
        } catch (orderError) {
          console.warn('Could not create order from API, using demo mode');
          finalOrderId = 'ORD-' + Math.random().toString(36).substr(2, 9);
          finalOrderNumber = 'ORD-' + Date.now();
        }
      }

      // Demo mode: simulate successful payment
      setPaymentStatus('SUCCESS');

      // Navigate directly to payment success page (NO ANIMATIONS)
      setOrderId(finalOrderId);
      setOrderNumber(finalOrderNumber);
      setCurrentScreen('payment-success');

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('FAILED');
      setError(error.message || 'Payment processing failed');
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    setCurrentScreen('cart');
  };

  return (
    <DashboardLayout pageTitle="Payment" pageIcon="💳">
      <div className="payment-container">
        <button className="back-button" onClick={handleBack}>
          ← Back
        </button>

        <div className="payment-content">
          <h1>Order Summary</h1>

          <div className="payment-items">
            <h3>Items Purchased</h3>
            {cartItems && cartItems.length > 0 ? (
              <div className="items-list">
                {cartItems.map((item) => (
                  <div key={item.id} className="payment-item">
                    <div className="item-name-brand">
                      <strong>{item.name}</strong>
                      {item.brand && <span> • {item.brand}</span>}
                    </div>
                    <div className="item-qty-price">
                      <span>Qty: {item.quantity}</span>
                      <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No items in cart</p>
            )}
          </div>

          <div className="payment-summary">
            <div className="summary-item">
              <span>Subtotal</span>
              <span>₹{safeCartTotal.toFixed(2)}</span>
            </div>
            <div className="summary-item">
              <span>Tax</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="summary-item total">
              <span>Total</span>
              <span className="total-amount">₹{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="payment-method">
            <h3>Payment Method</h3>
            <div className="method-selected">
              <span>💳 Credit Card</span>
              <span className="method-note">Demo Mode - Simulated Payment</span>
            </div>
          </div>

          <button
            className="pay-button"
            onClick={handlePayNow}
            disabled={isProcessing}
          >
            {isProcessing ? 'PROCESSING...' : 'PAY NOW'}
          </button>

        </div>
      </div>
    </DashboardLayout>
  );
}
