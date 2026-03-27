import { useState } from 'react';
import useVoiceInput from '../../hooks/useVoiceInput';

const VoiceProductInput = ({ onConfirm, onCancel }) => {
  const {
    isListening, error, isSupported, startListening, stopListening, resetTranscript,
    products, setProducts, currentProductIndex, currentFieldIndex, currentField,
    interimText, isDone, FIELD_ORDER, FIELD_LABELS,
  } = useVoiceInput();

  const [expandedIndex, setExpandedIndex] = useState(null);

  const handleFieldChange = (index, field, value) => {
    setProducts(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const handleRemove = (index) => {
    setProducts(prev => prev.filter((_, i) => i !== index));
    if (expandedIndex === index) setExpandedIndex(null);
    else if (expandedIndex > index) setExpandedIndex(expandedIndex - 1);
  };

  const handlePublishAll = () => {
    const validProducts = products.filter(p => p.name || p.price);
    for (let i = 0; i < validProducts.length; i++) {
      if (!validProducts[i].name || !validProducts[i].price) {
        alert(`Product #${i + 1}: Name and price are required.`);
        setExpandedIndex(i);
        return;
      }
    }
    onConfirm(validProducts);
  };

  if (!isSupported) {
    return (
      <div className="voice-input-container">
        <div className="voice-error">
          Speech recognition is not supported in your browser. Please use Google Chrome.
        </div>
        <div className="modal-actions" style={{ marginTop: '16px' }}>
          <button type="button" className="modal-cancel-btn" onClick={onCancel}>Close</button>
        </div>
      </div>
    );
  }

  // Review & edit phase — after user says "done" or stops listening with products
  const hasProducts = products.some(p => p.name || p.price || p.category);
  if ((isDone || !isListening) && hasProducts && !isListening) {
    return (
      <div className="voice-input-container">
        <h4>{products.length} Product{products.length !== 1 ? 's' : ''} Found — Edit & Publish</h4>

        <div className="voice-product-list">
          {products.map((product, i) => (
            <div key={i} className="voice-product-card">
              <div className="voice-product-card-header">
                <strong onClick={() => setExpandedIndex(expandedIndex === i ? null : i)} style={{ cursor: 'pointer' }}>
                  #{i + 1} {product.name || '(no name)'} {expandedIndex === i ? '▲' : '▼'}
                </strong>
                <button type="button" className="detail-remove-btn" onClick={() => handleRemove(i)} style={{ fontSize: '12px', padding: '2px 8px' }}>
                  Remove
                </button>
              </div>

              {expandedIndex !== i && (
                <div className="voice-product-card-details">
                  {product.category && <span>Category: {product.category}</span>}
                  {product.price && <span>₹{Number(product.price).toLocaleString()}</span>}
                  {product.stock && <span>Stock: {product.stock}</span>}
                </div>
              )}

              {expandedIndex === i && (
                <div className="voice-card-edit">
                  <div className="modal-field">
                    <label>Product Name *</label>
                    <input type="text" value={product.name} onChange={e => handleFieldChange(i, 'name', e.target.value)} />
                  </div>
                  <div className="modal-field">
                    <label>Description</label>
                    <textarea value={product.description} onChange={e => handleFieldChange(i, 'description', e.target.value)} rows={2} />
                  </div>
                  <div className="modal-field">
                    <label>Category</label>
                    <input type="text" value={product.category} onChange={e => handleFieldChange(i, 'category', e.target.value)} />
                  </div>
                  <div className="modal-field">
                    <label>Subcategory</label>
                    <input type="text" value={product.subcategory} onChange={e => handleFieldChange(i, 'subcategory', e.target.value)} />
                  </div>
                  <div className="modal-row">
                    <div className="modal-field">
                      <label>Price (₹) *</label>
                      <input type="number" value={product.price} onChange={e => handleFieldChange(i, 'price', e.target.value)} min="0" />
                    </div>
                    <div className="modal-field">
                      <label>Stock</label>
                      <input type="number" value={product.stock} onChange={e => handleFieldChange(i, 'stock', e.target.value)} min="0" />
                    </div>
                  </div>
                  <div className="modal-field">
                    <label>Image URL</label>
                    <input type="text" value={product.image} onChange={e => handleFieldChange(i, 'image', e.target.value)} placeholder="Paste image URL here" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button type="button" className="modal-cancel-btn" onClick={resetTranscript}>
            Start Over
          </button>
          <button type="button" className="modal-save-btn" onClick={handlePublishAll}>
            Confirm & Publish All ({products.filter(p => p.name || p.price).length})
          </button>
        </div>
      </div>
    );
  }

  // Speaking phase — field-by-field live input
  return (
    <div className="voice-input-container">
      {/* Instructions */}
      <div style={{ background: '#f0f4ff', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', lineHeight: '1.6' }}>
        <strong>How to speak:</strong><br />
        Speak each field one by one in order. Say <b>"next"</b> to move to the next field.<br />
        Say <b>"next product"</b> to start a new product.<br />
        Say <b>"done"</b> when finished.
      </div>

      {/* Mic button */}
      <div className="voice-mic-section">
        <button
          type="button"
          className={`voice-mic-btn ${isListening ? 'listening' : ''}`}
          onClick={isListening ? stopListening : startListening}
        >
          {isListening ? 'Stop Listening' : 'Start Speaking'}
        </button>
        {isListening && <span className="voice-status">Listening...</span>}
      </div>

      {error && <div className="auth-error">{error}</div>}

      {/* Live field-by-field preview */}
      {isListening && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
            Product #{currentProductIndex + 1}
          </div>

          {/* Show fields as they fill */}
          <div style={{ background: '#fafafa', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px' }}>
            {FIELD_ORDER.map((field, idx) => {
              const product = products[currentProductIndex] || {};
              const value = product[field] || '';
              const isActive = idx === currentFieldIndex;
              const isFilled = idx < currentFieldIndex || value;

              return (
                <div
                  key={field}
                  style={{
                    padding: '8px 12px',
                    marginBottom: '4px',
                    borderRadius: '6px',
                    background: isActive ? '#e8f5e9' : isFilled ? '#fff' : '#f5f5f5',
                    border: isActive ? '2px solid #4caf50' : '1px solid transparent',
                    opacity: idx > currentFieldIndex && !value ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: 600 }}>
                    {FIELD_LABELS[field]}
                  </span>
                  {isActive && (
                    <span style={{ fontSize: '11px', color: '#4caf50', marginLeft: '8px', fontWeight: 600 }}>
                      ● Speaking...
                    </span>
                  )}
                  <div style={{ fontSize: '15px', color: '#333', marginTop: '2px', minHeight: '20px' }}>
                    {value}
                    {isActive && interimText && (
                      <span style={{ color: '#999', fontStyle: 'italic' }}>{value ? ' ' : ''}{interimText}</span>
                    )}
                    {!value && !isActive && <span style={{ color: '#ccc' }}>—</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Previously completed products */}
          {currentProductIndex > 0 && (
            <div style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
              {currentProductIndex} product{currentProductIndex > 1 ? 's' : ''} already recorded
            </div>
          )}
        </div>
      )}

      {/* Cancel */}
      <div className="modal-actions" style={{ marginTop: '16px' }}>
        <button type="button" className="modal-cancel-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default VoiceProductInput;
