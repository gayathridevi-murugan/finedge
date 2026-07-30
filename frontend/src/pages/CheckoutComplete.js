import React, { useState, useEffect } from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import { generateReceipt, addLoyaltyPoints } from '../services/api';
import '../styles/CheckoutComplete.css';

export default function CheckoutComplete() {
  const orderId = useCheckoutStore((state) => state.orderId);
  const orderNumber = useCheckoutStore((state) => state.orderNumber);
  const cartTotal = useCheckoutStore((state) => state.cartTotal);
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);
  const setReceipt = useCheckoutStore((state) => state.setReceipt);
  const setLoyaltyPoints = useCheckoutStore((state) => state.setLoyaltyPoints);

  const [checklist, setChecklist] = useState([
    { id: 1, label: 'Payment Successful', completed: false },
    { id: 2, label: 'Receipt Generated', completed: false },
    { id: 3, label: 'Loyalty Points Awarded', completed: false },
    { id: 4, label: 'Security Cleared', completed: false }
  ]);

  useEffect(() => {
    const runChecklist = async () => {
      try {
        // Simulate each step
        await new Promise(resolve => setTimeout(resolve, 500));
        setChecklist(prev => prev.map((item, i) => i === 0 ? { ...item, completed: true } : item));

        // Generate receipt
        const receiptResponse = await generateReceipt(orderId);
        setReceipt(receiptResponse.data.data.receipt);
        await new Promise(resolve => setTimeout(resolve, 500));
        setChecklist(prev => prev.map((item, i) => i === 1 ? { ...item, completed: true } : item));

        // Add loyalty points
        const loyaltyPoints = Math.floor(cartTotal);
        await addLoyaltyPoints('guest-customer', orderId, loyaltyPoints);
        setLoyaltyPoints(loyaltyPoints, 'SILVER');
        await new Promise(resolve => setTimeout(resolve, 500));
        setChecklist(prev => prev.map((item, i) => i === 2 ? { ...item, completed: true } : item));

        // Security cleared
        await new Promise(resolve => setTimeout(resolve, 500));
        setChecklist(prev => prev.map((item, i) => i === 3 ? { ...item, completed: true } : item));
      } catch (error) {
        console.error('Error in checkout complete:', error);
      }
    };

    runChecklist();
  }, [orderId, cartTotal, setReceipt, setLoyaltyPoints]);

  const handleViewReceipt = () => {
    setCurrentScreen('receipt');
  };

  const handleProceedToExit = () => {
    setCurrentScreen('exit-verification');
  };

  return (
    <div className="checkout-complete-container">
      <div className="complete-content">
        <div className="complete-header">
          <div className="complete-icon">✓</div>
          <h1>Checkout Complete</h1>
          <p className="order-number">Order #{orderNumber}</p>
        </div>

        <div className="checklist">
          {checklist.map((item) => (
            <div
              key={item.id}
              className={`checklist-item ${item.completed ? 'completed' : ''}`}
            >
              <div className="checklist-icon">
                {item.completed ? '✓' : '◯'}
              </div>
              <span className="checklist-label">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="complete-actions">
          <button
            className="action-button secondary"
            onClick={handleViewReceipt}
          >
            VIEW RECEIPT
          </button>
          <button
            className="action-button primary"
            onClick={handleProceedToExit}
          >
            PROCEED TO EXIT
          </button>
        </div>

        <div className="complete-info">
          <p>Your payment has been processed and security tags have been deactivated.</p>
          <p>You can now proceed to the exit gate.</p>
        </div>
      </div>
    </div>
  );
}
