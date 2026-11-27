import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import { useLiveReload } from '../SocketContext';

function matchReason(person) {
  if (Array.isArray(person.reasons) && person.reasons.length) {
    return person.reasons.join(' • ');
  }
  return 'Suggested by AI';
}

function MatchList({ matches, selected, onSelect }) {
  if (!matches || matches.length === 0) {
    return <p className="card-hint">No volunteers ranked yet. Tap Suggest to rank them.</p>;
  }

  return (
    <div className="match-list">
      {matches.slice(0, 5).map((person, index) => {
        const active = String(selected) === String(person.id);
        const score = Math.round(Number(person.score) || 0);
        return (
          <button
            type="button"
            key={person.id}
            className={'match-card' + (active ? ' selected' : '') + (index === 0 ? ' best' : '')}
            onClick={() => onSelect(person.id)}
          >
            <span className="badge match-pct">{score}%</span>
            <div className="match-body">
              <strong>{person.name}</strong>
              <span>
                {person.city || 'No city'} · {person.skills || 'No skills listed'}
              </span>
              <p className="match-reason">{matchReason(person)}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

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

  useLiveReload(['task:assigned', 'task:updated', 'request:created', 'request:updated'], load);

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
      <p className="page-intro">
        {isAdmin
          ? 'Pick one pending request, let AI rank volunteers, then assign. Match score uses skills, city and availability.'
          : 'Update each task as you start and finish the work.'}
      </p>
      {msg && <p className="info">{msg}</p>}

      {isAdmin && (
        <div className="card">
          <h3>Pending requests</h3>
          <p className="card-hint">What to do next: suggest a match, check the score, then assign.</p>
          {pending.length === 0 && <p className="empty-note">No pending requests.</p>}
          <div className="assign-stack">
            {pending.map((r) => (
              <div className="assign-card" key={r.id}>
                <div className="assign-head">
                  <span className={'badge ' + r.urgency}>{r.urgency}</span>
                  <strong>{r.need_type}</strong>
                  <span>{r.city || 'No city yet'}</span>
                </div>
                <p className="assign-msg">{r.message}</p>
                <label className="field-label">Volunteer</label>
                <select
                  value={choice[r.id] || ''}
                  onChange={(e) => setChoice({ ...choice, [r.id]: e.target.value })}
                >
                  <option value="">Select volunteer</option>
                  {volunteers.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} — {v.city || 'no city'}
                    </option>
                  ))}
                </select>
                {suggestions[r.id] && (
                  <MatchList
                    matches={suggestions[r.id]}
                    selected={choice[r.id]}
                    onSelect={(id) => setChoice({ ...choice, [r.id]: id })}
                  />
                )}
                <div className="row-actions">
                  <button className="btn small" type="button" onClick={() => suggest(r.id)}>Suggest (AI)</button>
                  <button className="btn small" type="button" onClick={() => assign(r.id)}>Assign</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3>{isAdmin ? 'Assigned tasks' : 'Tasks assigned to me'}</h3>
        <p className="card-hint">
          {isAdmin ? 'A quieter list of work already given to volunteers.' : 'Mark a task In Progress, then Done when you finish.'}
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {isAdmin && <th>Volunteer</th>}
                <th>Type</th>
                <th>Urgency</th>
                <th>Message</th>
                {!isAdmin && <th>Person in need</th>}
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
