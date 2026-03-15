import { useState, useEffect } from 'react';
import api from '../../api/axios';
import AdminSidebar from '../../components/layout/AdminSidebar';
import './AdminCharges.css';

const AdminCharges = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    deliveryCharge: '',
    freeDeliveryThreshold: '',
    surgeCharge: '',
    handlingCharge: ''
  });

  useEffect(() => {
    fetchCharges();
  }, []);

  const fetchCharges = async () => {
    try {
      const { data } = await api.get('/admin/charges');
      setConfig(data);
      setForm({
        deliveryCharge: data.deliveryCharge,
        freeDeliveryThreshold: data.freeDeliveryThreshold,
        surgeCharge: data.surgeCharge,
        handlingCharge: data.handlingCharge
      });
    } catch (error) {
      console.error('Failed to fetch charges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        deliveryCharge: Number(form.deliveryCharge),
        freeDeliveryThreshold: Number(form.freeDeliveryThreshold),
        surgeCharge: Number(form.surgeCharge),
        handlingCharge: Number(form.handlingCharge)
      };
      await api.patch('/admin/charges', payload);
      await fetchCharges();
      alert('Charges updated successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update charges');
    } finally {
      setSaving(false);
    }
  };

  const fieldLabels = {
    deliveryCharge: 'Delivery Charge',
    freeDeliveryThreshold: 'Free Delivery Threshold',
    surgeCharge: 'Surge Charge',
    handlingCharge: 'Handling Charge'
  };

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <main className="admin-content">
          <div className="admin-loading">Loading charges...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-content">
        <h1 className="admin-page-title">Charge Management</h1>

        <div className="charges-layout">
          <div className="charges-form-section">
            <h2>Current Charges</h2>
            <form onSubmit={handleSubmit}>
              <div className="charge-field">
                <label>Delivery Charge (₹)</label>
                <input
                  type="number"
                  value={form.deliveryCharge}
                  onChange={e => setForm({ ...form, deliveryCharge: e.target.value })}
                  min="0"
                  required
                />
                <span className="charge-hint">Applied when cart total is below free delivery threshold</span>
              </div>
              <div className="charge-field">
                <label>Free Delivery Threshold (₹)</label>
                <input
                  type="number"
                  value={form.freeDeliveryThreshold}
                  onChange={e => setForm({ ...form, freeDeliveryThreshold: e.target.value })}
                  min="0"
                  required
                />
                <span className="charge-hint">Orders above this amount get free delivery</span>
              </div>
              <div className="charge-field">
                <label>Surge Charge (₹)</label>
                <input
                  type="number"
                  value={form.surgeCharge}
                  onChange={e => setForm({ ...form, surgeCharge: e.target.value })}
                  min="0"
                  required
                />
                <span className="charge-hint">Extra charge during peak hours or high demand</span>
              </div>
              <div className="charge-field">
                <label>Handling Charge (₹)</label>
                <input
                  type="number"
                  value={form.handlingCharge}
                  onChange={e => setForm({ ...form, handlingCharge: e.target.value })}
                  min="0"
                  required
                />
                <span className="charge-hint">Flat handling fee per order</span>
              </div>
              <button type="submit" className="charge-save-btn" disabled={saving}>
                {saving ? 'Saving...' : 'Update Charges'}
              </button>
            </form>
          </div>

          <div className="charges-audit-section">
            <h2>Audit Log</h2>
            {config?.auditLog?.length > 0 ? (
              <div className="audit-log-list">
                {[...config.auditLog].reverse().map((entry, idx) => (
                  <div key={idx} className="audit-entry">
                    <div className="audit-entry-header">
                      <span className="audit-field">{fieldLabels[entry.field] || entry.field}</span>
                      <span className="audit-date">
                        {new Date(entry.changedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="audit-entry-values">
                      <span className="audit-old">₹{entry.oldValue}</span>
                      <span className="audit-arrow">→</span>
                      <span className="audit-new">₹{entry.newValue}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No changes recorded yet</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminCharges;
