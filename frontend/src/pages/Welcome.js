import React from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import '../styles/Welcome.css';

export default function Welcome() {
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);
  const reset = useCheckoutStore((state) => state.reset);

  const handleStartCheckout = () => {
    reset();
    setCurrentScreen('demo-selector');
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-header">
          <div className="logo-icon">◆</div>
          <h1 className="welcome-title">Skip the Queue</h1>
          <p className="welcome-tagline">Shop. Pay. Go.</p>
        </div>

        <div className="welcome-description">
          <p>Next-generation self-checkout powered by NFC technology</p>
          <p>Place multiple products. Detect instantly. Pay once. Verify and leave.</p>
        </div>

        <button
          className="welcome-button primary"
          onClick={handleStartCheckout}
        >
          <span className="button-text">START CHECKOUT</span>
          <span className="button-arrow">→</span>
        </button>

        <div className="welcome-features">
          <div className="feature-card">
            <div className="feature-step">1</div>
            <p className="feature-label">Place products on NFC terminal</p>
          </div>
          <div className="feature-card">
            <div className="feature-step">2</div>
            <p className="feature-label">All items detected simultaneously</p>
          </div>
          <div className="feature-card">
            <div className="feature-step">3</div>
            <p className="feature-label">Pay and exit in seconds</p>
          </div>
        </div>
      </div>

      <div className="welcome-background">
        <div className="bg-element element-1"></div>
        <div className="bg-element element-2"></div>
        <div className="bg-element element-3"></div>
      </div>
    </div>
  );
}
