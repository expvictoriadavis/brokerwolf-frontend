import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkApproval = async () => {
      if (!user?.email) return;

      const { data, error } = await supabase
        .from('brokerwolfapp_users')
        .select('*')
        .eq('email', user.email)
        .eq('approved', true);

      if (error) {
        console.error('Approval check error:', error);
        setMessage('Server error. Please try again.');
        logout();
      } else if (!data?.length) {
        setMessage('Your access is pending approval by Victoria.');
        logout();
      } else {
        navigate('/dashboard');
      }
    };

    checkApproval();
  }, [user, logout, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setMessage('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: "https://brokerwolf-frontend.onrender.com/handle-login"
      }
    });

    if (error) {
      console.error('Login error:', error.message);
      setStatus('error');
      setMessage(error.message || 'Login failed.');
    } else {
      setStatus('sent');
    }
  };

  return (
    <div className="full-page-center">
      <div className="login-container">
        <h2>Login to Broker Wolf Exceptions Report App</h2>

        {status === 'sent' ? (
          <p className="success" style={{ marginTop: '1em' }}>
            ✅ Check your email for your login link.
          </p>
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
              {status === 'sending' ? 'Sending...' : 'Send Login Link'}
            </button>
          </form>
        )}

        {message && (
          <p style={{ marginTop: '1em', color: status === 'error' ? '#d00' : '#555' }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
