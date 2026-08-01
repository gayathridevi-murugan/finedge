import React, { useState, useEffect } from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import DashboardLayout from '../components/DashboardLayout';
import apiClient from '../services/api';
import '../styles/CartPage.css';

export default function CartPage() {
  const cartId = useCheckoutStore((state) => state.cartId);
  const cartItems = useCheckoutStore((state) => state.cartItems);
  const cartTotal = useCheckoutStore((state) => state.cartTotal);
  const setCartItems = useCheckoutStore((state) => state.setCartItems);
  const setCartTotal = useCheckoutStore((state) => state.setCartTotal);
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);
  const [quantities, setQuantities] = useState({});

  // Load cart data from backend on mount - only if cart is empty
  useEffect(() => {
    const loadCart = async () => {
      try {
        if (cartId && cartItems.length === 0) {
          const response = await apiClient.get(`/cart/${cartId}`);
          if (response.data.success && response.data.data) {
            const cartData = response.data.data;
            setCartItems(cartData.items || []);
            setCartTotal(cartData.total_amount || 0);
          }
        }
      } catch (error) {
        console.warn('Could not load cart from backend:', error);
      }
    };

    if (cartId && cartItems.length === 0) {
      loadCart();
    }
  }, [cartId, cartItems.length, setCartItems, setCartTotal]);

  const handleQuantityChange = async (itemId, qty) => {
    if (qty < 1) return;
    const newItems = cartItems.map(item =>
      item.id === itemId ? { ...item, quantity: qty } : item
    );
    setCartItems(newItems);
    const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setCartTotal(newTotal);

    // Persist to backend
    if (cartId) {
      try {
        await apiClient.post(`/cart/${cartId}/update-quantity`, {
          product_id: itemId,
          quantity: qty
        });
      } catch (error) {
        console.warn('Could not update cart quantity:', error);
      }
    }
  };

  const handleRemoveItem = async (itemId) => {
    const newItems = cartItems.filter(item => item.id !== itemId);
    setCartItems(newItems);
    const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setCartTotal(newTotal);

    // Persist to backend
    if (cartId) {
      try {
        await apiClient.post(`/cart/${cartId}/remove`, {
          product_id: itemId
        });
      } catch (error) {
        console.warn('Could not remove item from cart:', error);
      }
    }
  };

  const subtotal = cartTotal;
  const tax = Math.round(subtotal * 0.1 * 100) / 100;
  const total = subtotal + tax;

  return (
    <DashboardLayout pageTitle="Shopping Cart" pageIcon="🛒">
      <button className="back-button" onClick={() => setCurrentScreen('smart-shopping')}>
        ← Back
      </button>
      <div className="cart-page">
        <div className="cart-layout">
          {/* CART ITEMS */}
          <div className="cart-items-section">
            {cartItems.length > 0 ? (
              <>
                <div className="cart-header">
                  <h2>Your Items</h2>
                  <span className="item-count">{cartItems.length} items</span>
                </div>

                <div className="cart-items">
                  {cartItems.map((item) => {
                    const itemPrice = parseFloat(item.price) || 0;
                    const itemQty = parseInt(item.quantity) || 1;
                    const itemTotal = itemPrice * itemQty;
                    return (
                    <div key={item.id} className="cart-item-row">
                      <div className="item-image">{item.image || '👕'}</div>
                      <div className="item-info">
                        <h4>{item.name}</h4>
                        {item.brand && <p className="item-brand">👔 {item.brand}</p>}
                        <div className="item-details">
                          {item.size && <span className="item-detail">📏 {item.size}</span>}
                          {item.color && <span className="item-detail">🎨 {item.color}</span>}
                        </div>
                      </div>
                      <div className="item-controls">
                        <button
                          className="qty-btn"
                          onClick={() => handleQuantityChange(item.id, itemQty - 1)}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={itemQty}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                          className="qty-input"
                        />
                        <button
                          className="qty-btn"
                          onClick={() => handleQuantityChange(item.id, itemQty + 1)}
                        >
                          +
                        </button>
                      </div>
                      <div className="item-price">₹{itemTotal.toLocaleString()}</div>
                      <button
                        className="remove-btn"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        🗑️
                      </button>
                    </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="empty-cart">
                <div className="empty-icon">🛒</div>
                <h3>Your cart is empty</h3>
                <p>Start shopping by scanning products with NFC</p>
              </div>
            )}
          </div>

          {/* ORDER SUMMARY */}
          <div className="order-summary-section">
            <div className="summary-box">
              <h3>Order Summary</h3>

              <div className="summary-rows">
                <div className="summary-row">
                  <span className="summary-label">Subtotal</span>
                  <span className="summary-value">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Tax (10%)</span>
                  <span className="summary-value">₹{tax.toLocaleString()}</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row total">
                  <span className="summary-label">Total</span>
                  <span className="summary-value">₹{total.toLocaleString()}</span>
                </div>
              </div>

              {/* LOYALTY */}
              <div className="loyalty-box">
                <span className="loyalty-icon">⭐</span>
                <div className="loyalty-info">
                  <p className="loyalty-label">Loyalty Points</p>
                  <p className="loyalty-points">Earn {Math.floor(total / 10)} points</p>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="summary-actions">
                <button
                  className="action-btn secondary"
                  onClick={() => setCurrentScreen('overview')}
                >
                  Continue Shopping
                </button>
                <button
                  className="action-btn primary"
                  onClick={() => setCurrentScreen('payment')}
                  disabled={cartItems.length === 0}
                >
                  Proceed to Payment →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
