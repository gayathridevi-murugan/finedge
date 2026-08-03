import React from 'react';
import '../styles/NotificationDropdown.css';

const ICONS = { success: '✓', error: '✕', warning: '⚠', info: '•' };

// "3 min ago" style, derived from the event's real timestamp.
function timeAgo(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return '';
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function NotificationDropdown({
  isOpen,
  activity = [],
  loading = false,
  error = null,
  dismissed = [],
  onDismiss,
  onClearAll
}) {
  if (!isOpen) return null;

  const visible = activity.filter((a) => !dismissed.includes(a.id));

  return (
    <div className="notification-dropdown">
      <div className="dropdown-header">
        <h3>Activity</h3>
        {visible.length > 0 && (
          <button className="clear-btn" onClick={onClearAll}>Clear All</button>
        )}
      </div>

      <div className="notifications-list">
        {error && (
          <div className="no-notifications">
            <p>Could not load activity</p>
          </div>
        )}

        {!error && loading && visible.length === 0 && (
          <div className="no-notifications">
            <p>Loading…</p>
          </div>
        )}

        {!error && !loading && visible.length === 0 && (
          <div className="no-notifications">
            <p>No recent activity</p>
          </div>
        )}

        {visible.map((item) => (
          <div key={item.id} className={`notification-item ${item.type}`}>
            <div className="notification-icon">{ICONS[item.type] || ICONS.info}</div>
            <div className="notification-content">
              <p className="notification-title">{item.title}</p>
              <p className="notification-message">{item.message}</p>
              <span className="notification-time">{timeAgo(item.at)}</span>
            </div>
            <button
              className="notification-close"
              onClick={() => onDismiss(item.id)}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
