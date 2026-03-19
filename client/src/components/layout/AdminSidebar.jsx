import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './AdminSidebar.css';

const AdminSidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login/admin');
  };

  const links = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/admin/products', label: 'Products', icon: '📦' },
    { to: '/admin/orders', label: 'Orders', icon: '🛒' },
    { to: '/admin/users', label: 'Users', icon: '👥' },
    { to: '/admin/delivery', label: 'Delivery Boys', icon: '🚚' },
    { to: '/admin/charges', label: 'Charges', icon: '💰' },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <h2>Admin Panel</h2>
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
      </nav>
      <div className="admin-sidebar-footer">
        <button className="admin-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
