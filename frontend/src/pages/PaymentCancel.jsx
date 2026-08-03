import React, { useState } from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import DashboardLayout from '../components/DashboardLayout';
import '../styles/Payment.css';

export default function PaymentCancel() {
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);
  const storeOrderId = useCheckoutStore((state) => state.orderId);
  const [retrying, setRetrying] = useState(false);
  // Use order ID from store (state-based routing)
  const orderId = storeOrderId;

  const handleRetryPayment = () => {
    setRetrying(true);
    // Navigate back to payment page
    setCurrentScreen('payment');
  };

  const handleReturnToCart = () => {
    setCurrentScreen('cart');
  };

  return (
    <DashboardLayout pageTitle="Payment Cancelled">
      <div className="payment-container">
        <div className="payment-status-section">
          <div className="status-message failed">
            <div className="status-icon">❌</div>
            <h2>Payment Cancelled</h2>
            <p>Your payment has been cancelled or was not completed.</p>

            {orderId && (
              <div className="order-info">
                <p>Order ID: {orderId}</p>
                <small>You can retry payment or return to cart to modify your order.</small>
              </div>
            )}

            <div className="action-buttons">
              <button
                className="btn btn-primary"
                onClick={handleRetryPayment}
                disabled={retrying}
              >
                {retrying ? 'Redirecting...' : 'Retry Payment'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleReturnToCart}
              >
                Back to Cart
              </button>
            </div>

            <div className="info-box">
              <h4>What happened?</h4>
              <p>
                Your payment was not completed. This could happen if:
              </p>
              <ul>
                <li>You cancelled the payment process</li>
                <li>Your payment method was declined</li>
                <li>Your browser session expired</li>
                <li>A technical error occurred during payment</li>
              </ul>
              <p>
                You can retry the payment with the same or different payment method.
                Your cart items have been preserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
