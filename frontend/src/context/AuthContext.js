import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);
const API_URL = 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) fetchUser();
    else setLoading(false);
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setUser(data.user); }
      else localStorage.removeItem('token');
    } catch (err) {
      console.error('Błąd pobierania użytkownika');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) { localStorage.setItem('token', data.token); setUser(data.user); return { success: true }; }
    return { success: false, error: data.error };
  };

  const register = async (email, password, username, name, role, age, gender, status, phone) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username, name, role, age, gender, status, phone }),
    });
    const data = await res.json();
    if (res.ok) return { success: true };
    return { success: false, error: data.error };
  };

  const logout = () => { localStorage.removeItem('token'); setUser(null); };

  const updateUser = (newUserData) => { setUser(newUserData.user || newUserData); };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
