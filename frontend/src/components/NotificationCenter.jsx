import React from 'react';
import { useNotificationStore } from '../store/notificationStore';
import '../styles/NotificationCenter.css';

export default function NotificationCenter() {
  const notifications = useNotificationStore((state) => state.notifications);
  const removeNotification = useNotificationStore((state) => state.removeNotification);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <div className="notification-center">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification ${notification.type}`}
        >
          <div className="notification-icon">{getIcon(notification.type)}</div>
          <div className="notification-content">
            <h4 className="notification-title">{notification.title}</h4>
            {notification.message && (
              <p className="notification-message">{notification.message}</p>
            )}
          </div>
          <button
            className="notification-close"
            onClick={() => removeNotification(notification.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
