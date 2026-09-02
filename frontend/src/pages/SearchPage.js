import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './SearchPage.css';

const API_URL = 'http://localhost:5000/api';
const UPLOADS_URL = 'http://localhost:5000/uploads';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const { user, token } = useAuth();
  
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  
  // Filtry podstawowe
  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    minPrice: '',
    maxPrice: '',
    minArea: '',
    maxArea: '',
    hasBalcony: false,
    petsAllowed: false,
    hasParking: false,
  });

  // Filtry lokatorów
  const [residentFilters, setResidentFilters] = useState({
    minAge: 18,
    maxAge: 99,
    genderMale: true,
    genderFemale: true,
    statusStudent: true,
    statusWorker: true,
    statusUnemployed: true,
  });

  useEffect(() => {
    const cityFromUrl = searchParams.get('city');
    if (cityFromUrl) {
      setFilters(prev => ({ ...prev, city: cityFromUrl }));
    }
  }, [searchParams]);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (user && token) {
      fetchFavorites();
    }
  }, [user, token]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Podstawowe filtry
      if (filters.city) params.append('city', filters.city);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.minArea) params.append('minArea', filters.minArea);
      if (filters.maxArea) params.append('maxArea', filters.maxArea);
      if (filters.hasBalcony) params.append('hasBalcony', 'true');
      if (filters.petsAllowed) params.append('petsAllowed', 'true');
      if (filters.hasParking) params.append('hasParking', 'true');

      // Filtry lokatorów - wiek
      if (residentFilters.minAge > 18) {
        params.append('residentMinAge', residentFilters.minAge);
      }
      if (residentFilters.maxAge < 99) {
        params.append('residentMaxAge', residentFilters.maxAge);
      }

      // Filtry lokatorów - płeć
      const genders = [];
      if (residentFilters.genderMale) genders.push('male');
      if (residentFilters.genderFemale) genders.push('female');
      if (genders.length > 0 && genders.length < 2) {
        params.append('residentGender', genders.join(','));
      }

      // Filtry lokatorów - status
      const statuses = [];
      if (residentFilters.statusStudent) statuses.push('student');
      if (residentFilters.statusWorker) statuses.push('worker');
      if (residentFilters.statusUnemployed) statuses.push('unemployed');
      if (statuses.length > 0 && statuses.length < 3) {
        params.append('residentStatus', statuses.join(','));
      }

      const res = await fetch(`${API_URL}/apartments?${params.toString()}`);
      const data = await res.json();
      setRooms(data);
    } catch (err) {
      console.error('Błąd wyszukiwania:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await fetch(`${API_URL}/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFavorites(new Set(data.map(f => f.id)));
      }
    } catch (err) {
      console.error('Błąd pobierania ulubionych:', err);
    }
  };

  const toggleFavorite = async (roomId) => {
    if (!user || !token) return;

    try {
      if (favorites.has(roomId)) {
        await fetch(`${API_URL}/favorites/${roomId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(roomId);
          return newSet;
        });
      } else {
        await fetch(`${API_URL}/favorites/${roomId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        setFavorites(prev => new Set([...prev, roomId]));
      }
    } catch (err) {
      console.error('Błąd:', err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleResidentFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setResidentFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : parseInt(value) || value,
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRooms();
  };

  const handleReset = () => {
    setFilters({
      city: '',
      minPrice: '',
      maxPrice: '',
      minArea: '',
      maxArea: '',
      hasBalcony: false,
      petsAllowed: false,
      hasParking: false,
    });
    setResidentFilters({
      minAge: 18,
      maxAge: 99,
      genderMale: true,
      genderFemale: true,
      statusStudent: true,
      statusWorker: true,
      statusUnemployed: true,
    });
  };

  return (
    <div className="search-page">
      <aside className="filters-sidebar">
        <h2>🔍 Filtry</h2>
        <form onSubmit={handleSearch}>
          {/* Miasto */}
          <div className="filter-group">
            <label>Miasto</label>
            <input
              type="text"
              name="city"
              placeholder="np. Warszawa"
              value={filters.city}
              onChange={handleFilterChange}
            />
          </div>

          {/* Cena */}
          <div className="filter-group">
            <label>Cena (PLN/mies.)</label>
            <div className="range-inputs">
              <input
                type="number"
                name="minPrice"
                placeholder="Od"
                value={filters.minPrice}
                onChange={handleFilterChange}
              />
              <span>-</span>
              <input
                type="number"
                name="maxPrice"
                placeholder="Do"
                value={filters.maxPrice}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          {/* Metraż */}
          <div className="filter-group">
            <label>Metraż (m²)</label>
            <div className="range-inputs">
              <input
                type="number"
                name="minArea"
                placeholder="Od"
                value={filters.minArea}
                onChange={handleFilterChange}
              />
              <span>-</span>
              <input
                type="number"
                name="maxArea"
                placeholder="Do"
                value={filters.maxArea}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          {/* Cechy pokoju */}
          <div className="filter-group">
            <label>Cechy pokoju</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="hasBalcony"
                  checked={filters.hasBalcony}
                  onChange={handleFilterChange}
                />
                🏠 Balkon
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="petsAllowed"
                  checked={filters.petsAllowed}
                  onChange={handleFilterChange}
                />
                🐾 Zwierzęta
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="hasParking"
                  checked={filters.hasParking}
                  onChange={handleFilterChange}
                />
                🚗 Parking
              </label>
            </div>
          </div>

          <div className="filter-divider">
            <span>Współlokatorzy</span>
          </div>

          {/* Wiek lokatorów - suwak */}
          <div className="filter-group">
            <label>Wiek lokatorów: {residentFilters.minAge} - {residentFilters.maxAge} lat</label>
            <div className="age-sliders">
              <div className="slider-row">
                <span>Od:</span>
                <input
                  type="range"
                  name="minAge"
                  min="18"
                  max="99"
                  value={residentFilters.minAge}
                  onChange={handleResidentFilterChange}
                />
                <span className="slider-value">{residentFilters.minAge}</span>
              </div>
              <div className="slider-row">
                <span>Do:</span>
                <input
                  type="range"
                  name="maxAge"
                  min="18"
                  max="99"
                  value={residentFilters.maxAge}
                  onChange={handleResidentFilterChange}
                />
                <span className="slider-value">{residentFilters.maxAge}</span>
              </div>
            </div>
          </div>

          {/* Płeć lokatorów - checkboxy */}
          <div className="filter-group">
            <label>Płeć lokatorów</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="genderMale"
                  checked={residentFilters.genderMale}
                  onChange={handleResidentFilterChange}
                />
                👨 Mężczyźni
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="genderFemale"
                  checked={residentFilters.genderFemale}
                  onChange={handleResidentFilterChange}
                />
                👩 Kobiety
              </label>
            </div>
          </div>

          {/* Status lokatorów - checkboxy */}
          <div className="filter-group">
            <label>Status lokatorów</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="statusStudent"
                  checked={residentFilters.statusStudent}
                  onChange={handleResidentFilterChange}
                />
                🎓 Studenci
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="statusWorker"
                  checked={residentFilters.statusWorker}
                  onChange={handleResidentFilterChange}
                />
                💼 Pracownicy
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="statusUnemployed"
                  checked={residentFilters.statusUnemployed}
                  onChange={handleResidentFilterChange}
                />
                🏠 Bezrobotni
              </label>
            </div>
          </div>

          <div className="filter-buttons">
            <button type="submit" className="search-btn">
              Szukaj
            </button>
            <button type="button" className="reset-btn" onClick={handleReset}>
              Wyczyść
            </button>
          </div>
        </form>
      </aside>

      <main className="search-results">
        <div className="results-header">
          <h2>
            {loading
              ? 'Szukam...'
              : filters.city 
                ? `${rooms.length} ofert w "${filters.city}"`
                : `Wszystkie oferty (${rooms.length})`
            }
          </h2>
        </div>

        {!loading && rooms.length === 0 ? (
          <div className="no-results">
            <p>😕 Nie znaleziono ofert spełniających kryteria</p>
            <button onClick={handleReset} className="reset-btn">
              Wyczyść filtry
            </button>
          </div>
        ) : (
          <div className="rooms-grid">
            {rooms.map((room) => (
              <div key={room.id} className="room-card-search">
                <Link to={`/room/${room.id}`} className="room-link">
                  <div className="room-image">
                    {room.image ? (
                      <img src={`${UPLOADS_URL}/${room.image}`} alt={room.title} />
                    ) : (
                      <div className="no-image">Brak zdjęcia</div>
                    )}
                    {room.is_rented && <span className="rented-tag">Wynajęte</span>}
                  </div>
                  <div className="room-info">
                    <h3>{room.title}</h3>
                    <p className="room-location">📍 {room.city}, {room.address}</p>
                    <div className="room-details">
                      {room.area && <span>{room.area} m²</span>}
                      {room.has_balcony ? <span>🏠 Balkon</span> : null}
                      {room.pets_allowed ? <span>🐾 Zwierzęta</span> : null}
                      {room.has_parking ? <span>🚗 Parking</span> : null}
                    </div>
                    <p className="room-price">{room.price} PLN<span>/mies.</span></p>
                  </div>
                </Link>
                {user?.role === 'student' && (
                  <button
                    className={`favorite-btn ${favorites.has(room.id) ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleFavorite(room.id);
                    }}
                    title={favorites.has(room.id) ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
                  >
                    {favorites.has(room.id) ? '❤️' : '🤍'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchPage;
