import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import apiClient from '../services/api';
import '../styles/NFCScans.css';

const REFRESH_SECONDS = 10;

// Stand-in for product photography. Keyed on the values the catalogue actually
// uses - subcategory first, then category - so nothing silently falls through.
const SUBCATEGORY_ICONS = {
  'T-Shirts': '👕',
  Jeans: '👖',
  Jackets: '🧥',
  Hats: '🧢',
  Bags: '👜',
  Sunglasses: '🕶️',
  Shoes: '👟'
};
const CATEGORY_ICONS = { Clothing: '👕', Accessories: '🎒' };
const iconFor = (scan) =>
  SUBCATEGORY_ICONS[scan.subcategory] || CATEGORY_ICONS[scan.category] || '🏷️';

const money = (n) =>
  (parseFloat(n) || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const clockTime = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleTimeString();
};

const timeAgo = (iso) => {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return '';
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

export default function NFCScans() {
  const [scans, setScans] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [todayOnly, setTodayOnly] = useState(false);

  const load = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await apiClient.get(`/dashboard/scan-history?limit=100&t=${Date.now()}`);
      if (res.data.success) {
        setScans(res.data.data.scans || []);
        setStats(res.data.data.stats || null);
        setLastUpdated(new Date());
        setError(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(true);
    const id = setInterval(() => load(false), REFRESH_SECONDS * 1000);
    return () => clearInterval(id);
  }, [load]);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const filteredScans = scans.filter((s) => {
    const matchesSearch = s.product.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDay = !todayOnly || new Date(s.scannedAt) >= startOfToday;
    return matchesSearch && matchesDay;
  });

  if (loading) {
    return (
      <DashboardLayout pageTitle="NFC Scans">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading scan history…</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !scans.length) {
    return (
      <DashboardLayout pageTitle="NFC Scans">
        <div style={{ padding: '2rem', color: 'var(--color-error)' }}>
          <p>Could not load scan history: {error}</p>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Check that the backend is running on port 5000.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="NFC Scans">
      <div className="nfc-scans-container">
        <div className="scans-header">
          <div className="header-left">
            <h1>Recent NFC Scans</h1>
            <p className="subtitle">
              {error
                ? `Live data unavailable: ${error}`
                : `Live from the database · refreshes every ${REFRESH_SECONDS}s${
                    lastUpdated ? ` · updated ${lastUpdated.toLocaleTimeString()}` : ''
                  }`}
            </p>
          </div>
        </div>

        {/* STATS - computed over the same rows the list is drawn from */}
        <div className="scans-stats">
          <div className="stat-card">
            <span className="stat-label">Total Scans</span>
            <span className="stat-value">{stats?.totalScans ?? 0}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Today</span>
            <span className="stat-value">{stats?.scansToday ?? 0}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Distinct Products</span>
            <span className="stat-value">{stats?.uniqueProducts ?? 0}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Scanned Value</span>
            <span className="stat-value">₹{money(stats?.totalValue)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Avg Price</span>
            <span className="stat-value">₹{money(stats?.averagePrice)}</span>
          </div>
        </div>

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
              className={`filter-btn ${!todayOnly ? 'active' : ''}`}
              onClick={() => setTodayOnly(false)}
            >
              All ({scans.length})
            </button>
            <button
              className={`filter-btn ${todayOnly ? 'active' : ''}`}
              onClick={() => setTodayOnly(true)}
            >
              Today ({stats?.scansToday ?? 0})
            </button>
          </div>
        </div>

        <div className="scans-list">
          {filteredScans.length === 0 ? (
            <div className="no-scans">
              <p>
                {scans.length === 0
                  ? 'No scans recorded yet. Tap a product on Smart NFC Shopping or NFC Self Checkout.'
                  : 'No scans match this filter'}
              </p>
            </div>
          ) : (
            filteredScans.map((scan) => (
              <div key={scan.id} className="scan-item success">
                <div className="scan-left">
                  <div className="product-emoji">{iconFor(scan)}</div>
                  <div className="scan-info">
                    <h3 className="product-name">{scan.product}</h3>
                    <p className="scan-time">
                      {clockTime(scan.scannedAt)} · {timeAgo(scan.scannedAt)}
                      {scan.tagCode ? ` · ${scan.tagCode}` : ''}
                    </p>
                  </div>
                </div>
                <div className="scan-right">
                  <div className="product-price">₹{money(scan.price)}</div>
                  <span className="status-badge success">✓ Scanned</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="activity-section">
          <h2>Activity Timeline</h2>
          <div className="timeline">
            {filteredScans.slice(0, 5).map((scan) => (
              <div key={scan.id} className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <p className="timeline-title">{scan.product}</p>
                  <p className="timeline-time">{clockTime(scan.scannedAt)}</p>
                </div>
                <div className="timeline-price">₹{money(scan.price)}</div>
              </div>
            ))}
            {filteredScans.length === 0 && <p className="no-scans">Nothing to show yet</p>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
