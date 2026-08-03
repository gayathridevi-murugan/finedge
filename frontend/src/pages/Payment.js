import React, { useState, useEffect } from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import { createPaymentSession, createOrderFromCart } from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import '../styles/Payment.css';

export default function Payment() {
  const shoppingMode = useCheckoutStore((state) => state.shoppingMode);

  // Get cart from appropriate source
  const smartCartId = useCheckoutStore((state) => state.smartShoppingCartId);
  const smartCartItems = useCheckoutStore((state) => state.smartShoppingCartItems);
  const smartCartTotal = useCheckoutStore((state) => state.smartShoppingCartTotal);
  const nfcCartId = useCheckoutStore((state) => state.nfcSelfCheckoutCartId);
  const nfcCartItems = useCheckoutStore((state) => state.nfcSelfCheckoutCartItems);
  const nfcCartTotal = useCheckoutStore((state) => state.nfcSelfCheckoutCartTotal);

  // Use appropriate cart based on shopping mode
  const cartItems = shoppingMode === 'nfc-self-checkout' ? nfcCartItems : smartCartItems;
  const cartTotal = shoppingMode === 'nfc-self-checkout' ? nfcCartTotal : smartCartTotal;
  const cartId = shoppingMode === 'nfc-self-checkout' ? nfcCartId : smartCartId;

  const orderId = useCheckoutStore((state) => state.orderId);
  const orderNumber = useCheckoutStore((state) => state.orderNumber);
  const demoMode = useCheckoutStore((state) => state.demoMode);
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);
  const setOrderId = useCheckoutStore((state) => state.setOrderId);
  const setOrderNumber = useCheckoutStore((state) => state.setOrderNumber);
  const setPaymentStatus = useCheckoutStore((state) => state.setPaymentStatus);
  const error = useCheckoutStore((state) => state.error);
  const setError = useCheckoutStore((state) => state.setError);

  const [isProcessing, setIsProcessing] = useState(false);

  const taxRate = 0.1;
  const safeCartTotal = parseFloat(cartTotal || 0);
  const tax = parseFloat((safeCartTotal * taxRate).toFixed(2));
  const finalTotal = parseFloat((safeCartTotal + tax).toFixed(2));

  const handlePayNow = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      let finalOrderId = orderId;
      let finalOrderNumber = orderNumber;

      // Create order only if it doesn't exist
      if (!finalOrderId) {
        const orderResponse = await createOrderFromCart(cartId, null);
        finalOrderId = orderResponse.data.data.order.id;
        finalOrderNumber = orderResponse.data.data.order.order_number;
        setOrderId(finalOrderId);
        setOrderNumber(finalOrderNumber);
      }

      // Surfboard redirects here with ?local_order_id=... appended - App.js restores state from it.
      const returnUrl = `${window.location.origin}${window.location.pathname}?checkout_result=success&local_order_id=${finalOrderId}`;
      const cancelUrl = `${window.location.origin}${window.location.pathname}?checkout_result=cancelled&local_order_id=${finalOrderId}`;

      const sessionResponse = await createPaymentSession(finalOrderId, finalTotal, returnUrl, cancelUrl);
      const checkoutUrl = sessionResponse.data.data.checkout_url;

      if (!checkoutUrl) {
        throw new Error('Surfboard did not return a checkout URL');
      }

      // Full navigation to the Surfboard-hosted payment page - customer completes the TEST payment there.
      window.location.href = checkoutUrl;

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('FAILED');
      setError(error.response?.data?.error?.message || error.message || 'Payment processing failed');
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    setCurrentScreen('cart');
  };

  return (
    <DashboardLayout pageTitle="Payment" pageIcon="💳">
      <div className="payment-container">
        {!isProcessing && (
          <button className="back-button" onClick={handleBack} title="Return to cart">
            ← Back to Cart
          </button>
        )}

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

          {error && (
            <p style={{ color: 'var(--color-error)', marginTop: '12px' }}>{error}</p>
          )}

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
