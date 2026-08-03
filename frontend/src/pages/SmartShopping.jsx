import React, { useState } from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import DashboardLayout from '../components/DashboardLayout';
import '../styles/SmartShopping.css';

export default function SmartShopping() {
  const cartItems = useCheckoutStore((state) => state.cartItems);
  const cartTotal = useCheckoutStore((state) => state.cartTotal);
  const setCartItems = useCheckoutStore((state) => state.setCartItems);
  const setCartTotal = useCheckoutStore((state) => state.setCartTotal);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const products = [
    { id: 1, name: 'Running Shoes', price: 1499, image: '👟', size: '42', color: 'Blue', nfcId: 'NFC-00192' },
    { id: 2, name: 'T-Shirt', price: 799, image: '👕', size: 'M', color: 'White', nfcId: 'NFC-00193' },
    { id: 3, name: 'Backpack', price: 2499, image: '🎒', size: 'One Size', color: 'Black', nfcId: 'NFC-00194' },
    { id: 4, name: 'Sports Watch', price: 3999, image: '⌚', size: 'One Size', color: 'Silver', nfcId: 'NFC-00195' },
  ];

  const handleSimulateNFCTap = async (product) => {
    setIsSimulating(true);
    setSelectedProduct(null);

    // Simulate NFC tap
    await new Promise(resolve => setTimeout(resolve, 800));
    setSelectedProduct(product);

    // Auto add to cart after showing details
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newCartItems = [...cartItems];
    const existingItem = newCartItems.find(item => item.id === product.id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      newCartItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      });
    }

    setCartItems(newCartItems);
    const newTotal = newCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setCartTotal(newTotal);

    setIsSimulating(false);
    setSelectedProduct(null);
  };

  return (
    <DashboardLayout pageTitle="Smart Product NFC">
      <div className="smart-shopping">
        <div className="shopping-grid">
          {/* LEFT: PRODUCT CARD */}
          <div className="shopping-column-left">
            {selectedProduct ? (
              <div className="product-detail-card">
                <div className="detail-image">
                  <span className="detail-emoji">{selectedProduct.image}</span>
                </div>
                <div className="detail-content">
                  <h2>{selectedProduct.name}</h2>
                  <div className="nfc-status-detail">
                    <span className="status-badge authentic">✓ Authentic</span>
                    <span className="nfc-id">{selectedProduct.nfcId}</span>
                  </div>
                  <p className="detail-price">₹{selectedProduct.price}</p>

                  {/* TABS */}
                  <div className="detail-tabs">
                    <div className="tab-pane active">
                      <h3>Product Details</h3>
                      <div className="detail-row">
                        <span className="detail-label">Size:</span>
                        <span className="detail-value">{selectedProduct.size}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Color:</span>
                        <span className="detail-value">{selectedProduct.color}</span>
                      </div>
                    </div>
                  </div>

                  <button className="add-to-cart-btn">Added to Cart ✓</button>
                </div>
              </div>
            ) : (
              <div className="instruction-card">
                <div className="instruction-icon">📱</div>
                <h2>Tap Products with Your Phone</h2>
                <p className="instruction-text">
                  Place your phone near an NFC-enabled product to view details and add to cart.
                </p>
                <p className="instruction-hint">
                  Click on a product below to simulate an NFC tap.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT: AVAILABLE PRODUCTS */}
          <div className="shopping-column-right">
            <div className="products-list">
              <h3 className="products-title">Available Products</h3>
              <div className="product-cards">
                {products.map((product) => (
                  <button
                    key={product.id}
                    className={`product-card ${isSimulating ? 'disabled' : ''}`}
                    onClick={() => handleSimulateNFCTap(product)}
                    disabled={isSimulating}
                  >
                    <div className="product-image">{product.image}</div>
                    <h4>{product.name}</h4>
                    <p className="product-card-price">₹{product.price}</p>
                    <div className="product-card-footer">
                      <span className="tap-hint">🔗 Tap to NFC</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* CART SUMMARY */}
            <div className="cart-summary">
              <h3>Cart Summary</h3>
              <div className="summary-items">
                {cartItems.length > 0 ? (
                  <>
                    {cartItems.map((item) => (
                      <div key={item.id} className="summary-item">
                        <span>{item.name} ×{item.quantity}</span>
                        <span className="summary-price">₹{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="summary-total">
                      <span>Total</span>
                      <span className="total-amount">₹{cartTotal.toLocaleString()}</span>
                    </div>
                  </>
                ) : (
                  <p className="empty-cart-text">No items yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* INFO SECTION */}
        <div className="smart-shopping-info">
          <div className="info-card-smart">
            <div className="info-icon">💡</div>
            <div className="info-content">
              <h4>Smart Product NFC Features</h4>
              <ul>
                <li>✓ Instant product authentication verification</li>
                <li>✓ Digital product passport with warranty info</li>
                <li>✓ Care instructions and product details</li>
                <li>✓ Purchase history and buy again options</li>
              </ul>
            </div>
          </div>

          <div className="info-card-smart">
            <div className="info-icon">🔐</div>
            <div className="info-content">
              <h4>Security & Authenticity</h4>
              <ul>
                <li>✓ Every product has unique NFC tag</li>
                <li>✓ Encrypted product information</li>
                <li>✓ Anti-counterfeiting verification</li>
                <li>✓ Full product provenance tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
