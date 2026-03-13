import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

const CART_KEY = 'guest_cart';
const WISHLIST_KEY = 'guest_wishlist';

const getGuestCart = () => JSON.parse(localStorage.getItem(CART_KEY) || '[]');
const setGuestCart = (items) => localStorage.setItem(CART_KEY, JSON.stringify(items));

const getGuestWishlist = () => JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
const setGuestWishlist = (items) => localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const { isAuthenticated } = useAuth();

  // Sync guest cart/wishlist to DB on login
  useEffect(() => {
    if (isAuthenticated) {
      syncGuestDataToDB();
    }
    fetchCartCount();
  }, [isAuthenticated]);

  const syncGuestDataToDB = async () => {
    try {
      const guestCart = getGuestCart();
      for (const item of guestCart) {
        try {
          await api.post('/cart', { productId: item.productId, quantity: item.quantity });
        } catch (err) {
          // skip duplicates or errors
        }
      }
      localStorage.removeItem(CART_KEY);

      const guestWishlist = getGuestWishlist();
      for (const item of guestWishlist) {
        try {
          await api.post('/wishlist', { productId: item.productId });
        } catch (err) {
          // skip duplicates or errors
        }
      }
      localStorage.removeItem(WISHLIST_KEY);
    } catch (err) {
      // silent fail
    }
  };

  const fetchCartCount = async () => {
    if (isAuthenticated) {
      try {
        const res = await api.get('/cart');
        setCartCount(res.data.data.itemCount);
      } catch (err) {
        setCartCount(0);
      }
    } else {
      setCartCount(getGuestCart().length);
    }
  };

  const addToCart = async (productId, quantity = 1, productData = null) => {
    if (isAuthenticated) {
      const res = await api.post('/cart', { productId, quantity });
      await fetchCartCount();
      return res.data;
    } else {
      const cart = getGuestCart();
      const existing = cart.find((item) => item.productId === productId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        cart.push({ productId, quantity, product: productData });
      }
      setGuestCart(cart);
      setCartCount(cart.length);
    }
  };

  const updateCartItem = async (productId, quantity) => {
    if (isAuthenticated) {
      const res = await api.patch(`/cart/${productId}`, { quantity });
      await fetchCartCount();
      return res.data;
    } else {
      const cart = getGuestCart();
      const item = cart.find((i) => i.productId === productId);
      if (item) item.quantity = quantity;
      setGuestCart(cart);
    }
  };

  const removeFromCart = async (productId) => {
    if (isAuthenticated) {
      const res = await api.delete(`/cart/${productId}`);
      await fetchCartCount();
      return res.data;
    } else {
      const cart = getGuestCart().filter((i) => i.productId !== productId);
      setGuestCart(cart);
      setCartCount(cart.length);
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      const res = await api.delete('/cart');
      setCartCount(0);
      return res.data;
    } else {
      setGuestCart([]);
      setCartCount(0);
    }
  };

  // Wishlist helpers for guests
  const addToWishlist = async (productId, productData = null) => {
    if (isAuthenticated) {
      const res = await api.post('/wishlist', { productId });
      return res.data;
    } else {
      const wishlist = getGuestWishlist();
      const existing = wishlist.find((item) => item.productId === productId);
      if (!existing) {
        wishlist.push({ productId, product: productData });
        setGuestWishlist(wishlist);
      }
    }
  };

  const removeFromWishlist = async (productId) => {
    if (isAuthenticated) {
      const res = await api.delete(`/wishlist/${productId}`);
      return res.data;
    } else {
      const wishlist = getGuestWishlist().filter((i) => i.productId !== productId);
      setGuestWishlist(wishlist);
    }
  };

  const getGuestCartItems = () => getGuestCart();
  const getGuestWishlistItems = () => getGuestWishlist();

  const value = {
    cartCount,
    fetchCartCount,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    addToWishlist,
    removeFromWishlist,
    getGuestCartItems,
    getGuestWishlistItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
