import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import apiClient from '../services/api';
import '../styles/OverviewDashboard_NEW.css';

const REFRESH_SECONDS = 10;

// Render 0 as "0" rather than falling through to a default, so a genuine zero
// is distinguishable from missing data.
const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('en-IN') : '—');

const money = (n) =>
  typeof n === 'number'
    ? n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '—';

// One definition per KPI tile. Keeping them in data rather than nine hand
// written blocks keeps the markup, the expand behaviour and the ordering in
// one place.
const buildCards = (m) => {
  const pct = (part, whole) =>
    typeof part === 'number' && whole ? `${Math.round((part / whole) * 100)}%` : '—';

  return [
    {
      key: 'sessions',
      icon: '🛒',
      label: 'Active Sessions',
      value: fmt(m?.activeSessions),
      detail: `Carts touched in the last ${m?.activeSessionWindowMinutes ?? 15} min`,
      breakdown: [
        { k: 'Opened today', v: fmt(m?.cartsCreatedToday) },
        { k: 'Still active', v: fmt(m?.activeSessions) },
        { k: 'Conversion to order', v: pct(m?.todaysOrders, m?.cartsCreatedToday) }
      ]
    },
    {
      key: 'carts',
      icon: '🛍️',
      label: 'Carts Opened Today',
      value: fmt(m?.cartsCreatedToday),
      detail: 'Since midnight',
      breakdown: [
        { k: 'Became orders', v: fmt(m?.todaysOrders) },
        { k: 'Abandoned', v: fmt(typeof m?.cartsCreatedToday === 'number' && typeof m?.todaysOrders === 'number' ? m.cartsCreatedToday - m.todaysOrders : undefined) },
        { k: 'Currently active', v: fmt(m?.activeSessions) }
      ]
    },
    {
      key: 'orders',
      icon: '📦',
      label: "Today's Orders",
      value: fmt(m?.todaysOrders),
      detail: `${fmt(m?.completedOrders)} paid · ${fmt(m?.pendingOrders)} pending · ${fmt(m?.failedOrders)} failed`,
      breakdown: [
        { k: 'Paid', v: `${fmt(m?.completedOrders)} (${pct(m?.completedOrders, m?.todaysOrders)})` },
        { k: 'Pending', v: `${fmt(m?.pendingOrders)} (${pct(m?.pendingOrders, m?.todaysOrders)})` },
        { k: 'Failed', v: `${fmt(m?.failedOrders)} (${pct(m?.failedOrders, m?.todaysOrders)})` }
      ]
    },
    {
      key: 'revenue',
      icon: '💰',
      label: "Today's Revenue",
      value: `₹${money(m?.todaysRevenue)}`,
      detail: `From ${fmt(m?.completedOrders)} paid orders`,
      breakdown: [
        { k: 'Paid orders', v: fmt(m?.completedOrders) },
        {
          k: 'Average order value',
          v:
            typeof m?.todaysRevenue === 'number' && m?.completedOrders
              ? `₹${money(m.todaysRevenue / m.completedOrders)}`
              : '—'
        },
        { k: 'Uncollected orders', v: fmt(typeof m?.pendingOrders === 'number' && typeof m?.failedOrders === 'number' ? m.pendingOrders + m.failedOrders : undefined) }
      ]
    },
    {
      key: 'scans',
      icon: '📱',
      label: 'NFC Scans',
      value: fmt(m?.productsScanned),
      detail: `Across ${fmt(m?.uniqueProductsScanned)} distinct products`,
      breakdown: [
        { k: 'Total scans', v: fmt(m?.productsScanned) },
        { k: 'Distinct products', v: fmt(m?.uniqueProductsScanned) },
        {
          k: 'Scans per product',
          v:
            typeof m?.productsScanned === 'number' && m?.uniqueProductsScanned
              ? (m.productsScanned / m.uniqueProductsScanned).toFixed(1)
              : '—'
        }
      ]
    },
    {
      key: 'checkout',
      icon: '⏱️',
      label: 'Avg Checkout Time',
      value: m?.avgCheckoutMinutes != null ? `${m.avgCheckoutMinutes} min` : '—',
      detail: 'Order created to payment captured',
      breakdown: [
        { k: 'Measured over', v: `${fmt(m?.completedOrders)} paid orders` },
        { k: 'Basis', v: 'Order created → payment captured' }
      ]
    },
    {
      key: 'pending',
      icon: '⏳',
      label: 'Pending Payments',
      value: fmt(m?.pendingPayments),
      detail: 'Awaiting verification today',
      tone: 'alert',
      breakdown: [
        { k: 'Pending orders', v: fmt(m?.pendingOrders) },
        { k: 'Failed orders', v: fmt(m?.failedOrders) },
        { k: 'Gateway', v: m?.merchantStatus === 'ACTIVE' ? 'Live' : 'Not fully configured' }
      ]
    },
    {
      key: 'exits',
      icon: '🚪',
      label: 'Exit Events',
      value: fmt(m?.exitEvents),
      detail: 'Verified at the gate today',
      breakdown: [
        { k: 'Verified today', v: fmt(m?.exitEvents) },
        { k: 'Paid orders today', v: fmt(m?.completedOrders) }
      ]
    },
    {
      key: 'merchant',
      icon: '🏪',
      label: 'Merchant',
      value: m?.merchantId || 'Not configured',
      small: true,
      detail: `${m?.merchantStatus || 'UNKNOWN'} · DB ${m?.databaseStatus || 'UNKNOWN'}`,
      breakdown: [
        { k: 'Status', v: m?.merchantStatus || 'UNKNOWN' },
        { k: 'Database', v: m?.databaseStatus || 'UNKNOWN' },
        { k: 'Terminals', v: fmt(m?.terminals) }
      ]
    }
  ];
};

