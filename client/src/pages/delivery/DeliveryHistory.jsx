import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import './DeliveryHistory.css';

const DeliveryHistory = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [deliveries, setDeliveries] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [period, setPeriod] = useState('today');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [period, page]);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/delivery/history?period=${period}&page=${page}&limit=20`);
      setDeliveries(res.data.data.deliveries);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const fetchEarnings = async () => {
    try {
      const res = await api.get('/delivery/earnings');
      setEarnings(res.data.data);
    } catch (err) {
      // silent
    }
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setPage(1);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  // Get earnings for selected period
  const getPeriodEarnings = () => {
    if (!earnings) return { amount: 0, count: 0 };
    switch (period) {
      case 'today': return { amount: earnings.earningsToday, count: earnings.deliveriesToday };
      case 'week': return { amount: earnings.earningsThisWeek, count: earnings.deliveriesThisWeek };
      case 'month': return { amount: earnings.earningsThisMonth, count: earnings.deliveriesThisMonth };
      default: return { amount: 0, count: 0 };
    }
  };

  const periodData = getPeriodEarnings();

  return (
    <div className="dh-container">
      {/* Header */}
      <div className="dh-header">
        <Link to="/delivery/dashboard" className="dh-back-btn">Back</Link>
        <h1 className="dh-title">Delivery History</h1>
      </div>

      {/* Earnings Summary */}
      <div className="dh-summary-cards">
        <div className="dh-summary-card">
          <span className="dh-summary-label">Deliveries</span>
          <span className="dh-summary-value">{periodData.count}</span>
        </div>
        <div className="dh-summary-card">
          <span className="dh-summary-label">Earnings</span>
          <span className="dh-summary-value green">₹{periodData.amount.toLocaleString()}</span>
        </div>
        <div className="dh-summary-card">
          <span className="dh-summary-label">Avg / Delivery</span>
          <span className="dh-summary-value">
            ₹{periodData.count > 0 ? Math.round(periodData.amount / periodData.count) : 0}
          </span>
        </div>
      </div>

      {/* All-time stats */}
      {earnings && (
        <div className="dh-alltime">
          All time: <strong>{earnings.totalDeliveries}</strong> deliveries, <strong>₹{earnings.totalEarnings.toLocaleString()}</strong> earned
        </div>
      )}

      {/* Period Filter */}
      <div className="dh-filters">
        {['today', 'week', 'month'].map((p) => (
          <button
            key={p}
            className={`dh-filter-btn ${period === p ? 'active' : ''}`}
            onClick={() => handlePeriodChange(p)}
          >
            {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      {/* Deliveries List */}
      {loading ? (
        <div className="dh-loading">
          {[1, 2, 3].map((i) => <div key={i} className="dh-skeleton" />)}
        </div>
      ) : deliveries.length === 0 ? (
        <div className="dh-empty">
          <p>No deliveries for this period.</p>
        </div>
      ) : (
        <div className="dh-list">
          {deliveries.map((d, i) => (
            <div key={i} className="dh-card">
              <div className="dh-card-top">
                <div className="dh-card-left">
                  <span className="dh-order-id">#{d.orderId.toString().slice(-8).toUpperCase()}</span>
                  <span className="dh-customer">{d.customerName}</span>
                </div>
                <div className="dh-card-right">
                  {d.adminReviewStatus === 'pending_review' ? (
                    <>
                      <span className="dh-earning pipeline">₹{d.earning} (In Review)</span>
                      <span className="dh-badge pending">Under Review</span>
                    </>
                  ) : d.adminReviewStatus === 'rejected' ? (
                    <>
                      <span className="dh-earning rejected">₹0</span>
                      <span className="dh-badge rejected">Images Not Match</span>
                    </>
                  ) : (
                    <>
                      <span className="dh-earning">+₹{d.earning}</span>
                      <span className="dh-badge">Delivered</span>
                    </>
                  )}
                </div>
              </div>
              <div className="dh-card-bottom">
                <span className="dh-location">{d.deliveryLocation}</span>
                <span className="dh-items">{d.itemCount} item(s) — ₹{d.totalAmount.toLocaleString()}</span>
                <span className="dh-time">
                  {formatDate(d.deliveredAt)} | {formatTime(d.pickedUpAt)} → {formatTime(d.deliveredAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="dh-pagination">
          <button onClick={() => setPage(page - 1)} disabled={page === 1}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>Next</button>
        </div>
      )}
    </div>
  );
};

export default DeliveryHistory;
