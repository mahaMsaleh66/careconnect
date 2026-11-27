import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import api from '../api';

const ROLES = [
  { value: 'donor', label: 'Donor' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'needy', label: 'Person in need' },
];

export default function GoogleSignIn({ onLoggedIn }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const [pending, setPending] = useState(null);
  const [role, setRole] = useState('donor');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async (credential, chosenRole) => {
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/auth/google', {
        credential: credential,
        role: chosenRole || undefined,
      });
      if (res.data.needsRole) {
        setPending({
          credential: credential,
          email: res.data.email,
          name: res.data.name,
        });
        return;
      }
      onLoggedIn(res.data.token, res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Google Sign-In failed');
    } finally {
      setBusy(false);
    }
  };

  if (!clientId) {
    return (
      <p className="google-hint">
        Google Sign-In is not configured yet. Set <code>VITE_GOOGLE_CLIENT_ID</code> in{' '}
        <code>client/.env</code> and the same value as <code>GOOGLE_CLIENT_ID</code> in{' '}
        <code>server/.env</code>.
      </p>
    );
  }

  if (pending) {
    return (
      <div className="google-role">
        <p className="google-hint">
          Welcome, {pending.name}. Choose how you will use CareConnect. You cannot pick Administrator here.
        </p>
        {error && <p className="error">{error}</p>}
        <select value={role} onChange={(e) => setRole(e.target.value)} disabled={busy}>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <button type="button" disabled={busy} onClick={() => send(pending.credential, role)}>
          {busy ? 'Creating account…' : 'Continue'}
        </button>
      </div>
    );
  }

  return (
    <div className="google-auth">
      <div className="auth-divider"><span>or</span></div>
      {error && <p className="error">{error}</p>}
      <GoogleLogin
        onSuccess={(res) => send(res.credential)}
        onError={() => setError('Google Sign-In was cancelled or failed')}
        text="continue_with"
        shape="pill"
        width="320"
      />
    </div>
  );
}