export default function OverviewDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [error, setError] = useState(null);

  // isInitial keeps the full-page loading state for the first fetch only. Every
  // poll used to set loading=true, which swapped the whole dashboard out for
  // "Loading dashboard data..." on a 10 second cycle.
  const fetchDashboardData = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setRefreshing(true);

      const timestamp = new Date().getTime();
      const [metricsRes, ordersRes, productsRes] = await Promise.all([
        apiClient.get(`/dashboard/metrics?t=${timestamp}`),
        apiClient.get(`/dashboard/recent-orders?t=${timestamp}`),
        apiClient.get(`/dashboard/top-products?t=${timestamp}`)
      ]);

      if (metricsRes.data.success) setMetrics(metricsRes.data.data);
      if (ordersRes.data.success) setRecentOrders(ordersRes.data.data.orders || []);
      if (productsRes.data.success) setTopProducts(productsRes.data.data.topProducts || []);

      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);
    const interval = setInterval(() => fetchDashboardData(false), REFRESH_SECONDS * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <DashboardLayout pageTitle="Overview Dashboard">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Loading dashboard data...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Only block the page when there is nothing to show. A failed poll used to
  // replace the whole dashboard with an error, discarding data we already had;
  // now the last known figures stay up and the footer reports the problem.
  if (error && !metrics) {
    return (
      <DashboardLayout pageTitle="Overview Dashboard">
        <div style={{ padding: '2rem', color: 'var(--color-error)' }}>
          <p>Could not reach the API: {error}</p>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Check that the backend is running on port 5000.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const cards = buildCards(metrics);

  return (
    <DashboardLayout pageTitle="Overview Dashboard">
      <div className="overview-dashboard">
        {/* TOP METRIC CARDS */}
        <div className="metrics-grid">
          {cards.map((c) => {
            const open = expanded === c.key;
            return (
              <button
                key={c.key}
                type="button"
                className={`metric-card${c.tone ? ' ' + c.tone : ''}${open ? ' is-open' : ''}`}
                onClick={() => setExpanded(open ? null : c.key)}
                aria-expanded={open}
              >
                <span className="metric-head">
                  <span className="metric-icon" aria-hidden="true">{c.icon}</span>
                  <span className="metric-label">{c.label}</span>
                  <span className={`metric-chevron${open ? ' is-open' : ''}`} aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                         strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </span>

                <span className={`metric-value${c.small ? ' is-small' : ''}`}>{c.value}</span>
                <span className="metric-detail">{c.detail}</span>

                {open && (
                  <span className="metric-breakdown">
                    {c.breakdown.map((row) => (
                      <span className="metric-breakdown-row" key={row.k}>
                        <span className="bd-key">{row.k}</span>
                        <span className="bd-val">{row.v}</span>
                      </span>
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TOP SELLING PRODUCTS */}
        <div className="dashboard-grid">
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Top Selling Products</h2>
            </div>

            <div className="products-list">
              {topProducts.length > 0 ? (
                topProducts.slice(0, 5).map((product, idx) => (
                  <div key={idx} className="product-row">
                    <div className="product-rank">{idx + 1}</div>
                    <div className="product-info">
                      <p className="product-name">{product.name}</p>
                      <p className="product-sales">{product.sales_count || 0} sales</p>
                    </div>
                    <div className="product-price">₹{product.price?.toLocaleString() || 0}</div>
                  </div>
                ))
              ) : (
                <p className="empty-text">No sales data yet</p>
              )}
            </div>
          </div>
        </div>

        {/* RECENT ORDERS */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Orders</h2>
          </div>

          <div className="orders-list">
            {recentOrders.length > 0 ? (
              recentOrders.slice(0, 5).map((order, idx) => (
                <div key={idx} className="order-row">
                  <div className="order-info">
                    <p className="order-id">Order #{order.id}</p>
                    <p className="order-status">{order.payment_status || 'PENDING'}</p>
                  </div>
                  <div className="order-amount">₹{order.total_amount?.toLocaleString() || 0}</div>
                </div>
              ))
            ) : (
              <p className="empty-text">No recent orders</p>
            )}
          </div>
        </div>

        {/* REFRESH INDICATOR - interval is REFRESH_SECONDS, so the copy can't drift */}
        <div className="dashboard-refresh-note">
          {error
            ? `Live data unavailable: ${error}`
            : `Live from the database · refreshes every ${REFRESH_SECONDS}s${
                lastUpdated ? ` · updated ${lastUpdated.toLocaleTimeString()}` : ''
              }${refreshing ? ' · updating…' : ''}`}
        </div>
      </div>
    </DashboardLayout>
  );
}
