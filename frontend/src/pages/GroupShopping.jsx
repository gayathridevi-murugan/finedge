import React, { useState, useEffect } from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import DashboardLayout from '../components/DashboardLayout';
import apiClient from '../services/api';
import '../styles/GroupShopping.css';

export default function GroupShopping() {
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);
  const cartItems = useCheckoutStore((state) => state.cartItems);

  // Group workflow states
  const [groupSessionId, setGroupSessionId] = useState(null);
  const [members, setMembers] = useState([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [groupStep, setGroupStep] = useState('CREATE'); // CREATE, ASSIGN, SPLIT, PAY, COMPLETE
  const [splitMethod, setSplitMethod] = useState('equal');
  const [splitCalculation, setSplitCalculation] = useState({});
  const [memberPayments, setMemberPayments] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create group session
  const handleCreateGroup = async () => {
    if (members.length < 2) {
      setError('Add at least 2 members to continue');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/group-shopping/create', {
        groupName: `Group-${Date.now()}`,
        memberCount: members.length
      });

      if (response.data.success) {
        setGroupSessionId(response.data.data.groupSessionId);

        // Add members to session
        await apiClient.post(`/group-shopping/${response.data.data.groupSessionId}/members`, {
          members: members.map(m => ({ name: m, items: [] }))
        });

        setGroupStep('SPLIT');
        setError(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add member to group
  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    setMembers([...members, newMemberName]);
    setNewMemberName('');
  };

  // Assign products to member
  const handleAssignProduct = (productId, memberIndex) => {
    const updatedMembers = [...members];
    if (!memberPayments[memberIndex]) memberPayments[memberIndex] = [];
    memberPayments[memberIndex].push(productId);
    setMemberPayments({ ...memberPayments });
  };

  // Calculate split
  const handleCalculateSplit = async () => {
    if (!groupSessionId) return;

    try {
      setLoading(true);
      const response = await apiClient.post(`/group-shopping/${groupSessionId}/calculate-split`, {
        splitMethod
      });

      if (response.data.success) {
        setSplitCalculation(response.data.data.split);
        setGroupStep('PAY');
        setError(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Process member payment
  const handleMemberPay = async (memberId, amount) => {
    if (!groupSessionId) return;

    try {
      setLoading(true);
      const response = await apiClient.post(
        `/group-shopping/${groupSessionId}/member/${memberId}/pay`,
        {
          amount,
          paymentMethod: 'SURFBOARD',
          surfboardPaymentId: `SB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
      );

      if (response.data.success) {
        // Update member payment status
        const updatedSplit = { ...splitCalculation };
        if (updatedSplit[memberId]) {
          updatedSplit[memberId].paid = true;
        }
        setSplitCalculation(updatedSplit);

        // Check if all paid
        const allPaid = Object.values(updatedSplit).every(m => m.paid);
        if (allPaid) {
          setGroupStep('COMPLETE');
        }

        setError(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Complete group order
  const handleCompleteGroup = async () => {
    if (!groupSessionId) return;

    try {
      setLoading(true);
      const response = await apiClient.post(`/group-shopping/${groupSessionId}/complete`);

      if (response.data.success) {
        setError(null);
        alert('✅ Group order completed successfully!');
        setTimeout(() => setCurrentScreen('overview'), 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 1: CREATE GROUP
  if (groupStep === 'CREATE') {
    return (
      <DashboardLayout pageTitle="Group Shopping" pageIcon="👥">
        <div className="group-shopping-container">
          <div className="group-step-content">
            <h2>👥 Add Shopping Members</h2>
            <p className="step-description">Add members for group shopping</p>

            <div className="form-group">
              <div className="member-input">
                <input
                  type="text"
                  placeholder="Enter member name"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="form-input"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
                />
                <button onClick={handleAddMember} className="btn-add">Add Member</button>
              </div>
            </div>

            <div className="members-list">
              <h4>Members ({members.length})</h4>
              {members.length === 0 ? (
                <p className="empty-text">Add at least 2 members to start</p>
              ) : (
                <ul>
                  {members.map((member, idx) => (
                    <li key={idx}>
                      <span className="member-badge">{idx + 1}</span>
                      <span className="member-name">{member}</span>
                      <button
                        onClick={() => setMembers(members.filter((_, i) => i !== idx))}
                        className="btn-remove"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {error && <div className="error-message">❌ {error}</div>}

            <button
              onClick={handleCreateGroup}
              disabled={loading || members.length < 2}
              className="btn-primary btn-lg"
            >
              {loading ? '⏳ Creating...' : '👉 Continue'}
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate totals
  const groupTotal = Object.values(splitCalculation).reduce((sum, m) => sum + (m.amount || 0), 0);
  const paidMembers = Object.values(splitCalculation).filter(m => m.paid).length;
  const pendingMembers = Object.values(splitCalculation).filter(m => !m.paid).length;

  // STEP 2-4: SPLIT, PAY, COMPLETE
  return (
    <DashboardLayout pageTitle="Group Shopping - Payment" pageIcon="👥">
      <div className="group-shopping-container">
        {/* PROGRESS BAR */}
        <div className="group-progress">
          <div className={`progress-step ${groupStep === 'SPLIT' ? 'active' : 'done'}`}>
            <div className="step-number">1</div>
            <div className="step-label">Split Setup</div>
          </div>
          <div className={`progress-step ${groupStep === 'PAY' ? 'active' : groupStep === 'COMPLETE' ? 'done' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Payments</div>
          </div>
          <div className={`progress-step ${groupStep === 'COMPLETE' ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Complete</div>
          </div>
        </div>

        {/* SPLIT SELECTION (if haven't calculated yet) */}
        {groupStep === 'SPLIT' && Object.keys(splitCalculation).length === 0 && (
          <div className="group-step-content">
            <h2>💳 Choose Split Method</h2>
            <p className="step-description">How should the group total be divided?</p>

            <div className="split-options">
              <div
                className={`split-card ${splitMethod === 'equal' ? 'selected' : ''}`}
                onClick={() => setSplitMethod('equal')}
              >
                <div className="split-icon">📊</div>
                <h3>Equal Split</h3>
                <p>Divide total equally among all members</p>
                <div className="split-amount">
                  ₹{(Object.values(cartItems).reduce((sum, i) => sum + (i.price * i.quantity), 0) / members.length).toLocaleString()}
                  <span className="per-person">per person</span>
                </div>
              </div>

              <div
                className={`split-card ${splitMethod === 'item-based' ? 'selected' : ''}`}
                onClick={() => setSplitMethod('item-based')}
              >
                <div className="split-icon">🎯</div>
                <h3>Item-Based Split</h3>
                <p>Each member pays for their own items</p>
                <div className="split-amount">
                  Based on assigned products
                </div>
              </div>
            </div>

            {error && <div className="error-message">❌ {error}</div>}

            <button
              onClick={handleCalculateSplit}
              disabled={loading}
              className="btn-primary btn-lg"
            >
              {loading ? '⏳ Calculating...' : '💰 Calculate & Continue'}
            </button>
          </div>
        )}

        {/* PAYMENT TRACKING */}
        {(groupStep === 'PAY' || groupStep === 'COMPLETE') && (
          <>
            {/* SUMMARY */}
            <div className="group-summary">
              <div className="summary-stat">
                <span className="stat-label">Group Total</span>
                <span className="stat-value">₹{groupTotal.toLocaleString()}</span>
              </div>
              <div className="summary-stat">
                <span className="stat-label">Paid</span>
                <span className="stat-value paid">{paidMembers} / {members.length}</span>
              </div>
              <div className="summary-stat">
                <span className="stat-label">Pending</span>
                <span className="stat-value pending">{pendingMembers}</span>
              </div>
            </div>

            {/* MEMBER PAYMENT CARDS */}
            <div className="members-payment-grid">
              {Object.entries(splitCalculation).map(([memberId, member]) => (
                <div key={memberId} className={`member-payment-card ${member.paid ? 'paid' : 'pending'}`}>
                  <div className="card-header">
                    <h3>{member.memberName}</h3>
                    <div className={`payment-status ${member.paid ? 'paid' : 'pending'}`}>
                      {member.paid ? '✅ PAID' : '⏳ PENDING'}
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="amount-box">
                      <span className="amount-label">Amount Due</span>
                      <span className="amount-value">₹{member.amount?.toLocaleString() || 0}</span>
                    </div>

                    <div className="payment-method">
                      <span>💳 Surfboard Payment</span>
                    </div>
                  </div>

                  <div className="card-footer">
                    {!member.paid && (
                      <button
                        onClick={() => handleMemberPay(memberId, member.amount)}
                        disabled={loading}
                        className="btn-pay"
                      >
                        {loading ? '⏳ Processing...' : 'Pay Now'}
                      </button>
                    )}
                    {member.paid && (
                      <div className="paid-badge">✅ Payment Verified</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {error && <div className="error-message">❌ {error}</div>}
          </>
        )}

        {/* COMPLETION */}
        {groupStep === 'COMPLETE' && (
          <div className="completion-section">
            <div className="completion-icon">✅</div>
            <h2>All Payments Received!</h2>
            <p>All {members.length} members have completed their payments.</p>

            <button
              onClick={handleCompleteGroup}
              disabled={loading}
              className="btn-primary btn-lg"
            >
              {loading ? '⏳ Completing...' : '🎉 Complete Order & Return'}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
