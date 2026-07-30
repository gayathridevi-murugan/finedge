import React from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import '../styles/Receipt.css';

export default function Receipt() {
  const cartItems = useCheckoutStore((state) => state.cartItems);
  const cartTotal = useCheckoutStore((state) => state.cartTotal);
  const orderNumber = useCheckoutStore((state) => state.orderNumber);
  const loyaltyPointsEarned = useCheckoutStore((state) => state.loyaltyPointsEarned);
  const receipt = useCheckoutStore((state) => state.receipt);
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);

  const taxRate = 0.1;
  const tax = parseFloat((cartTotal * taxRate).toFixed(2));
  const finalTotal = parseFloat((cartTotal + tax).toFixed(2));

  const handleNewCheckout = () => {
    setCurrentScreen('welcome');
  };

  return (
    <div className="receipt-container">
      <div className="receipt-content">
        <div className="receipt-header">
          <div className="receipt-icon">✓</div>
          <h1>Digital Receipt</h1>
          <p className="receipt-order">Order #{orderNumber}</p>
          <p className="receipt-date">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
        </div>

        <div className="receipt-items">
          <h3>Items Purchased</h3>
          {cartItems.map((item, index) => (
            <div key={index} className="receipt-item-row">
              <div className="item-details">
                <span className="item-name">{item.product_name}</span>
                <span className="item-qty">Qty: {item.quantity || 1}</span>
              </div>
              <div className="item-price">
                ₹{item.price ? item.price.toFixed(2) : '0.00'}
              </div>
            </div>
          ))}
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
              <span className="points-amount">+{loyaltyPointsEarned}</span>
              <span className="points-label">Points Earned</span>
            </div>
          </div>
        )}

        <div className="receipt-footer">
          <p>Thank you for shopping with us!</p>
          <p>Visit again soon for more great savings</p>
        </div>

        <button className="new-checkout-button" onClick={handleNewCheckout}>
          NEW CHECKOUT
        </button>
      </div>
    </div>
  );
}
