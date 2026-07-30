import React, { useState, useEffect } from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import { processPayment, createOrderFromCart } from '../services/api';
import '../styles/Payment.css';

export default function Payment() {
  const cartId = useCheckoutStore((state) => state.cartId);
  const cartTotal = useCheckoutStore((state) => state.cartTotal);
  const demoMode = useCheckoutStore((state) => state.demoMode);
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);
  const setOrderId = useCheckoutStore((state) => state.setOrderId);
  const setOrderNumber = useCheckoutStore((state) => state.setOrderNumber);
  const setPaymentStatus = useCheckoutStore((state) => state.setPaymentStatus);
  const setError = useCheckoutStore((state) => state.setError);

  const [paymentStage, setPaymentStage] = useState('review');
  const [isProcessing, setIsProcessing] = useState(false);

  const taxRate = 0.1;
  const tax = parseFloat((cartTotal * taxRate).toFixed(2));
  const finalTotal = parseFloat((cartTotal + tax).toFixed(2));

  const handlePayNow = async () => {
    try {
      setIsProcessing(true);
      setPaymentStage('processing');

      // Create order
      const orderResponse = await createOrderFromCart(cartId, null);
      const orderId = orderResponse.data.data.order.id;
      const orderNumber = orderResponse.data.data.order.order_number;

      setOrderId(orderId);
      setOrderNumber(orderNumber);

      // Process payment
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate based on demo mode
      let isSuccess = true;
      if (demoMode === 'payment-failure') {
        isSuccess = false;
      } else if (demoMode === 'unpaid-item') {
        // For unpaid-item demo, we process payment for only partial items
        isSuccess = true;
      } else {
        isSuccess = true;
      }

      if (isSuccess) {
        const paymentResponse = await processPayment(orderId, finalTotal, 'CREDIT_CARD');
        setPaymentStatus(paymentResponse.data.data.payment.status);
        setPaymentStage('success');

        // Auto-transition
        await new Promise(resolve => setTimeout(resolve, 2000));
        setCurrentScreen('checkout-complete');
      } else {
        setPaymentStatus('FAILED');
        setPaymentStage('failed');
        setError('Payment declined. Please try another payment method.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('FAILED');
      setPaymentStage('failed');
      setError(error.message || 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setPaymentStage('review');
  };

  const handleBack = () => {
    setCurrentScreen('cart');
  };

  return (
    <div className="payment-container">
      <button className="back-button" onClick={handleBack}>
        ← Back
      </button>

      <div className="payment-content">
        {paymentStage === 'review' && (
          <>
            <h1>Order Summary</h1>
            <div className="payment-summary">
              <div className="summary-item">
                <span>Subtotal</span>
                <span>₹{cartTotal.toFixed(2)}</span>
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
              </div>
            </div>

            <button
              className="pay-button"
              onClick={handlePayNow}
              disabled={isProcessing}
            >
              {isProcessing ? 'PROCESSING...' : 'PAY NOW'}
            </button>
          </>
        )}

        {paymentStage === 'processing' && (
          <div className="payment-stage processing">
            <div className="payment-animation">
              <div className="processor-spinner"></div>
            </div>
            <h2>Processing Payment...</h2>
            <p>Please wait while we process your transaction</p>
          </div>
        )}

        {paymentStage === 'success' && (
          <div className="payment-stage success">
            <div className="success-icon">✓</div>
            <h2>Payment Successful</h2>
            <p>Your payment has been processed</p>
            <div className="success-details">
              <p>Redirecting to checkout...</p>
            </div>
          </div>
        )}

        {paymentStage === 'failed' && (
          <div className="payment-stage failed">
            <div className="failed-icon">✕</div>
            <h2>Payment Failed</h2>
            <p>Your payment could not be processed</p>
            <button className="retry-button" onClick={handleRetry}>
              TRY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
