import React, { useState } from 'react';
import { useCheckoutStore } from '../store/checkoutStore';
import DashboardLayout from '../components/DashboardLayout';
import '../styles/Settings.css';

export default function Settings() {
  const theme = useCheckoutStore((state) => state.theme);

  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    storeName: 'SELF CHECKOUT Store',
    storeLocation: 'Stockholm, Sweden',
    timezone: 'Europe/Stockholm',
    currency: 'SEK',
    taxRate: 10,
    notifications: true,
    emailNotifications: true,
    soundAlerts: true,
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // Save settings to backend
    console.log('Settings saved:', settings);
    alert('Settings saved successfully!');
  };

  return (
    <DashboardLayout pageTitle="Settings" pageIcon="⚙️">
      <div className="settings-page">
        {/* SETTINGS TABS */}
        <div className="settings-tabs">
          <button
            className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
          </button>
          <button
            className={`tab-btn ${activeTab === 'integration' ? 'active' : ''}`}
            onClick={() => setActiveTab('integration')}
          >
            Integration
          </button>
          <button
            className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            System
          </button>
        </div>

        {/* TAB CONTENT */}
        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="settings-section">
              <h2>General Settings</h2>
              <div className="settings-group">
                <div className="setting-item">
                  <label>Store Name</label>
                  <input
                    type="text"
                    value={settings.storeName}
                    onChange={(e) => handleSettingChange('storeName', e.target.value)}
                  />
                </div>
                <div className="setting-item">
                  <label>Store Location</label>
                  <input
                    type="text"
                    value={settings.storeLocation}
                    onChange={(e) => handleSettingChange('storeLocation', e.target.value)}
                  />
                </div>
                <div className="setting-item">
                  <label>Timezone</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => handleSettingChange('timezone', e.target.value)}
                  >
                    <option value="Europe/Stockholm">Europe/Stockholm</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="Europe/Paris">Europe/Paris</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div className="setting-item">
                  <label>Currency</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleSettingChange('currency', e.target.value)}
                  >
                    <option value="SEK">SEK (Swedish Krona)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="GBP">GBP (British Pound)</option>
                    <option value="USD">USD (US Dollar)</option>
                  </select>
                </div>
                <div className="setting-item">
                  <label>Tax Rate (%)</label>
                  <input
                    type="number"
                    value={settings.taxRate}
                    onChange={(e) => handleSettingChange('taxRate', parseFloat(e.target.value))}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2>Notification Settings</h2>
              <div className="settings-group">
                <div className="setting-toggle">
                  <div>
                    <h3>In-App Notifications</h3>
                    <p>Show notifications in the application</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                  />
                </div>
                <div className="setting-toggle">
                  <div>
                    <h3>Email Notifications</h3>
                    <p>Receive important updates via email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                  />
                </div>
                <div className="setting-toggle">
                  <div>
                    <h3>Sound Alerts</h3>
                    <p>Enable sound alerts for important events</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.soundAlerts}
                    onChange={(e) => handleSettingChange('soundAlerts', e.target.checked)}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integration' && (
            <div className="settings-section">
              <h2>Integration Status</h2>
              <div className="integration-grid">
                <div className="integration-card">
                  <h3>Surfboard Payments</h3>
                  <p>Payment Processing</p>
                  <div className="status demo">DEMO MODE</div>
                  <p className="status-text">Configure Surfboard API credentials in backend .env to enable real payments</p>
                </div>
                <div className="integration-card">
                  <h3>NFC System</h3>
                  <p>Product Scanning</p>
                  <div className="status active">ACTIVE</div>
                  <p className="status-text">Connected to PostgreSQL product database</p>
                </div>
                <div className="integration-card">
                  <h3>Cart System</h3>
                  <p>Shopping Cart</p>
                  <div className="status active">ACTIVE</div>
                  <p className="status-text">PostgreSQL cart persistence enabled</p>
                </div>
                <div className="integration-card">
                  <h3>Security System</h3>
                  <p>Exit Verification</p>
                  <div className="status active">ACTIVE</div>
                  <p className="status-text">Item verification and payment checking</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="settings-section">
              <h2>System Status</h2>
              <div className="system-info">
                <div className="system-item">
                  <span>Backend Status:</span>
                  <span className="status-badge online">Online</span>
                </div>
                <div className="system-item">
                  <span>Database:</span>
                  <span className="status-badge online">Connected</span>
                </div>
                <div className="system-item">
                  <span>NFC Simulation:</span>
                  <span className="status-badge online">Active</span>
                </div>
                <div className="system-item">
                  <span>Theme:</span>
                  <span className="status-badge">{theme || 'light'}</span>
                </div>
              </div>
              <div className="system-actions">
                <button className="btn btn-secondary">Test Connection</button>
                <button className="btn btn-secondary">View Logs</button>
              </div>
            </div>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="settings-actions">
          <button className="btn btn-primary" onClick={handleSave}>
            Save Settings
          </button>
          <button className="btn btn-secondary">Reset to Defaults</button>
        </div>
      </div>
    </DashboardLayout>
  );
}
