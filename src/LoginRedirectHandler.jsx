import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function LoginRedirectHandler() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const completeLogin = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        setErrorMsg('Login failed. No session found.');
        setLoading(false);
        return;
      }

      const email = session.user.email;

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

  return (
    <div className="full-page-center">
      <div className="login-container">
        {loading ? <p>Logging you in...</p> : <p style={{ color: '#d00' }}>{errorMsg}</p>}
      </div>
    </div>
  );
}
