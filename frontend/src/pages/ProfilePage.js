import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProfilePage.css';

const API_URL = 'http://localhost:5000/api';
const UPLOADS_URL = 'http://localhost:5000/uploads';

// Imię + pierwsza litera nazwiska z kropką
const displayName = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1].charAt(0)}.`;
};

const ProfilePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/profile/${username}`);
      if (!res.ok) throw new Error('Nie znaleziono profilu');
      const data = await res.json();
      setProfile(data);
      // Pobierz oceny po ID usera
      fetchRatings(data.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/ratings/user/${userId}`);
      const data = await res.json();
      setRatings(data);
    } catch (err) {
      console.error('Błąd pobierania ocen:', err);
    }
  };

  const getGenderLabel = (gender) => ({ male: 'Mężczyzna', female: 'Kobieta', other: 'Inna' }[gender] || '-');
  const getStatusLabel = (status) => ({ student: 'Student', worker: 'Pracownik', unemployed: 'Bezrobotny' }[status] || '-');

  const renderStars = (rating) => {
    const full = Math.round(rating || 0);
    return [1,2,3,4,5].map(i => <span key={i} className={`star ${i <= full ? 'filled' : ''}`}>★</span>);
  };

  if (loading) return <div className="profile-page"><div className="loading">Ładowanie profilu...</div></div>;

  if (error || !profile) {
    return (
      <div className="profile-page">
        <div className="error-container">
          <h2>😕 Nie znaleziono profilu</h2>
          <p>{error || 'Ten użytkownik nie istnieje.'}</p>
          <button onClick={() => navigate('/')}>Wróć do strony głównej</button>
        </div>
      </div>
    );
  }

  if (profile.role !== 'student') {
    return (
      <div className="profile-page">
        <div className="error-container">
          <h2>🔒 Profil niedostępny</h2>
          <p>Profile właścicieli nie są publiczne.</p>
          <button onClick={() => navigate('/')}>Wróć do strony głównej</button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.avatar ? (
              <img src={`${UPLOADS_URL}/${profile.avatar}`} alt={displayName(profile.name)} />
            ) : (
              <div className="avatar-placeholder">
                {profile.name?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h1>{displayName(profile.name)}</h1>
            <p className="profile-username">@{profile.username}</p>
            <div className="profile-badges">
              <span className={`profile-badge ${!profile.age ? 'empty' : ''}`}>
                🎂 {profile.age ? `${profile.age} lat` : 'Nie podano'}
              </span>
              <span className={`profile-badge ${!profile.gender ? 'empty' : ''}`}>
                {profile.gender === 'male' ? '👨' : profile.gender === 'female' ? '👩' : '👤'} {profile.gender ? getGenderLabel(profile.gender) : 'Nie podano'}
              </span>
              <span className={`profile-badge ${!profile.status ? 'empty' : ''}`}>
                💼 {profile.status ? getStatusLabel(profile.status) : 'Nie podano'}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-section ratings-section">
          <h2>📊 Średnia ocen</h2>
          {ratings && ratings.ratings_count > 0 ? (
            <div className="ratings-grid">
              <div className="rating-item">
                <span className="rating-label">🧹 Czystość</span>
                <div className="rating-stars">{renderStars(ratings.avg_cleanliness)}<span className="rating-value">{ratings.avg_cleanliness?.toFixed(1)}</span></div>
              </div>
              <div className="rating-item">
                <span className="rating-label">🤝 Bezkonfliktowość</span>
                <div className="rating-stars">{renderStars(ratings.avg_conflict_free)}<span className="rating-value">{ratings.avg_conflict_free?.toFixed(1)}</span></div>
              </div>
              <div className="rating-item">
                <span className="rating-label">💬 Relacyjność</span>
                <div className="rating-stars">{renderStars(ratings.avg_sociability)}<span className="rating-value">{ratings.avg_sociability?.toFixed(1)}</span></div>
              </div>
              <div className="ratings-count">Na podstawie <strong>{ratings.ratings_count}</strong> ocen</div>
            </div>
          ) : (
            <div className="no-ratings"><p>Ten użytkownik nie ma jeszcze żadnych ocen.</p></div>
          )}
        </div>

        {profile.bio && (
          <div className="profile-section bio-section">
            <h2>👋 O mnie</h2>
            <p className="bio-text">{profile.bio}</p>
          </div>
        )}

        <div className="profile-actions">
          <button className="back-btn" onClick={() => navigate(-1)}>← Wróć</button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
