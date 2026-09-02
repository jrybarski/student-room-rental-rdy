import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './Dashboard.css';

// Imię + pierwsza litera nazwiska
const displayName = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1].charAt(0)}.`;
};

const API_URL = 'http://localhost:5000/api';
const UPLOADS_URL = 'http://localhost:5000/uploads';

const Dashboard = () => {
  const { user, token, updateUser } = useAuth();
  const [activeSection, setActiveSection] = useState('requests');
  const [menuOpen, setMenuOpen] = useState({
    requests: true,
    myApartment: true,
    profile: false,
    favorites: false,
    rooms: true,
    pending: false,
  });

  const [rooms, setRooms] = useState([]);
  const [images, setImages] = useState({});
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [formData, setFormData] = useState({
    title: '', address: '', city: '', price: '', area: '',
    has_balcony: false, pets_allowed: false, has_parking: false, description: '',
  });

  // Moje Mieszkanie
  const [myApartment, setMyApartment] = useState(null);
  const [myRoommates, setMyRoommates] = useState([]);
  const [isResident, setIsResident] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Modal oceny
  const [showRatingModal, setShowRatingModal] = useState(null);
  const [ratingForm, setRatingForm] = useState({
    cleanliness: 5, conflict_free: 5, sociability: 5, comment: '',
  });

  // Edycja profilu
  const [profileForm, setProfileForm] = useState({
    name: '', age: '', gender: '', status: '', bio: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Zmiana hasła
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false, newPassword: false, confirmPassword: false,
  });
  const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'owner') {
      fetchMyRooms();
      fetchPendingRequests();
      setActiveSection('rooms');
    } else if (user?.role === 'student') {
      fetchMyRequests();
      fetchMyApartment();
      fetchFavorites();
      setActiveSection('requests');
      setProfileForm({
        name: user.name || '', age: user.age || '',
        gender: user.gender || '', status: user.status || '', bio: user.bio || '',
      });
    }
  }, [user]);

  const toggleMenu = (section) => {
    setMenuOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // ============ FETCH ============
  const fetchMyApartment = async () => {
    try {
      const res = await fetch(`${API_URL}/residents/my-apartment`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyApartment(data.apartment);
        setMyRoommates(data.roommates);
        setIsResident(!!data.apartment);
      }
    } catch (err) {
      console.error('Błąd pobierania mieszkania:', err);
    }
  };

  const fetchMyRooms = async () => {
    try {
      const res = await fetch(`${API_URL}/apartments/my/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRooms(data);
      data.forEach((room) => fetchRoomImages(room.id));
    } catch (err) { console.error('Błąd pobierania pokoi:', err); }
  };

  const fetchRoomImages = async (roomId) => {
    try {
      const res = await fetch(`${API_URL}/images/apartment/${roomId}`);
      if (res.ok) {
        const imgs = await res.json();
        setImages((prev) => ({ ...prev, [roomId]: imgs }));
      }
    } catch (err) { console.error('Błąd pobierania zdjęć:', err); }
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/residence/my-pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRequests(data);
    } catch (err) { console.error('Błąd pobierania wniosków:', err); }
  };

  const fetchMyRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/residence/my-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMyRequests(data);
    } catch (err) { console.error('Błąd pobierania moich wniosków:', err); }
  };

  const fetchFavorites = async () => {
    try {
      const res = await fetch(`${API_URL}/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { const data = await res.json(); setFavorites(data); }
    } catch (err) { console.error('Błąd pobierania ulubionych:', err); }
  };

  const removeFavorite = async (apartmentId) => {
    try {
      const res = await fetch(`${API_URL}/favorites/${apartmentId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setFavorites(prev => prev.filter(f => f.id !== apartmentId));
        setMessage('Usunięto z ulubionych');
      }
    } catch (err) { console.error('Błąd usuwania z ulubionych:', err); }
  };

  // ============ OPUŚĆ MIESZKANIE ============
  const handleLeaveApartment = async () => {
    setLeaveLoading(true);
    try {
      const res = await fetch(`${API_URL}/residents/leave`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMyApartment(null);
        setMyRoommates([]);
        setIsResident(false);
        setShowLeaveConfirm(false);
        setMessage('Opuściłeś mieszkanie.');
        setActiveSection('requests');
      } else {
        setMessage(data.error || 'Błąd przy opuszczaniu mieszkania');
      }
    } catch (err) {
      setMessage('Błąd połączenia');
    } finally {
      setLeaveLoading(false);
    }
  };

  // ============ OCENY ============
  const handleRatingChange = (field, value) => {
    setRatingForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitRating = async (roommateId) => {
    if (!myApartment) return;
    try {
      const res = await fetch(`${API_URL}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to_user_id: roommateId, apartment_id: myApartment.id, ...ratingForm }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Ocena dodana!');
        setShowRatingModal(null);
        setRatingForm({ cleanliness: 5, conflict_free: 5, sociability: 5, comment: '' });
        fetchMyApartment();
      } else {
        setMessage(data.error || 'Błąd dodawania oceny');
      }
    } catch (err) { setMessage('Błąd połączenia'); }
  };

  // ============ POKOJE ============
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) { setMessage('Maksymalnie 5 zdjęć'); return; }
    setSelectedImages(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setMessage('');
    try {
      const res = await fetch(`${API_URL}/apartments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        const roomId = data.apartment.id;
        if (selectedImages.length > 0) {
          const imgForm = new FormData();
          selectedImages.forEach((file) => imgForm.append('images', file));
          await fetch(`${API_URL}/images/apartment/${roomId}`, {
            method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: imgForm,
          });
        }
        setMessage('Ogłoszenie dodane!');
        setFormData({ title: '', address: '', city: '', price: '', area: '', has_balcony: false, pets_allowed: false, has_parking: false, description: '' });
        setSelectedImages([]); setShowAddForm(false); fetchMyRooms();
      } else { setMessage(data.error || 'Błąd dodawania'); }
    } catch (err) { setMessage('Błąd połączenia'); }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Na pewno chcesz usunąć to ogłoszenie?')) return;
    try {
      const res = await fetch(`${API_URL}/apartments/${roomId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { setMessage('Ogłoszenie usunięte'); fetchMyRooms(); }
    } catch (err) { setMessage('Błąd usuwania'); }
  };

  const handleRespondRequest = async (requestId, action) => {
    try {
      const res = await fetch(`${API_URL}/residence/respond/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      if (res.ok) { setMessage(`Wniosek ${action === 'accept' ? 'zaakceptowany' : 'odrzucony'}`); fetchPendingRequests(); }
    } catch (err) { setMessage('Błąd'); }
  };

  // ============ PROFIL ============
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault(); setMessage('');
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profileForm),
      });
      if (!res.ok) { const data = await res.json(); setMessage(data.error || 'Błąd aktualizacji profilu'); return; }
      if (avatarFile) {
        const avatarForm = new FormData();
        avatarForm.append('avatar', avatarFile);
        const avatarRes = await fetch(`${API_URL}/auth/avatar`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: avatarForm,
        });
        if (!avatarRes.ok) { setMessage('Profil zaktualizowany, ale błąd przy zapisie zdjęcia'); return; }
      }
      const meRes = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (meRes.ok) { const userData = await meRes.json(); if (updateUser) updateUser(userData); }
      setMessage('Profil zaktualizowany!');
      setAvatarFile(null);
    } catch (err) { setMessage('Błąd połączenia'); }
  };

  // ============ ZMIANA HASŁA ============
  const getPasswordStrength = (password) => {
    if (!password) return null;
    if (password.length < 6) return { label: 'Za krótkie', color: '#e74c3c', width: '20%' };
    if (password.length < 8) return { label: 'Słabe', color: '#e67e22', width: '40%' };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return { label: 'Średnie', color: '#f1c40f', width: '65%' };
    return { label: 'Silne', color: '#2ecc71', width: '100%' };
  };

  const handlePasswordFormChange = (e) => {
    setPasswordForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPasswordStatus({ type: '', message: '' });
  };

  const togglePasswordShow = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword)
      return setPasswordStatus({ type: 'error', message: 'Nowe hasła nie są identyczne.' });
    setPasswordLoading(true); setPasswordStatus({ type: '', message: '' });
    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(passwordForm),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordStatus({ type: 'success', message: '✅ Hasło zostało zmienione pomyślnie!' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordStatus({ type: 'error', message: data.error || 'Coś poszło nie tak.' });
      }
    } catch (err) {
      setPasswordStatus({ type: 'error', message: 'Błąd połączenia z serwerem.' });
    } finally { setPasswordLoading(false); }
  };

  const passwordStrength = getPasswordStrength(passwordForm.newPassword);

  if (!user) {
    return <div className="dashboard"><div className="dashboard-container"><p>Musisz być zalogowany.</p></div></div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-layout">

        {/* SIDEBAR */}
        <aside className="dashboard-sidebar">
          <div className="sidebar-header">
            <div className="user-avatar-small">
              {user.avatar ? <img src={`${UPLOADS_URL}/${user.avatar}`} alt={user.name} /> : <span>{user.name?.charAt(0).toUpperCase() || '?'}</span>}
            </div>
            <div className="user-info-small">
              <h3>{user.name}</h3>
              <span className="user-role">{user.role === 'student' ? 'Student' : 'Właściciel'}</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            {user.role === 'student' && (
              <>
                <div className="nav-section">
                  <button className={`nav-section-header ${menuOpen.requests ? 'open' : ''}`} onClick={() => toggleMenu('requests')}>
                    <span>📋 Wnioski o zamieszkanie</span>
                    <span className="arrow">{menuOpen.requests ? '▼' : '▶'}</span>
                  </button>
                  {menuOpen.requests && (
                    <div className="nav-section-content">
                      <button className={`nav-item ${activeSection === 'requests' ? 'active' : ''}`} onClick={() => setActiveSection('requests')}>
                        Moje wnioski ({myRequests.length})
                      </button>
                    </div>
                  )}
                </div>

                <div className="nav-section">
                  <button className={`nav-section-header ${menuOpen.myApartment ? 'open' : ''}`} onClick={() => toggleMenu('myApartment')}>
                    <span>🏠 Moje Mieszkanie</span>
                    {isResident && <span className="resident-dot" />}
                    <span className="arrow">{menuOpen.myApartment ? '▼' : '▶'}</span>
                  </button>
                  {menuOpen.myApartment && (
                    <div className="nav-section-content">
                      <button className={`nav-item ${activeSection === 'myApartment' ? 'active' : ''}`} onClick={() => setActiveSection('myApartment')}>
                        {isResident ? myApartment?.city || 'Moje mieszkanie' : 'Brak mieszkania'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="nav-section">
                  <button className={`nav-section-header ${menuOpen.favorites ? 'open' : ''}`} onClick={() => toggleMenu('favorites')}>
                    <span>❤️ Ulubione</span>
                    <span className="arrow">{menuOpen.favorites ? '▼' : '▶'}</span>
                  </button>
                  {menuOpen.favorites && (
                    <div className="nav-section-content">
                      <button className={`nav-item ${activeSection === 'favorites' ? 'active' : ''}`} onClick={() => setActiveSection('favorites')}>
                        Zapisane pokoje ({favorites.length})
                      </button>
                    </div>
                  )}
                </div>

                <div className="nav-section">
                  <button className={`nav-section-header ${menuOpen.profile ? 'open' : ''}`} onClick={() => toggleMenu('profile')}>
                    <span>👤 Mój profil</span>
                    <span className="arrow">{menuOpen.profile ? '▼' : '▶'}</span>
                  </button>
                  {menuOpen.profile && (
                    <div className="nav-section-content">
                      <button className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`} onClick={() => setActiveSection('profile')}>Edytuj profil</button>
                      <button className={`nav-item ${activeSection === 'changePassword' ? 'active' : ''}`} onClick={() => setActiveSection('changePassword')}>🔐 Zmień hasło</button>
                      <Link to={`/profile/${user.username}`} className="nav-item">Zobacz swój profil →</Link>
                    </div>
                  )}
                </div>
              </>
            )}

            {user.role === 'owner' && (
              <>
                <div className="nav-section">
                  <button className={`nav-section-header ${menuOpen.rooms ? 'open' : ''}`} onClick={() => toggleMenu('rooms')}>
                    <span>🏠 Moje ogłoszenia</span>
                    <span className="arrow">{menuOpen.rooms ? '▼' : '▶'}</span>
                  </button>
                  {menuOpen.rooms && (
                    <div className="nav-section-content">
                      <button className={`nav-item ${activeSection === 'rooms' ? 'active' : ''}`} onClick={() => setActiveSection('rooms')}>Lista ogłoszeń ({rooms.length})</button>
                    </div>
                  )}
                </div>
                <div className="nav-section">
                  <button className={`nav-section-header ${menuOpen.pending ? 'open' : ''}`} onClick={() => toggleMenu('pending')}>
                    <span>📬 Wnioski do rozpatrzenia</span>
                    <span className="arrow">{menuOpen.pending ? '▼' : '▶'}</span>
                  </button>
                  {menuOpen.pending && (
                    <div className="nav-section-content">
                      <button className={`nav-item ${activeSection === 'pending' ? 'active' : ''}`} onClick={() => setActiveSection('pending')}>Oczekujące ({requests.length})</button>
                    </div>
                  )}
                </div>
                <div className="nav-section">
                  <button className={`nav-section-header ${activeSection === 'changePassword' ? 'open' : ''}`} onClick={() => setActiveSection('changePassword')}>
                    <span>🔐 Zmień hasło</span>
                  </button>
                </div>
              </>
            )}
          </nav>
        </aside>

        {/* MAIN */}
        <main className="dashboard-main">
          {message && <div className="message-banner">{message}</div>}

          {/* MOJE WNIOSKI */}
          {user.role === 'student' && activeSection === 'requests' && (
            <section className="content-section">
              <h2>📋 Moje wnioski o zamieszkanie</h2>
              {isResident && (
                <div className="resident-info-banner">
                  🏠 Jesteś aktualnie mieszkańcem. Nie możesz wysyłać nowych wniosków dopóki nie opuścisz obecnego mieszkania.
                </div>
              )}
              {myRequests.length === 0 ? (
                <div className="empty-state">
                  <p>Nie wysłałeś jeszcze żadnych wniosków</p>
                  <Link to="/search" className="cta-btn">Przeglądaj oferty →</Link>
                </div>
              ) : (
                <div className="requests-list">
                  {myRequests.map((req) => (
                    <div key={req.id} className="request-card">
                      <div className="request-info">
                        <h3>{req.title}</h3>
                        <p>{req.city}, {req.address}</p>
                      </div>
                      <span className={`status-badge status-${req.status}`}>
                        {req.status === 'pending' && '⏳ Oczekuje'}
                        {req.status === 'accepted' && '✅ Zaakceptowany'}
                        {req.status === 'rejected' && '❌ Odrzucony'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* MOJE MIESZKANIE */}
          {user.role === 'student' && activeSection === 'myApartment' && (
            <section className="content-section">
              <h2>🏠 Moje Mieszkanie</h2>
              {!isResident ? (
                <div className="empty-state">
                  <p>Nie jesteś obecnie mieszkańcem żadnego mieszkania.</p>
                  <Link to="/search" className="cta-btn">Znajdź pokój →</Link>
                </div>
              ) : (
                <>
                  {/* Karta mieszkania */}
                  <div className="my-apartment-card">
                    <div className="apartment-card-info">
                      <h3>{myApartment.title}</h3>
                      <p className="apartment-card-location">📍 {myApartment.city}, {myApartment.address}</p>
                      <div className="apartment-card-meta">
                        <span>💰 {myApartment.price} PLN/mies.</span>
                        {myApartment.area && <span>📐 {myApartment.area} m²</span>}
                        {!!myApartment.has_balcony && <span>🌿 Balkon</span>}
                        {!!myApartment.pets_allowed && <span>🐾 Zwierzęta</span>}
                        {!!myApartment.has_parking && <span>🚗 Parking</span>}
                      </div>
                    </div>
                    <button className="leave-apartment-btn" onClick={() => setShowLeaveConfirm(true)}>
                      🚪 Opuść mieszkanie
                    </button>
                  </div>

                  {showLeaveConfirm && (
                    <div className="leave-confirm-box">
                      <p>⚠️ Czy na pewno chcesz opuścić to mieszkanie? Tej akcji nie można cofnąć.</p>
                      <div className="leave-confirm-actions">
                        <button className="leave-confirm-yes" onClick={handleLeaveApartment} disabled={leaveLoading}>
                          {leaveLoading ? 'Opuszczanie...' : 'Tak, opuść'}
                        </button>
                        <button className="leave-confirm-no" onClick={() => setShowLeaveConfirm(false)}>Anuluj</button>
                      </div>
                    </div>
                  )}

                  {/* Współlokatorzy */}
                  <div className="roommates-section">
                    <h3>
                      👥 Współlokatorzy
                      {myRoommates.length > 0 && <span className="roommates-count">{myRoommates.length}</span>}
                    </h3>
                    {myRoommates.length === 0 ? (
                      <div className="no-roommates"><p>Jesteś jedynym mieszkańcem tego lokalu.</p></div>
                    ) : (
                      <div className="roommates-tiles">
                        {myRoommates.map((roommate) => (
                          <div key={roommate.id} className="roommate-tile">
                            <Link to={`/profile/${roommate.username}`} className="roommate-tile-link">
                              <div className="roommate-tile-avatar">
                                {roommate.avatar ? (
                                  <img src={`${UPLOADS_URL}/${roommate.avatar}`} alt={roommate.name} />
                                ) : (
                                  <div className="roommate-tile-placeholder">
                                    {roommate.name?.charAt(0).toUpperCase() || '?'}
                                  </div>
                                )}
                              </div>
                              <p className="roommate-tile-name">{roommate.name}</p>
                            </Link>
                            {roommate.already_rated ? (
                              <span className="roommate-rated-badge">✓ Oceniono</span>
                            ) : (
                              <button className="roommate-rate-btn" onClick={() => setShowRatingModal(roommate)}>⭐ Oceń</button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
          )}

          {/* ULUBIONE */}
          {user.role === 'student' && activeSection === 'favorites' && (
            <section className="content-section">
              <h2>❤️ Ulubione pokoje</h2>
              {favorites.length === 0 ? (
                <div className="empty-state">
                  <p>Nie masz jeszcze ulubionych pokoi</p>
                  <Link to="/search" className="cta-btn">Przeglądaj oferty →</Link>
                </div>
              ) : (
                <div className="favorites-grid">
                  {favorites.map((room) => (
                    <div key={room.id} className="favorite-card">
                      <Link to={`/room/${room.id}`} className="favorite-link">
                        <div className="favorite-image">
                          {room.image ? <img src={`${UPLOADS_URL}/${room.image}`} alt={room.title} /> : <div className="no-image">Brak zdjęcia</div>}
                        </div>
                        <div className="favorite-info">
                          <h3>{room.title}</h3>
                          <p className="favorite-location">📍 {room.city}</p>
                          <p className="favorite-price">{room.price} PLN/mies.</p>
                        </div>
                      </Link>
                      <button className="remove-favorite-btn" onClick={() => removeFavorite(room.id)} title="Usuń z ulubionych">🗑️</button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* EDYCJA PROFILU */}
          {user.role === 'student' && activeSection === 'profile' && (
            <section className="content-section">
              <h2>👤 Edytuj swój profil</h2>
              <form className="profile-edit-form" onSubmit={handleProfileSubmit}>
                <div className="avatar-edit">
                  <div className="current-avatar">
                    {avatarPreview ? <img src={avatarPreview} alt="Preview" /> : user.avatar ? <img src={`${UPLOADS_URL}/${user.avatar}`} alt={user.name} /> : <div className="avatar-placeholder-large">{user.name?.charAt(0).toUpperCase() || '?'}</div>}
                  </div>
                  <div className="avatar-upload">
                    <label htmlFor="avatar-input" className="upload-btn">📷 Zmień zdjęcie</label>
                    <input id="avatar-input" type="file" accept="image/*" onChange={handleAvatarSelect} style={{ display: 'none' }} />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group"><label>Imię i nazwisko</label><input type="text" name="name" value={profileForm.name} onChange={handleProfileChange} /></div>
                  <div className="form-row-2">
                    <div className="form-group"><label>Wiek</label><input type="number" name="age" value={profileForm.age} onChange={handleProfileChange} min="16" max="99" /></div>
                    <div className="form-group">
                      <label>Płeć</label>
                      <select name="gender" value={profileForm.gender} onChange={handleProfileChange}>
                        <option value="">Wybierz...</option>
                        <option value="male">Mężczyzna</option>
                        <option value="female">Kobieta</option>
                        <option value="other">Inna</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select name="status" value={profileForm.status} onChange={handleProfileChange}>
                      <option value="">Wybierz...</option>
                      <option value="student">Student</option>
                      <option value="worker">Pracownik</option>
                      <option value="unemployed">Bezrobotny</option>
                    </select>
                  </div>
                  <div className="form-group full-width"><label>O mnie</label><textarea name="bio" value={profileForm.bio} onChange={handleProfileChange} rows="4" placeholder="Napisz kilka słów o sobie..." /></div>
                </div>
                <button type="submit" className="save-profile-btn">💾 Zapisz zmiany</button>
              </form>
            </section>
          )}

          {/* ZMIANA HASŁA */}
          {activeSection === 'changePassword' && (
            <section className="content-section">
              <h2>🔐 Zmiana hasła</h2>
              <p className="section-desc">Wprowadź obecne hasło, a następnie ustaw nowe.</p>
              <div className="change-password-card">
                {passwordStatus.message && (
                  <div className={`password-alert password-alert-${passwordStatus.type}`}>{passwordStatus.message}</div>
                )}
                <form className="change-password-form" onSubmit={handlePasswordSubmit}>
                  <div className="form-group">
                    <label>Obecne hasło</label>
                    <div className="password-input-wrapper">
                      <input type={showPasswords.currentPassword ? 'text' : 'password'} name="currentPassword" value={passwordForm.currentPassword} onChange={handlePasswordFormChange} placeholder="Wpisz obecne hasło" required />
                      <button type="button" className="password-toggle-btn" onClick={() => togglePasswordShow('currentPassword')}>{showPasswords.currentPassword ? '🙈' : '👁️'}</button>
                    </div>
                  </div>
                  <div className="password-divider" />
                  <div className="form-group">
                    <label>Nowe hasło</label>
                    <div className="password-input-wrapper">
                      <input type={showPasswords.newPassword ? 'text' : 'password'} name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordFormChange} placeholder="Minimum 6 znaków" required />
                      <button type="button" className="password-toggle-btn" onClick={() => togglePasswordShow('newPassword')}>{showPasswords.newPassword ? '🙈' : '👁️'}</button>
                    </div>
                    {passwordStrength && (
                      <div className="password-strength-bar">
                        <div className="strength-track"><div className="strength-fill" style={{ width: passwordStrength.width, background: passwordStrength.color }} /></div>
                        <span className="strength-label" style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Powtórz nowe hasło</label>
                    <div className="password-input-wrapper">
                      <input type={showPasswords.confirmPassword ? 'text' : 'password'} name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordFormChange} placeholder="Wpisz nowe hasło ponownie" required />
                      <button type="button" className="password-toggle-btn" onClick={() => togglePasswordShow('confirmPassword')}>{showPasswords.confirmPassword ? '🙈' : '👁️'}</button>
                    </div>
                    {passwordForm.confirmPassword && (
                      <p className={`password-match-hint ${passwordForm.newPassword === passwordForm.confirmPassword ? 'match' : 'no-match'}`}>
                        {passwordForm.newPassword === passwordForm.confirmPassword ? '✔ Hasła są identyczne' : '✘ Hasła się różnią'}
                      </p>
                    )}
                  </div>
                  <button type="submit" className="save-profile-btn" disabled={passwordLoading}>{passwordLoading ? 'Zapisywanie...' : '🔐 Zmień hasło'}</button>
                </form>
              </div>
            </section>
          )}

          {/* OGŁOSZENIA OWNER */}
          {user.role === 'owner' && activeSection === 'rooms' && (
            <section className="content-section">
              <div className="section-header">
                <h2>🏠 Moje ogłoszenia</h2>
                <button className="add-room-btn" onClick={() => setShowAddForm(!showAddForm)}>{showAddForm ? '✕ Anuluj' : '+ Dodaj ogłoszenie'}</button>
              </div>
              {showAddForm && (
                <form className="add-room-form" onSubmit={handleSubmit}>
                  <div className="form-group"><label>Tytuł ogłoszenia</label><input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="np. Przytulny pokój w centrum" /></div>
                  <div className="form-row-2">
                    <div className="form-group"><label>Adres</label><input type="text" name="address" value={formData.address} onChange={handleChange} required placeholder="ul. Przykładowa 10" /></div>
                    <div className="form-group"><label>Miasto</label><input type="text" name="city" value={formData.city} onChange={handleChange} required placeholder="Warszawa" /></div>
                  </div>
                  <div className="form-row-3">
                    <div className="form-group"><label>Cena (PLN/mies.)</label><input type="number" name="price" value={formData.price} onChange={handleChange} required placeholder="1500" /></div>
                    <div className="form-group"><label>Metraż (m²)</label><input type="number" name="area" value={formData.area} onChange={handleChange} placeholder="15" /></div>
                    <div className="form-group checkbox-group">
                      <label><input type="checkbox" name="has_balcony" checked={formData.has_balcony} onChange={handleChange} /> Balkon</label>
                      <label><input type="checkbox" name="pets_allowed" checked={formData.pets_allowed} onChange={handleChange} /> 🐾 Zwierzęta</label>
                      <label><input type="checkbox" name="has_parking" checked={formData.has_parking} onChange={handleChange} /> 🚗 Parking</label>
                    </div>
                  </div>
                  <div className="form-group"><label>Opis</label><textarea name="description" value={formData.description} onChange={handleChange} rows="4" placeholder="Opisz pokój..." /></div>
                  <div className="form-group">
                    <label>Zdjęcia (max 5)</label>
                    <input type="file" multiple accept="image/*" onChange={handleImageSelect} />
                    {selectedImages.length > 0 && <small>Wybrano: {selectedImages.length} plików</small>}
                  </div>
                  <button type="submit" className="submit-btn">Dodaj ogłoszenie</button>
                </form>
              )}
              <div className="rooms-list">
                {rooms.length === 0 ? <div className="empty-state"><p>Nie masz jeszcze żadnych ogłoszeń</p></div> : rooms.map((room) => (
                  <div key={room.id} className="room-card-owner">
                    <div className="room-thumb">
                      {images[room.id]?.length > 0 ? <img src={`${UPLOADS_URL}/${images[room.id][0].filename}`} alt={room.title} /> : <div className="no-image">Brak zdjęcia</div>}
                    </div>
                    <div className="room-info">
                      <h3>{room.title}</h3>
                      <p>{room.city}, {room.address}</p>
                      <p className="room-meta"><strong>{room.price} PLN</strong>{room.area && ` • ${room.area} m²`}{room.has_balcony ? ' • Balkon' : ''}{room.pets_allowed ? ' • 🐾' : ''}{room.has_parking ? ' • 🚗' : ''}</p>
                    </div>
                    <div className="room-actions">
                      <span className={`status-badge ${room.is_rented ? 'rented' : 'available'}`}>{room.is_rented ? 'Wynajęte' : 'Dostępne'}</span>
                      <button className="delete-btn" onClick={() => handleDeleteRoom(room.id)}>🗑️ Usuń</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* WNIOSKI OWNER */}
          {user.role === 'owner' && activeSection === 'pending' && (
            <section className="content-section">
              <h2>📬 Wnioski do rozpatrzenia</h2>
              {requests.length === 0 ? <div className="empty-state"><p>Brak wniosków oczekujących</p></div> : (
                <div className="pending-requests-list">
                  {requests.map((req) => (
                    <div key={req.id} className="pending-request-card">
                      <div className="request-student"><strong>{req.student_name}</strong><span>chce zamieszkać w:</span></div>
                      <div className="request-apartment"><strong>{req.title}</strong><span>{req.city}</span></div>
                      <div className="request-actions">
                        <button className="accept-btn" onClick={() => handleRespondRequest(req.id, 'accept')}>✓ Akceptuj</button>
                        <button className="reject-btn" onClick={() => handleRespondRequest(req.id, 'reject')}>✕ Odrzuć</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {/* MODAL OCENY */}
      {showRatingModal && (
        <div className="rating-modal-overlay" onClick={() => setShowRatingModal(null)}>
          <div className="rating-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Oceń {showRatingModal.name}</h3>
            <p className="rating-apartment">{myApartment?.title}</p>
            <p className="rating-warning">⚠️ Ocena jest jednorazowa!</p>
            {['cleanliness', 'conflict_free', 'sociability'].map((cat) => (
              <div className="rating-category" key={cat}>
                <label>
                  {cat === 'cleanliness' && '🧹 Czystość'}
                  {cat === 'conflict_free' && '🤝 Bezkonfliktowość'}
                  {cat === 'sociability' && '💬 Relacyjność'}
                </label>
                <div className="stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={`star ${star <= ratingForm[cat] ? 'active' : ''}`} onClick={() => handleRatingChange(cat, star)}>★</span>
                  ))}
                </div>
              </div>
            ))}
            <div className="rating-comment">
              <label>Komentarz (opcjonalny)</label>
              <textarea value={ratingForm.comment} onChange={(e) => handleRatingChange('comment', e.target.value)} placeholder="Napisz kilka słów..." rows="3" />
            </div>
            <div className="rating-modal-actions">
              <button className="submit-rating-btn" onClick={() => handleSubmitRating(showRatingModal.id)}>Wyślij ocenę</button>
              <button className="cancel-btn" onClick={() => setShowRatingModal(null)}>Anuluj</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
