import React from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import { createCart } from '../services/api';
import '../styles/DemoSelector.css';

export default function DemoSelector() {
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);
  const setDemoMode = useCheckoutStore((state) => state.setDemoMode);
  const setCartId = useCheckoutStore((state) => state.setCartId);
  const [loading, setLoading] = React.useState(false);

  const demos = [
    {
      id: 'success',
      title: 'Successful Checkout',
      description: 'Complete purchase with 3 items detected, paid, and verified',
      icon: '✓',
      flow: 'Scan → Pay ✓ → Exit GREEN'
    },
    {
      id: 'unpaid-item',
      title: 'Unpaid Item Detected',
      description: 'System blocks exit when an item is not paid for',
      icon: '⚠',
      flow: 'Scan → Pay Partial → Exit RED'
    },
    {
      id: 'payment-failure',
      title: 'Payment Declined',
      description: 'Payment is declined and checkout fails',
      icon: '✕',
      flow: 'Scan → Payment Failed → Retry'
    },
    {
      id: 'manual',
      title: 'Manual Checkout',
      description: 'Build your own cart with custom items',
      icon: '→',
      flow: 'Scan → Edit → Pay → Done'
    }
  ];

  const handleDemoSelect = async (demoId) => {
    setLoading(true);
    try {
      setDemoMode(demoId);
      const cartResponse = await createCart();
      setCartId(cartResponse.cart_id);
      setCurrentScreen('nfc-terminal');
    } catch (error) {
      console.error('Error starting demo:', error);
      alert('Error starting demo: ' + error.message);
      setLoading(false);
    }
  };

  const handleBack = () => {
    setCurrentScreen('welcome');
  };

  return (
    <div className="demo-selector-screen">
      <div className="demo-selector-content">
        <div className="demo-header">
          <button className="back-button" onClick={handleBack} disabled={loading}>
            ← Back
          </button>
          <div>
            <h1>Select Demo Scenario</h1>
            <p>Experience Queue-Free Checkout in action</p>
          </div>
        </div>

        <div className="demo-grid">
          {demos.map((demo) => (
            <button
              key={demo.id}
              className="demo-card"
              onClick={() => handleDemoSelect(demo.id)}
              disabled={loading}
            >
              <div className="demo-icon">{demo.icon}</div>
              <h2 className="demo-title">{demo.title}</h2>
              <p className="demo-description">{demo.description}</p>
              <div className="demo-flow-badge">{demo.flow}</div>
            </button>
          ))}
        </div>

        <div className="demo-disclaimer">
          <p>
            <strong>Demo Reality:</strong> This demonstration runs real backend logic with actual NFC simulation,
            real cart management, real payment processing, and real security verification.
          </p>
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Initializing checkout...</p>
        </div>
      )}
    </div>
  );
}
