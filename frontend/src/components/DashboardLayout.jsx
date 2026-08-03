import React, { useState } from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import SidebarNavigation from './SidebarNavigation';
import ThemeToggle from './ThemeToggle';
import NotificationDropdown from './NotificationDropdown';
import ProfileDropdown from './ProfileDropdown';
import '../styles/DashboardLayout.css';

export default function DashboardLayout({ children, pageTitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const currentScreen = useCheckoutStore((state) => state.currentScreen);
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);

  const handleNavigation = (screenId) => {
    console.log('Navigation clicked:', screenId);
    setCurrentScreen(screenId);
    console.log('Current screen set to:', screenId);
  };

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-text">
              <h2>SELF CHECKOUT</h2>
              <p>DEMO</p>
            </div>
          </div>
        </div>

        <SidebarNavigation
          sidebarOpen={sidebarOpen}
          onNavigate={handleNavigation}
          currentScreen={currentScreen}
        />

        <div className="sidebar-footer">
          <div className="terminal-status">
            <span className="status-dot online">●</span>
            {sidebarOpen && <span className="status-text">Terminal Online</span>}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="dashboard-main">
        {/* HEADER */}
        <header className="dashboard-header">
          <div className="header-left">
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <svg className="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
            <div className="header-title">
              <h1>{pageTitle || 'Dashboard'}</h1>
            </div>
          </div>

          <div className="header-right">
            <div className="terminal-status-header">
              <span className="status-dot online">●</span>
              <span className="status-text">Terminal Online</span>
            </div>

            <ThemeToggle />

            <div className="header-dropdown-container">
              <button
                className="notification-btn"
                title="Notifications"
                onClick={() => {
                  setNotificationOpen(!notificationOpen);
                  setProfileOpen(false);
                }}
              >
                <svg className="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>
                <span className="notification-badge">2</span>
              </button>
              <NotificationDropdown
                isOpen={notificationOpen}
                onClose={() => setNotificationOpen(false)}
              />
            </div>

            <div className="header-dropdown-container">
              <button
                className="profile-btn"
                title="Profile"
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotificationOpen(false);
                }}
              >
                <svg className="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
              <ProfileDropdown
                isOpen={profileOpen}
                onClose={() => setProfileOpen(false)}
              />
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}
