import React, { useEffect, useState } from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import apiClient from '../services/api';
import '../styles/ProfileDropdown.css';

export default function ProfileDropdown({ isOpen, onClose }) {
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);
  const reset = useCheckoutStore((state) => state.reset);

  // Merchant identity comes from the backend rather than the hardcoded
  // "Terminal User / Checkout Staff" this panel used to show.
  const [info, setInfo] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get(`/dashboard/metrics?t=${Date.now()}`);
        if (!cancelled && res.data.success) {
          setInfo(res.data.data);
          setLoadError(null);
        }
      } catch (err) {
        if (!cancelled) setLoadError(err.message);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen]);

  const handleLogout = () => {
    reset();
    setCurrentScreen('welcome');
    onClose();
  };

  if (!isOpen) return null;

  const configured = info?.merchantId && info.merchantId !== 'Not configured';

  return (
    <div className="profile-dropdown">
      <div className="profile-header">
        <div className="profile-avatar">👤</div>
        <div className="profile-info">
          <p className="profile-name">
            {configured ? info.merchantId : loadError ? 'Merchant unavailable' : 'Not configured'}
          </p>
          <p className="profile-role">
            {info
              ? `${info.merchantStatus || 'UNKNOWN'} · ${info.terminals ?? 0} terminal${info.terminals === 1 ? '' : 's'}`
              : loadError
              ? 'Could not reach the API'
              : 'Loading…'}
          </p>
        </div>
      </div>

      <div className="profile-divider"></div>

      <div className="profile-status">
        <div className="status-row">
          <span className="status-key">Database</span>
          <span className={`status-val ${info?.databaseStatus === 'CONNECTED' ? 'ok' : 'warn'}`}>
            {info?.databaseStatus || '—'}
          </span>
        </div>
        <div className="status-row">
          <span className="status-key">Orders today</span>
          <span className="status-val">{info?.todaysOrders ?? '—'}</span>
        </div>
        <div className="status-row">
          <span className="status-key">Revenue today</span>
          <span className="status-val">
            {typeof info?.todaysRevenue === 'number'
              ? `₹${info.todaysRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '—'}
          </span>
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
