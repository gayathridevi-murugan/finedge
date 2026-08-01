import React, { useState } from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import DashboardLayout from '../components/DashboardLayout';
import '../styles/DemoControls.css';

export default function DemoControls() {
  const cartItems = useCheckoutStore((state) => state.cartItems);
  const cartTotal = useCheckoutStore((state) => state.cartTotal);
  const sessionId = useCheckoutStore((state) => state.sessionId);
  const paymentStatus = useCheckoutStore((state) => state.paymentStatus);
  const exitStatus = useCheckoutStore((state) => state.exitStatus);
  const gateStatus = useCheckoutStore((state) => state.gateStatus);
  const setCartItems = useCheckoutStore((state) => state.setCartItems);
  const setCartTotal = useCheckoutStore((state) => state.setCartTotal);
  const setPaymentStatus = useCheckoutStore((state) => state.setPaymentStatus);
  const setExitStatus = useCheckoutStore((state) => state.setExitStatus);
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);
  const reset = useCheckoutStore((state) => state.reset);
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications([...notifications, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const handleResetDemo = () => {
    reset();
    addNotification('Demo reset successfully');
  };

  const handleSimulateNFCTap = () => {
    const products = [
      { id: 1, name: 'Running Shoes', price: 1499 },
      { id: 2, name: 'T-Shirt', price: 799 },
      { id: 3, name: 'Backpack', price: 2499 },
    ];
    const product = products[Math.floor(Math.random() * products.length)];
    const newItems = [...cartItems];
    const existing = newItems.find(i => i.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      newItems.push({ ...product, quantity: 1 });
    }
    setCartItems(newItems);
    const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setCartTotal(total);
    addNotification(`NFC tap: ${product.name} added to cart`, 'info');
  };

  const handleSimulatePayment = (success) => {
    if (success) {
      setPaymentStatus('SUCCESSFUL');
      addNotification('Payment processed successfully', 'success');
    } else {
      setPaymentStatus('FAILED');
      addNotification('Payment failed - retry available', 'error');
    }
  };

  const handleApprovedExit = () => {
    setExitStatus('APPROVED', 'GREEN', []);
    addNotification('Exit verified - All items paid', 'success');
  };

  const handleBlockedExit = () => {
    setExitStatus('BLOCKED', 'RED', [{ name: 'Running Shoes', price: 1499 }]);
    addNotification('Exit blocked - Unpaid items detected', 'warning');
  };

  return (
    <DashboardLayout pageTitle="Demo Controls" pageIcon="⚙️">
      <div className="demo-controls">
        {/* NOTIFICATION AREA */}
        <div className="notification-area">
          {notifications.map((notification) => (
            <div key={notification.id} className={`notification notification-${notification.type}`}>
              {notification.message}
            </div>
          ))}
        </div>

        {/* QUICK ACTIONS */}
        <div className="demo-section">
          <div className="section-header">
            <h2>Quick Actions</h2>
            <span className="badge">8 Actions Available</span>
          </div>

          <div className="actions-grid">
            <button className="action-button primary" onClick={handleSimulateNFCTap}>
              <span className="action-icon">📱</span>
              <span className="action-name">Simulate NFC Tap</span>
              <span className="action-desc">Add random product to cart</span>
            </button>

            <button
              className="action-button primary"
              onClick={() => setCurrentScreen('overview')}
            >
              <span className="action-icon">📊</span>
              <span className="action-name">View Dashboard</span>
              <span className="action-desc">Go to overview dashboard</span>
            </button>

            <button
              className="action-button primary"
              onClick={() => setCurrentScreen('nfc-self-checkout')}
            >
              <span className="action-icon">🏪</span>
              <span className="action-name">NFC Self Checkout</span>
              <span className="action-desc">Terminal checkout experience</span>
            </button>

            <button
              className="action-button primary"
              onClick={() => setCurrentScreen('smart-shopping')}
            >
              <span className="action-icon">📱</span>
              <span className="action-name">Smart Shopping</span>
              <span className="action-desc">Phone NFC experience</span>
            </button>

            <button
              className="action-button secondary"
              onClick={() => handleSimulatePayment(true)}
            >
              <span className="action-icon">✅</span>
              <span className="action-name">Success Payment</span>
              <span className="action-desc">Simulate successful payment</span>
            </button>

            <button
              className="action-button secondary"
              onClick={() => handleSimulatePayment(false)}
            >
              <span className="action-icon">❌</span>
              <span className="action-name">Failed Payment</span>
              <span className="action-desc">Simulate payment failure</span>
            </button>

            <button
              className="action-button success"
              onClick={handleApprovedExit}
            >
              <span className="action-icon">🟢</span>
              <span className="action-name">Approved Exit</span>
              <span className="action-desc">GREEN gate - exit allowed</span>
            </button>

            <button
              className="action-button error"
              onClick={handleBlockedExit}
            >
              <span className="action-icon">🔴</span>
              <span className="action-name">Blocked Exit</span>
              <span className="action-desc">RED gate - unpaid items</span>
            </button>

            <button
              className="action-button warning"
              onClick={handleResetDemo}
            >
              <span className="action-icon">🔄</span>
              <span className="action-name">Reset Demo</span>
              <span className="action-desc">Clear all data and start over</span>
            </button>
          </div>
        </div>

        {/* CURRENT STATE */}
        <div className="demo-section">
          <div className="section-header">
            <h2>Current Session State</h2>
          </div>

          <div className="state-grid">
            <div className="state-card">
              <p className="state-label">Session ID</p>
              <p className="state-value">{sessionId || 'QFC-0001'}</p>
            </div>

            <div className="state-card">
              <p className="state-label">Items in Cart</p>
              <p className="state-value">{cartItems.length}</p>
            </div>

            <div className="state-card">
              <p className="state-label">Total Amount</p>
              <p className="state-value">₹{cartTotal.toLocaleString()}</p>
            </div>

            <div className="state-card">
              <p className="state-label">Payment Status</p>
              <p className="state-value">{paymentStatus || 'Pending'}</p>
            </div>

            <div className="state-card">
              <p className="state-label">Exit Status</p>
              <p className="state-value">{exitStatus || 'Not Verified'}</p>
            </div>

            <div className="state-card">
              <p className="state-label">Gate Status</p>
              <p className="state-value">{gateStatus || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* DEMO FLOW */}
        <div className="demo-section">
          <div className="section-header">
            <h2>Demo Flow Guide</h2>
          </div>

          <div className="demo-flow">
            <div className="flow-step completed">
              <div className="flow-number">1</div>
              <div className="flow-content">
                <h4>Welcome & Overview</h4>
                <p>User sees landing page, then dashboard overview</p>
              </div>
            </div>

            <div className="flow-step completed">
              <div className="flow-number">2</div>
              <div className="flow-content">
                <h4>Shopping Mode Selection</h4>
                <p>Choose NFC Self Checkout or Smart Shopping</p>
              </div>
            </div>

            <div className="flow-step">
              <div className="flow-number">3</div>
              <div className="flow-content">
                <h4>Scan Products</h4>
                <p>Simulate NFC taps to add products one-by-one</p>
                <button
                  className="mini-btn"
                  onClick={handleSimulateNFCTap}
                >
                  Try Tap →
                </button>
              </div>
            </div>

            <div className="flow-step">
              <div className="flow-number">4</div>
              <div className="flow-content">
                <h4>Review & Cart</h4>
                <p>View all items, quantities, and total amount</p>
              </div>
            </div>

            <div className="flow-step">
              <div className="flow-number">5</div>
              <div className="flow-content">
                <h4>Payment</h4>
                <p>Process payment with success/failure options</p>
                <button
                  className="mini-btn"
                  onClick={() => handleSimulatePayment(true)}
                >
                  Simulate Success →
                </button>
              </div>
            </div>

            <div className="flow-step">
              <div className="flow-number">6</div>
              <div className="flow-content">
                <h4>Receipt</h4>
                <p>View and download digital receipt</p>
              </div>
            </div>

            <div className="flow-step">
              <div className="flow-number">7</div>
              <div className="flow-content">
                <h4>Exit Verification</h4>
                <p>Green gate (approved) or Red gate (blocked)</p>
                <div className="exit-buttons">
                  <button className="mini-btn success" onClick={handleApprovedExit}>
                    Approved →
                  </button>
                  <button className="mini-btn error" onClick={handleBlockedExit}>
                    Blocked →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SYSTEM STATUS */}
        <div className="demo-section">
          <div className="section-header">
            <h2>System Status</h2>
          </div>

          <div className="system-status">
            <div className="status-item online">
              <span className="status-dot">●</span>
              <span className="status-name">Backend API</span>
              <span className="status-text">Connected</span>
            </div>

            <div className="status-item online">
              <span className="status-dot">●</span>
              <span className="status-name">NFC Service</span>
              <span className="status-text">Ready</span>
            </div>

            <div className="status-item online">
              <span className="status-dot">●</span>
              <span className="status-name">Payment Gateway</span>
              <span className="status-text">Demo Mode</span>
            </div>

            <div className="status-item online">
              <span className="status-dot">●</span>
              <span className="status-name">Database</span>
              <span className="status-text">Active</span>
            </div>
          </div>
        </div>

        {/* TIPS */}
        <div className="demo-tips">
          <div className="tips-icon">💡</div>
          <div className="tips-content">
            <h4>Demo Tips</h4>
            <ul>
              <li>Click "Simulate NFC Tap" multiple times to add different products</li>
              <li>Use quick actions to navigate between screens instantly</li>
              <li>Try both SUCCESS and BLOCKED exit scenarios</li>
              <li>Use Reset Demo to start fresh anytime</li>
              <li>All data is stored in the browser session</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
