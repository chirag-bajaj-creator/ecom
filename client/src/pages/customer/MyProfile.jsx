import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import './MyProfile.css';

const MyProfile = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Profile state
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', profilePicture: null, isVerified: false });
  const [profileEdit, setProfileEdit] = useState({ name: '', phone: '' });
  const [profileChanged, setProfileChanged] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Addresses state
  const [addresses, setAddresses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    name: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '',
  });
  const [addressMsg, setAddressMsg] = useState('');

  // Password state
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMsg, setPasswordMsg] = useState('');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/my-profile' } });
      return;
    }
    fetchAll();
  }, [isAuthenticated]);

  const fetchAll = async () => {
    try {
      const [profileRes, addrRes] = await Promise.all([
        api.get('/profile'),
        api.get('/profile/addresses'),
      ]);
      const p = profileRes.data.data.user;
      setProfile(p);
      setProfileEdit({ name: p.name, phone: p.phone || '' });
      setAddresses(addrRes.data.data.addresses);
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  // ===== PROFILE =====
  const handleProfileChange = (field, value) => {
    setProfileEdit({ ...profileEdit, [field]: value });
    setProfileChanged(true);
  };

  const handleProfileSave = async () => {
    setProfileMsg('');
    try {
      const res = await api.patch('/profile', profileEdit);
      setProfile(res.data.data.user);
      setProfileChanged(false);
      setProfileMsg('Profile updated successfully');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (err) {
      setProfileMsg(err.response?.data?.error?.message || 'Failed to update profile');
    }
  };

  const handlePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const res = await api.post('/profile/picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile(res.data.data.user);
      setProfileMsg('Profile picture updated');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (err) {
      setProfileMsg(err.response?.data?.error?.message || 'Failed to upload picture');
    }
  };

  // ===== ADDRESSES =====
  const resetAddressForm = () => {
    setAddressForm({ name: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' });
    setShowAddForm(false);
    setEditingId(null);
    setAddressMsg('');
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setAddressMsg('');

    if (!/^\d{10}$/.test(addressForm.phone)) {
      setAddressMsg('Phone must be exactly 10 digits');
      return;
    }
    if (!/^\d{6}$/.test(addressForm.pincode)) {
      setAddressMsg('Pincode must be exactly 6 digits');
      return;
    }

    try {
      if (editingId) {
        const res = await api.patch(`/profile/addresses/${editingId}`, addressForm);
        setAddresses(addresses.map((a) => (a._id === editingId ? res.data.data.address : a)));
      } else {
        const res = await api.post('/profile/addresses', addressForm);
        setAddresses([...addresses, res.data.data.address]);
      }
      resetAddressForm();
    } catch (err) {
      setAddressMsg(err.response?.data?.error?.message || 'Failed to save address');
    }
  };

  const handleEditAddress = (addr) => {
    setEditingId(addr._id);
    setAddressForm({
      name: addr.name,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    });
    setShowAddForm(true);
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await api.delete(`/profile/addresses/${id}`);
      setAddresses(addresses.filter((a) => a._id !== id));
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.patch(`/profile/addresses/${id}/default`);
      setAddresses(addresses.map((a) => ({ ...a, isDefault: a._id === id })));
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to set default');
    }
  };

  // ===== PASSWORD =====
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMsg('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg('Passwords do not match');
      return;
    }

    try {
      await api.post('/profile/change-password', passwordForm);
      setPasswordMsg('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordMsg(''), 3000);
    } catch (err) {
      setPasswordMsg(err.response?.data?.error?.message || 'Failed to change password');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="profile-container">
          <div className="profile-loading">Loading profile...</div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="profile-container">
        <h1 className="profile-title">My Profile</h1>

        {/* Profile Info */}
        <div className="profile-section">
          <div className="profile-header">
            <div className="profile-pic-wrapper">
              {profile.profilePicture ? (
                <img src={profile.profilePicture} alt="Profile" className="profile-pic" />
              ) : (
                <div className="profile-pic-placeholder">{profile.name?.charAt(0)?.toUpperCase()}</div>
              )}
              <label className="pic-upload-label">
                Change
                <input type="file" accept=".jpg,.jpeg,.png" onChange={handlePictureUpload} hidden />
              </label>
            </div>

            <div className="profile-fields">
              <div className="field-group">
                <label>Name</label>
                <input
                  type="text"
                  value={profileEdit.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                />
              </div>
              <div className="field-group">
                <label>Email {profile.isVerified && <span className="verified-badge">Verified</span>}</label>
                <input type="email" value={profile.email} disabled />
              </div>
              <div className="field-group">
                <label>Phone</label>
                <input
                  type="text"
                  value={profileEdit.phone}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
                />
              </div>
              <button
                className="btn-save-profile"
                onClick={handleProfileSave}
                disabled={!profileChanged}
              >
                Save Changes
              </button>
              {profileMsg && <p className={`msg ${profileMsg.includes('success') ? 'msg-success' : 'msg-error'}`}>{profileMsg}</p>}
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="profile-section">
          <h2>Manage Addresses</h2>

          <div className="address-cards">
            {addresses.map((addr) => (
              <div key={addr._id} className="addr-card">
                {addr.isDefault && <span className="addr-default">Default</span>}
                <p className="addr-name">{addr.name}</p>
                <p>{addr.addressLine1}</p>
                {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                <p>Phone: {addr.phone}</p>
                <div className="addr-actions">
                  <button onClick={() => handleEditAddress(addr)}>Edit</button>
                  <button onClick={() => handleDeleteAddress(addr._id)}>Delete</button>
                  {!addr.isDefault && (
                    <button onClick={() => handleSetDefault(addr._id)}>Set Default</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button className="btn-add-addr" onClick={() => { resetAddressForm(); setShowAddForm(true); }}>
            + Add New Address
          </button>

          {showAddForm && (
            <form className="addr-form" onSubmit={handleAddressSubmit}>
              <h3>{editingId ? 'Edit Address' : 'Add New Address'}</h3>
              {addressMsg && <p className="msg msg-error">{addressMsg}</p>}
              <input type="text" placeholder="Recipient Name" value={addressForm.name} onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })} required />
              <input type="text" placeholder="Phone (10 digits)" value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} required />
              <input type="text" placeholder="Address Line 1" value={addressForm.addressLine1} onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })} required />
              <input type="text" placeholder="Address Line 2 (Optional)" value={addressForm.addressLine2} onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })} />
              <div className="addr-form-row">
                <input type="text" placeholder="City" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} required />
                <input type="text" placeholder="State" value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} required />
              </div>
              <input type="text" placeholder="Pincode (6 digits)" value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} required />
              <div className="addr-form-buttons">
                <button type="submit" className="btn-submit">{editingId ? 'Update' : 'Save'}</button>
                <button type="button" className="btn-cancel-form" onClick={resetAddressForm}>Cancel</button>
              </div>
            </form>
          )}
        </div>

        {/* Change Password */}
        <div className="profile-section">
          <h2>Change Password</h2>
          <form className="password-form" onSubmit={handlePasswordChange}>
            <input type="password" placeholder="Current Password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required />
            <input type="password" placeholder="New Password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required />
            <input type="password" placeholder="Confirm New Password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required />
            <button type="submit" className="btn-change-pwd">Change Password</button>
            {passwordMsg && <p className={`msg ${passwordMsg.includes('success') ? 'msg-success' : 'msg-error'}`}>{passwordMsg}</p>}
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MyProfile;
