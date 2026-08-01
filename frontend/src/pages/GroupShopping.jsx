import React, { useState, useEffect, useRef } from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import DashboardLayout from '../components/DashboardLayout';
import apiClient from '../services/api';
import '../styles/GroupShopping.css';

export default function GroupShopping() {
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);
  const cartItems = useCheckoutStore((state) => state.cartItems);

  // State Management
  const [groupSessionId, setGroupSessionId] = useState('GRP-' + Math.random().toString(36).substr(2, 9).toUpperCase());
  const [members, setMembers] = useState([
    { id: 'host', name: 'You (Host)', status: 'paid', amount: 0, paid: false }
  ]);
  const [products, setProducts] = useState(cartItems.map(item => ({
    ...item,
    assignedTo: 'host',
    emoji: item.image || '👕'
  })));
  const [splitCalculation, setSplitCalculation] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const initializedRef = useRef(false);

  // Initialize calculations
  useEffect(() => {
    if (!initializedRef.current) {
      calculatePayments();
      initializedRef.current = true;
    }
  }, []);

  // Calculate payments for all members
  const calculatePayments = () => {
    const calculations = {};

    members.forEach(member => {
      const memberProducts = products.filter(p => p.assignedTo === member.id);
      const subtotal = memberProducts.reduce((sum, p) => sum + (parseFloat(p.price) * p.quantity), 0);
      const sharedAmount = products
        .filter(p => p.assignedTo === 'shared')
        .reduce((sum, p) => sum + (parseFloat(p.price) * p.quantity), 0) / members.length;

      const total = subtotal + sharedAmount;
      const tax = total * 0.1;
      const grandTotal = total + tax;

      calculations[member.id] = {
        memberId: member.id,
        memberName: member.name,
        subtotal: parseFloat(subtotal.toFixed(2)),
        sharedAmount: parseFloat(sharedAmount.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        total: parseFloat(grandTotal.toFixed(2)),
        paid: member.paid || false,
        status: member.paid ? 'paid' : 'pending'
      };
    });

    setSplitCalculation(calculations);
  };

  // Update product assignment
  const handleAssignProduct = (productId, memberId) => {
    const updatedProducts = products.map(p =>
      p.id === productId ? { ...p, assignedTo: memberId } : p
    );
    setProducts(updatedProducts);

    // Recalculate immediately
    const updatedMembers = members.map(m => ({
      ...m,
      paid: splitCalculation[m.id]?.paid || false
    }));
    setMembers(updatedMembers);
    calculatePayments();
  };

  // Handle payment
  const handlePayment = async (memberId) => {
    try {
      setLoading(true);
      const amount = splitCalculation[memberId]?.total || 0;

      // Simulate payment
      const updatedMembers = members.map(m =>
        m.id === memberId ? { ...m, paid: true } : m
      );
      setMembers(updatedMembers);

      // Update calculations
      const updatedCalcs = { ...splitCalculation };
      updatedCalcs[memberId].paid = true;
      updatedCalcs[memberId].status = 'paid';
      setSplitCalculation(updatedCalcs);

      setError(null);
    } catch (err) {
      setError('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Check if all paid
  const allPaid = members.every(m => m.paid);
  const totalAmount = Object.values(splitCalculation).reduce((sum, calc) => sum + calc.total, 0);

  return (
    <DashboardLayout pageTitle="Group Shopping" pageIcon="👥">
      <div className="group-shopping-premium">
        {/* Header Card */}
        <div className="premium-card header-card">
          <div className="header-top">
            <div>
              <h1 className="group-title">👥 Group Shopping</h1>
              <p className="group-code">Code: {groupSessionId}</p>
            </div>
            <div className="qr-section">
              <div className="qr-placeholder">📱 QR</div>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Members Panel */}
          <div className="premium-card members-card">
            <h2 className="section-title">Members Joined</h2>
            <div className="members-grid">
              {members.map(member => (
                <div key={member.id} className={`member-badge ${member.paid ? 'paid' : 'pending'}`}>
                  <div className="member-avatar">👤</div>
                  <div className="member-info">
                    <p className="member-name">{member.name}</p>
                    <div className="member-status-badges">
                      {member.paid ? (
                        <span className="badge success">✓ Paid</span>
                      ) : (
                        <span className="badge pending">⏳ Pending</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Products Panel */}
          <div className="premium-card products-card">
            <h2 className="section-title">Products Scanned</h2>
            <div className="products-list">
              {products.length === 0 ? (
                <p className="empty-state">No products added yet</p>
              ) : (
                products.map(product => (
                  <div key={product.id} className="product-row">
                    <div className="product-info">
                      <div className="product-emoji">{product.emoji}</div>
                      <div className="product-details">
                        <p className="product-name">{product.name}</p>
                        <p className="product-brand">{product.brand || 'Premium'}</p>
                      </div>
                      <div className="product-price">₹{parseFloat(product.price).toLocaleString()}</div>
                    </div>
                    <select
                      className="assignment-dropdown"
                      value={product.assignedTo}
                      onChange={(e) => handleAssignProduct(product.id, e.target.value)}
                    >
                      {members.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.name.split('(')[0].trim()}
                        </option>
                      ))}
                      <option value="shared">Shared</option>
                    </select>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment Summary Panel */}
          <div className="premium-card payment-summary-card">
            <h2 className="section-title">Payment Summary</h2>
            <div className="payment-summary">
              {members.map(member => {
                const calc = splitCalculation[member.id];
                return (
                  <div key={member.id} className={`summary-row ${calc?.paid ? 'paid' : ''}`}>
                    <div className="summary-name">
                      <span className="member-label">{member.name}</span>
                      <div className="summary-breakdown">
                        <small>Items: ₹{calc?.subtotal || 0}</small>
                        {calc?.sharedAmount > 0 && <small>Shared: ₹{calc.sharedAmount}</small>}
                        <small>Tax: ₹{calc?.tax || 0}</small>
                      </div>
                    </div>
                    <div className="summary-total">
                      <p className="amount">₹{calc?.total || 0}</p>
                      {calc?.paid ? (
                        <span className="badge-small success">✓ Paid</span>
                      ) : (
                        <span className="badge-small pending">Pending</span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div className="summary-divider"></div>
              <div className="summary-grand-total">
                <p className="label">Grand Total</p>
                <p className="amount">₹{totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Payment Actions Panel */}
          <div className="premium-card actions-card">
            <h2 className="section-title">Complete Payment</h2>
            <div className="payment-actions">
              {members.map(member => {
                const calc = splitCalculation[member.id];
                return (
                  <div key={member.id} className="payment-button-wrapper">
                    {calc?.paid ? (
                      <button className="btn-paid" disabled>
                        ✓ {member.name.split('(')[0].trim()} - Paid
                      </button>
                    ) : (
                      <button
                        className="btn-pay"
                        onClick={() => handlePayment(member.id)}
                        disabled={loading}
                      >
                        💳 Pay ₹{calc?.total || 0}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {allPaid && (
              <div className="completion-section">
                <div className="success-badge">✨ All Members Paid</div>
                <button
                  className="btn-complete"
                  onClick={() => setCurrentScreen('exit-verification')}
                >
                  🎉 Complete Group Checkout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && <div className="error-message">{error}</div>}
      </div>
    </DashboardLayout>
  );
}
