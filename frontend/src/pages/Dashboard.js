import React, { useEffect, useState } from 'react';
import { simulatorService } from '../services/api';
import '../styles/Dashboard.css';

export default function Dashboard({ onStartCheckout }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await simulatorService.getDemoData();
        setProducts(res.data.data.sample_tags || []);
      } catch (error) {
        console.error('Failed to load products:', error);
      }
    };
    loadProducts();
  }, []);

  return (
    <div className="dashboard">
      <div className="header">
        <div>
          <h1>Queue-Free Checkout</h1>
          <p className="subtitle">NFC-Based Retail System</p>
        </div>
      </div>

      <div className="main-content">
        <div className="section welcome">
          <h2>Welcome!</h2>
          <p>Welcome to Queue-Free Checkout. Scan products with NFC tags to add them to your cart, complete payment, and exit with verification.</p>
          <button className="btn btn-primary large" onClick={onStartCheckout}>
            Start Shopping
          </button>
        </div>

        <div className="section">
          <h2>Available Products</h2>
          <div className="products-grid">
            {products.map((product) => (
              <div key={product.tag_id} className="product-card">
                <div className="product-image">🏷️</div>
                <h3>{product.product_name}</h3>
                <div className="price">${product.price}</div>
                <div className="tag-id">NFC: {product.tag_id.substring(0, 20)}...</div>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <h2>How It Works</h2>
          <div className="steps-list">
            <div className="step-item">
              <div className="step-icon">1</div>
              <div>
                <h3>Scan Products</h3>
                <p>Use NFC scanner to scan product tags and add items to your cart</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-icon">2</div>
              <div>
                <h3>Review Cart</h3>
                <p>Review all items and quantities before proceeding to checkout</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-icon">3</div>
              <div>
                <h3>Process Payment</h3>
                <p>Pay securely through Surfboard Payments</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-icon">4</div>
              <div>
                <h3>Verify Exit</h3>
                <p>Our security system verifies all items are paid before exit</p>
              </div>
            </div>
          </div>
        </div>

        <div className="section features">
          <h2>Features</h2>
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">🏷️</div>
              <h3>NFC Scanning</h3>
              <p>Fast product detection</p>
            </div>
            <div className="feature">
              <div className="feature-icon">💳</div>
              <h3>Surfboard Payments</h3>
              <p>Secure payment processing</p>
            </div>
            <div className="feature">
              <div className="feature-icon">🔒</div>
              <h3>Smart Exit</h3>
              <p>Automated security verification</p>
            </div>
            <div className="feature">
              <div className="feature-icon">⭐</div>
              <h3>Loyalty Rewards</h3>
              <p>Earn points on every purchase</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
