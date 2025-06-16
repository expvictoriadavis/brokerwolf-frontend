import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient'; // make sure this is correctly configured
import { useAuth } from './AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if already logged in
  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) {
      console.error('Supabase login error:', error.message);
      setStatus('error');
      setErrorMessage(error.message || 'Login failed.');
    } else {
      setStatus('sent');
    }
  };

  return (
    <div className="full-page-center">
      <div className="login-container">
        <h2>Login to Broker Wolf</h2>

        {status === 'sent' ? (
          <p className="success">📧 Check your email for a login link.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>
        )}

        {status === 'error' && <p className="error">{errorMessage}</p>}
      </div>
    </div>
  );
}
