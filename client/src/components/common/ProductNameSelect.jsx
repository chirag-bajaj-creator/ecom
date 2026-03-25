import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import './CategorySelect.css';

const ProductNameSelect = ({ value, onChange, required = false }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setSearch(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = (query) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/products/suggestions?q=${encodeURIComponent(query)}&limit=8`);
        const names = (data.data?.suggestions || []).map(s => s.name);
        setSuggestions(names);
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    onChange(val);
    fetchSuggestions(val);
    if (!open) setOpen(true);
  };

  const handleSelect = (name) => {
    setSearch(name);
    onChange(name);
    setOpen(false);
  };

  const filtered = suggestions.filter(s =>
    s.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div className="category-select-wrapper" ref={wrapperRef}>
      <input
        type="text"
        className="category-select-input"
        value={search}
        onChange={handleInputChange}
        onFocus={() => { if (search.trim()) setOpen(true); }}
        placeholder="Type product name..."
        required={required}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="category-select-dropdown">
          {loading && <div className="category-select-empty">Searching...</div>}
          {filtered.map((name, i) => (
            <div
              key={i}
              className={`category-select-option ${name === value ? 'selected' : ''}`}
              onClick={() => handleSelect(name)}
            >
              {highlightMatch(name, search)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function highlightMatch(text, query) {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase().trim());
  if (idx === -1) return text;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.trim().length);
  const after = text.slice(idx + query.trim().length);
  return (
    <>
      {before}<strong className="category-highlight">{match}</strong>{after}
    </>
  );
}

export default ProductNameSelect;
