import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import DashboardLayout from '../components/DashboardLayout';
import apiClient, {
  createCart,
  addItemsToCart,
  createOrderFromCart,
  createPaymentSession,
  verifyPayment
} from '../services/api';
import '../styles/GroupShopping.css';

const MIN_SHOPPERS = 2;
const MAX_SHOPPERS = 10;
const POLL_MS = 3000;

const money = (amount) =>
  (parseFloat(amount) || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const cartSubtotal = (items) =>
  items.reduce((sum, i) => sum + parseFloat(i.price) * (i.quantity || 1), 0);

export default function GroupShopping() {
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);
  const setOrderId = useCheckoutStore((state) => state.setOrderId);
  const setOrderNumber = useCheckoutStore((state) => state.setOrderNumber);

  // 'setup' -> 'shopping' -> 'summary'
  const [flowStep, setFlowStep] = useState('setup');
  const [shopperCount, setShopperCount] = useState(3);
  const [groupSessionId, setGroupSessionId] = useState(null);

  // One cart per customer, kept separate for the whole shop.
  const [carts, setCarts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);

  // Single payment for the whole group.
  const [paying, setPaying] = useState(false);
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const [payError, setPayError] = useState(null);
  const popupRef = useRef(null);
  const pollRef = useRef(null);
  const pollOrderRef = useRef(null);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const res = await apiClient.get('/nfc/available');
        if (res.data.success && res.data.data.available_tags) {
          setAvailableTags(res.data.data.available_tags);
        }
      } catch (e) {
        console.warn('Could not load NFC tags');
      }
    };
    loadTags();
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  // ---------------------------------------------------------------- setup
  const handleStartShopping = async () => {
    const count = Math.max(MIN_SHOPPERS, Math.min(MAX_SHOPPERS, parseInt(shopperCount, 10) || MIN_SHOPPERS));
    setShopperCount(count);
    setCarts(Array.from({ length: count }, () => []));
    setCurrentIndex(0);

    try {
      const res = await apiClient.post('/group-shopping/create', {
        groupName: `Group-${Date.now()}`,
        memberCount: count
      });
      if (res.data.success) setGroupSessionId(res.data.data.groupSessionId);
    } catch (e) {
      // The session id is only a label on screen - shopping can continue without it.
      console.warn('Could not create group session:', e);
    }

    setFlowStep('shopping');
  };

  // ------------------------------------------------------------- scanning
  const handleSimulateNFCTap = async () => {
    if (scanning) return;
    setScanning(true);
    try {
      await new Promise((r) => setTimeout(r, 900));

      let tagId;
      if (availableTags.length > 0) {
        tagId = availableTags[Math.floor(Math.random() * availableTags.length)].tag_id;
      } else {
        tagId = ['NFC_0001_', 'NFC_0002_', 'NFC_0003_'][Math.floor(Math.random() * 3)];
      }

      const res = await apiClient.post('/nfc/scan', { tag_id: tagId });
      if (res.data.success && res.data.data.product) {
        const p = res.data.data.product;
        setSelectedProduct({
          id: p.id,
          name: p.name,
          price: parseFloat(p.price),
          image:
            p.category === 'Shoes' ? '👟' : p.category === 'Accessories' ? '🎒' : '👕',
          brand: p.brand || '',
          size: p.size || '',
          color: p.color || ''
        });
      } else {
        alert('Product not found');
      }
    } catch (e) {
      console.error('Error scanning NFC tag:', e);
      alert('Error scanning NFC tag. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  // Items land only in the current customer's cart.
  const handleAddToCart = () => {
    if (!selectedProduct) return;
    setCarts((prev) =>
      prev.map((cart, idx) => {
        if (idx !== currentIndex) return cart;
        const existing = cart.find((i) => i.id === selectedProduct.id);
        if (existing) {
          return cart.map((i) =>
            i.id === selectedProduct.id ? { ...i, quantity: (i.quantity || 1) + 1 } : i
          );
        }
        return [...cart, { ...selectedProduct, quantity: 1 }];
      })
    );
    setSelectedProduct(null);
  };

  const handleRemoveItem = (productId) => {
    setCarts((prev) =>
      prev.map((cart, idx) => (idx === currentIndex ? cart.filter((i) => i.id !== productId) : cart))
    );
  };

  // No payment here - just hand the reader to the next customer.
  const handleFinishCustomer = () => {
    setSelectedProduct(null);
    if (currentIndex < shopperCount - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setFlowStep('summary');
    }
  };

  // -------------------------------------------------------------- payment
  const grandTotal = carts.reduce((sum, c) => sum + cartSubtotal(c), 0);

  const checkPaymentStatus = useCallback(async () => {
    const orderIdToCheck = pollOrderRef.current;
    if (!orderIdToCheck) return;
    try {
      const res = await verifyPayment(orderIdToCheck);
      const status = res.data.data.order_status;

      if (status === 'PAID') {
        stopPolling();
        if (popupRef.current && !popupRef.current.closed) popupRef.current.close();

        // One receipt for the single combined order.
        try {
          await apiClient.post('/receipts/generate', { order_id: orderIdToCheck });
        } catch (e) {
          console.warn('Could not generate receipt:', e);
        }

        setCurrentScreen('payment-success');
      } else if (status === 'FAILED' || status === 'CANCELLED') {
        stopPolling();
        if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
        setWaitingForPayment(false);
        setPaying(false);
        setPayError('Payment was not completed. You can try again.');
      }
    } catch (e) {
      // Keep polling - a single failed check is not a failed payment.
    }
  }, [setCurrentScreen, stopPolling]);

  // PAY TOTAL - one Surfboard session for the combined grand total.
  const handlePayTotal = () => {
    // window.open has to run synchronously inside the click handler, before any
    // await, or the browser stops treating it as user-triggered and blocks it.
    const popup = window.open('', 'surfboard_checkout');
    if (popup) {
      try {
        popup.document.write(
          '<p style="font-family:sans-serif;padding:24px">Loading payment page…</p>'
        );
      } catch (e) {
        /* cosmetic only */
      }
    }
    runPayment(popup);
  };

  const runPayment = async (popup) => {
    setPaying(true);
    setPayError(null);

    try {
      // Every customer's items go into one cart, so the group settles as a
      // single order and a single Surfboard transaction.
      const cartRes = await createCart();
      const cartId = cartRes.data.data.cart_id;

      const products = carts.flatMap((cart) =>
        cart.map((i) => ({ product_id: i.id, quantity: i.quantity || 1 }))
      );
      if (products.length === 0) throw new Error('No items to pay for');
      await addItemsToCart(cartId, products);

      const orderRes = await createOrderFromCart(cartId, null);
      const orderId = orderRes.data.data.order.id;
      const orderNumber = orderRes.data.data.order.order_number;
      setOrderId(orderId);
      setOrderNumber(orderNumber);

      // Keep the per-customer split for the receipt view, keyed to this order.
      try {
        sessionStorage.setItem(
          `group-breakdown-${orderId}`,
          JSON.stringify({
            shoppers: carts.map((cart, idx) => ({
              customer: `Customer ${idx + 1}`,
              items: cart.map((i) => ({ name: i.name, quantity: i.quantity || 1, price: i.price })),
              subtotal: cartSubtotal(cart)
            })),
            grandTotal
          })
        );
      } catch (e) {
        /* non-essential */
      }

      const base = `${window.location.origin}${window.location.pathname}`;
      const returnUrl = `${base}?checkout_result=success&local_order_id=${orderId}`;
      const cancelUrl = `${base}?checkout_result=cancelled&local_order_id=${orderId}`;

      const sessionRes = await createPaymentSession(orderId, grandTotal, returnUrl, cancelUrl);
      const checkoutUrl = sessionRes.data.data.checkout_url;
      if (!checkoutUrl) throw new Error('Surfboard did not return a checkout URL');

      if (popup && !popup.closed) {
        popup.location.href = checkoutUrl;
        popupRef.current = popup;
        pollOrderRef.current = orderId;
        setWaitingForPayment(true);
        pollRef.current = setInterval(checkPaymentStatus, POLL_MS);
      } else {
        setPayError(
          'Your browser blocked the payment popup. Please allow popups for this site (check the address bar) and press PAY TOTAL again.'
        );
        setPaying(false);
      }
    } catch (error) {
      console.error('Group payment error:', error);
      setPayError(
        error.response?.data?.error?.message || error.message || 'Payment could not be started'
      );
      setPaying(false);
      if (popup && !popup.closed) popup.close();
    }
  };

  const handleCancelWaiting = () => {
    stopPolling();
    if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
    setWaitingForPayment(false);
    setPaying(false);
  };

  // =============================================================== RENDER
  if (flowStep === 'setup') {
    return (
      <DashboardLayout pageTitle="👥 Group Shopping">
        <div className="group-shopping-container">
          <div className="group-setup">
            <h1 className="section-title">Group Shopping</h1>
            <p className="section-subtitle">How many shoppers?</p>
            <p className="section-description">
              Each shopper scans into their own cart. The group pays once at the end.
            </p>

            <div className="shopper-count-row">
              <button
                type="button"
                className="count-step"
                onClick={() => setShopperCount((n) => Math.max(MIN_SHOPPERS, n - 1))}
                disabled={shopperCount <= MIN_SHOPPERS}
                aria-label="Fewer shoppers"
              >
                −
              </button>
              <input
                className="count-input"
                type="number"
                min={MIN_SHOPPERS}
                max={MAX_SHOPPERS}
                value={shopperCount}
                onChange={(e) => setShopperCount(e.target.value)}
                onBlur={(e) => {
                  const n = parseInt(e.target.value, 10);
                  setShopperCount(
                    Number.isNaN(n) ? MIN_SHOPPERS : Math.max(MIN_SHOPPERS, Math.min(MAX_SHOPPERS, n))
                  );
                }}
                aria-label="Number of shoppers"
              />
              <button
                type="button"
                className="count-step"
                onClick={() => setShopperCount((n) => Math.min(MAX_SHOPPERS, n + 1))}
                disabled={shopperCount >= MAX_SHOPPERS}
                aria-label="More shoppers"
              >
                +
              </button>
            </div>
            <p className="count-hint">
              {MIN_SHOPPERS} to {MAX_SHOPPERS} shoppers
            </p>

            <button className="btn-primary-lg" onClick={handleStartShopping}>
              Start Shopping
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (flowStep === 'shopping') {
    const cart = carts[currentIndex] || [];
    const subtotal = cartSubtotal(cart);
    const isLast = currentIndex === shopperCount - 1;

    return (
      <DashboardLayout pageTitle="👥 Group Shopping">
        <div className="group-shopping-container">
          <div className="group-header">
            <h2>Group Shopping</h2>
            <p className="group-session-info">
              {shopperCount} shoppers
              {groupSessionId ? ` • Session: GRP-${groupSessionId.substring(0, 8)}` : ''}
            </p>
          </div>

          <div className="current-turn">
            <p className="turn-label">Now Shopping</p>
            <h3 className="turn-title">Customer {currentIndex + 1}</h3>
            <p className="turn-progress">of {shopperCount}</p>
          </div>

          {/* Progress across the group */}
          <div className="group-progress">
            {carts.map((c, idx) => (
              <div
                key={idx}
                className={`progress-item ${
                  idx < currentIndex ? 'status-completed' : idx === currentIndex ? 'status-shopping' : 'status-waiting'
                }`}
              >
                <span className="progress-icon">
                  {idx < currentIndex ? '✓' : idx === currentIndex ? '🛒' : '⏳'}
                </span>
                <span className="progress-name">Customer {idx + 1}</span>
                {idx < currentIndex && <span className="progress-sub">₹{money(cartSubtotal(c))}</span>}
              </div>
            ))}
          </div>

          <div className="nfc-section">
            <div className="nfc-scanner-box">
              <div className={`nfc-animation ${scanning ? 'scanning' : ''}`}>
                <div className="nfc-icon-center">📱</div>
              </div>
              <h3 className="scanner-title">Scan products</h3>
              <p className="nfc-instruction">
                {scanning ? 'Scanning…' : 'Hold phone near the product NFC tag'}
              </p>
              <button className="btn-scan" onClick={handleSimulateNFCTap} disabled={scanning}>
                {scanning ? 'Scanning…' : 'Simulate NFC Tap'}
              </button>
            </div>

            {selectedProduct && (
              <div className="product-details">
                <div className="product-info">
                  <div className="product-image">{selectedProduct.image}</div>
                  <div className="product-text">
                    <h4>{selectedProduct.name}</h4>
                    <p className="brand">{selectedProduct.brand}</p>
                    <p className="price">₹{money(selectedProduct.price)}</p>
                    <p className="specs">
                      {selectedProduct.size}
                      {selectedProduct.size && selectedProduct.color ? ' • ' : ''}
                      {selectedProduct.color}
                    </p>
                  </div>
                </div>
                <div className="product-actions">
                  <button className="btn-add" onClick={handleAddToCart}>
                    Add to Customer {currentIndex + 1} Cart
                  </button>
                  <button className="btn-cancel" onClick={() => setSelectedProduct(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="cart-section">
            <h3>Customer {currentIndex + 1} Cart</h3>
            <div className="cart-items">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <span className="item-image">{item.image}</span>
                    <div className="item-details">
                      <p className="item-name">{item.name}</p>
                      <p className="item-qty">Qty: {item.quantity}</p>
                    </div>
                    <span className="item-price">₹{money(item.price * item.quantity)}</span>
                    <button
                      className="item-remove"
                      onClick={() => handleRemoveItem(item.id)}
                      aria-label={`Remove ${item.name}`}
                    >
                      ✕
                    </button>
                  </div>
                ))
              ) : (
                <p className="empty-cart">No items yet. Scan the first product.</p>
              )}
            </div>

            <div className="cart-totals">
              <div className="total-row final">
                <span>Customer {currentIndex + 1} Subtotal</span>
                <span>₹{money(subtotal)}</span>
              </div>
            </div>

            <button className="btn-primary-lg" onClick={handleFinishCustomer}>
              {isLast ? 'Finish & View Summary' : `Finish Customer ${currentIndex + 1}`}
            </button>
            <p className="finish-hint">No payment yet — the group pays once at the end.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ------------------------------------------------------------- summary
  if (waitingForPayment) {
    return (
      <DashboardLayout pageTitle="👥 Group Shopping">
        <div className="group-shopping-container">
          <div className="group-waiting">
            <h2>Waiting for payment…</h2>
            <p>
              Complete the payment in the Surfboard tab that just opened. This page updates on its
              own once the payment goes through.
            </p>
            <p className="waiting-total">Amount: ₹{money(grandTotal)}</p>
            <button className="btn-cancel-lg" onClick={handleCancelWaiting}>
              Cancel
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="👥 Group Shopping">
      <div className="group-shopping-container">
        <div className="group-summary">
          <h1 className="summary-heading">Group Shopping Summary</h1>
          <p className="section-description">
            {shopperCount} shoppers • one payment for the whole group
          </p>

          {carts.map((cart, idx) => (
            <div key={idx} className="summary-customer">
              <div className="summary-customer-head">
                <h3>Customer {idx + 1}</h3>
                <span className="summary-customer-total">₹{money(cartSubtotal(cart))}</span>
              </div>
              {cart.length > 0 ? (
                <div className="summary-lines">
                  {cart.map((item) => (
                    <div key={item.id} className="summary-line">
                      <span className="line-name">
                        {item.name}
                        {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                      </span>
                      <span className="line-price">₹{money(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="summary-empty">No items</p>
              )}
              <div className="summary-subtotal">
                <span>Subtotal</span>
                <span>₹{money(cartSubtotal(cart))}</span>
              </div>
            </div>
          ))}

          <div className="summary-grand">
            <span>Grand Total</span>
            <span className="grand-value">₹{money(grandTotal)}</span>
          </div>

          {payError && <div className="payment-message error">{payError}</div>}

          <button
            className="btn-pay-total"
            onClick={handlePayTotal}
            disabled={paying || grandTotal <= 0}
          >
            {paying ? 'Starting payment…' : `PAY TOTAL ₹${money(grandTotal)}`}
          </button>

          <button className="btn-cancel-lg" onClick={() => setFlowStep('shopping')}>
            Back to Shopping
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
