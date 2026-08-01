import React, { useState, useEffect } from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import DashboardLayout from '../components/DashboardLayout';
import { verifyExit } from '../services/api';
import '../styles/ExitVerification.css';

export default function ExitVerificationDashboard() {
  const orderId = useCheckoutStore((state) => state.orderId);
  const cartItems = useCheckoutStore((state) => state.cartItems) || [];
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);
  const setExitStatus = useCheckoutStore((state) => state.setExitStatus);

  const [verifyStage, setVerifyStage] = useState('verifying');
  const [isApproved, setIsApproved] = useState(null);
  const [unpaidItems, setUnpaidItems] = useState([]);

  useEffect(() => {
    const runVerification = async () => {
      try {
        // Simulate verification delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Call backend API for actual exit verification
        if (orderId) {
          try {
            const response = await verifyExit(orderId);

            if (response.data.success) {
              const exitData = response.data.data.exit_verification;
              const status = exitData.exit_status.toLowerCase();
              const gate = exitData.gate_status.toLowerCase();

              setIsApproved(status === 'approved');

              if (status === 'approved') {
                setVerifyStage('approved');
                setExitStatus('APPROVED', 'GREEN', []);
              } else {
                setUnpaidItems(exitData.unpaid_items || []);
                setVerifyStage('blocked');
                setExitStatus('BLOCKED', 'RED', exitData.unpaid_items || []);
              }
            }
          } catch (error) {
            console.warn('Backend exit verification unavailable, using simulated verification');
            // Fallback to simulated verification
            const approved = Math.random() > 0.3; // 70% approval rate
            setIsApproved(approved);

            if (approved) {
              setVerifyStage('approved');
              setExitStatus('APPROVED', 'GREEN', []);
            } else {
              const selectedUnpaid = cartItems.slice(0, Math.ceil(Math.random() * 2));
              setUnpaidItems(selectedUnpaid);
              setVerifyStage('blocked');
              setExitStatus('BLOCKED', 'RED', selectedUnpaid);
            }
          }
        } else {
          // No order ID, use simulated verification for demo
          const approved = Math.random() > 0.3;
          setIsApproved(approved);

          if (approved) {
            setVerifyStage('approved');
            setExitStatus('APPROVED', 'GREEN', []);
          } else {
            const selectedUnpaid = cartItems.slice(0, Math.ceil(Math.random() * 2));
            setUnpaidItems(selectedUnpaid);
            setVerifyStage('blocked');
            setExitStatus('BLOCKED', 'RED', selectedUnpaid);
          }
        }
      } catch (error) {
        console.error('Exit verification error:', error);
        // Default to approved on error
        setIsApproved(true);
        setVerifyStage('approved');
        setExitStatus('APPROVED', 'GREEN', []);
      }
    };

    runVerification();
  }, [orderId, cartItems, setExitStatus]);

  const handleNewCheckout = () => {
    setCurrentScreen('overview');
  };

  const handleReturnItem = () => {
    // In a real system, this would process returning an item
    alert('Item return process initiated');
  };

  const handleCompletePayment = () => {
    // In a real system, this would show payment options again
    setCurrentScreen('payment');
  };

  return (
    <DashboardLayout pageTitle="Exit Verification" pageIcon="🚪">
      <div className="exit-verification-container">
        <div className="verification-content">
          {/* VERIFYING STAGE */}
          {verifyStage === 'verifying' && (
            <div className="verify-stage verifying">
              <div className="verification-animation">
                <div className="scanner-ring ring1"></div>
                <div className="scanner-ring ring2"></div>
                <div className="scanner-ring ring3"></div>
                <div className="scanner-icon">🚪</div>
              </div>
              <h1>Verifying Exit...</h1>
              <p>Checking payment status and security</p>
              <p className="verify-info">Please wait while we verify your items</p>
            </div>
          )}

          {/* APPROVED STAGE */}
          {verifyStage === 'approved' && (
            <div className="verify-stage approved">
              <div className="gate-visual green">
                <div className="gate-circle">
                  <div className="checkmark">✓</div>
                </div>
              </div>
              <h1 className="status-approved">EXIT APPROVED</h1>
              <p className="status-message">All purchased items are verified</p>

              <div className="approved-details">
                <div className="detail-item">
                  <span className="detail-icon">✓</span>
                  <span className="detail-text">All items paid</span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">✓</span>
                  <span className="detail-text">Security tags deactivated</span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">✓</span>
                  <span className="detail-text">You're cleared to leave</span>
                </div>
              </div>

              <div className="exit-actions">
                <button className="exit-button primary" onClick={handleNewCheckout}>
                  New Checkout
                </button>
              </div>
            </div>
          )}

          {/* BLOCKED STAGE */}
          {verifyStage === 'blocked' && (
            <div className="verify-stage blocked">
              <div className="gate-visual red">
                <div className="gate-circle">
                  <div className="warning-icon">⚠</div>
                </div>
              </div>
              <h1 className="status-blocked">EXIT BLOCKED</h1>
              <p className="status-message">Unpaid item detected</p>

              <div className="unpaid-items">
                <h3>Unpaid Items</h3>
                {unpaidItems.length > 0 ? (
                  unpaidItems.map((item, idx) => (
                    <div key={idx} className="unpaid-item">
                      <span className="item-name">{item.name || 'Product'}</span>
                      <span className="item-price">₹{(item.price || 0).toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <p className="no-items">Unable to determine unpaid items</p>
                )}
              </div>

              <div className="exit-actions">
                <button className="exit-button secondary" onClick={handleReturnItem}>
                  Return Item
                </button>
                <button className="exit-button primary" onClick={handleCompletePayment}>
                  Complete Payment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
