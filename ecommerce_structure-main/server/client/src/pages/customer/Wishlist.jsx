import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import './Wishlist.css';

const Wishlist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const { addToCart, removeFromWishlist, fetchCartCount, getGuestWishlistItems } = useCart();

  const fetchWishlist = async () => {
    try {
      if (isAuthenticated) {
        const res = await api.get('/wishlist');
        setItems(res.data.data.items);
      } else {
        const guestItems = getGuestWishlistItems();
        setItems(guestItems.map((item, i) => ({
          _id: i,
          product: item.product || { _id: item.productId, name: 'Product', price: 0 },
        })));
      }
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [isAuthenticated]);

  const handleRemove = async (productId) => {
    try {
      await removeFromWishlist(productId);
      await fetchWishlist();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to remove');
    }
  };

  const handleMoveToCart = async (productId, productData) => {
    try {
      if (isAuthenticated) {
        await api.post(`/wishlist/${productId}/move-to-cart`);
      } else {
        await addToCart(productId, 1, productData);
        await removeFromWishlist(productId);
      }
      await fetchCartCount();
      await fetchWishlist();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to move');
    }
  };

  const handleAddToCart = async (productId, productData) => {
    try {
      await addToCart(productId, 1, productData);
      await fetchCartCount();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to add');
    }
  };

  return (
    <div className="home">
      <Navbar />
      <main className="home-content">
        <div className="container">
          <h2 className="wishlist-title">Your Wishlist</h2>

          {loading ? (
            <p>Loading...</p>
          ) : items.length === 0 ? (
            <div className="cart-empty">
              <p>Your wishlist is empty.</p>
              <Link to="/" className="cart-shop-btn">Browse Products</Link>
            </div>
          ) : (
            <div className="wishlist-grid">
              {items.map((item) => (
                <div key={item._id} className="wishlist-card">
                  <div className="wishlist-card-image">
                    {item.product.image ? (
                      <img src={item.product.image} alt={item.product.name} />
                    ) : (
                      <div className="wishlist-card-placeholder" />
                    )}
                  </div>
                  <div className="wishlist-card-info">
                    <h3>{item.product.name}</h3>
                    <p className="wishlist-card-price">₹{item.product.price}</p>
                    <p className={`wishlist-card-stock ${item.product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                      {item.product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </p>
                  </div>
                  <div className="wishlist-card-actions">
                    <button
                      className="wishlist-move-btn"
                      onClick={() => handleMoveToCart(item.product._id, item.product)}
                      disabled={item.product.stock === 0}
                    >
                      Move to Cart
                    </button>
                    <button
                      className="wishlist-add-btn"
                      onClick={() => handleAddToCart(item.product._id, item.product)}
                      disabled={item.product.stock === 0}
                    >
                      Add to Cart
                    </button>
                    <button
                      className="wishlist-remove-btn"
                      onClick={() => handleRemove(item.product._id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Wishlist;
