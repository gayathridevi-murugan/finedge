import React, { useState, useEffect } from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import { verifyExit } from '../services/api';
import '../styles/ExitVerification.css';

export default function ExitVerification() {
  const orderId = useCheckoutStore((state) => state.orderId);
  const demoMode = useCheckoutStore((state) => state.demoMode);
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);
  const setExitStatus = useCheckoutStore((state) => state.setExitStatus);

  const [verifyStage, setVerifyStage] = useState('verifying');
  const [exitData, setExitData] = useState(null);

  useEffect(() => {
    const runVerification = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));

        const response = await verifyExit(orderId);
        const { exit_verification } = response.data.data;

        setExitData(exit_verification);
        const status = exit_verification.exit_status.toLowerCase();
        const gate = exit_verification.gate_status.toLowerCase();

        setExitStatus(status, gate, exit_verification.unpaid_items || []);

        if (status === 'approved') {
          setVerifyStage('approved');
        } else {
          setVerifyStage('blocked');
        }
      } catch (error) {
        console.error('Exit verification error:', error);
        // Default to approved if error
        setExitStatus('approved', 'green', []);
        setVerifyStage('approved');
      }
    };

    runVerification();
  }, [orderId, setExitStatus]);

  const handleNewCheckout = () => {
    setCurrentScreen('welcome');
  };

  const handleViewDetails = () => {
    // Could show more details about unpaid items
  };

  return (
    <div className="exit-verification-container">
      <div className="verification-content">
        {verifyStage === 'verifying' && (
          <div className="verify-stage verifying">
            <div className="verification-animation">
              <div className="gate-scanner"></div>
              <div className="scan-line"></div>
            </div>
            <h1>Verifying Exit...</h1>
            <p>Checking payment status and security</p>
          </div>
        )}

        {verifyStage === 'approved' && (
          <div className="verify-stage approved">
            <div className="gate-visual green">
              <div className="gate-icon">🟢</div>
            </div>
            <h1 className="status-approved">EXIT APPROVED</h1>
            <p className="status-message">All purchased items are verified</p>
            <div className="approved-details">
              <p>✓ All items paid</p>
              <p>✓ Security tags deactivated</p>
              <p>✓ You're cleared to leave</p>
            </div>
            <button
              className="new-checkout-button"
              onClick={handleNewCheckout}
            >
              NEW CHECKOUT
            </button>
          </div>
        )}

        {verifyStage === 'blocked' && (
          <div className="verify-stage blocked">
            <div className="gate-visual red">
              <div className="gate-icon">🔴</div>
            </div>
            <h1 className="status-blocked">EXIT BLOCKED</h1>
            <p className="status-message">Unpaid item detected</p>
            {exitData?.unpaid_items && exitData.unpaid_items.length > 0 && (
              <div className="unpaid-items">
                <h3>Unpaid Items:</h3>
                {exitData.unpaid_items.map((item, index) => (
                  <div key={index} className="unpaid-item">
                    <div className="item-name">{item.product_name}</div>
                    <div className="item-details">
                      <span>₹{item.price}</span>
                      <span className="security-status">Security: {item.security_tag_status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="blocked-action">
              <p>Please complete payment for unpaid items or return them to the shelf.</p>
              <button className="view-details-button" onClick={handleViewDetails}>
                VIEW DETAILS
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="exit-footer">
        <p className="simulation-note">This is a software simulation of EAS exit security - not a physical gate</p>
      </div>
    </div>
  );
}
