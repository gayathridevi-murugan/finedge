import React, { useState } from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import '../styles/SidebarNavigation.css';

export default function SidebarNavigation({ sidebarOpen, onNavigate, currentScreen }) {
  const navigationSections = [
    {
      id: 'home',
      title: 'HOME',
      items: [
        { id: 'overview', label: 'Dashboard' },
      ]
    },
    {
      id: 'nfc',
      title: 'SELF CHECKOUT',
      items: [
        { id: 'smart-shopping', label: 'Smart NFC Shopping' },
        { id: 'nfc-self-checkout', label: 'NFC Self Checkout' },
        { id: 'nfc-scans', label: 'NFC Scans' },
      ]
    },
    {
      id: 'shopping',
      title: 'SHOPPING',
      items: [
        { id: 'group-shopping', label: 'Group Shopping' },
      ]
    },
    {
      id: 'security',
      title: 'SECURITY',
      items: [
        { id: 'exit-verification', label: 'Exit Verification' },
      ]
    },
    {
      id: 'merchant',
      title: 'MERCHANT',
      items: [
        { id: 'merchant-onboarding', label: 'Onboarding' },
      ]
    },
    {
      id: 'system',
      title: 'SYSTEM',
      items: [
        { id: 'demo-controls', label: 'Demo Controls' },
        { id: 'settings', label: 'Settings' },
      ]
    },
  ];

  return (
    <nav className="sidebar-navigation">
      {navigationSections.map(section => (
        <div key={section.id} className="nav-section">
          <div className="section-title">{section.title}</div>
          <div className="section-items">
            {section.items.map(item => (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${currentScreen === item.id ? 'active' : ''}`}
                onClick={() => {
                  console.log('Navigation item clicked:', item.id);
                  onNavigate(item.id);
                }}
                title={item.label}
                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              >
                {/* Collapsed rail has no room for the label, so it falls back to
                    a letter monogram rather than a decorative icon. */}
                {sidebarOpen
                  ? <span className="nav-label">{item.label}</span>
                  : <span className="nav-initial" aria-hidden="true">{item.label.charAt(0)}</span>}
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
