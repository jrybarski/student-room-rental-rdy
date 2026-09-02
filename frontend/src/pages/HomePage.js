import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import RoomCard from '../components/RoomCard';
import './HomePage.css';

const API_URL = 'http://localhost:5000/api';

const HomePage = () => {
  const { user, token } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [images, setImages] = useState({});
  const [favorites, setFavorites] = useState(new Set());
  const [userCity, setUserCity] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    detectUserCity();
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [userCity]);

  useEffect(() => {
    if (user && token && user.role === 'student') {
      fetchFavorites();
    }
  }, [user, token]);

  const detectUserCity = () => {
    // Próba wykrycia lokalizacji przez Geolocation API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Użyj reverse geocoding (darmowe API)
            const { latitude, longitude } = position.coords;
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await res.json();
            const city = data.address?.city || data.address?.town || data.address?.village || '';
            setUserCity(city);
          } catch (err) {
            console.log('Nie udało się wykryć miasta');
            setUserCity('');
          }
        },
        () => {
          // Użytkownik nie zezwolił na lokalizację
          setUserCity('');
        }
      );
    }
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const params = userCity ? `?city=${encodeURIComponent(userCity)}` : '';
      const res = await fetch(`${API_URL}/apartments${params}`);
      const data = await res.json();
      setRooms(data);

      // Pobierz zdjęcia dla każdego pokoju
      data.forEach((room) => fetchRoomImages(room.id));
    } catch (err) {
      console.error('Błąd pobierania pokoi:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomImages = async (roomId) => {
    try {
      const res = await fetch(`${API_URL}/images/apartment/${roomId}`);
      if (res.ok) {
        const imgs = await res.json();
        setImages((prev) => ({ ...prev, [roomId]: imgs }));
      }
    } catch (err) {
      console.error('Błąd pobierania zdjęć:', err);
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

  const isNewRoom = (createdAt) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(createdAt) > weekAgo;
  };

  return (
    <div className="home-page">
      {/* Sekcja wyróżnionych ofert */}
      <section className="featured-section">
        <div className="section-header">
          <h2>
            {userCity ? `Oferty w ${userCity}` : 'Wyróżnione oferty'}
          </h2>
          {userCity && (
            <button 
              className="show-all-btn"
              onClick={() => setUserCity('')}
            >
              Pokaż wszystkie
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading">Ładowanie...</div>
        ) : rooms.length === 0 ? (
          <div className="no-results">
            <p>Brak ofert {userCity && `w mieście ${userCity}`}</p>
            {userCity && (
              <button 
                className="show-all-btn"
                onClick={() => setUserCity('')}
              >
                Pokaż wszystkie oferty
              </button>
            )}
          </div>
        ) : (
          <div className="rooms-grid">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                images={images[room.id]}
                isNew={isNewRoom(room.created_at)}
                isRented={room.is_rented}
                isFavorite={favorites.has(room.id)}
                onToggleFavorite={toggleFavorite}
                showFavorite={user?.role === 'student'}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
