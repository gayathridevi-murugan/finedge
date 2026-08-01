import React, { useState } from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import '../styles/SidebarNavigation.css';

export default function SidebarNavigation({ sidebarOpen, onNavigate, currentScreen }) {
  const navigationSections = [
    {
      id: 'home',
      title: 'HOME',
      items: [
        { id: 'overview', label: 'Dashboard', icon: '📊' },
      ]
    },
    {
      id: 'nfc',
      title: 'SELF CHECKOUT',
      items: [
        { id: 'smart-shopping', label: 'Smart NFC Shopping', icon: '📱' },
        { id: 'nfc-self-checkout', label: 'NFC Self Checkout', icon: '🏪' },
      ]
    },
    {
      id: 'shopping',
      title: 'SHOPPING',
      items: [
        { id: 'cart', label: 'Cart', icon: '🛒' },
        { id: 'group-shopping', label: 'Group Shopping', icon: '👥' },
      ]
    },
    {
      id: 'payments',
      title: 'PAYMENTS',
      items: [
        { id: 'payment', label: 'Payment', icon: '💳' },
        { id: 'receipt', label: 'Receipt', icon: '📄' },
      ]
    },
    {
      id: 'security',
      title: 'SECURITY',
      items: [
        { id: 'exit-verification', label: 'Exit Verification', icon: '🚪' },
      ]
    },
    {
      id: 'product',
      title: 'PRODUCT',
      items: [
        { id: 'product-passport', label: 'Product Passport', icon: '📦' },
      ]
    },
    {
      id: 'merchant',
      title: 'MERCHANT',
      items: [
        { id: 'merchant-onboarding', label: 'Onboarding', icon: '🏢' },
      ]
    },
    {
      id: 'system',
      title: 'SYSTEM',
      items: [
        { id: 'demo-controls', label: 'Demo Controls', icon: '⚙️' },
        { id: 'settings', label: 'Settings', icon: '⚙️' },
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
                <span className="nav-icon">{item.icon}</span>
                {sidebarOpen && <span className="nav-label">{item.label}</span>}
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
