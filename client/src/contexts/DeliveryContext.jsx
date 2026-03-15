import { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const DeliveryContext = createContext(null);

export const useDelivery = () => {
  const context = useContext(DeliveryContext);
  if (!context) {
    throw new Error('useDelivery must be used within a DeliveryProvider');
  }
  return context;
};

export const DeliveryProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  const wsRef = useRef(null);
  const locationIntervalRef = useRef(null);

  const isDelivery = isAuthenticated && user?.role === 'delivery';

  // Fetch initial status on mount
  useEffect(() => {
    if (isDelivery) {
      fetchStatus();
    } else {
      setLoading(false);
    }

    return () => {
      disconnectWebSocket();
      stopLocationPolling();
    };
  }, [isDelivery]);

  // Manage WebSocket + GPS when online status changes
  useEffect(() => {
    if (isOnline && isDelivery) {
      connectWebSocket();
      startLocationPolling();
    } else {
      disconnectWebSocket();
      stopLocationPolling();
    }
  }, [isOnline, isDelivery]);

  const fetchStatus = async () => {
    try {
      const [statusRes, orderRes] = await Promise.all([
        api.get('/delivery/status'),
        api.get('/delivery/current-order'),
      ]);
      setIsOnline(statusRes.data.data.isOnline);
      setCurrentOrder(orderRes.data.data.order);
      setTracking(orderRes.data.data.tracking);
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const toggleOnlineStatus = async (online) => {
    try {
      const res = await api.patch('/delivery/status', { isOnline: online });
      setIsOnline(res.data.data.isOnline);
      if (!online) {
        setCurrentOrder(null);
        setTracking(null);
      }
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const fetchCurrentOrder = async () => {
    try {
      const res = await api.get('/delivery/current-order');
      setCurrentOrder(res.data.data.order);
      setTracking(res.data.data.tracking);
      return res.data.data;
    } catch (err) {
      throw err;
    }
  };

  const markPickedUp = async (orderId, photoFile) => {
    try {
      const formData = new FormData();
      formData.append('orderId', orderId);
      formData.append('photo', photoFile);
      const res = await api.post('/delivery/pickup', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchCurrentOrder();
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const markDelivered = async (orderId, photoFile) => {
    try {
      const formData = new FormData();
      formData.append('orderId', orderId);
      formData.append('photo', photoFile);
      const res = await api.post('/delivery/deliver', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCurrentOrder(null);
      setTracking(null);
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const fetchEarnings = async () => {
    try {
      const res = await api.get('/delivery/earnings');
      setEarnings(res.data.data);
      return res.data.data;
    } catch (err) {
      throw err;
    }
  };

  // ===== WebSocket =====
  const connectWebSocket = () => {
    disconnectWebSocket();

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const wsUrl = `${protocol}//${host}:5000/ws?token=${token}&type=delivery`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Delivery WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'order_assigned') {
          fetchCurrentOrder();
        }
      } catch (err) {
        // silent
      }
    };

    ws.onclose = () => {
      console.log('Delivery WebSocket disconnected');
    };

    ws.onerror = (err) => {
      console.error('Delivery WebSocket error:', err);
    };

    wsRef.current = ws;
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  // ===== GPS Location Polling =====
  const startLocationPolling = () => {
    stopLocationPolling();

    if (!navigator.geolocation) return;

    const sendLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            await api.post('/delivery/location', {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
          } catch (err) {
            // fire and forget
          }
        },
        (err) => {
          // GPS error — silent
        },
        { enableHighAccuracy: true, timeout: 4000 }
      );
    };

    // Send immediately, then every 5 seconds
    sendLocation();
    locationIntervalRef.current = setInterval(sendLocation, 5000);
  };

  const stopLocationPolling = () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  };

  const value = {
    isOnline,
    currentOrder,
    tracking,
    earnings,
    loading,
    toggleOnlineStatus,
    fetchCurrentOrder,
    markPickedUp,
    markDelivered,
    fetchEarnings,
  };

  return <DeliveryContext.Provider value={value}>{children}</DeliveryContext.Provider>;
};
