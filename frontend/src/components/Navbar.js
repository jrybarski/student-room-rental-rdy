import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const API_URL = 'http://localhost:5000/api';

// Imię + pierwsza litera nazwiska
const displayName = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1].charAt(0)}.`;
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [popularCities, setPopularCities] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const searchRef = useRef(null);

  useEffect(() => {
    fetchPopularCities();
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.length > 0) searchCities(searchQuery);
    else setSearchResults([]);
  }, [searchQuery]);

  const fetchPopularCities = async () => {
    try {
      const res = await fetch(`${API_URL}/apartments/cities/popular`);
      if (res.ok) { const data = await res.json(); setPopularCities(data); }
    } catch (err) { console.error('Błąd pobierania miast:', err); }
  };

  const searchCities = async (query) => {
    try {
      const res = await fetch(`${API_URL}/apartments/cities/search?q=${encodeURIComponent(query)}`);
      if (res.ok) { const data = await res.json(); setSearchResults(data); }
    } catch (err) { console.error('Błąd wyszukiwania miast:', err); }
  };

  const handleLogout = () => { logout(); navigate('/'); };
  const handleSearchFocus = () => setShowDropdown(true);
  const handleCitySelect = (city) => { setSearchQuery(city); setShowDropdown(false); navigate(`/search?city=${encodeURIComponent(city)}`); };
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowDropdown(false);
    if (searchQuery.trim()) {
      navigate(`/search?city=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/search');
    }
  };

  const citiesToShow = searchQuery.length > 0 ? searchResults : popularCities;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">CoRoom</Link>

        <div className="navbar-search" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="search-form">
            <span className="search-icon">🏠</span>
            <input
              type="text"
              placeholder="Gdzie chciałbyś mieszkać?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleSearchFocus}
              className="search-input"
            />
            <button type="submit" className="search-submit">Szukaj</button>
          </form>

          {showDropdown && (
            <div className="search-dropdown">
              {searchQuery.length === 0 && popularCities.length > 0 && <div className="dropdown-header">Popularne miejsca</div>}
              {searchQuery.length > 0 && searchResults.length === 0 && <div className="dropdown-empty">Brak wyników dla "{searchQuery}"</div>}
              {citiesToShow.map((item, idx) => (
                <div key={idx} className="dropdown-item" onClick={() => handleCitySelect(item.city)}>
                  <span className="dropdown-icon">📍</span>
                  <div className="dropdown-text">
                    <span className="dropdown-city">{item.city}</span>
                    <span className="dropdown-count">{item.count} ogłoszeń</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="navbar-auth">
          {user ? (
            <div className="user-menu">
              <span className="user-name">Cześć, {displayName(user.name)}!</span>
              <Link to="/dashboard" className="dashboard-link">Panel</Link>
              <button onClick={handleLogout} className="logout-btn">Wyloguj</button>
            </div>
          ) : (
            <Link to="/login" className="auth-link">Zaloguj się</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
