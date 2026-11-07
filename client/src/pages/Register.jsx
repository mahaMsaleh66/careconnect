import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', city: '', role: 'donor',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
    <div className="auth-box">
      <h2>Create Account</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Full name" onChange={change} required />
        <input name="email" type="email" placeholder="Email" onChange={change} required />
        <input name="password" type="password" placeholder="Password" onChange={change} required />
        <input name="phone" placeholder="Phone" onChange={change} />
        <input name="city" placeholder="City" onChange={change} />
        <select name="role" value={form.role} onChange={change}>
          <option value="donor">Donor</option>
          <option value="volunteer">Volunteer</option>
          <option value="needy">Needy</option>
        </select>
        <button type="submit">Register</button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}