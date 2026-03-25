import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDelivery } from '../../contexts/DeliveryContext';
import './DeliveryDashboard.css';

const statusLabels = {
  assigned: 'Order Assigned',
  picking_up: 'Picking Up',
  picked_up: 'Picked Up',
  on_the_way: 'On The Way',
  delivered: 'Delivered',
};

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const {
    isOnline, currentOrder, tracking, loading,
    toggleOnlineStatus, fetchCurrentOrder, markPickedUp, markDelivered,
    notifications, unreadCount, markNotificationRead, markAllNotificationsRead,
  } = useDelivery();

  const [toggling, setToggling] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [photoAction, setPhotoAction] = useState(null); // 'pickup' or 'deliver'
  const [showNotifications, setShowNotifications] = useState(false);
  const fileInputRef = useRef(null);
  const notifRef = useRef(null);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await toggleOnlineStatus(!isOnline);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to toggle status');
    } finally {
      setToggling(false);
    }
  };

  const handlePickup = () => {
    setPhotoAction('pickup');
    fileInputRef.current.value = '';
    fileInputRef.current.click();
  };

  const handleDeliver = () => {
    if (!window.confirm('Confirm delivery to customer?')) return;
    setPhotoAction('deliver');
    fileInputRef.current.value = '';
    fileInputRef.current.click();
  };

  const handlePhotoSelected = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setPhotoAction(null);
      return;
    }

    setActionLoading(true);
    try {
      if (photoAction === 'pickup') {
        await markPickedUp(currentOrder._id, file);
      } else if (photoAction === 'deliver') {
        const res = await markDelivered(currentOrder._id, file);
        const msg = res.data?.photoVerified
          ? `Order delivered & verified! (${res.data.verificationScore}% match) You earned ₹${res.data?.earning || 30}`
          : `Images not match (${res.data?.verificationScore}% match). `;
        alert(msg);
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || `Failed to confirm ${photoAction}`);
    } finally {
      setActionLoading(false);
      setPhotoAction(null);
    }
  };

  const handleLogout = async () => {
    if (isOnline) {
      await toggleOnlineStatus(false);
    }
    await logout();
    setTimeout(() => navigate('/goodbye', { replace: true }), 100);
  };

  if (loading) {
    return <div className="dd-container"><div className="dd-loading">Loading dashboard...</div></div>;
  }

  return (
    <div className="dd-container">
      {/* Header */}
      <div className="dd-header">
        <div className="dd-header-left">
          <h1 className="dd-title">Delivery Dashboard</h1>
          <p className="dd-greeting">Hello, {user?.name}</p>
        </div>
        <div className="dd-header-right">
          <div className="dd-notif-wrapper" ref={notifRef}>
            <button
              className="dd-notif-bell"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && <span className="dd-notif-badge">{unreadCount}</span>}
            </button>

            {showNotifications && (
              <div className="dd-notif-dropdown">
                <div className="dd-notif-header">
                  <h4>Notifications</h4>
                  {unreadCount > 0 && (
                    <button className="dd-notif-mark-all" onClick={markAllNotificationsRead}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="dd-notif-list">
                  {notifications.length === 0 ? (
                    <p className="dd-notif-empty">No notifications</p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        className={`dd-notif-item ${!notif.read ? 'unread' : ''} ${notif.type === 'delivery_rejected' ? 'rejected' : ''} ${notif.type === 'delivery_approved' ? 'approved' : ''}`}
                        onClick={() => !notif.read && markNotificationRead(notif._id)}
                      >
                        <div className="dd-notif-icon">
                          {notif.type === 'delivery_rejected' ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="9 12 12 15 16 10"/></svg>
                          )}
                        </div>
                        <div className="dd-notif-content">
                          <p className="dd-notif-title">{notif.title}</p>
                          <p className="dd-notif-msg">{notif.message}</p>
                          <p className="dd-notif-time">
                            {new Date(notif.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{' '}
                            {new Date(notif.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {!notif.read && <span className="dd-notif-dot" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <Link to="/delivery/history" className="dd-history-btn">History</Link>
          <button className="dd-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Toggle */}
      <div className="dd-toggle-section">
        <button
          className={`dd-toggle-btn ${isOnline ? 'online' : 'offline'}`}
          onClick={handleToggle}
          disabled={toggling}
        >
          {toggling ? 'Updating...' : isOnline ? 'Go Offline' : 'Go Online'}
        </button>
        <span className={`dd-status-indicator ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? 'You are Online' : 'You are Offline'}
        </span>
      </div>

      {/* Content based on state */}
      {!isOnline ? (
        <div className="dd-offline-msg">
          <p>You are offline. Go online to receive deliveries.</p>
        </div>
      ) : !currentOrder ? (
        <div className="dd-searching">
          <div className="dd-spinner" />
          <p>Finding customer...</p>
          <p className="dd-searching-sub">You will be notified when an order is assigned</p>
        </div>
      ) : (
        <div className="dd-order-section">
          {/* Order Status */}
          <div className="dd-order-status">
            <span className="dd-status-label">Status:</span>
            <span className="dd-status-value">{statusLabels[tracking?.status || currentOrder.status] || currentOrder.status}</span>
          </div>

          {/* Delivery Address */}
          <div className="dd-card">
            <h3>Delivery Address</h3>
            <p className="dd-addr-name">{currentOrder.deliveryAddress.name}</p>
            <p>{currentOrder.deliveryAddress.addressLine1}</p>
            {currentOrder.deliveryAddress.addressLine2 && <p>{currentOrder.deliveryAddress.addressLine2}</p>}
            <p>{currentOrder.deliveryAddress.city}, {currentOrder.deliveryAddress.state} - {currentOrder.deliveryAddress.pincode}</p>
            <p>Phone: {currentOrder.deliveryAddress.phone}</p>
          </div>

          {/* Items */}
          <div className="dd-card">
            <h3>Items ({currentOrder.items.length})</h3>
            {currentOrder.items.map((item, i) => (
              <div key={i} className="dd-item-row">
                <span>{item.name}</span>
                <span>x{item.quantity}</span>
                <span>₹{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div className="dd-item-total">
              <span>Total</span>
              <span>₹{currentOrder.grandTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="dd-card">
            <h3>Payment</h3>
            <p>
              Method: <strong>{currentOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : currentOrder.paymentMethod === 'upi' ? 'UPI' : 'Card'}</strong>
            </p>
            {currentOrder.paymentMethod === 'cod' && (
              <p className="dd-cod-alert">Collect ₹{currentOrder.grandTotal.toLocaleString()} from customer</p>
            )}
          </div>

          {/* ETA */}
          {tracking?.estimatedArrival && (
            <div className="dd-card dd-eta-card">
              <h3>Estimated Arrival</h3>
              <p className="dd-eta-time">
                {new Date(tracking.estimatedArrival).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}

          {/* Hidden file input for camera/photo */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handlePhotoSelected}
            style={{ display: 'none' }}
          />

          {/* Action Buttons */}
          <div className="dd-actions">
            {(tracking?.status === 'assigned' || tracking?.status === 'picking_up') && (
              <button className="dd-action-btn pickup" onClick={handlePickup} disabled={actionLoading}>
                {actionLoading ? 'Uploading photo...' : '📷 Confirm Pickup'}
              </button>
            )}
            {(tracking?.status === 'picked_up' || tracking?.status === 'on_the_way') && (
              <button className="dd-action-btn deliver" onClick={handleDeliver} disabled={actionLoading}>
                {actionLoading ? 'Verifying...' : '📷 Confirm Delivery'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;
