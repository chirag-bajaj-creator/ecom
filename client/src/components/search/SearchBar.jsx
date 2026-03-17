import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import './SearchBar.css';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [trending, setTrending] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch recent + trending when dropdown opens with empty query
  const fetchDropdownData = async () => {
    try {
      const [trendingRes, recentRes] = await Promise.all([
        api.get('/search/trending'),
        isAuthenticated ? api.get('/search/recent') : Promise.resolve(null),
      ]);
      setTrending(trendingRes.data.data.trending);
      if (recentRes) setRecentSearches(recentRes.data.data.searches);
    } catch (err) {
      // silent fail
    }
  };

  // Debounced autocomplete
  useEffect(() => {
    if (query.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      try {
        const res = await api.get(`/products/suggestions?q=${encodeURIComponent(query)}&limit=10`, {
          signal: abortRef.current.signal,
        });
        setSuggestions(res.data.data.suggestions);
      } catch (err) {
        if (err.name !== 'CanceledError') setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleFocus = () => {
    setShowDropdown(true);
    if (query.trim().length === 0) fetchDropdownData();
  };

  const handleSearch = (searchQuery) => {
    const q = searchQuery || query;
    if (q.trim().length === 0) return;
    setShowDropdown(false);
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClearHistory = async () => {
    try {
      await api.delete('/search/recent');
      setRecentSearches([]);
    } catch (err) {
      // silent fail
    }
  };

  return (
    <div className="search-bar-wrapper" ref={wrapperRef}>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
        />
        <button className="search-btn" onClick={() => handleSearch()}>
          Search
        </button>
      </div>

      {showDropdown && (
        <div className="search-dropdown">
          {query.trim().length > 0 ? (
            <>
              {loading && <div className="search-dropdown-info">Searching...</div>}
              {!loading && suggestions.length === 0 && (
                <div className="search-dropdown-info">No suggestions found</div>
              )}
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  className="search-dropdown-item"
                  onClick={() => {
                    setQuery(s.name);
                    handleSearch(s.name);
                  }}
                >
                  {s.name}
                </div>
              ))}
            </>
          ) : (
            <>
              {isAuthenticated && recentSearches.length > 0 && (
                <div className="search-dropdown-section">
                  <div className="search-dropdown-header">
                    <span>Recent Searches</span>
                    <button onClick={handleClearHistory}>Clear</button>
                  </div>
                  {recentSearches.map((s, i) => (
                    <div
                      key={i}
                      className="search-dropdown-item"
                      onClick={() => {
                        setQuery(s.query);
                        handleSearch(s.query);
                      }}
                    >
                      {s.query}
                    </div>
                  ))}
                </div>
              )}
              {trending.length > 0 && (
                <div className="search-dropdown-section">
                  <div className="search-dropdown-header">
                    <span>Trending</span>
                  </div>
                  {trending.map((t, i) => (
                    <div
                      key={i}
                      className="search-dropdown-item trending-item"
                      onClick={() => {
                        setQuery(t.query);
                        handleSearch(t.query);
                      }}
                    >
                      <span className="trending-icon">╱╲╱</span>
                      {t.query}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
