import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL;
console.log("API_BASE_URL:", API_BASE_URL); // Debug log

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (data.status === 'ok') {
        login(email);
        navigate('/dashboard');
      } else if (data.status === 'pending') {
        setMessage(data.message);
      } else {
        setMessage('Unexpected response. Please contact support.');
      }
    } catch (err) {
      console.error("Login request failed:", err);
      setMessage("Login failed. Check your connection or server.");
    }
  };

  return (
    <div className="full-page-center">
      <div className="login-container">
        <h2>Login to Broker Wolf</h2>
        <form onSubmit={handleSubmit}>
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
        {message && <p style={{ marginTop: '1em', color: '#d00' }}>{message}</p>}
      </div>
    </div>
  );
}
