import { useEffect, useState } from 'react';
import api from '../api';

export default function VolunteerProfile() {
  const [form, setForm] = useState({ skills: '', city: '', availability: 'Available' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/volunteers/me').then((res) => {
      setForm({
        skills: res.data.skills || '',
        city: res.data.city || '',
        availability: res.data.availability || 'Available',
      });
    });
  }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/volunteers/me', form);
      setMsg('Profile saved');
    } catch (err) {
      setMsg('Could not save profile');
    }
  };

  return (
    <div>
      <h1>My Volunteer Profile</h1>
      {msg && <p className="info">{msg}</p>}
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <input name="skills" placeholder="Skills (e.g. medical, driving, teaching)" value={form.skills} onChange={change} />
            <input name="city" placeholder="City" value={form.city} onChange={change} />
            <select name="availability" value={form.availability} onChange={change}>
              <option>Available</option>
              <option>Busy</option>
            </select>
          </div>
          <button type="submit" className="btn">Save Profile</button>
        </form>
      </div>
    </div>
  );
}