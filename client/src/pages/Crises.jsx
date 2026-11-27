import { useEffect, useMemo, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import TranslateButton from '../components/TranslateButton';
import LocationMapPicker from '../components/LocationMapPicker';
import ReliefMapView from '../components/ReliefMapView';
import CrisisTypeFilter, { matchesCrisisFilter } from '../components/CrisisTypeFilter';
import { hasCoords } from '../utils/pakistanCities';
import { useLiveReload } from '../SocketContext';

const emptyForm = {
  title: '',
  type: 'Flood',
  location: '',
  affected_people: '',
  description: '',
  severity: 'Low',
  lat: null,
  lng: null,
};

const CRISIS_TYPES = ['Flood', 'Earthquake', 'Pandemic', 'Hunger', 'Medical', 'Fire', 'Other'];

export default function Crises() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [crises, setCrises] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const load = async () => {
    try {
      const res = await api.get('/crises');
      setCrises(res.data);
      setMsg((prev) => (prev === 'Could not load crises' ? '' : prev));
      if (user.role === 'admin') {
        const reqs = await api.get('/requests');
        setRequests(reqs.data);
      }
    } catch (err) {
      setMsg('Could not load crises');
    }
  };

  useEffect(() => {
    load();
  }, []);

  useLiveReload(['crisis:updated', 'request:created', 'request:updated'], load);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const visibleCrises = useMemo(
    () => crises.filter((c) => matchesCrisisFilter(c.type, typeFilter)),
    [crises, typeFilter]
  );

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

  const crisisMarkers = visibleCrises.filter(hasCoords).map((c) => ({
    id: c.id,
    lat: c.lat,
    lng: c.lng,
    title: c.title,
    subtitle: [c.location, c.type].filter(Boolean).join(' · '),
    kind: 'crisis',
    severity: c.severity,
  }));
  const requestMarkers = (typeFilter === 'All' ? requests : []).filter(hasCoords).map((r) => ({
    id: r.id,
    lat: r.lat,
    lng: r.lng,
    title: (r.need_type || 'Help') + ' request',
    subtitle: [r.city, r.needy_name].filter(Boolean).join(' · '),
    kind: 'request',
    severity: r.urgency,
  }));

  return (
    <div>
      <h1>{t('page.crises')}</h1>
      {msg && <p className="info">{msg}</p>}

      <ReliefMapView
        title={t('crises.map')}
        markers={[...crisisMarkers, ...requestMarkers]}
        toolbar={<CrisisTypeFilter value={typeFilter} onChange={setTypeFilter} />}
      />

      {user.role === 'admin' && (
        <div className="card">
          <h3>Add New Crisis</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <input name="title" placeholder="Title" value={form.title} onChange={change} required />
              <select name="type" value={form.type} onChange={change}>
                {CRISIS_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
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
            <LocationMapPicker
              lat={form.lat}
              lng={form.lng}
              onChange={({ lat, lng, label }) => {
                setForm((prev) => ({
                  ...prev,
                  lat: lat,
                  lng: lng,
                  location: prev.location || label || prev.location,
                }));
              }}
            />
            <button type="button" className="btn" style={{ marginRight: 8 }} onClick={predict}>Predict Severity (AI)</button>
            <button type="submit" className="btn">Save Crisis</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-toolbar">
          <h3>{typeFilter === 'All' ? t('crises.all') : typeFilter}</h3>
          <CrisisTypeFilter value={typeFilter} onChange={setTypeFilter} />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('col.title')}</th>
                <th>{t('col.description')}</th>
                <th>{t('col.type')}</th>
                <th>{t('col.location')}</th>
                <th>{t('col.affected')}</th>
                <th>{t('col.severity')}</th>
                <th>{t('col.status')}</th>
                {user.role === 'admin' && <th>{t('col.action')}</th>}
              </tr>
            </thead>
            <tbody>
              {visibleCrises.length === 0 && (
                <tr>
                  <td colSpan="8">{t('crises.none')}</td>
                </tr>
              )}
              {visibleCrises.map((c) => (
                <tr key={c.id}>
                  <td>{c.title}</td>
                  <td>
                    <div className="crisis-desc">{c.description || '—'}</div>
                    <TranslateButton text={c.description} />
                  </td>
                  <td>{c.type}</td>
                  <td>
                    {c.location}
                    {hasCoords(c) && (
                      <div className="coord-hint">{Number(c.lat).toFixed(4)}, {Number(c.lng).toFixed(4)}</div>
                    )}
                  </td>
                  <td>{c.affected_people}</td>
                  <td><span className={'badge ' + c.severity}>{t('severity.' + c.severity, c.severity)}</span></td>
                  <td>{t('status.' + c.status, c.status)}</td>
                  {user.role === 'admin' && (
                    <td>
                      {c.status === 'Active' && (
                        <button className="btn small" onClick={() => resolve(c.id)}>{t('btn.resolve')}</button>
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
