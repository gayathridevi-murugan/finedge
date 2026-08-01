import React, { useState, useEffect } from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import DashboardLayout from '../components/DashboardLayout';
import apiClient from '../services/api';
import '../styles/MerchantOnboarding.css';

export default function MerchantOnboarding() {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState('DRAFT');
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    businessEmail: '',
    businessPhone: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const totalSteps = 6;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      await handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      // Submit to backend for Surfboard onboarding
      const response = await apiClient.post('/merchants/onboard', {
        ...formData,
        mode: 'DEMO' // Mark as demo until real Surfboard credentials available
      });

      if (response.data.success) {
        setStatus('SUBMITTED');
        // Simulate approval for demo
        setTimeout(() => setStatus('APPROVED'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Onboarding failed');
      console.error('Onboarding error:', err);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    'Business Info',
    'Owner Info',
    'Verification',
    'Settlement',
    'Review',
    'Submit'
  ];

  const statusBadgeColor = {
    'DRAFT': '#94a3b8',
    'SUBMITTED': '#3b82f6',
    'UNDER_REVIEW': '#f59e0b',
    'APPROVED': '#10b981',
    'REJECTED': '#ef4444',
    'ACTION_REQUIRED': '#f59e0b'
  };

  return (
    <DashboardLayout pageTitle="Merchant Onboarding" pageIcon="🏢">
      <div className="merchant-onboarding">
        {/* HEADER WITH STATUS */}
        <div className="onboarding-header">
          <h1>Merchant Account Setup</h1>
          <div className="onboarding-status">
            <span
              className="status-badge"
              style={{ backgroundColor: statusBadgeColor[status] }}
            >
              {status}
            </span>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
          <div className="step-indicators">
            {steps.map((stepName, index) => (
              <div
                key={index}
                className={`step-indicator ${index + 1 <= step ? 'active' : ''} ${index + 1 === step ? 'current' : ''}`}
              >
                <span className="step-number">{index + 1}</span>
                {window.innerWidth > 768 && <span className="step-label">{stepName}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* STEP CONTENT */}
        <div className="onboarding-form">
          {error && <div className="error-message">{error}</div>}

          {step === 1 && (
            <div className="form-step">
              <h2>Business Information</h2>
              <div className="form-group">
                <label>Business Name *</label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  placeholder="Your business name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Business Type *</label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select business type</option>
                  <option value="RETAIL">Retail</option>
                  <option value="SUPERMARKET">Supermarket</option>
                  <option value="MALL">Shopping Mall</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Business Email *</label>
                  <input
                    type="email"
                    name="businessEmail"
                    value={formData.businessEmail}
                    onChange={handleInputChange}
                    placeholder="business@example.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Business Phone *</label>
                  <input
                    type="tel"
                    name="businessPhone"
                    value={formData.businessPhone}
                    onChange={handleInputChange}
                    placeholder="+46 XXX XXX XXX"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-step">
              <h2>Owner/Representative Information</h2>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleInputChange}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="ownerEmail"
                    value={formData.ownerEmail}
                    onChange={handleInputChange}
                    placeholder="owner@example.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    name="ownerPhone"
                    value={formData.ownerPhone}
                    onChange={handleInputChange}
                    placeholder="+46 XXX XXX XXX"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form-step">
              <h2>Business Verification</h2>
              <div className="verification-info">
                <p>We'll verify your business information with official registries.</p>
                <div className="verification-checklist">
                  <div className="check-item">✓ Business registration</div>
                  <div className="check-item">✓ Tax identification</div>
                  <div className="check-item">✓ Owner verification</div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="form-step">
              <h2>Bank Settlement Information</h2>
              <p className="info-text">(Required for real Surfboard integration)</p>
              <div className="form-group">
                <label>Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  placeholder="Your bank name"
                />
              </div>
              <div className="form-group">
                <label>Account Number</label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  placeholder="Account number"
                />
              </div>
              <div className="form-group">
                <label>Account Holder Name</label>
                <input
                  type="text"
                  name="accountHolder"
                  value={formData.accountHolder}
                  onChange={handleInputChange}
                  placeholder="Account holder name"
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="form-step">
              <h2>Review Your Information</h2>
              <div className="review-section">
                <h3>Business Information</h3>
                <div className="review-item">
                  <span>Name:</span>
                  <span>{formData.businessName}</span>
                </div>
                <div className="review-item">
                  <span>Type:</span>
                  <span>{formData.businessType}</span>
                </div>
                <div className="review-item">
                  <span>Email:</span>
                  <span>{formData.businessEmail}</span>
                </div>

                <h3>Owner Information</h3>
                <div className="review-item">
                  <span>Name:</span>
                  <span>{formData.ownerName}</span>
                </div>
                <div className="review-item">
                  <span>Email:</span>
                  <span>{formData.ownerEmail}</span>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="form-step">
              <h2>Ready to Submit</h2>
              <div className="submit-info">
                <p>Your merchant onboarding is ready to be submitted to Surfboard.</p>
                <div className="submit-status">
                  <p><strong>Mode:</strong> DEMO MODE</p>
                  <p>Real Surfboard API credentials not configured. This is a demonstration flow.</p>
                  <p>To enable real Surfboard integration, update your Surfboard API credentials in the backend .env file.</p>
                </div>
              </div>
            </div>
          )}

          {/* FORM BUTTONS */}
          <div className="form-actions">
            <button
              className="btn btn-secondary"
              onClick={handlePrevious}
              disabled={step === 1}
            >
              ← Previous
            </button>
            <button
              className="btn btn-primary"
              onClick={handleNext}
              disabled={loading}
            >
              {loading ? 'Processing...' : (step === totalSteps ? 'Submit' : 'Next →')}
            </button>
          </div>
        </div>

        {/* INFO BOX */}
        <div className="info-box">
          <h3>🔒 Secure Integration with Surfboard</h3>
          <p>Your merchant account will be connected to Surfboard Payments for processing customer payments securely.</p>
          <p>All data is encrypted and handled according to PCI DSS standards.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
