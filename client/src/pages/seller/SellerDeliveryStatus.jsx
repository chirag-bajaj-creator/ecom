import { useState, useEffect } from 'react';
import api from '../../api/axios';
import SellerSidebar from '../../components/layout/SellerSidebar';
import '../admin/AdminProducts.css';

const statusColors = {
  ordered: '#3b82f6',
  shipped: '#f59e0b',
  out_for_delivery: '#8b5cf6',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

const statusLabels = {
  ordered: 'In Queue',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const SellerDeliveryStatus = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/seller/orders');
      setOrders(data.data?.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-layout">
        <SellerSidebar />
        <main className="admin-content">
          <div className="admin-loading">Loading delivery status...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <SellerSidebar />
      <main className="admin-content">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Delivery Boy Status</h1>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Delivery Boy</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? orders.map(order => (
                <tr key={order._id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                    {order._id.slice(-8).toUpperCase()}
                  </td>
                  <td>{order.userId?.name || 'N/A'}</td>
                  <td>{order.items?.length || 0} item(s)</td>
                  <td className="price-cell">₹{order.grandTotal?.toLocaleString()}</td>
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#fff',
                        background: statusColors[order.status] || '#888',
                      }}
                    >
                      {statusLabels[order.status] || order.status}
                    </span>
                  </td>
                  <td>{order.deliveryBoyId?.name || 'Not assigned'}</td>
                  <td style={{ fontSize: '13px', color: '#666' }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="7" className="no-data">No orders found for your products</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default SellerDeliveryStatus;
