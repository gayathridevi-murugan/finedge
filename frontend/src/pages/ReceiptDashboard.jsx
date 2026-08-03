import React from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import DashboardLayout from '../components/DashboardLayout';
import '../styles/Receipt.css';

export default function ReceiptDashboard() {
  try {
    const cartItems = useCheckoutStore((state) => state.cartItems) || [];
    const cartTotal = Number(useCheckoutStore((state) => state.cartTotal)) || 0;
    const orderNumber = useCheckoutStore((state) => state.orderNumber) || 'ORD-' + Math.random().toString(36).substr(2, 9);
    const loyaltyPointsEarned = Number(useCheckoutStore((state) => state.loyaltyPointsEarned)) || 0;
    const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);

    const tax = (cartTotal * 0.1);
    const finalTotal = cartTotal + tax;

    const handleContinueToExit = () => {
      setCurrentScreen('exit-verification');
    };

    const handleNewCheckout = () => {
      setCurrentScreen('overview');
    };

    return (
      <DashboardLayout pageTitle="Digital Receipt">
        <div className="receipt-container">
          <div className="receipt-content">
            <div className="receipt-header">
              <div className="receipt-icon">✓</div>
              <h1>Digital Receipt</h1>
              <p className="receipt-order">Order #{String(orderNumber)}</p>
              <p className="receipt-date">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
            </div>

            <div className="receipt-items">
              <h3>Items Purchased</h3>
              {Array.isArray(cartItems) && cartItems.length > 0 ? (
                cartItems.map((item, index) => (
                  <div key={index} className="receipt-item-row">
                    <div className="item-details">
                      <span className="item-name">{String(item?.name || item?.product_name || 'Product')}</span>
                      <span className="item-qty">Qty: {item?.quantity || 1}</span>
                    </div>
                    <div className="item-price">
                      ₹{String(Number(item?.price || 0).toFixed(2))}
                    </div>
                  </div>
                ))
              ) : (
                <p>No items in this order</p>
              )}
            </div>

            <div className="receipt-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Tax (10%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {loyaltyPointsEarned > 0 && (
              <div className="loyalty-section">
                <h3>Loyalty Points</h3>
                <div className="points-earned">
                  <span className="points-amount">+{Math.floor(loyaltyPointsEarned)}</span>
                  <span className="points-label">Points Earned</span>
                </div>
              </div>
            )}

            <div className="receipt-footer">
              <p>Thank you for shopping with us!</p>
              <p>Visit again soon for more great savings</p>
            </div>

            <div className="receipt-actions">
              <button className="receipt-button secondary" onClick={handleNewCheckout}>
                New Checkout
              </button>
              <button className="receipt-button primary" onClick={handleContinueToExit}>
                Proceed to Exit Verification →
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  } catch (error) {
    console.error('Receipt render error:', error);
    return (
      <DashboardLayout pageTitle="Digital Receipt">
        <div className="receipt-container">
          <div className="receipt-content">
            <h1>Receipt Error</h1>
            <p>An error occurred while loading the receipt.</p>
            <p>{error.message}</p>
            <button onClick={() => {
              useCheckoutStore.getState().setCurrentScreen('overview');
            }}>
              Return to Overview
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }
}
