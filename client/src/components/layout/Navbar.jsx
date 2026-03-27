import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import api from '../../api/axios';
import useCatalogUpdates from '../../hooks/useCatalogUpdates';
import SearchBar from '../search/SearchBar';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const { openLogin } = useAuthModal();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data.data?.categories || data.categories || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useCatalogUpdates(fetchCategories);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setDropdownOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="logo-text">ChiragKart</span>
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
            <button onClick={openLogin} className="nav-btn login-btn">
              Login
            </button>
          )}

          {categories.length > 0 && (
            <div className="hamburger-wrapper" ref={menuRef}>
              <button
                className="hamburger-btn"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Categories menu"
              >
                <span className={`hamburger-icon ${menuOpen ? 'open' : ''}`}>
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </button>

              {menuOpen && (
                <div className="categories-dropdown">
                  <div className="categories-dropdown-header">Categories</div>
                  {categories.map((cat) => (
                    <Link
                      key={cat._id}
                      to={`/category/${cat.slug}`}
                      className="categories-dropdown-item"
                      onClick={() => setMenuOpen(false)}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
