import React from 'react';
import { Link } from 'react-router-dom';
import './RoomCard.css';

const UPLOADS_URL = 'http://localhost:5000/uploads';

const RoomCard = ({ room, images, isNew, isRented, isFavorite, onToggleFavorite, showFavorite }) => {
  const hasImage = images && images.length > 0;
  const mainImage = hasImage ? `${UPLOADS_URL}/${images[0].filename}` : null;

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(room.id);
    }
  };

  return (
    <Link to={`/room/${room.id}`} className="room-card">
      <div className="room-image-container">
        {hasImage ? (
          <img src={mainImage} alt={room.title} className="room-image" />
        ) : (
          <div className="room-image-placeholder">
            <span>🏠</span>
            <p>Brak zdjęcia</p>
          </div>
        )}
        {isNew && <span className="badge badge-new">NOWOŚĆ</span>}
        {isRented && <span className="badge badge-rented">WYNAJĘTE</span>}
        {showFavorite && (
          <button 
            className={`favorite-btn ${isFavorite ? 'active' : ''}`} 
            onClick={handleFavoriteClick}
            title={isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
        )}
      </div>
      <div className="room-info">
        <h3 className="room-location">{room.city}, {room.address}</h3>
        <p className="room-details">
          {room.area && `${room.area} m²`}
          {room.has_balcony ? ', balkon' : ''}
          {room.pets_allowed ? ', 🐾' : ''}
          {room.has_parking ? ', 🚗' : ''}
        </p>
        <div className="room-price-row">
          <span className="room-price">{room.price} PLN</span>
        </div>
      </div>
    </Link>
  );
};

export default RoomCard;
