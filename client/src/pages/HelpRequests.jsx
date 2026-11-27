import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import HelpChat from '../components/HelpChat';
import LocationMapPicker from '../components/LocationMapPicker';
import VoiceMicButton from '../components/VoiceMicButton';
import ReliefMapView from '../components/ReliefMapView';
import { hasCoords } from '../utils/pakistanCities';
import { useLiveReload } from '../SocketContext';

export default function HelpRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ need_type: 'Food', urgency: 'Low', city: '', message: '', lat: null, lng: null });
  const [msg, setMsg] = useState(null);

  const isAdmin = user.role === 'admin';

  const load = async () => {
    try {
      const url = isAdmin ? '/requests' : '/requests/my';
      const res = await api.get(url);
      setRequests(res.data);
    } catch (err) {
      setMsg({ text: 'Could not load requests' });
    }
  };

  useLiveReload(['request:created', 'request:updated', 'task:assigned'], load);

  useEffect(() => {
    load();
    if (user.role === 'needy') {
      api.get('/auth/me').then((res) => {
        if (res.data.city) {
          setForm((prev) => ({ ...prev, city: prev.city || res.data.city }));
        }
      }).catch(() => {});
    }
  }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submitRequest = async () => {
    try {
      await api.post('/requests', form);
      setForm({ need_type: 'Food', urgency: 'Low', city: form.city, message: '', lat: form.lat, lng: form.lng });
      setMsg({ text: 'Request submitted' });
      load();
      return true;
    } catch (err) {
      const data = err.response?.data || {};
      if (err.response?.status === 409 || data.duplicate) {
        setMsg({
          kind: 'duplicate',
          text: data.message || 'A similar request is already in progress.',
          ur: data.message_ur || 'اسی طرح کی ایک درخواست پہلے سے زیرِ عمل ہے۔',
        });
        return false;
      }
      const raw = data.message;
      setMsg({
        text: typeof raw === 'string' ? raw : 'Failed to submit. Please try again.',
      });
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitRequest();
  };

  const updateStatus = async (id, status) => {
    await api.put('/requests/' + id + '/status', { status: status });
    load();
  };

  return (
    <div>
      <h1>Help Requests</h1>
      <p className="page-intro">Ask in Urdu or English. If a similar request is already open, CareConnect will tell you instead of creating a duplicate.</p>
      {msg && (
        <div className={'info' + (msg.kind === 'duplicate' ? ' alert-warn' : '')}>
          <strong>{msg.text}</strong>
          {msg.ur && <span className="alert-ur" dir="rtl">{msg.ur}</span>}
        </div>
      )}

      <ReliefMapView
        title="Mapped help requests"
        markers={requests.filter(hasCoords).map((r) => ({
          id: r.id,
          lat: r.lat,
          lng: r.lng,
          title: (r.need_type || 'Help') + ' request',
          subtitle: [r.city, r.needy_name].filter(Boolean).join(' · '),
          kind: 'request',
          severity: r.urgency,
        }))}
      />

      {user.role === 'needy' && (
        <div className="help-layout">
          <HelpChat form={form} setForm={setForm} onConfirmSubmit={submitRequest} />

          <div className="card">
            <h3>Submit a Help Request</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">Need type</span>
                  <select name="need_type" value={form.need_type} onChange={change}>
                    <option>Food</option>
                    <option>Medical</option>
                    <option>Shelter</option>
                    <option>Education</option>
                    <option>Other</option>
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">Urgency</span>
                  <select name="urgency" value={form.urgency} onChange={change}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">City</span>
                  <input name="city" placeholder="City" value={form.city} onChange={change} />
                </label>
              </div>
              <label className="field-label">Message</label>
              <div className="voice-field">
                <textarea
                  name="message"
                  placeholder="Describe what you need"
                  value={form.message}
                  onChange={change}
                  rows="4"
                  required
                  dir={/[\u0600-\u06FF]/.test(form.message) ? 'rtl' : 'ltr'}
                />
                <VoiceMicButton
                  onTranscript={(text) => {
                    setForm((prev) => ({
                      ...prev,
                      message: prev.message ? prev.message + ' ' + text : text,
                    }));
                  }}
                />
              </div>
              <LocationMapPicker
                lat={form.lat}
                lng={form.lng}
                onChange={({ lat, lng, label }) => {
                  setForm((prev) => ({
                    ...prev,
                    lat: lat,
                    lng: lng,
                    city: prev.city || label || prev.city,
                  }));
                }}
              />
              <button type="submit" className="btn">Submit Request</button>
            </form>
          </div>
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
                  <td>
                    {r.city}
                    {hasCoords(r) && (
                      <div className="coord-hint">{Number(r.lat).toFixed(4)}, {Number(r.lng).toFixed(4)}</div>
                    )}
                  </td>
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
