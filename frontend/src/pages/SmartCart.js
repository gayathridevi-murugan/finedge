import React from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import '../styles/SmartCart.css';

export default function SmartCart() {
  const cartItems = useCheckoutStore((state) => state.cartItems);
  const cartTotal = useCheckoutStore((state) => state.cartTotal);
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);

  const taxRate = 0.1;
  const tax = parseFloat((cartTotal * taxRate).toFixed(2));
  const finalTotal = parseFloat((cartTotal + tax).toFixed(2));

  const handleProceedToPayment = () => {
    setCurrentScreen('payment');
  };

  const handleBack = () => {
    setCurrentScreen('welcome');
  };

  return (
    <div className="smart-cart-container">
      <button className="back-button" onClick={handleBack}>
        ← Back
      </button>

      <div className="cart-header">
        <h1>Your Cart</h1>
        <p className="item-count">{cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}</p>
      </div>

      <div className="cart-content">
        {cartItems.length > 0 ? (
          <>
            <div className="cart-items">
              {cartItems.map((item, index) => (
                <div key={index} className="cart-item">
                  <div className="item-info">
                    <h3 className="item-name">{item.product_name}</h3>
                    <p className="item-quantity">Qty: {item.quantity}</p>
                  </div>
                  <div className="item-price">
                    ₹{item.price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
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

            <button
              className="proceed-button"
              onClick={handleProceedToPayment}
            >
              PROCEED TO PAYMENT
            </button>
          </>
        ) : (
          <div className="empty-cart">
            <p>No items in cart</p>
          </div>
        )}
      </div>
    </div>
  );
}
