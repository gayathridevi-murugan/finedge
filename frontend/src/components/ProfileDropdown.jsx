import React from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import '../styles/ProfileDropdown.css';

export default function ProfileDropdown({ isOpen, onClose }) {
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);
  const reset = useCheckoutStore((state) => state.reset);

  const handleLogout = () => {
    reset();
    setCurrentScreen('welcome');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="profile-dropdown">
      <div className="profile-header">
        <div className="profile-avatar">👤</div>
        <div className="profile-info">
          <p className="profile-name">Terminal User</p>
          <p className="profile-role">Checkout Staff</p>
        </div>
      </div>

      <div className="profile-divider"></div>

      <div className="profile-menu">
        <button
          className="profile-menu-item"
          onClick={() => {
            setCurrentScreen('settings');
            onClose();
          }}
        >
          <span className="menu-icon">⚙️</span>
          <span className="menu-label">Settings</span>
        </button>

        <button
          className="profile-menu-item"
          onClick={() => {
            setCurrentScreen('merchant-onboarding');
            onClose();
          }}
        >
          <span className="menu-icon">🏪</span>
          <span className="menu-label">Merchant Setup</span>
        </button>
      </div>

      <div className="profile-divider"></div>

      <button className="profile-logout" onClick={handleLogout}>
        <span className="logout-icon">🚪</span>
        <span className="logout-label">Logout</span>
      </button>
    </div>
  );
}
