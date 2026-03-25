import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import './CategorySelect.css';

const PRESET_CATEGORIES = [
  'Electronics',
  'Clothing',
  'Home & Kitchen',
  'Books',
  'Beauty & Personal Care',
  'Sports & Outdoors',
  'Toys & Games',
  'Health & Wellness',
  'Automotive',
  'Grocery',
  'Footwear',
  'Jewelry',
  'Office Supplies',
  'Pet Supplies',
  'Baby Products',
  'Furniture',
  'Mobile Accessories',
  'Computers & Laptops',
  'Fashion Accessories',
  'Bags & Luggage'
];

const CategorySelect = ({ value, onChange, required = false }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value || '');
  const [dbCategories, setDbCategories] = useState([]);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories');
        const cats = data.data?.categories || data.categories || [];
        setDbCategories(cats.map(c => c.name));
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

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

  // Merge preset + DB categories, deduplicate (case-insensitive)
  const allCategories = [...new Set([
    ...PRESET_CATEGORIES,
    ...dbCategories
  ].map(c => c.trim()))].filter(Boolean);

  // Deduplicate case-insensitively but keep original casing
  const seen = new Set();
  const uniqueCategories = allCategories.filter(c => {
    const lower = c.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });

  const filtered = uniqueCategories.filter(c =>
    c.toLowerCase().includes(search.toLowerCase().trim())
  );

  const exactMatch = uniqueCategories.some(
    c => c.toLowerCase() === search.toLowerCase().trim()
  );

  const handleSelect = (cat) => {
    setSearch(cat);
    onChange(cat);
    setOpen(false);
  };

  const handleAddNew = () => {
    const trimmed = search.trim();
    if (!trimmed) return;
    setDbCategories(prev => [...prev, trimmed]);
    onChange(trimmed);
    setOpen(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    onChange(val);
    if (!open) setOpen(true);
  };

  return (
    <div className="category-select-wrapper" ref={wrapperRef}>
      <input
        ref={inputRef}
        type="text"
        className="category-select-input"
        value={search}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        placeholder="Search or type a category..."
        required={required}
        autoComplete="off"
      />
      {open && (
        <div className="category-select-dropdown">
          {filtered.length > 0 ? (
            filtered.map((cat, i) => (
              <div
                key={i}
                className={`category-select-option ${cat === value ? 'selected' : ''}`}
                onClick={() => handleSelect(cat)}
              >
                {highlightMatch(cat, search)}
              </div>
            ))
          ) : (
            <div className="category-select-empty">No matching categories</div>
          )}
          {search.trim() && !exactMatch && (
            <div className="category-select-option category-select-add" onClick={handleAddNew}>
              + Add "{search.trim()}"
            </div>
          )}
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

export default CategorySelect;
