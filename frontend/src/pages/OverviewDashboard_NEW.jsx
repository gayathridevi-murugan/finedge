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

export default function OverviewDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
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

  return (
    <DashboardLayout pageTitle="Overview Dashboard">
      <div className="overview-dashboard">
        {/* TOP METRIC CARDS */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon" aria-hidden="true">🛒</div>
            <div className="metric-content">
              <p className="metric-label">Active Sessions</p>
              <h3 className="metric-value">{fmt(metrics?.activeSessions)}</h3>
              <p className="metric-detail">
                Carts active in last {metrics?.activeSessionWindowMinutes ?? 15} min
              </p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon" aria-hidden="true">🛍️</div>
            <div className="metric-content">
              <p className="metric-label">Carts Opened Today</p>
              <h3 className="metric-value">{fmt(metrics?.cartsCreatedToday)}</h3>
              <p className="metric-detail">Since midnight</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon" aria-hidden="true">📦</div>
            <div className="metric-content">
              <p className="metric-label">Today's Orders</p>
              <h3 className="metric-value">{fmt(metrics?.todaysOrders)}</h3>
              <p className="metric-detail">
                {fmt(metrics?.completedOrders)} paid · {fmt(metrics?.pendingOrders)} pending · {fmt(metrics?.failedOrders)} failed
              </p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon" aria-hidden="true">💰</div>
            <div className="metric-content">
              <p className="metric-label">Today's Revenue</p>
              <h3 className="metric-value">₹{money(metrics?.todaysRevenue)}</h3>
              <p className="metric-detail">From {fmt(metrics?.completedOrders)} paid orders</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon" aria-hidden="true">📱</div>
            <div className="metric-content">
              <p className="metric-label">NFC Scans</p>
              <h3 className="metric-value">{fmt(metrics?.productsScanned)}</h3>
              <p className="metric-detail">
                Across {fmt(metrics?.uniqueProductsScanned)} distinct products
              </p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon" aria-hidden="true">⏱️</div>
            <div className="metric-content">
              <p className="metric-label">Avg Checkout Time</p>
              <h3 className="metric-value">
                {metrics?.avgCheckoutMinutes != null ? `${metrics.avgCheckoutMinutes} min` : '—'}
              </h3>
              <p className="metric-detail">Order created to payment captured</p>
            </div>
          </div>

          <div className="metric-card alert">
            <div className="metric-icon" aria-hidden="true">⏳</div>
            <div className="metric-content">
              <p className="metric-label">Pending Payments</p>
              <h3 className="metric-value">{fmt(metrics?.pendingPayments)}</h3>
              <p className="metric-detail">Awaiting verification today</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon" aria-hidden="true">🚪</div>
            <div className="metric-content">
              <p className="metric-label">Exit Events</p>
              <h3 className="metric-value">{fmt(metrics?.exitEvents)}</h3>
              <p className="metric-detail">Verified at the gate today</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon" aria-hidden="true">🏪</div>
            <div className="metric-content">
              <p className="metric-label">Merchant</p>
              <h3 className="metric-value" style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>
                {metrics?.merchantId || 'Not configured'}
              </h3>
              <p className="metric-detail">
                {metrics?.merchantStatus || 'UNKNOWN'} · DB {metrics?.databaseStatus || 'UNKNOWN'}
              </p>
            </div>
          </div>
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
