import { useEffect, useState } from 'react';
import api from '../api';
import LocationMapPicker from '../components/LocationMapPicker';
import SkillPicker, { joinSkills } from '../components/SkillPicker';

export default function VolunteerProfile() {
  const [form, setForm] = useState({
    skills: '',
    city: '',
    availability: 'Available',
    lat: null,
    lng: null,
  });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/volunteers/me').then((res) => {
      setForm({
        skills: joinSkills(res.data.skills || ''),
        city: res.data.city || '',
        availability: res.data.availability || 'Available',
        lat: res.data.lat ?? null,
        lng: res.data.lng ?? null,
      });
    });
  }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/volunteers/me', { ...form, skills: joinSkills(form.skills) });
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
          <SkillPicker
            value={form.skills}
            onChange={(skills) => setForm((prev) => ({ ...prev, skills: joinSkills(skills) }))}
          />
          <div className="form-grid">
            <input name="city" placeholder="City" value={form.city} onChange={change} />
            <select name="availability" value={form.availability} onChange={change}>
              <option>Available</option>
              <option>Busy</option>
            </select>
          </div>
          <LocationMapPicker
            lat={form.lat}
            lng={form.lng}
            onChange={({ lat, lng, label }) => {
              setForm((prev) => ({
                ...prev,
                lat: lat,
                lng: lng,
                city: prev.city || (label && label.length < 80 ? label : prev.city),
              }));
            }}
          />
          <button type="submit" className="btn">Save Profile</button>
        </form>
      </div>
    </div>
  );
}
