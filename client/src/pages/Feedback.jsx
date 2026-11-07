import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function Feedback() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ message: '', rating: '5' });
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const res = await api.get(isAdmin ? '/feedback' : '/feedback/my');
      setItems(res.data);
    } catch (err) {
      setMsg('Could not load feedback');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/feedback', form);
      setForm({ message: '', rating: '5' });
      setMsg('Thank you for your feedback');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not send feedback');
    }
  };

  const average = items.length
    ? (items.reduce((s, f) => s + Number(f.rating || 0), 0) / items.length).toFixed(1)
    : '-';

  return (
    <div>
      <h1>Feedback</h1>
      {msg && <p className="info">{msg}</p>}

      {!isAdmin && (
        <div className="card">
          <h3>Send Feedback</h3>
          <form onSubmit={handleSubmit}>
            <select name="rating" value={form.rating} onChange={change} style={{ marginBottom: 12 }}>
              <option value="5">5 - Excellent</option>
              <option value="4">4 - Good</option>
              <option value="3">3 - Okay</option>
              <option value="2">2 - Poor</option>
              <option value="1">1 - Very poor</option>
            </select>
            <textarea
              name="message"
              rows="4"
              placeholder="Tell us about your experience"
              value={form.message}
              onChange={change}
              required
            />
            <button type="submit" className="btn">Send</button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>{isAdmin ? 'All Feedback' : 'My Feedback'}</h3>
        {isAdmin && <p>Average rating: <b>{average}</b> / 5 ({items.length} responses)</p>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {isAdmin && <th>User</th>}
                {isAdmin && <th>Role</th>}
                <th>Rating</th>
                <th>Message</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan="5">No feedback yet</td></tr>
              )}
              {items.map((f) => (
                <tr key={f.id}>
                  {isAdmin && <td>{f.user_name}</td>}
                  {isAdmin && <td>{f.user_role}</td>}
                  <td>{f.rating} / 5</td>
                  <td>{f.message}</td>
                  <td>{new Date(f.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}