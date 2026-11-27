import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';
import api from '../api';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import GoogleSignIn from '../components/GoogleSignIn';
import LanguageToggle from '../components/LanguageToggle';
import PasswordInput from '../components/PasswordInput';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const form = new FormData(e.currentTarget);
    const nextEmail = String(form.get('email') || email || '').trim();
    const nextPassword = String(form.get('password') || password || '');
    setEmail(nextEmail);
    setPassword(nextPassword);
    try {
      const res = await api.post('/auth/login', { email: nextEmail, password: nextPassword });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-top">
        <Link to="/" className="auth-back"><ArrowLeft size={16} /> {t('auth.backHome')}</Link>
        <LanguageToggle variant="light" />
      </div>
      <div className="auth-box">
        <div className="auth-logo"><Heart size={22} /></div>
        <h2>{t('auth.welcome')}</h2>
        <p className="auth-sub">{t('auth.loginSub')}</p>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder={t('auth.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <PasswordInput
            name="password"
            autoComplete="current-password"
            placeholder={t('auth.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">{t('auth.loginBtn')}</button>
        </form>
        <GoogleSignIn
          onLoggedIn={(token, userData) => {
            login(token, userData);
            navigate('/dashboard');
          }}
        />
        <p>{t('auth.noAccount')} <Link to="/register">{t('auth.registerHere')}</Link></p>
      </div>
    </div>
  );
}
