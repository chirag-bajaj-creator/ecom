import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import SearchBar from '../search/SearchBar';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setDropdownOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="logo-text">ShopKart</span>
        </Link>

        <SearchBar />

        <div className="navbar-actions">
          <Link to="/add-to-cart" className="nav-btn cart-nav-btn" title="Cart">
            Cart
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>

          <Link to="/wishlist" className="nav-btn" title="Wishlist">
            Wishlist
          </Link>

          <Link to="/help" className="nav-btn" title="Help">
            Help
          </Link>

          {isAuthenticated ? (
            <div className="profile-dropdown">
              <button
                className="nav-btn profile-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </button>

              {dropdownOpen && (
                <div className="dropdown-menu">
                  <p className="dropdown-name">{user.name}</p>
                  <p className="dropdown-email">{user.email}</p>
                  <hr />
                  <Link to="/my-orders" onClick={() => setDropdownOpen(false)}>
                    My Orders
                  </Link>
                  <Link to="/my-profile" onClick={() => setDropdownOpen(false)}>
                    My Profile
                  </Link>
                  <button onClick={handleLogout} className="dropdown-logout">
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="nav-btn login-btn">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
