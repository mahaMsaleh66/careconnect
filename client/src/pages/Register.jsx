import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';
import api from '../api';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import GoogleSignIn from '../components/GoogleSignIn';
import LanguageToggle from '../components/LanguageToggle';
import PasswordInput from '../components/PasswordInput';

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', city: '', role: 'donor',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/register', form);
      alert('Registered successfully. Please login.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
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
        <h2>{t('auth.create')}</h2>
        <p className="auth-sub">{t('auth.registerSub')}</p>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input name="name" placeholder={t('auth.name')} onChange={change} required />
          <input name="email" type="email" placeholder={t('auth.email')} onChange={change} required />
          <PasswordInput name="password" autoComplete="new-password" placeholder={t('auth.password')} onChange={change} required />
          <input name="phone" placeholder={t('auth.phone')} onChange={change} />
          <input name="city" placeholder={t('auth.city')} onChange={change} />
          <select name="role" value={form.role} onChange={change}>
            <option value="donor">{t('role.donor')}</option>
            <option value="volunteer">{t('role.volunteer')}</option>
            <option value="needy">{t('role.needy')}</option>
          </select>
          <button type="submit">{t('auth.registerBtn')}</button>
        </form>
        <GoogleSignIn
          onLoggedIn={(token, userData) => {
            login(token, userData);
            navigate('/dashboard');
          }}
        />
        <p>{t('auth.haveAccount')} <Link to="/login">{t('auth.loginBtn')}</Link></p>
      </div>
    </div>
  );
}
