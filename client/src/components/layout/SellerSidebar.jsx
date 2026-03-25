import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import './AdminSidebar.css';

const SellerSidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showContact, setShowContact] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);

  const handleLogout = async () => {
    await logout();
    setTimeout(() => navigate('/login', { replace: true }), 100); // Small delay and replace history
  };

  const handleContactAdmin = async () => {
    try {
      if (!contactInfo) {
        const { data } = await api.get('/seller/admin-contact');
        setContactInfo(data.data);
      }
      setShowContact(true);
    } catch (error) {
      console.error('Failed to fetch admin contact:', error);
      alert('Failed to load admin contact info');
    }
  };

  const links = [
    { to: '/seller/products', label: 'Products', icon: '📦' },
    { to: '/seller/delivery-status', label: 'Delivery Status', icon: '🚚' },
  ];

  return (
    <>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>Seller Panel</h2>
        </div>
        <nav className="admin-sidebar-nav">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `admin-sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="admin-sidebar-icon">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
          <button
            className="admin-sidebar-link"
            onClick={handleContactAdmin}
            style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
          >
            <span className="admin-sidebar-icon">📞</span>
            <span>Contact Admin</span>
          </button>
        </nav>
        <div className="admin-sidebar-footer">
          <button className="admin-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      {showContact && (
        <div className="admin-modal-overlay" onClick={() => setShowContact(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
            <h2>Contact Admin</h2>
            {contactInfo ? (
              <div style={{ fontSize: '15px', lineHeight: '2' }}>
                <p><strong>Email:</strong> {contactInfo.email}</p>
                <p><strong>Phone:</strong> {contactInfo.phone}</p>
              </div>
            ) : (
              <p>Loading...</p>
            )}
            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={() => setShowContact(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SellerSidebar;
