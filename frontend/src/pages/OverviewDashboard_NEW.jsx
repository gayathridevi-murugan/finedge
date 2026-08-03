import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import apiClient from '../services/api';
import '../styles/OverviewDashboard_NEW.css';

export default function OverviewDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all dashboard data in parallel with cache busting
      const timestamp = new Date().getTime();
      const [metricsRes, ordersRes, productsRes] = await Promise.all([
        apiClient.get(`/dashboard/metrics?t=${timestamp}`),
        apiClient.get(`/dashboard/recent-orders?t=${timestamp}`),
        apiClient.get(`/dashboard/top-products?t=${timestamp}`)
      ]);

      if (metricsRes.data.success) setMetrics(metricsRes.data.data);
      if (ordersRes.data.success) setRecentOrders(ordersRes.data.data.orders || []);
      if (productsRes.data.success) setTopProducts(productsRes.data.data.topProducts || []);

      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and auto-refresh
  useEffect(() => {
    fetchDashboardData();
    // Refresh every 10 seconds for real-time updates
    const interval = setInterval(fetchDashboardData, 10000);
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

  if (error) {
    return (
      <DashboardLayout pageTitle="Overview Dashboard">
        <div style={{ padding: '2rem', color: 'var(--color-error)' }}>
          <p>Error loading dashboard: {error}</p>
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
            <div className="metric-icon">📊</div>
            <div className="metric-content">
              <p className="metric-label">Active Sessions</p>
              <h3 className="metric-value">{metrics?.activeSessions || 0}</h3>
              <p className="metric-detail">Currently shopping</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">📦</div>
            <div className="metric-content">
              <p className="metric-label">Today's Orders</p>
              <h3 className="metric-value">{metrics?.todaysOrders || 0}</h3>
              <p className="metric-detail">{metrics?.completedOrders || 0} completed</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">💰</div>
            <div className="metric-content">
              <p className="metric-label">Today's Revenue</p>
              <h3 className="metric-value">₹{metrics?.todaysRevenue?.toLocaleString() || 0}</h3>
              <p className="metric-detail">From completed orders</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">📱</div>
            <div className="metric-content">
              <p className="metric-label">Products Scanned</p>
              <h3 className="metric-value">{metrics?.productsScanned || 0}</h3>
              <p className="metric-detail">Today</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">✓</div>
            <div className="metric-content">
              <p className="metric-label">Completed Checkouts</p>
              <h3 className="metric-value">{metrics?.completedOrders || 0}</h3>
              <p className="metric-detail">Today</p>
            </div>
          </div>

          <div className="metric-card alert">
            <div className="metric-icon">⏳</div>
            <div className="metric-content">
              <p className="metric-label">Pending Payments</p>
              <h3 className="metric-value">{metrics?.pendingPayments || 0}</h3>
              <p className="metric-detail">Awaiting verification</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">🚪</div>
            <div className="metric-content">
              <p className="metric-label">Exit Events</p>
              <h3 className="metric-value">{metrics?.exitEvents || 0}</h3>
              <p className="metric-detail">Today</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">🛍️</div>
            <div className="metric-content">
              <p className="metric-label">Merchant ID</p>
              <h3 className="metric-value" style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>
                {metrics?.merchantId || 'N/A'}
              </h3>
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

        {/* REFRESH INDICATOR */}
        <div style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
          📡 Data refreshes automatically every 30 seconds
        </div>
      </div>
    </DashboardLayout>
  );
}
