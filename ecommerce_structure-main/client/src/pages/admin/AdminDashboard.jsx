import { useState, useEffect } from 'react';
import api from '../../api/axios';
import AdminSidebar from '../../components/layout/AdminSidebar';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/dashboard');
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusLabels = {
    ordered: 'Ordered',
    shipped: 'Shipped',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };

  const statusColors = {
    ordered: '#3b82f6',
    shipped: '#f59e0b',
    out_for_delivery: '#eab308',
    delivered: '#22c55e',
    cancelled: '#ef4444'
  };

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <main className="admin-content">
          <div className="admin-loading">Loading dashboard...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-content">
        <h1 className="admin-page-title">Dashboard</h1>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Orders</div>
            <div className="stat-value">{stats?.totalOrders || 0}</div>
          </div>
          <div className="stat-card stat-revenue">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">₹{(stats?.totalRevenue || 0).toLocaleString()}</div>
          </div>
          <div className="stat-card stat-refund">
            <div className="stat-label">Total Refunds</div>
            <div className="stat-value">₹{(stats?.totalRefunds || 0).toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Products</div>
            <div className="stat-value">{stats?.totalProducts || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Customers</div>
            <div className="stat-value">{stats?.totalUsers || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Delivery Boys</div>
            <div className="stat-value">
              {stats?.activeDeliveryBoys || 0}
              <span className="stat-sub"> / {stats?.totalDeliveryBoys || 0} online</span>
            </div>
          </div>
        </div>

        <div className="dashboard-sections">
          <div className="dashboard-section">
            <h2>Orders by Status</h2>
            <div className="status-bars">
              {Object.entries(statusLabels).map(([key, label]) => {
                const count = stats?.ordersByStatus?.[key] || 0;
                const percentage = stats?.totalOrders ? (count / stats.totalOrders) * 100 : 0;
                return (
                  <div key={key} className="status-bar-row">
                    <div className="status-bar-label">
                      <span className="status-dot" style={{ background: statusColors[key] }}></span>
                      {label}
                    </div>
                    <div className="status-bar-track">
                      <div
                        className="status-bar-fill"
                        style={{ width: `${percentage}%`, background: statusColors[key] }}
                      ></div>
                    </div>
                    <div className="status-bar-count">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="dashboard-section">
            <h2>Recent Orders</h2>
            {stats?.recentOrders?.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map(order => (
                    <tr key={order._id}>
                      <td className="order-id">#{order._id.slice(-6)}</td>
                      <td>{order.userId?.name || 'N/A'}</td>
                      <td>₹{order.grandTotal?.toLocaleString()}</td>
                      <td>
                        <span
                          className="status-badge"
                          style={{ background: statusColors[order.status] }}
                        >
                          {statusLabels[order.status]}
                        </span>
                      </td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">No orders yet</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
