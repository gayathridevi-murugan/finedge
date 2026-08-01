import React, { useState } from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import SidebarNavigation from './SidebarNavigation';
import ThemeToggle from './ThemeToggle';
import '../styles/DashboardLayout.css';

export default function DashboardLayout({ children, pageTitle, pageIcon }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const currentScreen = useCheckoutStore((state) => state.currentScreen);
  const setCurrentScreen = useCheckoutStore((state) => state.setCurrentScreen);
  const sessionId = useCheckoutStore((state) => state.sessionId);

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
            <span className="logo-icon">🛍️</span>
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
              ☰
            </button>
            <div className="header-title">
              {pageIcon && <span className="page-icon">{pageIcon}</span>}
              <h1>{pageTitle || 'Dashboard'}</h1>
            </div>
          </div>

          <div className="header-right">
            <div className="session-info">
              <span className="session-label">Session:</span>
              <span className="session-id">{sessionId || 'QFC-0001'}</span>
            </div>

            <div className="terminal-status-header">
              <span className="status-dot online">●</span>
              <span className="status-text">Terminal Online</span>
            </div>

            <ThemeToggle />

            <button className="notification-btn" title="Notifications">
              🔔
              <span className="notification-badge">2</span>
            </button>

            <button className="profile-btn" title="Profile">
              👤
            </button>
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
