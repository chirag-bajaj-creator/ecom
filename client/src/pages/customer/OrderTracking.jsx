import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import 'leaflet/dist/leaflet.css';
import './OrderTracking.css';

// Fix leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const deliveryIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const statusLabels = {
  assigned: 'Delivery Boy Assigned',
  picking_up: 'Picking Up Your Order',
  picked_up: 'Order Picked Up',
  on_the_way: 'On The Way',
  delivered: 'Delivered',
};

const statusColors = {
  assigned: '#2563eb',
  picking_up: '#f59e0b',
  picked_up: '#f97316',
  on_the_way: '#8b5cf6',
  delivered: '#16a34a',
};

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [trackingData, setTrackingData] = useState(null);
  const [deliveryBoy, setDeliveryBoy] = useState(null);
  const [orderInfo, setOrderInfo] = useState(null);
  const [deliveryLat, setDeliveryLat] = useState(null);
  const [deliveryLng, setDeliveryLng] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [eta, setEta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [delivered, setDelivered] = useState(false);

  const wsRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/orders/${orderId}/tracking` } });
      return;
    }
    fetchTracking();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, orderId]);

  const fetchTracking = async () => {
    try {
      const res = await api.get(`/orders/${orderId}/tracking`);
      const { order, tracking, deliveryBoy: db } = res.data.data;

      setOrderInfo(order);
      setTrackingData(tracking);
      setDeliveryBoy(db);

      if (tracking) {
        setDeliveryLat(tracking.currentLat);
        setDeliveryLng(tracking.currentLng);
        setCurrentStatus(tracking.status);
        setEta(tracking.estimatedArrival);

        if (tracking.status === 'delivered') {
          setDelivered(true);
        } else {
          connectWebSocket();
        }
      }
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const wsUrl = `${protocol}//${host}:5000/ws?token=${token}&type=tracking&orderId=${orderId}`;

    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'location_update') {
          setDeliveryLat(data.lat);
          setDeliveryLng(data.lng);
          if (data.status) setCurrentStatus(data.status);
        }

        if (data.type === 'status_update') {
          setCurrentStatus(data.status);
          if (data.lat) setDeliveryLat(data.lat);
          if (data.lng) setDeliveryLng(data.lng);

          if (data.status === 'delivered') {
            setDelivered(true);
            ws.close();
          }
        }
      } catch (err) {
        // silent
      }
    };

    ws.onclose = () => {
      console.log('Tracking WebSocket disconnected');
    };

    wsRef.current = ws;
  };

  // ETA countdown
  const getEtaText = () => {
    if (!eta) return '';
    const diff = new Date(eta) - new Date();
    if (diff <= 0) return 'Arriving now';
    const mins = Math.ceil(diff / 60000);
    return `${mins} min${mins > 1 ? 's' : ''} away`;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="ot-container">
          <div className="ot-loading">Loading tracking...</div>
        </div>
        <Footer />
      </>
    );
  }

  if (!trackingData) {
    return (
      <>
        <Navbar />
        <div className="ot-container">
          <div className="ot-no-tracking">
            <p>Tracking not available for this order yet.</p>
            <p>A delivery boy will be assigned shortly.</p>
            <Link to="/my-orders" className="ot-back-link">Back to My Orders</Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const mapCenter = deliveryLat && deliveryLng
    ? [deliveryLat, deliveryLng]
    : [28.6139, 77.209]; // Default: Delhi

  return (
    <>
      <Navbar />
      <div className="ot-container">
        <div className="ot-header">
          <Link to="/my-orders" className="ot-back-link">Back to Orders</Link>
          <h1 className="ot-title">Order Tracking</h1>
          <span className="ot-order-id">#{orderId.slice(-8).toUpperCase()}</span>
        </div>

        {/* Delivered Banner */}
        {delivered && (
          <div className="ot-delivered-banner">
            Order Delivered!
          </div>
        )}

        {/* Status Bar */}
        <div className="ot-status-bar">
          {['assigned', 'picking_up', 'picked_up', 'on_the_way', 'delivered'].map((s, i) => {
            const statusOrder = ['assigned', 'picking_up', 'picked_up', 'on_the_way', 'delivered'];
            const currentIdx = statusOrder.indexOf(currentStatus);
            const isActive = i <= currentIdx;

            return (
              <div key={s} className={`ot-status-step ${isActive ? 'active' : ''}`}>
                <div className="ot-step-dot" style={{ background: isActive ? statusColors[currentStatus] : '#d1d5db' }} />
                <span className="ot-step-label">{statusLabels[s]}</span>
              </div>
            );
          })}
        </div>

        {/* ETA */}
        {!delivered && eta && (
          <div className="ot-eta">
            <span className="ot-eta-label">Estimated Arrival:</span>
            <span className="ot-eta-value">{getEtaText()}</span>
          </div>
        )}

        {/* Delivery Boy Info */}
        {deliveryBoy && (
          <div className="ot-delivery-boy">
            <div className="ot-db-avatar">{deliveryBoy.name?.charAt(0)?.toUpperCase()}</div>
            <div className="ot-db-info">
              <p className="ot-db-name">{deliveryBoy.name}</p>
              <p className="ot-db-phone">{deliveryBoy.phone}</p>
            </div>
          </div>
        )}

        {/* Map */}
        {deliveryLat && deliveryLng && (
          <div className="ot-map-wrapper">
            <MapContainer
              center={mapCenter}
              zoom={14}
              className="ot-map"
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[deliveryLat, deliveryLng]} icon={deliveryIcon}>
                <Popup>
                  {deliveryBoy ? deliveryBoy.name : 'Delivery Boy'}
                  <br />
                  {statusLabels[currentStatus] || currentStatus}
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        )}

        {/* Delivery Address */}
        {orderInfo?.deliveryAddress && (
          <div className="ot-address-card">
            <h3>Delivering To</h3>
            <p><strong>{orderInfo.deliveryAddress.name}</strong></p>
            <p>{orderInfo.deliveryAddress.addressLine1}</p>
            {orderInfo.deliveryAddress.addressLine2 && <p>{orderInfo.deliveryAddress.addressLine2}</p>}
            <p>{orderInfo.deliveryAddress.city}, {orderInfo.deliveryAddress.state} - {orderInfo.deliveryAddress.pincode}</p>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default OrderTracking;
