import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message || 'Login failed');
      return;
    }

    // Check if approved
    const { data: approvedUser, error: userError } = await supabase
      .from('brokerwolfapp_users')
      .select('*')
      .eq('email', email)
      .eq('approved', true);

    if (userError || !approvedUser.length) {
      setMessage('You are not approved yet.');
      await supabase.auth.signOut();
      logout();
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="full-page-center">
      <div className="login-container">
        <h2>Login to Broker Wolf Exceptions Report App</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
        {message && <p style={{ marginTop: '1em', color: '#d00' }}>{message}</p>}
      </div>
    </div>
  );
}
