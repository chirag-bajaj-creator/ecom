import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import './Cart.css';

const Cart = () => {
  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const {
    updateCartItem, removeFromCart, clearCart, fetchCartCount,
    addToWishlist, getGuestCartItems,
  } = useCart();
  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      if (isAuthenticated) {
        const res = await api.get('/cart');
        setCartData(res.data.data);
      } else {
        const guestItems = getGuestCartItems();
        let subtotal = 0;
        const items = guestItems.map((item, i) => {
          const itemTotal = (item.product?.price || 0) * item.quantity;
          subtotal += itemTotal;
          return {
            _id: i,
            product: item.product || { _id: item.productId, name: 'Product', price: 0 },
            quantity: item.quantity,
            itemTotal,
          };
        });
        const chargesRes = await api.get(`/checkout/charges?cartTotal=${subtotal}`);
        const c = chargesRes.data.data;
        setCartData({
          items,
          charges: { subtotal, deliveryCharge: c.deliveryCharge, surgeCharge: c.surgeCharge, handlingCharge: c.handlingCharge, grandTotal: c.grandTotal },
          itemCount: items.length,
        });
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  const handleQuantityChange = async (productId, newQty) => {
    try {
      await updateCartItem(productId, newQty);
      await fetchCart();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update');
    }
  };

  const handleRemove = async (productId) => {
    try {
      await removeFromCart(productId);
      await fetchCart();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to remove');
    }
  };

  const handleMoveToWishlist = async (productId, productData) => {
    try {
      await addToWishlist(productId, productData);
      await removeFromCart(productId);
      await fetchCart();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to move');
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      await fetchCart();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to clear');
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="home">
      <Navbar />
      <main className="home-content">
        <div className="container">
          <div className="cart-header">
            <h2>Your Cart</h2>
            {cartData?.items?.length > 0 && (
              <button className="cart-clear-btn" onClick={handleClearCart}>Clear Cart</button>
            )}
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : !cartData || cartData.items.length === 0 ? (
            <div className="cart-empty">
              <p>Your cart is empty.</p>
              <Link to="/" className="cart-shop-btn">Start Shopping</Link>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cartData.items.map((item) => (
                  <div key={item._id} className="cart-item">
                    <div className="cart-item-image">
                      {item.product.image ? (
                        <img src={item.product.image} alt={item.product.name} />
                      ) : (
                        <div className="cart-item-placeholder" />
                      )}
                    </div>
                    <div className="cart-item-details">
                      <h3>{item.product.name}</h3>
                      <p className="cart-item-desc">{item.product.description}</p>
                      <p className="cart-item-price">₹{item.product.price}</p>
                    </div>
                    <div className="cart-item-quantity">
                      <button
                        onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                        disabled={item.product.stock && item.quantity >= item.product.stock}
                      >
                        +
                      </button>
                    </div>
                    <div className="cart-item-total">
                      <p>₹{item.itemTotal}</p>
                    </div>
                    <div className="cart-item-actions">
                      <button
                        className="cart-wishlist-btn"
                        onClick={() => handleMoveToWishlist(item.product._id, item.product)}
                      >
                        Move to Wishlist
                      </button>
                      <button
                        className="cart-remove-btn"
                        onClick={() => handleRemove(item.product._id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <h3>Order Summary</h3>
                <div className="cart-summary-row">
                  <span>Subtotal</span>
                  <span>₹{cartData.charges.subtotal}</span>
                </div>
                <div className="cart-summary-row">
                  <span>Delivery Charge</span>
                  <span>{cartData.charges.deliveryCharge === 0 ? 'FREE' : `₹${cartData.charges.deliveryCharge}`}</span>
                </div>
                <div className="cart-summary-row">
                  <span>Surge Charge</span>
                  <span>₹{cartData.charges.surgeCharge}</span>
                </div>
                <div className="cart-summary-row">
                  <span>Handling Charge</span>
                  <span>₹{cartData.charges.handlingCharge}</span>
                </div>
                <div className="cart-summary-row cart-summary-total">
                  <span>Grand Total</span>
                  <span>₹{cartData.charges.grandTotal}</span>
                </div>
                <button className="cart-checkout-btn" onClick={handleCheckout}>
                  {isAuthenticated ? 'Proceed to Checkout' : 'Login to Checkout'}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
