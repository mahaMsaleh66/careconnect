import { useEffect, useState } from 'react';
import { Droplets } from 'lucide-react';
import api from '../api';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { useLiveReload } from '../SocketContext';
import LocationMapPicker from '../components/LocationMapPicker';
import ReliefMapView from '../components/ReliefMapView';
import TranslateButton from '../components/TranslateButton';
import SpeakButton from '../components/SpeakButton';
import { PAKISTAN_CITIES, SINDH_CENTER, hasCoords } from '../utils/pakistanCities';

const emptyForm = {
  title: '',
  district: 'Dadu',
  severity: 'Warning',
  water_level: '',
  description: '',
  lat: 26.7329,
  lng: 67.7791,
};

function alertSpeech(alert) {
  return [alert.title, alert.district, alert.severity, alert.water_level, alert.description]
    .filter(Boolean)
    .join('. ');
}

function floodMapSeverity(level) {
  if (level === 'Emergency') return 'Emergency';
  if (level === 'Advisory') return 'Advisory';
  return 'Warning';
}

export default function FloodMonitor() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isAdmin = user.role === 'admin';
  const [alerts, setAlerts] = useState([]);
  const [crises, setCrises] = useState([]);
  const [feed, setFeed] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState('');
  const [loadingFeed, setLoadingFeed] = useState(false);

  const load = async () => {
    try {
      const alertRes = await api.get('/flood/alerts');
      setAlerts(alertRes.data || []);
    } catch (err) {
      setMsg('Could not load flood alerts');
    }
    try {
      const crisisRes = await api.get('/crises');
      setCrises((crisisRes.data || []).filter((c) => c.type === 'Flood' && c.status === 'Active'));
    } catch (err) {
      setCrises([]);
    }
  };

  const loadFeed = async () => {
    setLoadingFeed(true);
    try {
      const res = await api.get('/flood/live-feed');
      setFeed(res.data || []);
      setMsg('');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not fetch live flood reports');
    }
    setLoadingFeed(false);
  };

  useEffect(() => {
    load();
    loadFeed();
  }, []);

  useLiveReload(['flood:alert', 'flood:volunteer_alert', 'crisis:updated'], load);

  const change = (e) => {
    const next = { ...form, [e.target.name]: e.target.value };
    if (e.target.name === 'district') {
      const city = PAKISTAN_CITIES.find((c) => c.name === e.target.value);
      if (city) {
        next.lat = city.lat;
        next.lng = city.lng;
      }
    }
    setForm(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/flood/alerts', form);
      setForm({ ...emptyForm, district: form.district, lat: form.lat, lng: form.lng });
      setMsg('Flood alert issued');
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not issue alert');
    }
  };

  const resolve = async (id) => {
    await api.put('/flood/alerts/' + id + '/resolve');
    load();
  };

  const active = alerts.filter((a) => a.status === 'Active');
  const emergencies = active.filter((a) => a.severity === 'Emergency');
  const warnings = active.filter((a) => a.severity === 'Warning');

  const markers = [
    ...active.filter(hasCoords).map((a) => ({
      id: 'alert-' + a.id,
      lat: a.lat,
      lng: a.lng,
      title: a.title,
      subtitle: [a.district, a.severity, a.water_level].filter(Boolean).join(' · '),
      kind: 'flood',
      severity: floodMapSeverity(a.severity),
    })),
    ...crises.filter(hasCoords).map((c) => ({
      id: 'crisis-' + c.id,
      lat: c.lat,
      lng: c.lng,
      title: c.title,
      subtitle: [c.location, c.severity].filter(Boolean).join(' · '),
      kind: 'crisis',
      severity: c.severity,
    })),
  ];

  return (
    <div>
      <h1><Droplets size={26} /> {t('page.flood')}</h1>
      {msg && <p className="info">{msg}</p>}

      {active.length > 0 ? (
        <div className={'flood-banner ' + (emergencies.length ? 'Emergency' : warnings.length ? 'Warning' : 'Advisory')}>
          <div className="flood-banner-head">
            <strong>{t('flood.banner')}</strong>
            <SpeakButton text={active.map(alertSpeech).join('. ')} />
          </div>
          <p>
            {emergencies.length > 0 && (
              <span>Emergency: {emergencies.map((a) => a.district).join(', ')}. </span>
            )}
            {warnings.length > 0 && (
              <span>Warning: {warnings.map((a) => a.district).join(', ')}. </span>
            )}
            {active.filter((a) => a.severity === 'Advisory').length > 0 && (
              <span>
                Advisory: {active.filter((a) => a.severity === 'Advisory').map((a) => a.district).join(', ')}.
              </span>
            )}
          </p>
        </div>
      ) : (
        <p className="info">{t('flood.none')}</p>
      )}

      <ReliefMapView title={t('flood.map')} markers={markers} center={SINDH_CENTER} />

      {isAdmin && (
        <div className="card">
          <h3>{t('flood.issue')}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <input name="title" placeholder="Title (optional)" value={form.title} onChange={change} />
              <select name="district" value={form.district} onChange={change}>
                {PAKISTAN_CITIES.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
              <select name="severity" value={form.severity} onChange={change}>
                <option>Advisory</option>
                <option>Warning</option>
                <option>Emergency</option>
              </select>
              <input
                name="water_level"
                placeholder="Water level / rainfall note"
                value={form.water_level}
                onChange={change}
              />
            </div>
            <textarea
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={change}
              rows="3"
            />
            <LocationMapPicker
              lat={form.lat}
              lng={form.lng}
              onChange={({ lat, lng, label }) => {
                setForm((prev) => ({
                  ...prev,
                  lat: lat,
                  lng: lng,
                  district: prev.district || label || prev.district,
                }));
              }}
            />
            <button type="submit" className="btn">{t('flood.issue')}</button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>{t('flood.activeList')}</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>District</th>
                <th>Severity</th>
                <th>Water level</th>
                <th>Status</th>
                {isAdmin && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 && (
                <tr><td colSpan={isAdmin ? 6 : 5}>{t('flood.none')}</td></tr>
              )}
              {alerts.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.title}
                    {a.description && <div className="crisis-desc">{a.description}</div>}
                    {a.status === 'Active' && <SpeakButton text={alertSpeech(a)} />}
                  </td>
                  <td>{a.district}</td>
                  <td><span className={'badge ' + a.severity}>{a.severity}</span></td>
                  <td>{a.water_level || '—'}</td>
                  <td>{a.status}</td>
                  {isAdmin && (
                    <td>
                      {a.status === 'Active' && (
                        <button type="button" className="btn small" onClick={() => resolve(a.id)}>
                          {t('flood.resolve')}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="map-picker-head">
          <h3>{t('flood.live')}</h3>
          <button type="button" className="btn small" onClick={loadFeed} disabled={loadingFeed}>
            {loadingFeed ? 'Fetching…' : 'Refresh feed'}
          </button>
        </div>
        {feed.length === 0 && <p className="map-note">No live flood headlines yet.</p>}
        {feed.map((item, i) => (
          <div className="flood-feed-item" key={i}>
            <div>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noreferrer">{item.headline}</a>
              ) : (
                <strong>{item.headline}</strong>
              )}
              <div className="coord-hint">
                {item.source || 'GDELT'}
                {item.district ? ' · ' + item.district : ''}
                {item.category ? ' · ' + item.category : ''}
              </div>
              <div className="voice-inline">
                <TranslateButton text={item.headline} />
                <SpeakButton text={item.headline} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
