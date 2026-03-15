import { useState, useEffect } from 'react';
import api from '../../api/axios';
import AdminSidebar from '../../components/layout/AdminSidebar';
import './AdminDelivery.css';

const AdminDelivery = () => {
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveryBoys();
  }, []);

  const fetchDeliveryBoys = async () => {
    try {
      const { data } = await api.get('/admin/delivery-boys');
      setDeliveryBoys(data.deliveryBoys);
    } catch (error) {
      console.error('Failed to fetch delivery boys:', error);
    } finally {
      setLoading(false);
    }
  };

  const onlineCount = deliveryBoys.filter(d => d.isOnline).length;
  const activeCount = deliveryBoys.filter(d => d.currentOrderId).length;
  const totalEarnings = deliveryBoys.reduce((sum, d) => sum + (d.totalEarnings || 0), 0);
  const totalDeliveries = deliveryBoys.reduce((sum, d) => sum + (d.totalDeliveries || 0), 0);

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-content">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Delivery Boys</h1>
          <button className="admin-refresh-btn" onClick={fetchDeliveryBoys}>Refresh</button>
        </div>

        <div className="delivery-stats-grid">
          <div className="delivery-stat-card">
            <div className="stat-label">Total</div>
            <div className="stat-value">{deliveryBoys.length}</div>
          </div>
          <div className="delivery-stat-card online-card">
            <div className="stat-label">Online</div>
            <div className="stat-value">{onlineCount}</div>
          </div>
          <div className="delivery-stat-card active-card">
            <div className="stat-label">On Delivery</div>
            <div className="stat-value">{activeCount}</div>
          </div>
          <div className="delivery-stat-card earnings-card">
            <div className="stat-label">Total Earnings</div>
            <div className="stat-value">₹{totalEarnings.toLocaleString()}</div>
          </div>
          <div className="delivery-stat-card">
            <div className="stat-label">Total Deliveries</div>
            <div className="stat-value">{totalDeliveries}</div>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading">Loading delivery boys...</div>
        ) : (
          <div className="delivery-cards-grid">
            {deliveryBoys.length > 0 ? deliveryBoys.map(boy => (
              <div key={boy._id} className={`delivery-card ${boy.isOnline ? 'online' : 'offline'}`}>
                <div className="delivery-card-header">
                  <div className="delivery-avatar">
                    {boy.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="delivery-info">
                    <div className="delivery-name">{boy.userId?.name || 'Unknown'}</div>
                    <div className="delivery-contact">{boy.userId?.email}</div>
                    {boy.userId?.phone && (
                      <div className="delivery-contact">{boy.userId.phone}</div>
                    )}
                  </div>
                  <div className={`online-indicator ${boy.isOnline ? 'is-online' : 'is-offline'}`}>
                    {boy.isOnline ? 'Online' : 'Offline'}
                  </div>
                </div>

                <div className="delivery-card-stats">
                  <div className="delivery-stat">
                    <span className="delivery-stat-label">Deliveries</span>
                    <span className="delivery-stat-value">{boy.totalDeliveries || 0}</span>
                  </div>
                  <div className="delivery-stat">
                    <span className="delivery-stat-label">Earnings</span>
                    <span className="delivery-stat-value earnings">₹{(boy.totalEarnings || 0).toLocaleString()}</span>
                  </div>
                  <div className="delivery-stat">
                    <span className="delivery-stat-label">Last Active</span>
                    <span className="delivery-stat-value">
                      {boy.lastActiveAt
                        ? new Date(boy.lastActiveAt).toLocaleString()
                        : 'Never'}
                    </span>
                  </div>
                </div>

                {boy.currentOrderId && (
                  <div className="delivery-active-order">
                    <div className="active-order-label">Active Order</div>
                    <div className="active-order-detail">
                      <span>#{boy.currentOrderId._id?.slice(-6) || boy.currentOrderId}</span>
                      {boy.currentOrderId.status && (
                        <span className="active-order-status">{boy.currentOrderId.status}</span>
                      )}
                      {boy.currentOrderId.grandTotal && (
                        <span>₹{boy.currentOrderId.charges.grandTotal.toLocaleString()}</span>
                      )}
                    </div>
                    {boy.currentOrderId.deliveryAddress && (
                      <div className="active-order-address">
                        {boy.currentOrderId.deliveryAddress.city}, {boy.currentOrderId.deliveryAddress.state}
                      </div>
                    )}
                  </div>
                )}

                {boy.currentLat && boy.currentLng && (
                  <div className="delivery-location">
                    GPS: {boy.currentLat.toFixed(4)}, {boy.currentLng.toFixed(4)}
                  </div>
                )}
              </div>
            )) : (
              <div className="no-data">No delivery boys registered</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDelivery;
