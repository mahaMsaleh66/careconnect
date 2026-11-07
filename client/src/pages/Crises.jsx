import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

const emptyForm = {
  title: '',
  type: 'Flood',
  location: '',
  affected_people: '',
  description: '',
  severity: 'Low',
};

export default function Crises() {
  const { user } = useAuth();
  const [crises, setCrises] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/crises');
      setCrises(res.data);
    } catch (err) {
      setMsg('Could not load crises');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/crises', form);
      setForm(emptyForm);
      setMsg('Crisis created');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to create crisis');
    }
  };

  const resolve = async (id) => {
    await api.put('/crises/' + id + '/resolve');
    load();
  };
  const predict = async () => {
    try {
      const res = await api.post('/crises/predict', {
        type: form.type,
        affected_people: form.affected_people,
        description: form.description,
      });
      setForm({ ...form, severity: res.data.severity });
      setMsg('AI predicted severity: ' + res.data.severity + ' (' + res.data.confidence + '% confidence)');
    } catch (err) {
      setMsg('AI service is not running');
    }
  };

  return (
    <div>
      <h1>Crises</h1>
      {msg && <p className="info">{msg}</p>}

      {user.role === 'admin' && (
        <div className="card">
          <h3>Add New Crisis</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <input name="title" placeholder="Title" value={form.title} onChange={change} required />
              <select name="type" value={form.type} onChange={change}>
                <option>Flood</option>
                <option>Earthquake</option>
                <option>Hunger</option>
                <option>Medical</option>
                <option>Fire</option>
                <option>Other</option>
              </select>
              <input name="location" placeholder="Location" value={form.location} onChange={change} />
              <input name="affected_people" type="number" placeholder="Affected people" value={form.affected_people} onChange={change} />
              <select name="severity" value={form.severity} onChange={change}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
            <textarea name="description" placeholder="Description" value={form.description} onChange={change} rows="3" />
            <button type="button" className="btn" style={{ marginRight: 8 }} onClick={predict}>Predict Severity (AI)</button>
<button type="submit" className="btn">Save Crisis</button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>All Crises</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Location</th>
                <th>Affected</th>
                <th>Severity</th>
                <th>Status</th>
                {user.role === 'admin' && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {crises.length === 0 && (
                <tr>
                  <td colSpan="7">No crises yet</td>
                </tr>
              )}
              {crises.map((c) => (
                <tr key={c.id}>
                  <td>{c.title}</td>
                  <td>{c.type}</td>
                  <td>{c.location}</td>
                  <td>{c.affected_people}</td>
                  <td><span className={'badge ' + c.severity}>{c.severity}</span></td>
                  <td>{c.status}</td>
                  {user.role === 'admin' && (
                    <td>
                      {c.status === 'Active' && (
                        <button className="btn small" onClick={() => resolve(c.id)}>Resolve</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}