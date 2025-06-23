import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const { logout } = useAuth();
  const navigate = useNavigate();

  const checkApprovalAndNavigate = async (userEmail) => {
    const normalizedEmail = userEmail.trim().toLowerCase();

    // ✅ Allow Victoria to bypass approval
    if (normalizedEmail === 'victoria.davis@exprealty.net') {
      return navigate('/dashboard');
    }

    const { data, error } = await supabase
      .from('brokerwolfapp_users')
      .select('*')
      .ilike('email', normalizedEmail);

    console.log('Approval check result:', data, 'Error:', error);

    const approvedUser = data?.find(u => u.approved === true);

    if (error || !approvedUser) {
      setMessage('Your account is not yet approved. Please contact Victoria.');
      await supabase.auth.signOut();
      logout();
    } else {
      navigate('/dashboard');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });

    if (error) {
      setStatus('error');
      setMessage(error.message || 'Login failed');
    } else {
      checkApprovalAndNavigate(email);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    const normalizedEmail = email.trim().toLowerCase();

    const { error: signupError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password
    });

    if (signupError) {
      if (signupError.message.includes('User already registered')) {
        setMessage('Account already exists, please log in.');
      } else {
        setMessage(signupError.message || 'Signup failed');
      }
      setStatus('error');
      return;
    }

    // Upsert into approval table to avoid duplicate insert issues
    const { error: insertError } = await supabase.from('brokerwolfapp_users').upsert(
      {
        email: normalizedEmail,
        approved: false,
        is_admin: false
      },
      { onConflict: 'email' }
    );

    if (insertError) {
      console.error("❌ Failed to upsert brokerwolfapp_users:", insertError.message);
      setMessage("Signup failed. Please contact support.");
      setStatus('error');
      return;
    }

    setMessage('Account created! Awaiting admin approval.');
    setStatus('idle');
  };

  return (
    <div className="full-page-center">
      <div className="login-container">
        <h2>Login to Broker Wolf Exceptions Report App</h2>
        <form>
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

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
            <button onClick={handleLogin} disabled={status === 'loading'}>Login</button>
            <button onClick={handleSignup} disabled={status === 'loading'}>Create Account</button>
          </div>
        </form>

        {message && (
          <p style={{ marginTop: '1em', color: status === 'error' ? '#d00' : '#007b00' }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
