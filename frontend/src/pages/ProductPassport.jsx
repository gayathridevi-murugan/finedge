import React from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import Button from '../components/Button';
import '../styles/ProductPassport_Premium.css';

export default function ProductPassport() {
  const [activeTab, setActiveTab] = React.useState('details');
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);

  return (
    <div className="passport-container">
      <div className="passport-content">
        {/* PRODUCT IMAGE */}
        <div className="passport-image">
          <div className="product-image-placeholder">
            📦
          </div>
        </div>

        {/* AUTHENTICITY BADGE */}
        <div className="authenticity-badge">
          <span className="badge-icon">✓</span>
          <span className="badge-text">Authentic & Verified</span>
        </div>

        {/* PRODUCT TITLE */}
        <h1 className="passport-title">Premium Product</h1>
        <p className="passport-sku">SKU: PRD-2024-001</p>

        {/* TABS */}
        <div className="passport-tabs">
          <button
            className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button
            className={`tab-button ${activeTab === 'warranty' ? 'active' : ''}`}
            onClick={() => setActiveTab('warranty')}
          >
            Warranty
          </button>
          <button
            className={`tab-button ${activeTab === 'care' ? 'active' : ''}`}
            onClick={() => setActiveTab('care')}
          >
            Care
          </button>
        </div>

        {/* TAB CONTENT */}
        <div className="tab-content">
          {activeTab === 'details' && (
            <div className="details-tab">
              <div className="info-card">
                <h3>Purchase Information</h3>
                <div className="info-row">
                  <span className="label">Order ID:</span>
                  <span className="value">ORD-2024-0847</span>
                </div>
                <div className="info-row">
                  <span className="label">Receipt:</span>
                  <span className="value">REC-2024-0847</span>
                </div>
                <div className="info-row">
                  <span className="label">Purchase Date:</span>
                  <span className="value">July 31, 2024</span>
                </div>
                <div className="info-row">
                  <span className="label">Store Location:</span>
                  <span className="value">Stockholm Central</span>
                </div>
              </div>

              <div className="info-card">
                <h3>Product Specifications</h3>
                <div className="info-row">
                  <span className="label">Brand:</span>
                  <span className="value">Premium Brand</span>
                </div>
                <div className="info-row">
                  <span className="label">Manufacturer:</span>
                  <span className="value">Quality Manufacturing Co.</span>
                </div>
                <div className="info-row">
                  <span className="label">Country of Origin:</span>
                  <span className="value">Sweden</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'warranty' && (
            <div className="warranty-tab">
              <div className="info-card">
                <h3>Warranty Coverage</h3>
                <div className="warranty-item">
                  <span className="duration">2 Years</span>
                  <span className="description">Manufacturing Defect Coverage</span>
                </div>
                <div className="warranty-item">
                  <span className="duration">1 Year</span>
                  <span className="description">Accidental Damage Protection</span>
                </div>
                <div className="warranty-item">
                  <span className="duration">Lifetime</span>
                  <span className="description">Material Quality Guarantee</span>
                </div>
              </div>

              <div className="info-card">
                <h3>Warranty Details</h3>
                <p>
                  This product is covered under a comprehensive warranty program.
                  For claims or service, contact our warranty team with your receipt and order ID.
                </p>
                <div className="warranty-contact">
                  <p>📞 Support: +46 (0) 8 XXX XXXX</p>
                  <p>📧 Email: warranty@queuefreecheckout.com</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'care' && (
            <div className="care-tab">
              <div className="info-card">
                <h3>Care Instructions</h3>
                <ol className="care-steps">
                  <li>Store in a cool, dry place away from direct sunlight</li>
                  <li>Clean regularly with a soft, damp cloth</li>
                  <li>Avoid harsh chemicals and abrasive materials</li>
                  <li>Follow specific material care instructions included in packaging</li>
                  <li>Keep original packaging for optimal storage</li>
                </ol>
              </div>

              <div className="info-card">
                <h3>Pro Tips</h3>
                <ul className="pro-tips">
                  <li>🌡️ Maintain temperature between 15-25°C for longevity</li>
                  <li>💧 Keep away from moisture and water exposure</li>
                  <li>🎒 Use protective case when transporting</li>
                  <li>✨ Polish quarterly to maintain appearance</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="passport-actions">
          <Button variant="primary" fullWidth>
            Buy Again
          </Button>
          <Button variant="secondary" fullWidth>
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
}
