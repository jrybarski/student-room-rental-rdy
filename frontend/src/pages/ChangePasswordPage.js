import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ChangePasswordPage.css';

const API_URL = 'http://localhost:5000/api';

const ChangePasswordPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setStatus({ type: '', message: '' });
  };

  const toggleShow = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const getPasswordStrength = (password) => {
    if (!password) return null;
    if (password.length < 6) return { label: 'Za krótkie', color: '#e74c3c', width: '20%' };
    if (password.length < 8) return { label: 'Słabe', color: '#e67e22', width: '40%' };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password))
      return { label: 'Średnie', color: '#f1c40f', width: '65%' };
    return { label: 'Silne', color: '#2ecc71', width: '100%' };
  };

  const strength = getPasswordStrength(form.newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      return setStatus({ type: 'error', message: 'Nowe hasła nie są identyczne.' });
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: 'success', message: '✅ Hasło zostało zmienione pomyślnie!' });
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setStatus({ type: 'error', message: data.error || 'Coś poszło nie tak.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Błąd połączenia z serwerem.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-page">
      <div className="change-password-container">

        {/* Nagłówek */}
        <div className="change-password-header">
          <div className="header-icon">🔐</div>
          <h1>Zmiana hasła</h1>
          <p>Wprowadź obecne hasło, a następnie ustaw nowe</p>
        </div>

        {/* Formularz */}
        <div className="change-password-body">

          {status.message && (
            <div className={`alert alert-${status.type}`}>
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Obecne hasło */}
            <div className="form-group">
              <label>Obecne hasło</label>
              <div className="input-wrapper">
                <input
                  type={showPasswords.currentPassword ? 'text' : 'password'}
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={handleChange}
                  placeholder="Wpisz obecne hasło"
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => toggleShow('currentPassword')}
                >
                  {showPasswords.currentPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="divider" />

            {/* Nowe hasło */}
            <div className="form-group">
              <label>Nowe hasło</label>
              <div className="input-wrapper">
                <input
                  type={showPasswords.newPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder="Minimum 6 znaków"
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => toggleShow('newPassword')}
                >
                  {showPasswords.newPassword ? '🙈' : '👁️'}
                </button>
              </div>

              {/* Pasek siły hasła */}
              {strength && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div
                      className="strength-fill"
                      style={{ width: strength.width, background: strength.color }}
                    />
                  </div>
                  <span className="strength-label" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Potwierdzenie nowego hasła */}
            <div className="form-group">
              <label>Powtórz nowe hasło</label>
              <div className="input-wrapper">
                <input
                  type={showPasswords.confirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Wpisz nowe hasło ponownie"
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => toggleShow('confirmPassword')}
                >
                  {showPasswords.confirmPassword ? '🙈' : '👁️'}
                </button>
              </div>

              {/* Walidacja zgodności haseł */}
              {form.confirmPassword && (
                <p className={`match-hint ${form.newPassword === form.confirmPassword ? 'match' : 'no-match'}`}>
                  {form.newPassword === form.confirmPassword ? '✔ Hasła są identyczne' : '✘ Hasła się różnią'}
                </p>
              )}
            </div>

            {/* Przyciski */}
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
                ← Wróć
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Zapisywanie...' : 'Zmień hasło'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
