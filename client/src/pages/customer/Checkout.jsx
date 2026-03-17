import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import PaymentGateway from '../../components/payment/PaymentGateway';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { fetchCartCount } = useCart();

  const [cartData, setCartData] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1=address, 2=payment, 3=confirm
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);

  // New address form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    name: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '',
  });
  const [addressError, setAddressError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    fetchData();
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      const [cartRes, addrRes] = await Promise.all([
        api.get('/cart'),
        api.get('/profile/addresses'),
      ]);
      setCartData(cartRes.data.data);
      setAddresses(addrRes.data.data.addresses);

      if (cartRes.data.data.itemCount === 0) {
        navigate('/add-to-cart');
        return;
      }

      // Auto-select default address
      const defaultAddr = addrRes.data.data.addresses.find((a) => a.isDefault);
      if (defaultAddr) setSelectedAddress(defaultAddr._id);
    } catch (err) {
      setError('Failed to load checkout data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setAddressError('');

    if (!/^\d{10}$/.test(addressForm.phone)) {
      setAddressError('Phone must be exactly 10 digits');
      return;
    }
    if (!/^\d{6}$/.test(addressForm.pincode)) {
      setAddressError('Pincode must be exactly 6 digits');
      return;
    }

    try {
      const res = await api.post('/profile/addresses', addressForm);
      setAddresses([...addresses, res.data.data.address]);
      setSelectedAddress(res.data.data.address._id);
      setShowAddressForm(false);
      setAddressForm({ name: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' });
    } catch (err) {
      setAddressError(err.response?.data?.error?.message || 'Failed to add address');
    }
  };

  const handleInitiatePayment = () => {
    if (!selectedAddress || !paymentMethod) return;
    setShowPaymentGateway(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentGateway(false);
    setPlacing(true);
    setError('');

    try {
      const orderRes = await api.post('/checkout', {
        addressId: selectedAddress,
        paymentMethod,
      });

      const order = orderRes.data.data.order;

      await api.post('/payments/process', {
        orderId: order._id,
        method: paymentMethod,
      });

      await fetchCartCount();
      navigate('/my-orders', { state: { newOrderId: order._id } });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="checkout-container">
          <div className="checkout-loading">Loading checkout...</div>
        </div>
        <Footer />
      </>
    );
  }

  const selectedAddr = addresses.find((a) => a._id === selectedAddress);

  return (
    <>
      <Navbar />
      <div className="checkout-container">
        <h1 className="checkout-title">Checkout</h1>

        {error && <div className="checkout-error">{error}</div>}

        {/* Steps indicator */}
        <div className="checkout-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Address</div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Payment</div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Confirm</div>
        </div>

        {/* Step 1: Address */}
        {step === 1 && (
          <div className="checkout-section">
            <h2>Select Delivery Address</h2>
            {addresses.length === 0 && !showAddressForm && (
              <p className="no-addresses">No saved addresses. Add one to continue.</p>
            )}

            <div className="address-list">
              {addresses.map((addr) => (
                <div
                  key={addr._id}
                  className={`address-card ${selectedAddress === addr._id ? 'selected' : ''}`}
                  onClick={() => setSelectedAddress(addr._id)}
                >
                  {addr.isDefault && <span className="default-badge">Default</span>}
                  <p className="addr-name">{addr.name}</p>
                  <p>{addr.addressLine1}</p>
                  {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                  <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                  <p>Phone: {addr.phone}</p>
                </div>
              ))}
            </div>

            <button className="btn-add-address" onClick={() => setShowAddressForm(!showAddressForm)}>
              {showAddressForm ? 'Cancel' : '+ Add New Address'}
            </button>

            {showAddressForm && (
              <form className="address-form" onSubmit={handleAddAddress}>
                {addressError && <div className="form-error">{addressError}</div>}
                <input type="text" placeholder="Recipient Name" value={addressForm.name} onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })} required />
                <input type="text" placeholder="Phone (10 digits)" value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} required />
                <input type="text" placeholder="Address Line 1" value={addressForm.addressLine1} onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })} required />
                <input type="text" placeholder="Address Line 2 (Optional)" value={addressForm.addressLine2} onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })} />
                <div className="form-row">
                  <input type="text" placeholder="City" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} required />
                  <input type="text" placeholder="State" value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} required />
                </div>
                <input type="text" placeholder="Pincode (6 digits)" value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} required />
                <button type="submit" className="btn-save-address">Save Address</button>
              </form>
            )}

            <button className="btn-next" onClick={() => setStep(2)} disabled={!selectedAddress}>
              Continue to Payment
            </button>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div className="checkout-section">
            <h2>Select Payment Method</h2>
            <div className="payment-methods">
              {[
                { key: 'upi', label: 'UPI', desc: 'Pay using UPI ID' },
                { key: 'credit-debit', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay' },
                { key: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive' },
              ].map((method) => (
                <div
                  key={method.key}
                  className={`payment-card ${paymentMethod === method.key ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod(method.key)}
                >
                  <span className="payment-label">{method.label}</span>
                  <span className="payment-desc">{method.desc}</span>
                </div>
              ))}
            </div>

            <div className="step-buttons">
              <button className="btn-back" onClick={() => setStep(1)}>Back</button>
              <button className="btn-next" onClick={() => setStep(3)} disabled={!paymentMethod}>
                Review Order
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="checkout-section">
            <h2>Review & Confirm</h2>

            <div className="review-block">
              <h3>Delivery Address</h3>
              {selectedAddr && (
                <div className="review-address">
                  <p><strong>{selectedAddr.name}</strong></p>
                  <p>{selectedAddr.addressLine1}</p>
                  {selectedAddr.addressLine2 && <p>{selectedAddr.addressLine2}</p>}
                  <p>{selectedAddr.city}, {selectedAddr.state} - {selectedAddr.pincode}</p>
                  <p>Phone: {selectedAddr.phone}</p>
                </div>
              )}
            </div>

            <div className="review-block">
              <h3>Payment Method</h3>
              <p className="review-payment">
                {paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'credit-debit' ? 'Credit / Debit Card' : 'Cash on Delivery'}
              </p>
            </div>

            <div className="review-block">
              <h3>Order Summary</h3>
              <div className="review-items">
                {cartData.items.map((item) => (
                  <div key={item._id} className="review-item">
                    <span>{item.product.name} x {item.quantity}</span>
                    <span>₹{item.itemTotal.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="review-charges">
                <div className="charge-row"><span>Subtotal</span><span>₹{cartData.charges.subtotal.toLocaleString()}</span></div>
                <div className="charge-row"><span>Delivery</span><span>{cartData.charges.deliveryCharge === 0 ? 'FREE' : `₹${cartData.charges.deliveryCharge}`}</span></div>
                <div className="charge-row"><span>Handling</span><span>₹{cartData.charges.handlingCharge}</span></div>
                {cartData.charges.surgeCharge > 0 && (
                  <div className="charge-row"><span>Surge</span><span>₹{cartData.charges.surgeCharge}</span></div>
                )}
                <div className="charge-row total"><span>Grand Total</span><span>₹{cartData.charges.grandTotal.toLocaleString()}</span></div>
              </div>
            </div>

            <div className="step-buttons">
              <button className="btn-back" onClick={() => setStep(2)}>Back</button>
              <button className="btn-place-order" onClick={handleInitiatePayment} disabled={placing}>
                {placing ? 'Placing Order...' : `Place Order — ₹${cartData.charges.grandTotal.toLocaleString()}`}
              </button>
            </div>
          </div>
        )}
      </div>

      {showPaymentGateway && (
        <PaymentGateway
          method={paymentMethod}
          amount={cartData.charges.grandTotal}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPaymentGateway(false)}
        />
      )}

      <Footer />
    </>
  );
};

export default Checkout;
