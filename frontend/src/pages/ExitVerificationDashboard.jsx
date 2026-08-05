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
  const [blockReason, setBlockReason] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const runVerification = async () => {
      // Nothing to verify without an order. This used to fall through to
      // Math.random() > 0.3 and approve or block at random.
      if (!orderId) {
        if (!cancelled) setVerifyStage('no-order');
        return;
      }

      try {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        const response = await verifyExit(orderId);
        if (cancelled) return;

        // The endpoint reports success:false for a blocked exit, so the status
        // has to be read from the payload. Gating on response.data.success left
        // a blocked exit stuck on the verifying spinner for ever.
        const exitData = response.data?.data?.exit_verification;
        if (!exitData?.exit_status) {
          throw new Error(response.data?.error?.message || 'Verification response was empty');
        }

        const approved = exitData.exit_status.toUpperCase() === 'APPROVED';
        const items = exitData.unpaid_items || [];

        setIsApproved(approved);
        setUnpaidItems(items);
        // simulation_note is "…not physical gate. Reason: <why>"; keep the why.
        const note = exitData.simulation_note || '';
        setBlockReason(note.includes('Reason:') ? note.split('Reason:').pop().trim() : null);
        setVerifyStage(approved ? 'approved' : 'blocked');
        setExitStatus(
          approved ? 'APPROVED' : 'BLOCKED',
          approved ? 'GREEN' : 'RED',
          approved ? [] : items
        );
      } catch (error) {
        if (cancelled) return;
        // A gate must never open because a check failed. This previously fell
        // back to a random verdict, and the outer catch defaulted to approved.
        console.error('Exit verification failed:', error);
        setErrorMessage(
          error.response?.data?.error?.message || error.message || 'Verification unavailable'
        );
        setIsApproved(false);
        setVerifyStage('error');
      }
    };

    runVerification();
    return () => { cancelled = true; };
    // cartItems is intentionally not a dependency - it is a fresh array each
    // render and would restart verification on every store update.
  }, [orderId, setExitStatus]);

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
    <DashboardLayout pageTitle="Exit Verification">
      <div className="exit-verification-container">
        <div className="verification-content">
          {/* VERIFYING STAGE */}
          {verifyStage === 'verifying' && (
            <div className="verify-stage verifying">
              <div className="verification-animation">
                <div className="scanner-icon">🚪</div>
              </div>
              <h1>Verifying Exit...</h1>
              <p>Checking payment status and security</p>
              <p className="verify-info">Please wait while we verify your items</p>
            </div>
          )}

          {/* NOTHING TO VERIFY - reached with no order in the session */}
          {verifyStage === 'no-order' && (
            <div className="verify-stage verifying">
              <div className="verification-animation">
                <div className="scanner-icon">🚪</div>
              </div>
              <h1>No Order To Verify</h1>
              <p className="status-message">
                The gate checks a completed order. Finish a checkout first, then come back here.
              </p>
              <div className="exit-actions">
                <button className="exit-button primary" onClick={handleNewCheckout}>
                  Start a Checkout
                </button>
              </div>
            </div>
          )}

          {/* VERIFICATION FAILED - the gate stays shut when the check cannot run */}
          {verifyStage === 'error' && (
            <div className="verify-stage blocked">
              <div className="gate-visual red">
                <div className="gate-circle">
                  <div className="warning-icon">⚠</div>
                </div>
              </div>
              <h1 className="status-blocked">VERIFICATION UNAVAILABLE</h1>
              <p className="status-message">{errorMessage}</p>
              <p className="verify-info">
                The gate stays closed when the check cannot be completed. Please call an attendant.
              </p>
              <div className="exit-actions">
                <button className="exit-button primary" onClick={handleNewCheckout}>
                  Back to Dashboard
                </button>
              </div>
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
                <h3>{unpaidItems.length > 0 ? 'Unpaid Items' : 'Reason'}</h3>
                {unpaidItems.length > 0 ? (
                  unpaidItems.map((item, idx) => (
                    <div key={idx} className="unpaid-item">
                      <span className="item-name">
                        {item.product_name || item.name || 'Product'}
                        {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                      </span>
                      <span className="item-price">
                        ₹{(parseFloat(item.price) || 0).toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  // A block can be order-wide rather than per item, e.g. payment
                  // not completed. Showing the reason beats "unable to determine".
                  <p className="no-items">{blockReason || 'No itemised detail returned'}</p>
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
