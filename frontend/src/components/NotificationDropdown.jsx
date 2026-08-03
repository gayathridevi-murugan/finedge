import React, { useState, useEffect } from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import { useNotificationStore } from '../store/notificationStore';
import '../styles/NotificationDropdown.css';

export default function NotificationDropdown({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'success', title: 'NFC Product Scanned', message: 'Nike Shoes added to cart', timestamp: new Date(Date.now() - 300000) },
    { id: 2, type: 'success', title: 'Product Added', message: 'Item added to your cart successfully', timestamp: new Date(Date.now() - 600000) },
  ]);

  const handleNotificationClick = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  if (!isOpen) return null;

  return (
    <div className="notification-dropdown">
      <div className="dropdown-header">
        <h3>Notifications</h3>
        {notifications.length > 0 && (
          <button className="clear-btn" onClick={clearAll}>Clear All</button>
        )}
      </div>

      <div className="notifications-list">
        {notifications.length > 0 ? (
          notifications.map(notif => (
            <div key={notif.id} className={`notification-item ${notif.type}`}>
              <div className="notification-icon">
                {notif.type === 'success' && '✓'}
                {notif.type === 'error' && '✕'}
                {notif.type === 'warning' && '⚠'}
              </div>
              <div className="notification-content">
                <p className="notification-title">{notif.title}</p>
                <p className="notification-message">{notif.message}</p>
                <span className="notification-time">
                  {Math.round((Date.now() - notif.timestamp) / 60000)} min ago
                </span>
              </div>
              <button
                className="notification-close"
                onClick={() => handleNotificationClick(notif.id)}
              >
                ✕
              </button>
            </div>
          ))
        ) : (
          <div className="no-notifications">
            <p>No notifications</p>
          </div>
        )}
      </div>
    </div>
  );
}
