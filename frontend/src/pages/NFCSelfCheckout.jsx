import React, { useState, useEffect } from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import DashboardLayout from '../components/DashboardLayout';
import apiClient from '../services/api';
import '../styles/NFCSelfCheckout.css';

export default function NFCSelfCheckout() {
  const cartId = useCheckoutStore((state) => state.cartId);
  const cartItems = useCheckoutStore((state) => state.cartItems);
  const cartTotal = useCheckoutStore((state) => state.cartTotal);
  const setCartId = useCheckoutStore((state) => state.setCartId);
  const setCartItems = useCheckoutStore((state) => state.setCartItems);
  const setCartTotal = useCheckoutStore((state) => state.setCartTotal);
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);
  const [isScanning, setIsScanning] = useState(false);
  const [scanAnimation, setScanAnimation] = useState(null);
  const [lastScannedProduct, setLastScannedProduct] = useState(null);
  const [availableProducts, setAvailableProducts] = useState([]);

  // Initialize cart on mount
  useEffect(() => {
    const initializeCart = async () => {
      try {
        const response = await apiClient.post('/cart/create', {});
        if (response.data.success && response.data.data.cart_id) {
          setCartId(response.data.data.cart_id);
        }
      } catch (error) {
        console.warn('Could not initialize cart:', error);
      }
    };

    if (!cartId) {
      initializeCart();
    }
  }, [cartId, setCartId]);

  // Load available products from backend on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await apiClient.get('/products?limit=50');
        if (response.data.success) {
          setAvailableProducts(response.data.data.products);
        }
      } catch (error) {
        console.error('Could not load products from backend:', error);
        // Show error to user instead of using fallback
        setAvailableProducts([]);
      }
    };
    loadProducts();
  }, []);

  const handleSimulateNFCTap = async () => {
    if (isScanning || availableProducts.length === 0) return;

    setIsScanning(true);
    setScanAnimation('READY');

    try {
      // Simulate NFC tap sequence
      const sequence = ['READING', 'AUTHENTICATING', 'IDENTIFYING', 'FOUND'];
      for (let i = 0; i < sequence.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 400));
        setScanAnimation(sequence[i]);
      }

      // Select random product from backend data
      const randomProduct = availableProducts[Math.floor(Math.random() * availableProducts.length)];
      setLastScannedProduct(randomProduct);

      // Add to cart
      const newCartItems = [...cartItems];
      const existingItem = newCartItems.find(item => item.id === randomProduct.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        newCartItems.push({
          id: randomProduct.id,
          name: randomProduct.name,
          price: randomProduct.price,
          category: randomProduct.category || 'General',
          quantity: 1
        });
      }

      setCartItems(newCartItems);
      const newTotal = newCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      setCartTotal(newTotal);

      // Persist to backend if cart exists
      if (cartId) {
        try {
          await apiClient.post(`/cart/${cartId}/add`, {
            products: [{ product_id: randomProduct.id, quantity: existingItem ? 1 : 1 }]
          });
        } catch (error) {
          console.warn('Could not persist cart to backend:', error);
        }
      }

      setScanAnimation('ADDED');
      await new Promise(resolve => setTimeout(resolve, 1500));
      setScanAnimation(null);
    } catch (error) {
      console.error('Error scanning product:', error);
      setScanAnimation(null);
    } finally {
      setIsScanning(false);
    }
  };

  const journeySteps = [
    { step: 1, label: 'Tap Products', active: true },
    { step: 2, label: 'Review Cart', active: false },
    { step: 3, label: 'Pay', active: false },
    { step: 4, label: 'Exit', active: false },
  ];

  const subtotal = cartTotal;
  const tax = Math.round(subtotal * 0.1 * 100) / 100;
  const total = subtotal + tax;

  return (
    <DashboardLayout pageTitle="NFC Self Checkout" pageIcon="🏪">
      <div className="nfc-self-checkout">
        {/* JOURNEY STEPS */}
        <div className="journey-indicator">
          {journeySteps.map((step, idx) => (
            <div key={step.step} className="journey-step-bar">
              <div className={`step-circle ${step.active ? 'active' : ''}`}>{step.step}</div>
              <p className="step-title">{step.label}</p>
              {idx < journeySteps.length - 1 && <div className="step-line"></div>}
            </div>
          ))}
        </div>

        {/* MAIN CHECKOUT AREA */}
        <div className="checkout-area">
          {/* LEFT: NFC READER */}
          <div className="nfc-reader-section">
            <h2>NFC READER</h2>
            <div className="nfc-reader-container">
              {/* NFC ANIMATION */}
              <div className={`nfc-animation ${isScanning ? 'scanning' : ''}`}>
                <div className={`scanner-ring ring1 ${scanAnimation ? 'active' : ''}`}></div>
                <div className={`scanner-ring ring2 ${scanAnimation ? 'active' : ''}`}></div>
                <div className={`scanner-ring ring3 ${scanAnimation ? 'active' : ''}`}></div>
                <div className="nfc-icon">📱</div>
              </div>

              {/* STATUS TEXT */}
              <div className="nfc-status-display">
                {scanAnimation ? (
                  <div className={`status-animation status-${scanAnimation.toLowerCase()}`}>
                    <div className="status-spinner"></div>
                    <p className="status-text">{scanAnimation}</p>
                  </div>
                ) : isScanning ? (
                  <p className="status-text">Place product near reader...</p>
                ) : (
                  <p className="status-text">Ready to Scan</p>
                )}
              </div>

              {/* SIMULATE TAP BUTTON */}
              <button
                className="simulate-tap-btn"
                onClick={handleSimulateNFCTap}
                disabled={isScanning}
              >
                {isScanning ? 'Scanning...' : 'SIMULATE NFC TAP'}
              </button>

              {/* LAST SCANNED */}
              {lastScannedProduct && (
                <div className="last-scanned">
                  <p className="last-scanned-label">Last Scanned:</p>
                  <div className="last-scanned-product">
                    <span className="product-emoji">{lastScannedProduct.image}</span>
                    <div className="product-info">
                      <p className="product-name">{lastScannedProduct.name}</p>
                      <p className="product-price">₹{lastScannedProduct.price}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CENTER: SCANNING EFFECT */}
          <div className="scanning-center">
            <div className="pulse-effect"></div>
            <div className="pulse-effect delay-1"></div>
            <div className="pulse-effect delay-2"></div>
          </div>

          {/* RIGHT: SHOPPING CART */}
          <div className="cart-preview-section">
            <h2>SHOPPING CART</h2>
            <div className="cart-items-list">
              {cartItems.length > 0 ? (
                <>
                  {cartItems.map((item) => (
                    <div key={item.id} className="cart-item">
                      <span className="item-emoji">{item.image}</span>
                      <div className="item-details">
                        <p className="item-name">{item.name}</p>
                        <p className="item-nfc">NFC: {item.nfcId}</p>
                      </div>
                      <div className="item-price-qty">
                        <p className="item-qty">Qty: {item.quantity}</p>
                        <p className="item-price">₹{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="empty-cart">
                  <p className="empty-text">Scan products to start shopping</p>
                </div>
              )}
            </div>

            {/* CART TOTALS */}
            <div className="cart-totals">
              <div className="total-row">
                <span>Items:</span>
                <span className="total-value">{cartItems.length}</span>
              </div>
              <div className="total-row">
                <span>Subtotal:</span>
                <span className="total-value">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="total-row">
                <span>Tax (10%):</span>
                <span className="total-value">₹{tax.toLocaleString()}</span>
              </div>
              <div className="total-row final">
                <span>Total:</span>
                <span className="total-value">₹{total.toLocaleString()}</span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="cart-actions">
              <button className="action-btn secondary" onClick={() => setLastScannedProduct(null)}>
                Continue Scanning
              </button>
              <button className="action-btn primary" onClick={() => setCurrentScreen('cart')}>
                Review Cart →
              </button>
            </div>
          </div>
        </div>

        {/* INFO BOX */}
        <div className="info-box">
          <p className="info-title">💡 How NFC Self-Checkout Works</p>
          <p className="info-text">
            Place products near the NFC reader one at a time. Each tap adds the product to your cart.
            The system verifies authenticity and tracks your purchases. No bulk scanning - each item is verified individually.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
