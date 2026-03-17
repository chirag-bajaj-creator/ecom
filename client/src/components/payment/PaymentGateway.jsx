import { useState, useEffect } from 'react';
import './PaymentGateway.css';

const PaymentGateway = ({ method, amount, onSuccess, onCancel }) => {
  const [stage, setStage] = useState('form'); // form, processing, otp, success
  const [cardForm, setCardForm] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [upiId, setUpiId] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [txnId, setTxnId] = useState('');

  const generateTxnId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = 'TXN';
    for (let i = 0; i < 12; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
  };

  const formatCardNumber = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  // Credit/Debit Card
  const handleCardSubmit = () => {
    setError('');
    const num = cardForm.number.replace(/\s/g, '');
    if (num.length < 13) { setError('Enter a valid card number'); return; }
    if (!cardForm.name.trim()) { setError('Enter cardholder name'); return; }
    if (cardForm.expiry.length < 5) { setError('Enter valid expiry (MM/YY)'); return; }
    if (cardForm.cvv.length < 3) { setError('Enter valid CVV'); return; }

    setStage('processing');
    setTimeout(() => {
      const id = generateTxnId();
      setTxnId(id);
      setStage('success');
    }, 2500);
  };

  // UPI
  const handleUpiSubmit = () => {
    setError('');
    if (!upiId.includes('@')) { setError('Enter a valid UPI ID (e.g. name@upi)'); return; }

    setStage('processing');
    setTimeout(() => setStage('otp'), 2000);
  };

  const handleOtpSubmit = () => {
    setError('');
    if (otp.length !== 6) { setError('Enter 6-digit OTP'); return; }

    setStage('processing');
    setTimeout(() => {
      const id = generateTxnId();
      setTxnId(id);
      setStage('success');
    }, 2500);
  };

  // COD
  const handleCodConfirm = () => {
    setStage('processing');
    setTimeout(() => {
      setStage('success');
    }, 1500);
  };

  // Auto-callback on success
  useEffect(() => {
    if (stage === 'success') {
      const timer = setTimeout(() => onSuccess(txnId || null), 2000);
      return () => clearTimeout(timer);
    }
  }, [stage, txnId, onSuccess]);

  return (
    <div className="pg-overlay" onClick={(e) => e.target === e.currentTarget && stage === 'form' && onCancel()}>
      <div className="pg-modal">
        {/* Header */}
        <div className="pg-header">
          <div className="pg-header-left">
            <span className="pg-logo">ChiragKart Pay</span>
            <span className="pg-secure">Secure Payment</span>
          </div>
          {stage === 'form' && (
            <button className="pg-close" onClick={onCancel}>&times;</button>
          )}
        </div>

        <div className="pg-amount-bar">
          Amount: <strong>&#8377;{amount.toLocaleString()}</strong>
        </div>

        {/* Processing */}
        {stage === 'processing' && (
          <div className="pg-processing">
            <div className="pg-spinner" />
            <p>Processing payment...</p>
            <p className="pg-processing-sub">Please do not close this window</p>
          </div>
        )}

        {/* Success */}
        {stage === 'success' && (
          <div className="pg-success">
            <div className="pg-checkmark">
              <svg viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="25" fill="none" stroke="#22c55e" strokeWidth="2" />
                <path fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M14 27l7 7 16-16" />
              </svg>
            </div>
            <h3>Payment Successful</h3>
            {txnId && <p className="pg-txn">Transaction ID: {txnId}</p>}
            <p className="pg-redirect">Redirecting to your orders...</p>
          </div>
        )}

        {/* Card Form */}
        {stage === 'form' && method === 'credit-debit' && (
          <div className="pg-form">
            <h3>Credit / Debit Card</h3>
            {error && <div className="pg-error">{error}</div>}
            <div className="pg-field">
              <label>Card Number</label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardForm.number}
                onChange={(e) => setCardForm({ ...cardForm, number: formatCardNumber(e.target.value) })}
                maxLength={19}
              />
            </div>
            <div className="pg-field">
              <label>Cardholder Name</label>
              <input
                type="text"
                placeholder="Name on card"
                value={cardForm.name}
                onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
              />
            </div>
            <div className="pg-row">
              <div className="pg-field">
                <label>Expiry</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={cardForm.expiry}
                  onChange={(e) => setCardForm({ ...cardForm, expiry: formatExpiry(e.target.value) })}
                  maxLength={5}
                />
              </div>
              <div className="pg-field">
                <label>CVV</label>
                <input
                  type="password"
                  placeholder="***"
                  value={cardForm.cvv}
                  onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  maxLength={4}
                />
              </div>
            </div>
            <button className="pg-pay-btn" onClick={handleCardSubmit}>
              Pay &#8377;{amount.toLocaleString()}
            </button>
            <div className="pg-card-icons">
              <span>Visa</span>
              <span>Mastercard</span>
              <span>RuPay</span>
            </div>
          </div>
        )}

        {/* UPI Form */}
        {stage === 'form' && method === 'upi' && (
          <div className="pg-form">
            <h3>Pay via UPI</h3>
            {error && <div className="pg-error">{error}</div>}
            <div className="pg-field">
              <label>UPI ID</label>
              <input
                type="text"
                placeholder="yourname@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
            </div>
            <button className="pg-pay-btn" onClick={handleUpiSubmit}>
              Verify &amp; Pay &#8377;{amount.toLocaleString()}
            </button>
            <div className="pg-upi-icons">
              <span>Google Pay</span>
              <span>PhonePe</span>
              <span>Paytm</span>
              <span>BHIM</span>
            </div>
          </div>
        )}

        {/* UPI OTP */}
        {stage === 'otp' && method === 'upi' && (
          <div className="pg-form">
            <h3>Enter UPI PIN</h3>
            <p className="pg-otp-info">Enter your 6-digit UPI PIN to authorize payment of &#8377;{amount.toLocaleString()}</p>
            {error && <div className="pg-error">{error}</div>}
            <div className="pg-otp-inputs">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <input
                  key={i}
                  type="password"
                  maxLength={1}
                  value={otp[i] || ''}
                  className="pg-otp-box"
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    const newOtp = otp.split('');
                    newOtp[i] = val;
                    setOtp(newOtp.join(''));
                    if (val && e.target.nextSibling) e.target.nextSibling.focus();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !otp[i] && e.target.previousSibling) {
                      e.target.previousSibling.focus();
                    }
                  }}
                />
              ))}
            </div>
            <button className="pg-pay-btn" onClick={handleOtpSubmit}>
              Confirm Payment
            </button>
          </div>
        )}

        {/* COD */}
        {stage === 'form' && method === 'cod' && (
          <div className="pg-form pg-cod">
            <div className="pg-cod-icon">&#128181;</div>
            <h3>Cash on Delivery</h3>
            <p className="pg-cod-info">
              Pay <strong>&#8377;{amount.toLocaleString()}</strong> in cash when your order is delivered to your doorstep.
            </p>
            <div className="pg-cod-note">
              <span>&#9432;</span> Please keep exact change ready for a smooth delivery experience.
            </div>
            <button className="pg-pay-btn pg-cod-btn" onClick={handleCodConfirm}>
              Confirm Order
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="pg-footer">
          <span>100% Secure Payment</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;
