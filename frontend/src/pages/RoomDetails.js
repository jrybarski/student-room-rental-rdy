import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './RoomDetails.css';

const API_URL = 'http://localhost:5000/api';
const UPLOADS_URL = 'http://localhost:5000/uploads';

const displayName = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1].charAt(0)}.`;
};

const RoomDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [room, setRoom] = useState(null);
  const [images, setImages] = useState([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [hasApplied, setHasApplied] = useState(null);
  const [isAlreadyResident, setIsAlreadyResident] = useState(false);

  useEffect(() => { fetchRoom(); fetchImages(); fetchResidents(); }, [id]);
  useEffect(() => { if (user?.role === 'student') { checkIfApplied(); checkIfResident(); } }, [user, id]);

  const fetchRoom = async () => {
    try {
      const res = await fetch(`${API_URL}/apartments/${id}`);
      if (res.ok) setRoom(await res.json());
      else navigate('/');
    } catch (err) { console.error('Błąd:', err); }
    finally { setLoading(false); }
  };

  const fetchImages = async () => {
    try {
      const res = await fetch(`${API_URL}/images/apartment/${id}`);
      if (res.ok) setImages(await res.json());
    } catch (err) { console.error('Błąd:', err); }
  };

  const fetchResidents = async () => {
    try {
      const res = await fetch(`${API_URL}/residents/apartment/${id}`);
      if (res.ok) setResidents(await res.json());
    } catch (err) { console.error('Błąd:', err); }
  };

  const checkIfApplied = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/residence/my-requests`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const myRequest = data.find((r) => r.apartment_id === parseInt(id));
        setHasApplied(myRequest ? myRequest.status : null);
      }
    } catch (err) { console.error('Błąd:', err); }
  };

  const checkIfResident = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/residents/my-apartment`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setIsAlreadyResident(!!data.apartment); }
    } catch (err) { console.error('Błąd:', err); }
  };

  const handleApply = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      const res = await fetch(`${API_URL}/residence/${id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) { setMessage('Wniosek wysłany! Właściciel wkrótce odpowie.'); setHasApplied('pending'); }
      else { setMessage(data.error || 'Błąd wysyłania wniosku'); if (data.alreadyResident) setIsAlreadyResident(true); }
    } catch (err) { setMessage('Błąd połączenia'); }
  };

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + images.length) % images.length);

  if (loading) return <div className="room-details-page loading">Ładowanie...</div>;
  if (!room) return <div className="room-details-page">Nie znaleziono ogłoszenia</div>;

  return (
    <div className="room-details-page">
      <div className="room-details-container">
        <div className="gallery-section">
          {images.length > 0 ? (
            <div className="main-image">
              <img src={`${UPLOADS_URL}/${images[currentImage].filename}`} alt={room.title} />
              {images.length > 1 && (
                <>
                  <button className="gallery-nav prev" onClick={prevImage}>‹</button>
                  <button className="gallery-nav next" onClick={nextImage}>›</button>
                  <div className="image-counter">{currentImage + 1} / {images.length}</div>
                </>
              )}
            </div>
          ) : <div className="no-images">Brak zdjęć</div>}
          {images.length > 1 && (
            <div className="thumbnails">
              {images.map((img, idx) => (
                <img key={img.id} src={`${UPLOADS_URL}/${img.filename}`} alt="" className={idx === currentImage ? 'active' : ''} onClick={() => setCurrentImage(idx)} />
              ))}
            </div>
          )}
        </div>

        <div className="info-section">
          <div className="info-main">
            <h1>{room.title}</h1>
            <p className="location">📍 {room.city}, {room.address}</p>
            <div className="price-box">
              <span className="price">{room.price} PLN</span>
              <span className="price-label">/ miesiąc</span>
            </div>
            <div className="features">
              {room.area && <div className="feature"><span className="feature-icon">📐</span><span>{room.area} m²</span></div>}
              <div className="feature"><span className="feature-icon">{room.has_balcony ? '✅' : '❌'}</span><span>{room.has_balcony ? 'Balkon' : 'Bez balkonu'}</span></div>
              <div className="feature"><span className="feature-icon">{room.pets_allowed ? '🐾' : '🚫'}</span><span>{room.pets_allowed ? 'Zwierzęta dozwolone' : 'Bez zwierząt'}</span></div>
              <div className="feature"><span className="feature-icon">{room.has_parking ? '🚗' : '🚫'}</span><span>{room.has_parking ? 'Parking' : 'Bez parkingu'}</span></div>
            </div>
            {room.description && <div className="description"><h3>Opis</h3><p>{room.description}</p></div>}

            {residents.length > 0 && (
              <div className="residents-section">
                <h3>Obecni lokatorzy ({residents.length})</h3>
                <div className="residents-list">
                  {residents.map((r) => (
                    <Link key={r.id} to={`/profile/${r.username}`} className="resident-card clickable">
                      <div className="resident-avatar">
                        {r.avatar ? <img src={`${UPLOADS_URL}/${r.avatar}`} alt={displayName(r.name)} /> : displayName(r.name)?.charAt(0) || '?'}
                      </div>
                      <span>{displayName(r.name)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="info-sidebar">
            <div className="owner-card">
              <h3>Właściciel</h3>
              <p className="owner-name">{displayName(room.owner_name)}</p>
              {room.owner_phone && (
                <a href={`tel:${room.owner_phone}`} className="owner-phone">
                  📞 {room.owner_phone}
                </a>
              )}

              {user?.role === 'student' && !room.is_rented && (
                <>
                  {hasApplied === 'accepted' ? (
                    <div className="applied-badge accepted">✓ Jesteś lokatorem tego pokoju</div>
                  ) : hasApplied === 'pending' ? (
                    <div className="applied-badge pending">⏳ Wniosek oczekuje na akceptację</div>
                  ) : hasApplied === 'rejected' ? (
                    <div className="applied-badge rejected">✗ Wniosek odrzucony</div>
                  ) : isAlreadyResident ? (
                    <div className="applied-badge blocked">
                      🏠 Jesteś już mieszkańcem innego pokoju. <Link to="/dashboard">Opuść obecne mieszkanie</Link>, aby wysłać nowy wniosek.
                    </div>
                  ) : (
                    <button className="apply-btn" onClick={handleApply}>Wyślij wniosek o zamieszkanie</button>
                  )}
                </>
              )}

              {!user && <button className="apply-btn" onClick={() => navigate('/login')}>Zaloguj się, aby wysłać wniosek</button>}
              {!!room.is_rented && <div className="rented-badge">Ten pokój jest już wynajęty</div>}
            </div>
            {message && <div className="message-box">{message}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetails;
