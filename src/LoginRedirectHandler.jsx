import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function LoginRedirectHandler() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [email, setEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('idle');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const completeLogin = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        setErrorMsg('Login failed. This link may be expired. You can resend the login link below.');
        setLoading(false);
        return;
      }

      const email = session.user.email;
      setEmail(email); // save email for possible resend

      const { data, error } = await supabase
        .from('brokerwolfapp_users')
        .select('*')
        .eq('email', email)
        .eq('approved', true);

      if (error || !data?.length) {
        setErrorMsg('Your account is not yet approved. Please contact Victoria.');
        setLoading(false);
        return;
      }

      navigate('/dashboard');
    };

    completeLogin();
  }, [navigate]);

  const handleResendLink = async () => {
    if (!email) return;
    setResendStatus('sending');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: "https://brokerwolf-frontend.onrender.com/handle-login"
      }
    });

    if (error) {
      console.error('Resend failed:', error.message);
      setResendStatus('error');
    } else {
      setResendStatus('sent');
    }
  };

  return (
    <div className="full-page-center">
      <div className="login-container">
        {loading ? (
          <p>Logging you in...</p>
        ) : (
          <>
            <p style={{ color: '#d00', marginBottom: '1rem' }}>{errorMsg}</p>

            {email && (
              <>
                <button onClick={handleResendLink} disabled={resendStatus === 'sending'}>
                  {resendStatus === 'sending' ? 'Resending...' : 'Resend Login Link'}
                </button>
                {resendStatus === 'sent' && (
                  <p style={{ marginTop: '0.5rem', color: '#008000' }}>
                    ✅ Link resent! Check your email.
                  </p>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
