import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import './AddressBar.css';

const AddressBar = () => {
  const { isAuthenticated } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAddresses = async () => {
    try {
      const { data } = await api.get('/profile/addresses');
      const list = data.data.addresses || [];
      setAddresses(list);
      const def = list.find((a) => a.isDefault) || list[0] || null;
      setSelectedAddress(def);
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    }
  };

  const handleSelectAddress = async (addr) => {
    setSelectedAddress(addr);
    setDropdownOpen(false);
    if (!addr.isDefault) {
      try {
        await api.patch(`/profile/addresses/${addr._id}/default`);
        setAddresses((prev) =>
          prev.map((a) => ({ ...a, isDefault: a._id === addr._id }))
        );
      } catch (err) {
        console.error('Failed to set default:', err);
      }
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.name || !form.phone || !form.addressLine1 || !form.city || !form.state || !form.pincode) {
      setFormError('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.post('/profile/addresses', form);
      const newAddr = data.data.address;
      setAddresses((prev) => [newAddr, ...prev]);
      setSelectedAddress(newAddr);
      setShowNewForm(false);
      setForm({ name: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' });
    } catch (err) {
      setFormError(err.response?.data?.error?.message || 'Failed to add address');
    } finally {
      setSaving(false);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setFormError('Geolocation is not supported by your browser');
      return;
    }

    setDetecting(true);
    setFormError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const geo = await res.json();
          const addr = geo.address || {};

          setForm((prev) => ({
            ...prev,
            addressLine1: [addr.road, addr.neighbourhood, addr.suburb].filter(Boolean).join(', ') || prev.addressLine1,
            city: addr.city || addr.town || addr.village || addr.county || prev.city,
            state: addr.state || prev.state,
            pincode: addr.postcode || prev.pincode,
          }));
          setShowNewForm(true);
        } catch (err) {
          setFormError('Could not detect location. Please enter manually.');
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        setDetecting(false);
        if (err.code === 1) {
          setFormError('Location permission denied. Please allow location access.');
        } else {
          setFormError('Could not detect location. Please enter manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const displayAddress = selectedAddress
    ? `${selectedAddress.addressLine1}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}`
    : null;

  return (
    <div className="address-bar" ref={dropdownRef}>
      <div className="address-bar-inner" onClick={() => setDropdownOpen(!dropdownOpen)}>
        <span className="address-bar-icon">&#x1F4CD;</span>
        {isAuthenticated && displayAddress ? (
          <div className="address-bar-text">
            <span className="address-bar-label">Deliver to</span>
            <span className="address-bar-value">{displayAddress}</span>
          </div>
        ) : (
          <div className="address-bar-text">
            <span className="address-bar-label">Deliver to</span>
            <span className="address-bar-value">
              {isAuthenticated ? 'Select your address' : 'Login to add address'}
            </span>
          </div>
        )}
        <span className={`address-bar-arrow ${dropdownOpen ? 'open' : ''}`}>&#9662;</span>
      </div>

      {dropdownOpen && (
        <div className="address-dropdown">
          {!isAuthenticated ? (
            <div className="address-dropdown-login">
              <p>Sign in to see your saved addresses</p>
              <Link to="/login" className="address-login-btn" onClick={() => setDropdownOpen(false)}>
                Sign In
              </Link>
              <div className="address-divider" />
              <button className="address-detect-btn" onClick={handleDetectLocation} disabled={detecting}>
                {detecting ? 'Detecting...' : 'Detect My Location'}
              </button>
            </div>
          ) : (
            <>
              {addresses.length > 0 && !showNewForm && (
                <div className="address-list">
                  <div className="address-dropdown-title">Your Addresses</div>
                  {addresses.map((addr) => (
                    <div
                      key={addr._id}
                      className={`address-item ${selectedAddress?._id === addr._id ? 'selected' : ''}`}
                      onClick={() => handleSelectAddress(addr)}
                    >
                      <div className="address-item-name">{addr.name}</div>
                      <div className="address-item-detail">
                        {addr.addressLine1}, {addr.city}, {addr.state} - {addr.pincode}
                      </div>
                      {addr.isDefault && <span className="address-default-badge">Default</span>}
                    </div>
                  ))}
                </div>
              )}

              {!showNewForm ? (
                <div className="address-actions">
                  <button className="address-new-btn" onClick={() => setShowNewForm(true)}>
                    + Add New Address
                  </button>
                  <button className="address-detect-btn" onClick={handleDetectLocation} disabled={detecting}>
                    {detecting ? 'Detecting...' : 'Detect My Location'}
                  </button>
                </div>
              ) : (
                <form className="address-form" onSubmit={handleAddAddress}>
                  <div className="address-form-title">Add New Address</div>
                  {formError && <div className="address-form-error">{formError}</div>}
                  <div className="address-form-row">
                    <input
                      placeholder="Full Name *"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                    <input
                      placeholder="Phone (10 digits) *"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <input
                    placeholder="Address Line 1 *"
                    value={form.addressLine1}
                    onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                  />
                  <input
                    placeholder="Address Line 2"
                    value={form.addressLine2}
                    onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                  />
                  <div className="address-form-row">
                    <input
                      placeholder="City *"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                    <input
                      placeholder="State *"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                    />
                    <input
                      placeholder="Pincode *"
                      value={form.pincode}
                      onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    />
                  </div>
                  <div className="address-form-actions">
                    <button type="submit" className="address-save-btn" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Address'}
                    </button>
                    <button
                      type="button"
                      className="address-cancel-btn"
                      onClick={() => {
                        setShowNewForm(false);
                        setFormError('');
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="address-detect-btn"
                      onClick={handleDetectLocation}
                      disabled={detecting}
                    >
                      {detecting ? 'Detecting...' : 'Detect Location'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {formError && !showNewForm && isAuthenticated && (
            <div className="address-form-error" style={{ padding: '8px 16px' }}>{formError}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressBar;
