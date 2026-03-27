import { useState } from 'react';
import useBulkVoiceInput from '../../hooks/useBulkVoiceInput';

const BulkVoiceProductInput = ({ onConfirm, onCancel }) => {
  const {
    isListening, error, isSupported, startListening, stopListening,
    currentFieldIndex, currentField, fieldValues, setFieldValues,
    interimText, isDone, validationError,
    goToNextField, goToPrevField, validateAndBuild, resetAll, clearCurrentField,
    parseField, FIELD_ORDER, FIELD_LABELS,
  } = useBulkVoiceInput();

  const [products, setProducts] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);

  const handleFinish = () => {
    const built = validateAndBuild();
    if (built) {
      setProducts(built);
    }
  };

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

  const handleStartOver = () => {
    resetAll();
    setProducts([]);
    setExpandedIndex(null);
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

  // Review phase — after validation passes
  if (isDone && products.length > 0) {
    return (
      <div className="voice-input-container">
        <h4>{products.length} Product{products.length !== 1 ? 's' : ''} Found — Edit & Publish</h4>

        <div className="voice-product-list">
          {products.map((product, i) => (
            <div key={i} className="voice-product-card">
              <div className="voice-product-card-header">
                <strong onClick={() => setExpandedIndex(expandedIndex === i ? null : i)} style={{ cursor: 'pointer' }}>
                  #{i + 1} {product.name || '(no name)'} {expandedIndex === i ? '\u25B2' : '\u25BC'}
                </strong>
                <button type="button" className="detail-remove-btn" onClick={() => handleRemove(i)} style={{ fontSize: '12px', padding: '2px 8px' }}>
                  Remove
                </button>
              </div>

              {expandedIndex !== i && (
                <div className="voice-product-card-details">
                  {product.category && <span>Category: {product.category}</span>}
                  {product.price && <span>Price: {product.price}</span>}
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
                      <label>Price *</label>
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
          <button type="button" className="modal-cancel-btn" onClick={handleStartOver}>
            Start Over
          </button>
          <button type="button" className="modal-save-btn" onClick={handlePublishAll}>
            Confirm & Publish All ({products.filter(p => p.name || p.price).length})
          </button>
        </div>
      </div>
    );
  }

  // Speaking phase — field by field, comma-separated bulk input
  const currentParsed = parseField(fieldValues[currentField] || '');
  const isLastField = currentFieldIndex === FIELD_ORDER.length - 1;

  return (
    <div className="voice-input-container">
      {/* Instructions */}
      <div style={{ background: '#f0f4ff', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', lineHeight: '1.6' }}>
        <strong>Bulk Add — How it works:</strong><br />
        <b>Voice:</b> Say items with <b>"next"</b> between them. E.g. <i>"Shirt next Pants next Jacket"</i><br />
        <b>Paste/Type:</b> You can also paste or type comma-separated values directly in the text box.<br />
        All fields must have the <b>same number of items</b>.
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        {FIELD_ORDER.map((field, idx) => (
          <div
            key={field}
            style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              background: idx < currentFieldIndex ? '#4caf50' : idx === currentFieldIndex ? '#2196f3' : '#e0e0e0',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      {/* Current field label */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', fontWeight: 600 }}>
          Step {currentFieldIndex + 1} of {FIELD_ORDER.length}
        </div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#333' }}>
          Speak all {FIELD_LABELS[currentField]}
        </div>
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

      {/* Current field text area (editable) */}
      <div style={{ marginTop: '12px' }}>
        <textarea
          value={fieldValues[currentField] || ''}
          onChange={e => setFieldValues(prev => ({ ...prev, [currentField]: e.target.value }))}
          rows={3}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', resize: 'vertical' }}
          placeholder={`e.g. Item1, Item2, Item3`}
        />
        {interimText && isListening && (
          <div style={{ color: '#999', fontStyle: 'italic', fontSize: '13px', marginTop: '4px' }}>
            {interimText}
          </div>
        )}
      </div>

      {/* Parsed preview */}
      {currentParsed.length > 0 && (
        <div style={{ marginTop: '8px', fontSize: '13px', color: '#555' }}>
          Parsed <strong>{currentParsed.length}</strong> item{currentParsed.length !== 1 ? 's' : ''}:
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
            {currentParsed.map((item, i) => (
              <span key={i} style={{ background: '#e8f5e9', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                {i + 1}. {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary of all fields */}
      <div style={{ marginTop: '16px', background: '#fafafa', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#888', marginBottom: '8px' }}>All Fields Summary</div>
        {FIELD_ORDER.map((field, idx) => {
          const parsed = parseField(fieldValues[field] || '');
          const isActive = idx === currentFieldIndex;
          return (
            <div
              key={field}
              style={{
                padding: '6px 10px',
                marginBottom: '2px',
                borderRadius: '6px',
                background: isActive ? '#e3f2fd' : 'transparent',
                fontSize: '13px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ color: isActive ? '#1976d2' : '#666' }}>{FIELD_LABELS[field]}</span>
              <span style={{ color: parsed.length > 0 ? '#4caf50' : '#ccc', fontWeight: 600 }}>
                {parsed.length > 0 ? `${parsed.length} items` : '--'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Validation error */}
      {validationError && (
        <div style={{ marginTop: '12px', padding: '10px', background: '#ffebee', color: '#c62828', borderRadius: '8px', fontSize: '13px' }}>
          {validationError}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="modal-actions" style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="modal-cancel-btn" onClick={onCancel}>Cancel</button>
          <button type="button" className="modal-cancel-btn" onClick={() => clearCurrentField()}>Clear Field</button>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {currentFieldIndex > 0 && (
            <button type="button" className="modal-cancel-btn" onClick={goToPrevField}>Back</button>
          )}
          {!isLastField && (
            <button type="button" className="modal-save-btn" onClick={goToNextField}>
              Next Field
            </button>
          )}
          {isLastField && (
            <button type="button" className="modal-save-btn" onClick={handleFinish}>
              Validate & Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkVoiceProductInput;
