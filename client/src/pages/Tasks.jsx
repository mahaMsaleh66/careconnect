import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function Tasks() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';
  const [tasks, setTasks] = useState([]);
  const [pending, setPending] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [choice, setChoice] = useState({});
  const [suggestions, setSuggestions] = useState({});
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const res = await api.get(isAdmin ? '/tasks' : '/tasks/my');
      setTasks(res.data);
      if (isAdmin) {
        const reqs = await api.get('/requests');
        setPending(reqs.data.filter((r) => r.status === 'Pending'));
        const vols = await api.get('/volunteers');
        setVolunteers(vols.data);
      }
    } catch (err) {
      setMsg('Could not load data');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const suggest = async (requestId) => {
    try {
      const res = await api.post('/volunteers/match', { request_id: requestId });
      setSuggestions({ ...suggestions, [requestId]: res.data });
      if (res.data.length > 0) {
        setChoice({ ...choice, [requestId]: res.data[0].id });
      }
      setMsg('AI ranked the volunteers. The best match is selected.');
    } catch (err) {
      setMsg('AI service is not running');
    }
  };

  const assign = async (requestId) => {
    const volunteerId = choice[requestId];
    if (!volunteerId) {
      setMsg('Please select a volunteer first');
      return;
    }
    try {
      await api.post('/tasks', { request_id: requestId, volunteer_id: volunteerId });
      setMsg('Task assigned');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not assign');
    }
  };

  const updateStatus = async (id, status) => {
    await api.put('/tasks/' + id + '/status', { status: status });
    load();
  };

  return (
    <div>
      <h1>{isAdmin ? 'Assign Tasks' : 'My Tasks'}</h1>
      {msg && <p className="info">{msg}</p>}

      {isAdmin && (
        <div className="card">
          <h3>Pending Requests</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Urgency</th>
                  <th>City</th>
                  <th>Message</th>
                  <th>Volunteer</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.length === 0 && (
                  <tr><td colSpan="6">No pending requests</td></tr>
                )}
                {pending.map((r) => (
                  <tr key={r.id}>
                    <td>{r.need_type}</td>
                    <td><span className={'badge ' + r.urgency}>{r.urgency}</span></td>
                    <td>{r.city}</td>
                    <td>{r.message}</td>
                    <td>
                      <select
                        value={choice[r.id] || ''}
                        onChange={(e) => setChoice({ ...choice, [r.id]: e.target.value })}
                      >
                        <option value="">Select volunteer</option>
                        {volunteers.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} ({v.skills || 'no skills'}, {v.city || 'no city'}, {v.availability || 'Available'})
                          </option>
                        ))}
                      </select>
                      {suggestions[r.id] && (
                        <div style={{ marginTop: 8, fontSize: 13 }}>
                          <b>AI ranking:</b>
                          {suggestions[r.id].map((s, i) => (
                            <div key={s.id}>
                              {i + 1}. {s.name} - {s.score}% match ({s.skills || 'no skills'}, {s.city || 'no city'}, {s.availability})
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <button className="btn small" style={{ marginBottom: 6 }} onClick={() => suggest(r.id)}>Suggest (AI)</button>
                      <br />
                      <button className="btn small" onClick={() => assign(r.id)}>Assign</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <h3>{isAdmin ? 'All Assigned Tasks' : 'Tasks Assigned To Me'}</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {isAdmin && <th>Volunteer</th>}
                <th>Type</th>
                <th>Urgency</th>
                <th>Message</th>
                {!isAdmin && <th>Needy Person</th>}
                {!isAdmin && <th>Phone</th>}
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 && (
                <tr><td colSpan="7">No tasks yet</td></tr>
              )}
              {tasks.map((t) => (
                <tr key={t.id}>
                  {isAdmin && <td>{t.volunteer_name}</td>}
                  <td>{t.need_type}</td>
                  <td><span className={'badge ' + t.urgency}>{t.urgency}</span></td>
                  <td>{t.message}</td>
                  {!isAdmin && <td>{t.needy_name}</td>}
                  {!isAdmin && <td>{t.needy_phone}</td>}
                  <td>
                    {isAdmin ? (
                      t.status
                    ) : (
                      <select value={t.status} onChange={(e) => updateStatus(t.id, e.target.value)}>
                        <option>Assigned</option>
                        <option>In Progress</option>
                        <option>Done</option>
                      </select>
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