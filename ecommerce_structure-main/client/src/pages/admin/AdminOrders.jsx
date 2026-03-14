import { useState, useEffect } from 'react';
import api from '../../api/axios';
import AdminSidebar from '../../components/layout/AdminSidebar';
import './AdminOrders.css';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 15 });
      if (statusFilter) params.append('status', statusFilter);
      const { data } = await api.get(`/admin/orders?${params}`);
      setOrders(data.orders);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (!window.confirm(`Change order status to "${newStatus}"?`)) return;
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm('Cancel this order and refund the payment?')) return;
    try {
      await api.post(`/admin/orders/${orderId}/cancel`);
      fetchOrders();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel order');
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

  const nextStatus = {
    ordered: 'shipped',
    shipped: 'out_for_delivery',
    out_for_delivery: 'delivered'
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-content">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Orders</h1>
          <div className="order-filters">
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="status-filter-select"
            >
              <option value="">All Statuses</option>
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading">Loading orders...</div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? orders.map(order => (
                  <>
                    <tr
                      key={order._id}
                      className={`order-row ${expandedOrder === order._id ? 'expanded' : ''}`}
                      onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                    >
                      <td className="order-id">#{order._id.slice(-6)}</td>
                      <td>
                        <div className="customer-name">{order.userId?.name || 'N/A'}</div>
                        <div className="customer-email">{order.userId?.email || ''}</div>
                      </td>
                      <td>{order.items?.length || 0}</td>
                      <td className="price-cell">₹{order.grandTotal?.toLocaleString()}</td>
                      <td>
                        <span className={`payment-badge ${order.paymentStatus}`}>
                          {order.paymentMethod?.toUpperCase()} - {order.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <span className="status-badge" style={{ background: statusColors[order.status] }}>
                          {statusLabels[order.status]}
                        </span>
                      </td>
                      <td className="date-cell">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="action-btns">
                          {nextStatus[order.status] && (
                            <button
                              className="edit-btn"
                              onClick={() => handleStatusUpdate(order._id, nextStatus[order.status])}
                              title={`Move to ${statusLabels[nextStatus[order.status]]}`}
                            >
                              {statusLabels[nextStatus[order.status]]}
                            </button>
                          )}
                          {order.status === 'ordered' && (
                            <button
                              className="delete-btn"
                              onClick={() => handleCancel(order._id)}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedOrder === order._id && (
                      <tr key={`${order._id}-detail`} className="order-detail-row">
                        <td colSpan="8">
                          <div className="order-detail-content">
                            <div className="detail-section">
                              <h4>Items</h4>
                              <div className="detail-items">
                                {order.items?.map((item, idx) => (
                                  <div key={idx} className="detail-item">
                                    <span className="detail-item-name">{item.name}</span>
                                    <span className="detail-item-qty">x{item.quantity}</span>
                                    <span className="detail-item-price">₹{item.price?.toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="detail-section">
                              <h4>Delivery Address</h4>
                              <p className="detail-address">
                                {order.deliveryAddress?.name}<br />
                                {order.deliveryAddress?.addressLine1}
                                {order.deliveryAddress?.addressLine2 && <>, {order.deliveryAddress.addressLine2}</>}<br />
                                {order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}<br />
                                Phone: {order.deliveryAddress?.phone}
                              </p>
                            </div>
                            <div className="detail-section">
                              <h4>Charges</h4>
                              <div className="detail-charges">
                                <div>Subtotal: ₹{order.totalAmount?.toLocaleString()}</div>
                                <div>Delivery: ₹{order.deliveryCharge}</div>
                                <div>Handling: ₹{order.handlingCharge}</div>
                                <div>Surge: ₹{order.surgeCharge}</div>
                                <div className="detail-grand-total">Grand Total: ₹{order.grandTotal?.toLocaleString()}</div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )) : (
                  <tr><td colSpan="8" className="no-data">No orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="admin-pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminOrders;
