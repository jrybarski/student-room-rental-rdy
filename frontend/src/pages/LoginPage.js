import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '', password: '', username: '', name: '', role: 'student', age: '', gender: '', status: '', phone: '',
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    let value = e.target.value;
    // username: automatycznie zamień na małe litery i zablokuj niedozwolone znaki
    if (e.target.name === 'username') value = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password);
        if (result.success) navigate('/');
        else setMessage(result.error || 'Błąd logowania');
      } else {
        const result = await register(
          formData.email, formData.password, formData.username, formData.name,
          formData.role, formData.age, formData.gender, formData.status, formData.phone
        );
        if (result.success) {
          setMessage('Konto utworzone! Możesz się teraz zalogować.');
          setIsLogin(true);
          setFormData({ ...formData, password: '', username: '', age: '', gender: '', status: '' });
        } else {
          setMessage(result.error || 'Błąd rejestracji');
        }
      }
    } catch (err) {
      setMessage('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>{isLogin ? 'Zaloguj się' : 'Zarejestruj się'}</h1>

        <div className="tabs">
          <button className={isLogin ? 'active' : ''} onClick={() => setIsLogin(true)}>Logowanie</button>
          <button className={!isLogin ? 'active' : ''} onClick={() => setIsLogin(false)}>Rejestracja</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="twoj@email.com" />
          </div>

          <div className="form-group">
            <label>Hasło</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" />
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label>Login <span className="label-hint">(@nazwa użytkownika)</span></label>
                <div className="username-input-wrapper">
                  <span className="username-prefix">@</span>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder="jan_kowalski"
                    maxLength={20}
                  />
                </div>
                <small className="field-hint">Tylko małe litery, cyfry i _ (3–20 znaków)</small>
              </div>

              <div className="form-group">
                <label>Imię i nazwisko</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Jan Kowalski" />
              </div>

              <div className="form-group">
                <label>Typ konta</label>
                <div className="role-selection">
                  <label className={`role-option ${formData.role === 'student' ? 'selected' : ''}`}>
                    <input type="radio" name="role" value="student" checked={formData.role === 'student'} onChange={handleChange} />
                    <div className="role-content">
                      <span className="role-icon">🎓</span>
                      <span className="role-name">Student</span>
                      <span className="role-desc">Szukam pokoju</span>
                    </div>
                  </label>
                  <label className={`role-option ${formData.role === 'owner' ? 'selected' : ''}`}>
                    <input type="radio" name="role" value="owner" checked={formData.role === 'owner'} onChange={handleChange} />
                    <div className="role-content">
                      <span className="role-icon">🏠</span>
                      <span className="role-name">Właściciel</span>
                      <span className="role-desc">Wynajmuję pokoje</span>
                    </div>
                  </label>
                </div>
              </div>


              {formData.role === 'owner' && (
                <div className="form-group">
                  <label>Numer telefonu <span className="label-hint">(widoczny w ofertach)</span></label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+48 123 456 789"
                    maxLength={20}
                  />
                </div>
              )}

              {formData.role === 'student' && (
                <>
                  <div className="form-row two-cols">
                    <div className="form-group">
                      <label>Wiek</label>
                      <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="np. 22" min="16" max="99" />
                    </div>
                    <div className="form-group">
                      <label>Płeć</label>
                      <select name="gender" value={formData.gender} onChange={handleChange}>
                        <option value="">Wybierz...</option>
                        <option value="male">Mężczyzna</option>
                        <option value="female">Kobieta</option>
                        <option value="other">Inna</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select name="status" value={formData.status} onChange={handleChange}>
                      <option value="">Wybierz...</option>
                      <option value="student">Student</option>
                      <option value="worker">Pracownik</option>
                      <option value="unemployed">Bezrobotny</option>
                    </select>
                  </div>
                </>
              )}
            </>
          )}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Proszę czekać...' : isLogin ? 'Zaloguj' : 'Zarejestruj'}
          </button>
        </form>

        {message && (
          <p className={`message ${message.includes('Konto') ? 'success' : 'error'}`}>{message}</p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
