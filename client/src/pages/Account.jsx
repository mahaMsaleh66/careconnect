import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function Account() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', city: '' });
  const [pw, setPw] = useState({ current_password: '', new_password: '' });
  const [email, setEmail] = useState('');
  const [hasPassword, setHasPassword] = useState(true);
  const [msg, setMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    api.get('/auth/me').then((res) => {
      setForm({
        name: res.data.name || '',
        phone: res.data.phone || '',
        city: res.data.city || '',
      });
      setEmail(res.data.email);
      setHasPassword(res.data.has_password !== false);
    });
  }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const changePw = (e) => setPw({ ...pw, [e.target.name]: e.target.value });

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put('/users/me', form);
      login(localStorage.getItem('token'), { ...user, name: form.name });
      setMsg('Profile updated');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not update profile');
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    try {
      await api.put('/users/me/password', pw);
      setPw({ current_password: '', new_password: '' });
      setPwMsg('Password changed');
    } catch (err) {
      setPwMsg(err.response?.data?.message || 'Could not change password');
    }
  };

  return (
    <div>
      <h1>My Account</h1>

      <div className="card">
        <h3>Profile</h3>
        {msg && <p className="info">{msg}</p>}
        <p>Email: <b>{email}</b> | Role: <b>{user.role}</b></p>
        <form onSubmit={saveProfile}>
          <div className="form-grid">
            <input name="name" placeholder="Full name" value={form.name} onChange={change} required />
            <input name="phone" placeholder="Phone" value={form.phone} onChange={change} />
            <input name="city" placeholder="City" value={form.city} onChange={change} />
          </div>
          <button type="submit" className="btn">Save Profile</button>
        </form>
      </div>

      <div className="card">
        <h3>Change Password</h3>
        {pwMsg && <p className="info">{pwMsg}</p>}
        {!hasPassword && (
          <p>This account uses Google Sign-In, so there is no password to change.</p>
        )}
        {hasPassword && (
        <form onSubmit={savePassword}>
          <div className="form-grid">
            <input name="current_password" type="password" placeholder="Current password" value={pw.current_password} onChange={changePw} required />
            <input name="new_password" type="password" placeholder="New password (min 6 characters)" value={pw.new_password} onChange={changePw} required />
          </div>
          <button type="submit" className="btn">Change Password</button>
        </form>
        )}
      </div>
    </div>
  );
}