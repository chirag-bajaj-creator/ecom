import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import './MyOrders.css';

const statusColors = {
  ordered: 'badge-blue',
  shipped: 'badge-orange',
  out_for_delivery: 'badge-yellow',
  delivered: 'badge-green',
  cancelled: 'badge-red',
};

const statusLabels = {
  ordered: 'Ordered',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const MyOrders = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { fetchCartCount } = useCart();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/my-orders' } });
      return;
    }
    fetchOrders();
  }, [isAuthenticated, page]);

  const fetchOrders = async () => {
    try {
      const res = await api.get(`/orders?page=${page}&limit=10`);
      setOrders(res.data.data.orders);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    setActionLoading(orderId);
    try {
      await api.post(`/orders/${orderId}/cancel`);
      setOrders(orders.map((o) =>
        o._id === orderId ? { ...o, status: 'cancelled', cancelledAt: new Date() } : o
      ));
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to cancel order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReorder = async (orderId) => {
    setActionLoading(orderId);
    try {
      const res = await api.post(`/orders/${orderId}/reorder`);
      await fetchCartCount();
      const { added, skipped } = res.data.data;
      let msg = `${added.length} item(s) added to cart.`;
      if (skipped.length > 0) {
        msg += ` ${skipped.length} item(s) skipped (out of stock).`;
      }
      alert(msg);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to reorder');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="orders-container">
          <h1 className="orders-title">My Orders</h1>
          <div className="orders-loading">
            {[1, 2, 3].map((i) => (
              <div key={i} className="order-skeleton" />
            ))}
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="orders-container">
        <h1 className="orders-title">My Orders</h1>

        {orders.length === 0 ? (
          <div className="orders-empty">
            <p>No orders yet — start shopping!</p>
            <button onClick={() => navigate('/')} className="btn-shop">Browse Products</button>
          </div>
        ) : (
          <>
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order._id} className="order-card">
                  <div
                    className="order-header"
                    onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
                  >
                    <div className="order-header-left">
                      <div className="order-id">#{order._id.slice(-8).toUpperCase()}</div>
                      <div className="order-date">{formatDate(order.createdAt)}</div>
                    </div>
                    <div className="order-header-right">
                      <span className="order-total">₹{order.grandTotal.toLocaleString()}</span>
                      <span className={`status-badge ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </div>
                  </div>

                  {/* Thumbnails */}
                  <div className="order-thumbnails">
                    {order.items.slice(0, 4).map((item, i) => (
                      <div key={i} className="thumb-wrapper">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="thumb-img" />
                        ) : (
                          <div className="thumb-placeholder">{item.name.charAt(0)}</div>
                        )}
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <div className="thumb-more">+{order.items.length - 4}</div>
                    )}
                  </div>

                  {/* Expanded detail */}
                  {expandedId === order._id && (
                    <div className="order-detail">
                      <div className="detail-section">
                        <h4>Items</h4>
                        {order.items.map((item, i) => (
                          <div key={i} className="detail-item">
                            <div className="detail-item-info">
                              {item.image && <img src={item.image} alt={item.name} className="detail-item-img" />}
                              <div>
                                <p className="detail-item-name">{item.name}</p>
                                <p className="detail-item-qty">Qty: {item.quantity} × ₹{item.price.toLocaleString()}</p>
                              </div>
                            </div>
                            <span className="detail-item-total">₹{(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      <div className="detail-section">
                        <h4>Delivery Address</h4>
                        <p>{order.deliveryAddress.name}</p>
                        <p>{order.deliveryAddress.addressLine1}</p>
                        {order.deliveryAddress.addressLine2 && <p>{order.deliveryAddress.addressLine2}</p>}
                        <p>{order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}</p>
                        <p>Phone: {order.deliveryAddress.phone}</p>
                      </div>

                      <div className="detail-section">
                        <h4>Payment</h4>
                        <p>{order.paymentMethod === 'upi' ? 'UPI' : order.paymentMethod === 'credit-debit' ? 'Credit / Debit Card' : 'Cash on Delivery'}</p>
                      </div>

                      <div className="detail-section">
                        <h4>Charges</h4>
                        <div className="detail-charges">
                          <div className="charge-line"><span>Subtotal</span><span>₹{order.totalAmount.toLocaleString()}</span></div>
                          <div className="charge-line"><span>Delivery</span><span>{order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`}</span></div>
                          <div className="charge-line"><span>Handling</span><span>₹{order.handlingCharge}</span></div>
                          {order.surgeCharge > 0 && (
                            <div className="charge-line"><span>Surge</span><span>₹{order.surgeCharge}</span></div>
                          )}
                          <div className="charge-line total"><span>Total</span><span>₹{order.grandTotal.toLocaleString()}</span></div>
                        </div>
                      </div>

                      <div className="order-actions">
                        <button
                          className="btn-reorder"
                          onClick={() => handleReorder(order._id)}
                          disabled={actionLoading === order._id}
                        >
                          {actionLoading === order._id ? 'Processing...' : 'Reorder'}
                        </button>
                        {['ordered', 'shipped', 'out_for_delivery'].includes(order.status) && (
                          <button
                            className="btn-track"
                            onClick={() => navigate(`/orders/${order._id}/tracking`)}
                          >
                            Track Order
                          </button>
                        )}
                        {['ordered', 'shipped'].includes(order.status) && (
                          <button
                            className="btn-cancel"
                            onClick={() => handleCancel(order._id)}
                            disabled={actionLoading === order._id}
                          >
                            {actionLoading === order._id ? 'Cancelling...' : 'Cancel Order'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="orders-pagination">
                <button onClick={() => setPage(page - 1)} disabled={page === 1}>Previous</button>
                <span>Page {page} of {totalPages}</span>
                <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>Next</button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  );
};

export default MyOrders;
