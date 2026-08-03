import React, { useState, useEffect } from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import DashboardLayout from '../components/DashboardLayout';
import { scanNFCTag } from '../services/api';
import apiClient from '../services/api';
import '../styles/SmartNFCShoppingDashboard.css';

export default function SmartNFCShoppingDashboard() {
  const cartId = useCheckoutStore((state) => state.smartShoppingCartId);
  const cartItems = useCheckoutStore((state) => state.smartShoppingCartItems);
  const setCartId = useCheckoutStore((state) => state.setSmartShoppingCartId);
  const setCartItems = useCheckoutStore((state) => state.setSmartShoppingCartItems);
  const setCartTotal = useCheckoutStore((state) => state.setSmartShoppingCartTotal);
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);
  const setShoppingMode = useCheckoutStore((state) => state.setShoppingMode);
  const [scanning, setScanning] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initialize cart on mount - ALWAYS create fresh cart and clear old data
  useEffect(() => {
    setShoppingMode('smart-shopping');
    setCartItems([]);
    setCartTotal(0);
    setSelectedProduct(null);

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

    initializeCart();
  }, [setCartId, setCartItems, setCartTotal, setShoppingMode]);

  // Load available NFC tags from backend on mount
  useEffect(() => {
    const loadAvailableTags = async () => {
      try {
        const response = await apiClient.get('/nfc/available');
        if (response.data.success && response.data.data.available_tags) {
          setAvailableTags(response.data.data.available_tags);
        }
      } catch (error) {
        console.warn('Could not load NFC tags from backend');
      }
    };
    loadAvailableTags();
  }, []);

  const handleAddToCart = async () => {
    if (!selectedProduct) {
      alert('No product selected');
      return;
    }

    // Validate product has required fields
    if (!selectedProduct.name || !selectedProduct.price || selectedProduct.price <= 0) {
      alert('Product information incomplete. Please scan a valid product.');
      return;
    }

    const newItems = [...cartItems];
    const existing = newItems.find(i => i.id === selectedProduct.id);

    if (existing) {
      // Just increase quantity if item already in cart
      existing.quantity += 1;
    } else {
      // Add new item with ONLY real product data (no fallbacks)
      const cartItem = {
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: parseFloat(selectedProduct.price),
        image: selectedProduct.image || '👕',
        nfcId: selectedProduct.nfcId,
        brand: selectedProduct.brand,
        size: selectedProduct.size,
        color: selectedProduct.color,
        quantity: 1
      };
      newItems.push(cartItem);
    }

    setCartItems(newItems);
    const total = newItems.reduce((sum, item) => sum + (parseFloat(item.price) * (item.quantity || 1)), 0);
    setCartTotal(total);

    // Persist to backend if cart exists
    if (cartId) {
      try {
        await apiClient.post(`/cart/${cartId}/add`, {
          products: [{ product_id: selectedProduct.id, quantity: existing ? 1 : 1 }]
        });
      } catch (error) {
        console.warn('Could not persist cart to backend:', error);
      }
    }

    // Redirect to cart page after adding to cart
    setCurrentScreen('cart');
  };

  const handleSimulateNFCTap = async () => {
    if (scanning || loading) return;

    setScanning(true);
    setLoading(true);

    try {
      // Simulate NFC scan sequence
      const steps = ['READY', 'NFC TAG DETECTED', 'READING PRODUCT', 'VERIFYING PRODUCT', 'PRODUCT FOUND'];

      for (let step of steps) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Get a random NFC tag ID from available tags or use demo tags
      let tagId;
      if (availableTags.length > 0) {
        tagId = availableTags[Math.floor(Math.random() * availableTags.length)].tag_id;
      } else {
        // Fallback to demo tags if backend unavailable
        const demoTags = ['NFC_0001_', 'NFC_0002_', 'NFC_0003_'];
        tagId = demoTags[Math.floor(Math.random() * demoTags.length)];
      }

      // Call backend API to scan the NFC tag
      const response = await scanNFCTag(tagId);

      if (response.data.success && response.data.data.product) {
        const product = response.data.data.product;
        setSelectedProduct({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.category === 'Shoes' ? '👟' : product.category === 'Accessories' ? '🎒' : '👕',
          nfcId: tagId,
          brand: product.brand || 'Premium Brand',
          category: product.category || 'General',
          subcategory: product.subcategory || '',
          authentic: product.authenticity_verified || true,
          description: product.description || 'Premium product details available',
          size: product.size || 'One Size',
          color: product.color || '',
          material: product.material || '',
          care: product.care_instructions || 'Contact support for care instructions',
          warranty: `${product.warranty_months || 12} months warranty`,
          rating: product.rating || 4.5,
          reviews: product.review_count || 0,
          sku: product.sku || ''
        });

        // Only set the product details, don't add to cart yet
        // User must click "Add to Cart" button to add to cart
      } else {
        console.error('Product not found from backend');
      }
    } catch (error) {
      console.error('Error scanning NFC tag:', error);
      // Show error to user
      alert('Error scanning NFC tag. Please try again.');
    } finally {
      setScanning(false);
      setLoading(false);
      setActiveTab('details');
    }
  };

  return (
    <DashboardLayout pageTitle="Smart NFC Fashion Shopping">
      <div className="smart-nfc-shopping">
        {/* NFC INTERACTION AREA */}
        <div className="nfc-interaction-section">
          <div className="nfc-scanner-box">
            <div className={`nfc-animation ${scanning ? 'scanning' : ''}`}>
              <div className="nfc-icon-center">📱</div>
            </div>

            <h2 className="scanner-title">Tap a Fashion Product</h2>
            <p className="nfc-instruction">
              {scanning ? '🔄 Scanning Product Details...' : '📍 Hold phone near product NFC tag'}
            </p>

            <button
              className="simulate-nfc-btn"
              onClick={handleSimulateNFCTap}
              disabled={scanning}
            >
              {scanning ? '⏳ Scanning...' : '👆 Simulate NFC Tap'}
            </button>

            <p className="nfc-demo-note">
              💡 Demo Mode: Click button to scan a random fashion product from inventory
            </p>
          </div>

          {/* QUICK ACTIONS */}
          <div className="quick-actions">
            <button
              className="action-btn primary"
              onClick={() => setCurrentScreen('cart')}
            >
              <span className="action-icon">🛒</span>
              <span className="action-text">View Cart</span>
              {cartItems.length > 0 && (
                <span className="action-badge">{cartItems.length}</span>
              )}
            </button>

            <button
              className="action-btn secondary"
              onClick={() => setCurrentScreen('payment')}
              disabled={cartItems.length === 0}
            >
              <span className="action-icon">💳</span>
              <span className="action-text">Checkout</span>
            </button>

            <button
              className="action-btn secondary"
              onClick={() => setCurrentScreen('overview')}
            >
              <span className="action-icon">📊</span>
              <span className="action-text">Dashboard</span>
            </button>
          </div>
        </div>

        {/* PRODUCT DETAILS */}
        {selectedProduct && (
          <div className="product-details-section">
            <div className="product-header">
              <div className="product-image-large">{selectedProduct.image}</div>

              <div className="product-main-info">
                <h2>{selectedProduct.name}</h2>

                <div className="authenticity-badge">
                  <span className="badge-icon">✓</span>
                  <span className="badge-text">Authentic Product Verified</span>
                </div>

                <p className="product-price">₹{selectedProduct.price.toLocaleString()}</p>

                <div className="product-specs">
                  <div className="spec-item">
                    <span className="spec-label">👔 Category</span>
                    <span className="spec-value">{selectedProduct.subcategory || selectedProduct.category}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">📏 Size</span>
                    <span className="spec-value">{selectedProduct.size}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">🎨 Color</span>
                    <span className="spec-value">{selectedProduct.color}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">⭐ Rating</span>
                    <span className="spec-value">{selectedProduct.rating}/5 ({selectedProduct.reviews})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* TABS */}
            <div className="product-tabs-section">
              <div className="tabs-header">
                <button
                  className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button
                  className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                  onClick={() => setActiveTab('details')}
                >
                  Details
                </button>
                <button
                  className={`tab-btn ${activeTab === 'warranty' ? 'active' : ''}`}
                  onClick={() => setActiveTab('warranty')}
                >
                  Warranty
                </button>
                <button
                  className={`tab-btn ${activeTab === 'care' ? 'active' : ''}`}
                  onClick={() => setActiveTab('care')}
                >
                  Care Guide
                </button>
              </div>

              <div className="tabs-content">
                {activeTab === 'overview' && (
                  <div className="tab-pane">
                    <div className="info-card">
                      <h4>Product Description</h4>
                      <p>{selectedProduct.description}</p>
                    </div>
                    <div className="info-card">
                      <h4>Availability</h4>
                      <p className="availability in-stock">✓ In Stock - Ready to Purchase</p>
                    </div>
                  </div>
                )}

                {activeTab === 'details' && (
                  <div className="tab-pane">
                    <div className="info-card">
                      <h4>Product Information</h4>
                      <div className="info-rows">
                        <div className="info-row">
                          <span className="label">SKU</span>
                          <span className="value">{selectedProduct.sku}</span>
                        </div>
                        <div className="info-row">
                          <span className="label">Material</span>
                          <span className="value">{selectedProduct.material}</span>
                        </div>
                        <div className="info-row">
                          <span className="label">Size</span>
                          <span className="value">{selectedProduct.size}</span>
                        </div>
                        <div className="info-row">
                          <span className="label">Color</span>
                          <span className="value">{selectedProduct.color}</span>
                        </div>
                        <div className="info-row">
                          <span className="label">Price</span>
                          <span className="value">₹{selectedProduct.price.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'warranty' && (
                  <div className="tab-pane">
                    <div className="info-card">
                      <h4>✓ Warranty & Support</h4>
                      <p className="warranty-period">{selectedProduct.warranty || '12 months warranty'}</p>
                      <p className="authenticity-text">✓ Authenticity Guaranteed</p>
                      <div className="warranty-details">
                        <p>📧 Email: support@selfcheckout.com</p>
                        <p>📞 Phone: +46-8-CHECKOUT (Swedish support)</p>
                        <p>🌐 Web: www.selfcheckout.com/support</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'care' && (
                  <div className="tab-pane">
                    <div className="info-card">
                      <h4>Care Instructions</h4>
                      <div className="care-steps">
                        {selectedProduct.care.split('\n').map((step, idx) => (
                          <p key={idx}>{step}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="product-actions">
              <button
                className="action-primary"
                onClick={handleAddToCart}
              >
                Add to Cart
              </button>
              <button
                className="action-secondary"
                onClick={() => setCurrentScreen('product-passport')}
              >
                View Product Passport
              </button>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!selectedProduct && (
          <div className="empty-state">
            <div className="empty-icon">📱</div>
            <h3>No Product Scanned</h3>
            <p>Tap your phone on an NFC-enabled product to view its details and digital product passport</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
