import React from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import { useTheme } from '../store/ThemeContext';
import Button from '../components/Button';
import '../styles/Welcome_Premium.css';

export default function Welcome() {
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);
  const reset = useCheckoutStore((state) => state.reset);
  const { theme, toggleTheme } = useTheme();

  const handleStartDemo = () => {
    setCurrentScreen('overview');
  };

  return (
    <div className="welcome-container">
      <button
        onClick={toggleTheme}
        className="welcome-theme-toggle"
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <div className="welcome-content">
        {/* HERO SECTION */}
        <div className="welcome-hero">
          <div className="hero-icon">🛍️</div>
          <h1 className="hero-title">SELF CHECKOUT</h1>
          <p className="hero-tagline">Tap • Shop • Pay • Go</p>
          <p className="hero-description">
            Experience the future of frictionless retail with NFC-powered self-checkout
          </p>
        </div>

        {/* CTA BUTTON */}
        <div className="welcome-cta">
          <Button
            variant="primary"
            size="lg"
            onClick={handleStartDemo}
            fullWidth
            className="start-button"
          >
            START DEMO →
          </Button>
        </div>

        {/* FEATURES */}
        <div className="welcome-features">
          <div className="feature-item">
            <div className="feature-icon">📱</div>
            <h3>Smartphone Shopping</h3>
            <p>Tap products with your phone and add them instantly</p>
          </div>

          <div className="feature-item">
            <div className="feature-icon">🏪</div>
            <h3>Self-Checkout Terminal</h3>
            <p>Modern kiosk experience for fast, secure checkout</p>
          </div>

          <div className="feature-item">
            <div className="feature-icon">👥</div>
            <h3>Group Shopping</h3>
            <p>Shop together and split payments with friends</p>
          </div>

          <div className="feature-item">
            <div className="feature-icon">✅</div>
            <h3>Smart Verification</h3>
            <p>Security gate ensures only paid items exit</p>
          </div>
        </div>

        {/* FLOW STEPS */}
        <div className="welcome-benefits">
          <h2>How It Works</h2>
          <div className="flow-steps">
            <div className="flow-step">
              <span className="step-number">1</span>
              <span className="step-label">Select Shopping Mode</span>
            </div>
            <span className="flow-arrow">→</span>
            <div className="flow-step">
              <span className="step-number">2</span>
              <span className="step-label">Tap Products</span>
            </div>
            <span className="flow-arrow">→</span>
            <div className="flow-step">
              <span className="step-number">3</span>
              <span className="step-label">Review Cart</span>
            </div>
            <span className="flow-arrow">→</span>
            <div className="flow-step">
              <span className="step-number">4</span>
              <span className="step-label">Pay & Verify</span>
            </div>
          </div>
        </div>

        {/* BENEFITS */}
        <div className="welcome-benefits">
          <h2>Why SELF CHECKOUT?</h2>
          <div className="benefits-grid">
            <div className="benefit">
              <span className="benefit-icon">⚡</span>
              <h4>Lightning Fast</h4>
              <p>Complete checkout in minutes, not hours</p>
            </div>
            <div className="benefit">
              <span className="benefit-icon">🔒</span>
              <h4>Secure & Verified</h4>
              <p>Security gate prevents loss and theft</p>
            </div>
            <div className="benefit">
              <span className="benefit-icon">💳</span>
              <h4>Multiple Payment</h4>
              <p>Support all major payment methods</p>
            </div>
            <div className="benefit">
              <span className="benefit-icon">🌍</span>
              <h4>Sustainable</h4>
              <p>Reduce paper, reduce waste, reduce lines</p>
            </div>
          </div>
        </div>

        {/* CALL TO ACTION */}
        <div className="welcome-footer">
          <Button
            variant="primary"
            size="lg"
            onClick={handleStartDemo}
            fullWidth
          >
            Experience SELF CHECKOUT
          </Button>
          <p className="footer-note">🎯 This is a full-featured demo of the complete checkout system</p>
        </div>
      </div>

      {/* BACKGROUND GRADIENT */}
      <div className="welcome-bg-gradient"></div>
    </div>
  );
}
