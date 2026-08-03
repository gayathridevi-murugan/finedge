import React, { useState, useEffect } from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import DashboardLayout from '../components/DashboardLayout';
import apiClient from '../services/api';
import '../styles/NFCSelfCheckout.css';

export default function NFCSelfCheckout() {
  const cartId = useCheckoutStore((state) => state.nfcSelfCheckoutCartId);
  const cartItems = useCheckoutStore((state) => state.nfcSelfCheckoutCartItems);
  const cartTotal = useCheckoutStore((state) => state.nfcSelfCheckoutCartTotal);
  const setCartId = useCheckoutStore((state) => state.setNFCSelfCheckoutCartId);
  const setCartItems = useCheckoutStore((state) => state.setNFCSelfCheckoutCartItems);
  const setCartTotal = useCheckoutStore((state) => state.setNFCSelfCheckoutCartTotal);
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);
  const setShoppingMode = useCheckoutStore((state) => state.setShoppingMode);
  const [isScanning, setIsScanning] = useState(false);
  const [scanAnimation, setScanAnimation] = useState(null);
  const [lastScannedProduct, setLastScannedProduct] = useState(null);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [availableNFCTags, setAvailableNFCTags] = useState([]);

  // Initialize cart on mount
  useEffect(() => {
    setShoppingMode('nfc-self-checkout');
    // IMPORTANT: Clear old cart data from any previous session
    setCartItems([]);
    setCartTotal(0);

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

    // Always create a fresh cart when entering NFC Self Checkout
    initializeCart();
  }, [setCartId, setShoppingMode, setCartItems, setCartTotal]);

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

  // Load available NFC tags from backend on mount
  useEffect(() => {
    const loadNFCTags = async () => {
      try {
        const response = await apiClient.get('/nfc/available');
        if (response.data.success && response.data.data.available_tags) {
          setAvailableNFCTags(response.data.data.available_tags);
        }
      } catch (error) {
        console.error('Could not load NFC tags from backend:', error);
        setAvailableNFCTags([]);
      }
    };
    loadNFCTags();
  }, []);

  const handleSimulateNFCTap = async () => {
    // Use NFC tags if available, otherwise fall back to products
    const tagsToUse = availableNFCTags.length > 0 ? availableNFCTags : availableProducts;
    if (isScanning || tagsToUse.length === 0) return;

    setIsScanning(true);
    setScanAnimation('READY');

    try {
      // Simulate NFC tap sequence
      const sequence = ['READING', 'AUTHENTICATING', 'IDENTIFYING', 'FOUND'];
      for (let i = 0; i < sequence.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 400));
        setScanAnimation(sequence[i]);
      }

      let randomProduct = null;

      // If we have NFC tags, scan one to update last_scanned_at
      if (availableNFCTags.length > 0) {
        const randomTag = availableNFCTags[Math.floor(Math.random() * availableNFCTags.length)];
        try {
          const scanResponse = await apiClient.post('/nfc/scan', { tag_id: randomTag.tag_id });
          if (scanResponse.data.success && scanResponse.data.data.product) {
            randomProduct = scanResponse.data.data.product;
            setLastScannedProduct(randomProduct);
          }
        } catch (error) {
          console.warn('NFC scan failed, using fallback product:', error);
          // Fall back to random product
          randomProduct = availableProducts[Math.floor(Math.random() * availableProducts.length)];
          setLastScannedProduct(randomProduct);
        }
      } else {
        // Fallback: use random product without NFC scan
        randomProduct = availableProducts[Math.floor(Math.random() * availableProducts.length)];
        setLastScannedProduct(randomProduct);
      }

      if (!randomProduct) throw new Error('No product selected');

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
            products: [{ product_id: randomProduct.id, quantity: 1 }]
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
              {/* NFC READER ICON - scanning feedback is the status text/spinner below */}
              <div className={`nfc-animation ${isScanning ? 'scanning' : ''}`}>
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
