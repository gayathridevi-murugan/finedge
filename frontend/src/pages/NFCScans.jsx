import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import '../styles/NFCScans.css';

export default function NFCScans() {
  const [scans, setScans] = useState([
    { id: 1, product: 'Premium Cotton T-Shirt', price: 999, time: '14:32:15', emoji: '👕', status: 'success' },
    { id: 2, product: 'Casual Printed T-Shirt', price: 1299, time: '14:31:42', emoji: '👕', status: 'success' },
    { id: 3, product: 'Classic Blue Denim Jeans', price: 2499, time: '14:31:08', emoji: '👖', status: 'success' },
    { id: 4, product: 'Slim Fit Black Jeans', price: 2299, time: '14:30:35', emoji: '👖', status: 'success' },
    { id: 5, product: 'White Running Sneakers', price: 3999, time: '14:29:52', emoji: '👟', status: 'success' },
    { id: 6, product: 'Casual Black Slip-Ons', price: 2799, time: '14:29:10', emoji: '👞', status: 'success' },
    { id: 7, product: 'Premium Hoodie Jacket', price: 1999, time: '14:28:33', emoji: '🧥', status: 'success' },
    { id: 8, product: 'Sports Hoodie', price: 1799, time: '14:27:58', emoji: '🧥', status: 'success' },
    { id: 9, product: 'Cotton Baseball Cap', price: 699, time: '14:27:15', emoji: '🧢', status: 'success' },
    { id: 10, product: 'Leather Crossbody Bag', price: 4299, time: '14:26:42', emoji: '👜', status: 'success' },
  ]);

  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredScans = scans.filter(scan => {
    const matchesFilter = filter === 'all' || scan.status === filter;
    const matchesSearch = scan.product.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalScans = scans.length;
  const successfulScans = scans.filter(s => s.status === 'success').length;
  const totalValue = scans.reduce((sum, scan) => sum + scan.price, 0);

  return (
    <DashboardLayout pageTitle="NFC Scans">
      <div className="nfc-scans-container">
        {/* HEADER */}
        <div className="scans-header">
          <div className="header-left">
            <h1>📡 Recent NFC Scans</h1>
            <p className="subtitle">Live product scanning activity</p>
          </div>
        </div>

        {/* STATS */}
        <div className="scans-stats">
          <div className="stat-card">
            <span className="stat-label">Total Scans</span>
            <span className="stat-value">{totalScans}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Successful</span>
            <span className="stat-value">{successfulScans}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Value</span>
            <span className="stat-value">₹{totalValue.toLocaleString()}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Avg Price</span>
            <span className="stat-value">₹{(totalValue / totalScans).toLocaleString()}</span>
          </div>
        </div>

        {/* FILTERS & SEARCH */}
        <div className="scans-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({totalScans})
            </button>
            <button
              className={`filter-btn ${filter === 'success' ? 'active' : ''}`}
              onClick={() => setFilter('success')}
            >
              ✓ Success ({successfulScans})
            </button>
          </div>
        </div>

        {/* SCANS LIST */}
        <div className="scans-list">
          {filteredScans.length === 0 ? (
            <div className="no-scans">
              <p>No scans found</p>
            </div>
          ) : (
            filteredScans.map((scan) => (
              <div key={scan.id} className={`scan-item ${scan.status}`}>
                <div className="scan-left">
                  <div className="product-emoji">{scan.emoji}</div>
                  <div className="scan-info">
                    <h3 className="product-name">{scan.product}</h3>
                    <p className="scan-time">Scanned at {scan.time}</p>
                  </div>
                </div>
                <div className="scan-right">
                  <div className="product-price">₹{scan.price.toLocaleString()}</div>
                  <span className={`status-badge ${scan.status}`}>
                    {scan.status === 'success' ? '✓ Added' : 'Pending'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ACTIVITY TIMELINE */}
        <div className="activity-section">
          <h2>Activity Timeline</h2>
          <div className="timeline">
            {filteredScans.slice(0, 5).map((scan, idx) => (
              <div key={idx} className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <p className="timeline-title">{scan.product}</p>
                  <p className="timeline-time">{scan.time}</p>
                </div>
                <div className="timeline-price">₹{scan.price}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
