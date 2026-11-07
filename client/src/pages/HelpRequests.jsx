import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function HelpRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ need_type: 'Food', urgency: 'Low', city: '', message: '' });
  const [msg, setMsg] = useState('');
  const [botReply, setBotReply] = useState('');

  const isAdmin = user.role === 'admin';

  const load = async () => {
    try {
      const url = isAdmin ? '/requests' : '/requests/my';
      const res = await api.get(url);
      setRequests(res.data);
    } catch (err) {
      setMsg('Could not load requests');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/requests', form);
      setForm({ need_type: 'Food', urgency: 'Low', city: '', message: '' });
      setMsg('Request submitted');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to submit');
    }
  };

  const updateStatus = async (id, status) => {
    await api.put('/requests/' + id + '/status', { status: status });
    load();
  };
  const analyze = async () => {
    if (!form.message.trim()) {
      setMsg('Please type your message first');
      return;
    }
    try {
      const res = await api.post('/requests/analyze', { message: form.message });
      setForm({ ...form, need_type: res.data.need_type, urgency: res.data.urgency });
      setBotReply(res.data.reply);
    } catch (err) {
      setMsg('AI service is not running');
    }
  };

  return (
    <div>
      <h1>Help Requests</h1>
      {msg && <p className="info">{msg}</p>}

      {user.role === 'needy' && (
        <div className="card">
          <h3>Submit a Help Request</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <select name="need_type" value={form.need_type} onChange={change}>
                <option>Food</option>
                <option>Medical</option>
                <option>Shelter</option>
                <option>Education</option>
                <option>Other</option>
              </select>
              <select name="urgency" value={form.urgency} onChange={change}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
              <input name="city" placeholder="City" value={form.city} onChange={change} />
            </div>
            <textarea name="message" placeholder="Describe what you need" value={form.message} onChange={change} rows="4" required />
            <button type="button" className="btn" style={{ marginRight: 8 }} onClick={analyze}>Analyze (Urdu AI)</button>
<button type="submit" className="btn">Submit Request</button>
{botReply && <p className="info" dir="rtl">{botReply}</p>}
          </form>
        </div>
      )}

      <div className="card">
        <h3>{isAdmin ? 'All Requests' : 'My Requests'}</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {isAdmin && <th>Name</th>}
                <th>Type</th>
                <th>Urgency</th>
                <th>City</th>
                <th>Message</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr><td colSpan="6">No requests yet</td></tr>
              )}
              {requests.map((r) => (
                <tr key={r.id}>
                  {isAdmin && <td>{r.needy_name}</td>}
                  <td>{r.need_type}</td>
                  <td><span className={'badge ' + r.urgency}>{r.urgency}</span></td>
                  <td>{r.city}</td>
                  <td>{r.message}</td>
                  <td>
                    {isAdmin ? (
                      <select value={r.status} onChange={(e) => updateStatus(r.id, e.target.value)}>
                        <option>Pending</option>
                        <option>Assigned</option>
                        <option>Completed</option>
                        <option>Rejected</option>
                      </select>
                    ) : (
                      r.status
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}