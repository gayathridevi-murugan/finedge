import React, { useEffect, useState, useRef } from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import DashboardLayout from '../components/DashboardLayout';
import '../styles/Receipt.css';

export default function PaymentSuccess() {
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);
  const storeOrderId = useCheckoutStore((state) => state.orderId);
  const setCartId = useCheckoutStore((state) => state.setCartId);
  const setCartItems = useCheckoutStore((state) => state.setCartItems);
  const setCartTotal = useCheckoutStore((state) => state.setCartTotal);
  const setOrderId = useCheckoutStore((state) => state.setOrderId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verified, setVerified] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const hasNavigatedRef = useRef(false);
  // Use order ID from store (state-based routing)
  const orderId = storeOrderId;

  // Verify payment on mount (runs only once)
  useEffect(() => {
    let mounted = true;

    const verifyPayment = async () => {
      try {
        if (!orderId) {
          if (mounted) setError('No order ID provided');
          if (mounted) setLoading(false);
          return;
        }

        // In real scenario: Call backend to verify Surfboard payment
        // For now: Mark as verified after a brief delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (mounted) {
          setVerified(true);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Payment verification failed');
          setLoading(false);
        }
      }
    };

    verifyPayment();

    return () => {
      mounted = false;
    };
  }, [orderId]);

  // Auto-navigate to dashboard after 5 seconds on success (runs only once)
  useEffect(() => {
    if (!verified || hasNavigatedRef.current) return;

    // Set initial screen to show payment success page
    setCurrentScreen('payment-success');

    const timer = setTimeout(() => {
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        // Clear checkout state before navigating away
        setCartId(null);
        setCartItems([]);
        setCartTotal(0);
        setOrderId(null);
        setCurrentScreen('overview');
      }
    }, 5000);

    const interval = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
    // Only depend on verified, not setCurrentScreen to prevent recreating effect
  }, [verified, setCurrentScreen, setCartId, setCartItems, setCartTotal, setOrderId]);

  if (loading) {
    return (
      <DashboardLayout pageTitle="Processing Payment" pageIcon="⏳">
        <div className="receipt-container">
          <div className="receipt-content">
            <div className="receipt-header">
              <h1>Processing Payment</h1>
              <p>Verifying your payment with Surfboard...</p>
              <div className="spinner"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout pageTitle="Payment Error" pageIcon="❌">
        <div className="receipt-container">
          <div className="receipt-content">
            <div className="receipt-header">
              <h1>Payment Verification Failed</h1>
              <p className="error-text">{error}</p>
              <button
                className="action-btn primary back-to-home"
                onClick={() => setCurrentScreen('overview')}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (verified) {
    return (
      <DashboardLayout pageTitle="Payment Successful" pageIcon="✅">
        <div className="receipt-container">
          <div className="receipt-content">
            <div className="receipt-header success">
              <div className="success-icon">✓</div>
              <h1>Payment Successful!</h1>
              <p>Order ID: {orderId}</p>
              <p>Your payment has been processed successfully.</p>
              <button
                className="action-btn primary"
                onClick={() => setCurrentScreen('overview')}
              >
                Continue to Dashboard
              </button>
              <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                Redirecting to dashboard in {countdown} seconds...
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return null;
}
