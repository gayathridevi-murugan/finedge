import React, { useState, useEffect } from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import DashboardLayout from '../components/DashboardLayout';
import apiClient from '../services/api';
import '../styles/GroupShopping.css';

// Format a number as Indian-grouped currency with exactly 2 decimals
const money = (amount) =>
  (parseFloat(amount) || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

export default function GroupShopping() {
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);

  // Flow states: 'add-shoppers' → 'shopping' → 'payment' → 'shopping' → ... → 'complete'
  const [flowStep, setFlowStep] = useState('add-shoppers');

  // Shoppers list with names
  const [shoppers, setShoppers] = useState([]);
  const [newShopperName, setNewShopperName] = useState('');

  // Group session data
  const [groupSessionId, setGroupSessionId] = useState(null);
  const [currentShopperIndex, setCurrentShopperIndex] = useState(0);

  // Track each person's completion
  const [completedShoppers, setCompletedShoppers] = useState([]);

  // Current person's shopping data
  const [currentPersonCart, setCurrentPersonCart] = useState([]);
  const [currentPersonTotal, setCurrentPersonTotal] = useState(0);
  const [currentPersonCartId, setCurrentPersonCartId] = useState(null);
  const [currentPersonOrderId, setCurrentPersonOrderId] = useState(null);

  // Product being scanned
  const [selectedProduct, setSelectedProduct] = useState(null);

  // UI states
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');

  // Load available NFC tags on mount
  useEffect(() => {
    const loadAvailableTags = async () => {
      try {
        const response = await apiClient.get('/nfc/available');
        if (response.data.success && response.data.data.available_tags) {
          setAvailableTags(response.data.data.available_tags);
        }
      } catch (error) {
        console.warn('Could not load NFC tags');
      }
    };
    loadAvailableTags();
  }, []);

  // Initialize cart for current person
  const initializePersonCart = async () => {
    try {
      const response = await apiClient.post('/cart/create', {});
      if (response.data.success && response.data.data.cart_id) {
        setCurrentPersonCartId(response.data.data.cart_id);
      }
    } catch (error) {
      console.warn('Could not initialize cart:', error);
    }
  };

  // When person changes, initialize their cart
  useEffect(() => {
    if (flowStep === 'shopping' && !currentPersonCartId) {
      initializePersonCart();
    }
  }, [flowStep, currentShopperIndex, currentPersonCartId]);

  // ============================================
  // STEP 1: ADD SHOPPERS WITH NAMES
  // ============================================
  const handleAddShopper = () => {
    const name = newShopperName.trim() || `Person ${shoppers.length + 1}`;
    const newShoppers = [...shoppers, { name: name, status: 'Waiting' }];
    setShoppers(newShoppers);
    setNewShopperName('');
  };

  const handleStartShopping = async () => {
    if (shoppers.length === 0) {
      alert('Please add at least one shopper');
      return;
    }

    setLoading(true);

    let sessionId = null;
    try {
      const response = await apiClient.post('/group-shopping/create', {
        groupName: `Group-${Date.now()}`,
        memberCount: shoppers.length,
        members: shoppers.map(s => s.name)
      });

      if (response.data.success) {
        sessionId = response.data.data.groupSessionId;
      } else {
        console.warn('Group session API returned failure:', response.data.error);
      }
    } catch (error) {
      console.warn('Could not create group session on backend:', error);
    }

    // Always advance - fall back to a local session id so the demo never dead-ends
    setGroupSessionId(sessionId || `LOCAL-${Date.now().toString(36)}`);
    setCurrentShopperIndex(0);

    const updated = shoppers.map((s, i) => ({ ...s, status: i === 0 ? 'Shopping' : 'Waiting' }));
    setShoppers(updated);

    setFlowStep('shopping');
    setLoading(false);
  };

  // ============================================
  // SCAN PRODUCTS FOR CURRENT PERSON
  // ============================================
  const handleSimulateNFCTap = async () => {
    if (scanning || loading) return;

    setScanning(true);
    setLoading(true);

    try {
      const steps = ['READY', 'NFC TAG DETECTED', 'READING PRODUCT', 'VERIFYING PRODUCT', 'PRODUCT FOUND'];
      for (let step of steps) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      let tagId;
      if (availableTags.length > 0) {
        tagId = availableTags[Math.floor(Math.random() * availableTags.length)].tag_id;
      } else {
        const demoTags = ['NFC_0001_', 'NFC_0002_', 'NFC_0003_'];
        tagId = demoTags[Math.floor(Math.random() * demoTags.length)];
      }

      const response = await apiClient.post('/nfc/scan', { tag_id: tagId });

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
          size: product.size || 'One Size',
          color: product.color || ''
        });
      } else {
        alert('Product not found');
      }
    } catch (error) {
      console.error('Error scanning NFC tag:', error);
      alert('Error scanning NFC tag. Please try again.');
    } finally {
      setScanning(false);
      setLoading(false);
    }
  };

  // Add scanned product to current person's cart
  const handleAddToCart = async () => {
    if (!selectedProduct) {
      alert('No product selected');
      return;
    }

    if (!currentPersonCartId) {
      alert('Cart not initialized');
      return;
    }

    const newItems = [...currentPersonCart];
    const existing = newItems.find(i => i.id === selectedProduct.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      newItems.push({
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: parseFloat(selectedProduct.price),
        image: selectedProduct.image,
        brand: selectedProduct.brand,
        size: selectedProduct.size,
        color: selectedProduct.color,
        quantity: 1
      });
    }

    setCurrentPersonCart(newItems);
    const total = newItems.reduce((sum, item) => sum + (parseFloat(item.price) * (item.quantity || 1)), 0);
    setCurrentPersonTotal(total);

    try {
      await apiClient.post(`/cart/${currentPersonCartId}/add`, {
        products: [{ product_id: selectedProduct.id, quantity: 1 }]
      });
    } catch (error) {
      console.warn('Could not persist cart to backend:', error);
    }

    setSelectedProduct(null);
  };

  // Proceed to payment
  const handleProceedToPayment = async () => {
    if (currentPersonCart.length === 0) {
      alert('Please add at least one product');
      return;
    }

    setFlowStep('payment');
    setPaymentProcessing(false);
    setPaymentSuccess(false);
  };

  // Process payment for current person
  const handlePayNow = async () => {
    setPaymentProcessing(true);
    setPaymentMessage('Processing payment...');

    try {
      let orderId;

      // Create order if needed
      if (!currentPersonOrderId) {
        try {
          const orderResponse = await apiClient.post('/orders/create', {
            cart_id: currentPersonCartId,
            customer_id: null
          });
          orderId = orderResponse.data.data?.order?.id || `ORD-${Date.now()}`;
        } catch (err) {
          orderId = `ORD-${Date.now()}`;
        }
      } else {
        orderId = currentPersonOrderId;
      }

      setCurrentPersonOrderId(orderId);

      const amount = currentPersonTotal * 1.1;

      try {
        await apiClient.post('/payments/process', {
          order_id: orderId,
          amount: amount,
          payment_method: 'card'
        });
      } catch (err) {
        console.warn('Payment API error, using demo success:', err);
      }

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      setPaymentSuccess(true);
      setPaymentMessage('✓ Payment Successful!');
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentSuccess(false);
      setPaymentMessage('✗ Payment Failed. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Proceed to next person
  const handleNextPerson = () => {
    const updated = [...completedShoppers];
    updated.push({
      index: currentShopperIndex,
      name: shoppers[currentShopperIndex].name,
      cartItems: currentPersonCart,
      cartTotal: currentPersonTotal,
      orderId: currentPersonOrderId,
      amount: currentPersonTotal * 1.1,
      status: 'COMPLETED'
    });
    setCompletedShoppers(updated);

    // Check if all shoppers are done
    if (currentShopperIndex === shoppers.length - 1) {
      setFlowStep('complete');
    } else {
      // Move to next shopper
      const nextIndex = currentShopperIndex + 1;
      setShoppers(shoppers.map((s, i) => {
        if (i === currentShopperIndex) return { ...s, status: 'Completed' };
        if (i === nextIndex) return { ...s, status: 'Shopping' };
        return s;
      }));

      setCurrentShopperIndex(currentShopperIndex + 1);
      setCurrentPersonCart([]);
      setCurrentPersonTotal(0);
      setCurrentPersonCartId(null);
      setCurrentPersonOrderId(null);
      setPaymentSuccess(false);
      setFlowStep('shopping');
    }
  };

  // ============================================
  // RENDER: ADD SHOPPERS STEP
  // ============================================
  if (flowStep === 'add-shoppers') {
    return (
      <DashboardLayout pageTitle="Group Shopping">
        <div className="group-shopping-container">
          <div className="add-shoppers-section">
            <h1 className="section-title">Group Shopping</h1>
            <p className="section-subtitle">Step 1: Add Shoppers</p>
            <p className="section-description">Set up group members. Each person will shop and checkout sequentially.</p>

            <div className="shoppers-list">
              {shoppers.map((shopper, idx) => (
                <div key={idx} className="shopper-card">
                  <span className="shopper-number">#{idx + 1}</span>
                  <span className="shopper-name">{shopper.name}</span>
                  <span className={`shopper-status status-${shopper.status.toLowerCase()}`}>
                    {shopper.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="add-shopper-form">
              <input
                type="text"
                placeholder="Add another shopper's name..."
                value={newShopperName}
                onChange={(e) => setNewShopperName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddShopper()}
              />
              <button className="btn-add-shopper" onClick={handleAddShopper}>
                + Add Shopper
              </button>
            </div>

            <button
              className="btn-start-shopping"
              onClick={handleStartShopping}
              disabled={loading || shoppers.length === 0}
            >
              Start Shopping →
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ============================================
  // RENDER: SHOPPING STEP
  // ============================================
  if (flowStep === 'shopping') {
    const currentShopper = shoppers[currentShopperIndex];
    return (
      <DashboardLayout pageTitle="Group Shopping">
        <div className="group-shopping-container">
          <div className="group-header">
            <h2>Group Shopping</h2>
            <p className="group-session-info">
              {shoppers.length} People • Session: GRP-{groupSessionId?.substring(0, 8) || 'LOADING'}
            </p>
          </div>

          <div className="current-turn">
            <p className="turn-label">Current Turn</p>
            <h3 className="turn-title">{currentShopper.name}</h3>
          </div>

          {/* GROUP PROGRESS */}
          <div className="group-progress">
            {shoppers.map((shopper, idx) => (
              <div key={idx} className={`progress-item status-${shopper.status.toLowerCase()}`}>
                <span className="progress-icon">
                  {shopper.status === 'Completed' ? '✓' : shopper.status === 'Shopping' ? '🛍️' : '⏳'}
                </span>
                <span className="progress-name">{shopper.name}</span>
              </div>
            ))}
          </div>

          {/* NFC Scanner */}
          <div className="nfc-section">
            <div className="nfc-scanner-box">
              <div className={`nfc-animation ${scanning ? 'scanning' : ''}`}>
                <div className="nfc-icon-center">📱</div>
              </div>

              <h3 className="scanner-title">Scan your products</h3>
              <p className="nfc-instruction">
                {scanning ? '🔄 Scanning...' : '📍 Hold phone near product NFC tag'}
              </p>

              <button
                className="btn-scan"
                onClick={handleSimulateNFCTap}
                disabled={scanning}
              >
                {scanning ? '⏳ Scanning...' : '👆 Simulate NFC Tap'}
              </button>
            </div>

            {/* Product Details */}
            {selectedProduct && (
              <div className="product-details">
                <div className="product-info">
                  <div className="product-image">{selectedProduct.image}</div>
                  <div className="product-text">
                    <h4>{selectedProduct.name}</h4>
                    <p className="brand">{selectedProduct.brand}</p>
                    <p className="price">₹{money(selectedProduct.price)}</p>
                    <p className="specs">{selectedProduct.size} • {selectedProduct.color}</p>
                  </div>
                </div>
                <div className="product-actions">
                  <button className="btn-add" onClick={handleAddToCart}>Add to Cart</button>
                  <button className="btn-cancel" onClick={() => setSelectedProduct(null)}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Cart Summary */}
          <div className="cart-section">
            <h3>Your Cart</h3>
            <div className="cart-items">
              {currentPersonCart.length > 0 ? (
                currentPersonCart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <span className="item-image">{item.image}</span>
                    <div className="item-details">
                      <p className="item-name">{item.name}</p>
                      <p className="item-qty">Qty: {item.quantity}</p>
                    </div>
                    <span className="item-price">₹{money(item.price * item.quantity)}</span>
                  </div>
                ))
              ) : (
                <p className="empty-cart">No items yet. Scan your first product!</p>
              )}
            </div>

            {currentPersonCart.length > 0 && (
              <div className="cart-totals">
                <div className="total-row">
                  <span>Subtotal</span>
                  <span>₹{money(currentPersonTotal)}</span>
                </div>
                <div className="total-row">
                  <span>Tax (10%)</span>
                  <span>₹{money(currentPersonTotal * 0.1)}</span>
                </div>
                <div className="total-row final">
                  <span>Total</span>
                  <span>₹{money(currentPersonTotal * 1.1)}</span>
                </div>
              </div>
            )}

            <button
              className="btn-pay"
              onClick={handleProceedToPayment}
              disabled={currentPersonCart.length === 0}
            >
              PAY NOW
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ============================================
  // RENDER: PAYMENT STEP
  // ============================================
  if (flowStep === 'payment') {
    const currentShopper = shoppers[currentShopperIndex];
    return (
      <DashboardLayout pageTitle="Group Shopping">
        <div className="group-shopping-container">
          <div className="payment-section">
            <h2>{currentShopper.name} - Payment</h2>

            <div className="payment-items">
              <h3>Items</h3>
              {currentPersonCart.map((item) => (
                <div key={item.id} className="payment-item">
                  <span>{item.name} × {item.quantity}</span>
                  <span className="price">₹{money(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="payment-totals">
              <div className="total-row">
                <span>Subtotal</span>
                <span>₹{money(currentPersonTotal)}</span>
              </div>
              <div className="total-row">
                <span>Tax (10%)</span>
                <span>₹{money(currentPersonTotal * 0.1)}</span>
              </div>
              <div className="total-row final">
                <span>Total</span>
                <span>₹{money(currentPersonTotal * 1.1)}</span>
              </div>
            </div>

            {!paymentSuccess && (
              <button
                className="btn-pay-large"
                onClick={handlePayNow}
                disabled={paymentProcessing}
              >
                {paymentProcessing ? '⏳ Processing...' : '💳 Pay Now'}
              </button>
            )}

            {/* Only shown while pending or on failure - the success block below carries its own heading */}
            {paymentMessage && !paymentSuccess && (
              <div className="payment-message error">
                {paymentMessage}
              </div>
            )}

            {paymentSuccess && (
              <div className="payment-success">
                <h3>✓ Payment Successful!</h3>
                <p>Amount Paid: ₹{money(currentPersonTotal * 1.1)}</p>
                <p>Order ID: {currentPersonOrderId}</p>
                <button className="btn-next" onClick={handleNextPerson}>
                  {currentShopperIndex === shoppers.length - 1 ? 'View Summary →' : 'Next Person →'}
                </button>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ============================================
  // RENDER: COMPLETE STEP
  // ============================================
  if (flowStep === 'complete') {
    const groupTotal = completedShoppers.reduce((sum, s) => sum + s.amount, 0);
    return (
      <DashboardLayout pageTitle="Group Shopping">
        <div className="group-shopping-container">
          <div className="complete-section">
            <h1>✓ Group Shopping Complete!</h1>
            <p className="complete-subtitle">
              All {shoppers.length} shoppers have checked out
            </p>

            <div className="completion-summary">
              <h3>Shopping Summary</h3>
              {completedShoppers.map((shopper) => (
                <div key={shopper.index} className="person-summary">
                  <span className="person-label">{shopper.name}</span>
                  <span className="person-status">✓ Completed</span>
                  <span className="person-amount">₹{money(shopper.amount)}</span>
                </div>
              ))}
            </div>

            <div className="group-totals">
              <div className="total-item">
                <span className="label">Total Shoppers</span>
                <span className="value">{shoppers.length}</span>
              </div>
              <div className="total-item">
                <span className="label">Group Total</span>
                <span className="value">₹{money(groupTotal)}</span>
              </div>
              <div className="total-item">
                <span className="label">Average Per Person</span>
                <span className="value">₹{money(groupTotal / shoppers.length)}</span>
              </div>
            </div>

            <button className="btn-dashboard" onClick={() => setCurrentScreen('overview')}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }
}
