import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Droplets, Gift, HeartHandshake, LifeBuoy, MapPin } from 'lucide-react';
import PublicNav from '../components/PublicNav';
import { useAuth } from '../AuthContext';
import { floodAreas } from '../content/landing';
import api from '../api';

export default function FloodSindh() {
  const { user } = useAuth();
  const start = user ? '/dashboard' : '/register';
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    api.get('/flood/alerts')
      .then((res) => setAlerts((res.data || []).filter((a) => a.status === 'Active')))
      .catch(() => setAlerts([]));
  }, []);

  return (
    <div className="lp">
      <PublicNav active="flood" />

      <section className="dp-hero flood">
        <div className="lp-container">
          <Link to="/" className="dp-back"><ArrowLeft size={16} /> Back to landing</Link>
          <div className="lp-pill"><Droplets size={14} /> Case study · Sindh floods</div>
          <h1>Flood Sindh</h1>
          <p>
            A sample desk after Sindh’s recent major floods — not the whole of CareConnect.
            Monsoon flooding displaces families and cuts people off from food, water and clinics.
            The same platform also coordinates earthquakes, outbreaks, fires and hunger across
            every province of Pakistan, in Urdu as well as English.
          </p>
          <div className={'flood-public-strip ' + (alerts.length ? (alerts.some((a) => a.severity === 'Emergency') ? 'Emergency' : 'Warning') : 'empty')}>
            <strong>Live CareConnect flood alerts</strong>
            {alerts.length === 0 ? (
              <p>No active flood alerts right now. Administrators post warnings from the Flood Monitor when rivers rise.</p>
            ) : (
              <ul>
                {alerts.slice(0, 6).map((a) => (
                  <li key={a.id}>
                    <span className={'badge ' + a.severity}>{a.severity}</span>
                    {' '}{a.district}{a.water_level ? ' · ' + a.water_level : ''}
                  </li>
                ))}
              </ul>
            )}
            {user && <Link to="/dashboard/flood" className="lp-btn ghost">Open Flood Monitor</Link>}
          </div>
          <div className="lp-cta">
            <Link to={user ? '/dashboard/requests' : '/register'} className="lp-btn primary">Request help</Link>
            <Link to={user ? '/dashboard/donations' : '/register'} className="lp-btn ghost">Donate</Link>
            <Link to={user ? '/dashboard/profile' : '/register'} className="lp-btn ghost">Volunteer</Link>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-head">
            <h2>What this page is for</h2>
            <p>
              This is the public Flood Sindh case study for the FYP. Live case data is entered by
              administrators as Flood crises; people in need submit requests; donors and volunteers
              act from their dashboards. Other crisis types use the same desks nationwide.
            </p>
          </div>
          <div className="dp-actions-grid">
            <div className="dp-action">
              <LifeBuoy size={22} />
              <h3>Need help</h3>
              <p>Describe food, water, shelter or medical need in Urdu or Roman Urdu. The assistant detects urgency.</p>
              <Link to={start}>Open help request →</Link>
            </div>
            <div className="dp-action">
              <Gift size={22} />
              <h3>Donate</h3>
              <p>Record a gift toward a flood crisis or the general relief fund and print a CareConnect receipt.</p>
              <Link to={user ? '/dashboard/donations' : '/register'}>Give toward relief →</Link>
            </div>
            <div className="dp-action">
              <HeartHandshake size={22} />
              <h3>Volunteer</h3>
              <p>Share skills and city. Admins match you to nearby flood-related requests.</p>
              <Link to={user ? '/dashboard/profile' : '/register'}>Join as volunteer →</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section alt">
        <div className="lp-container">
          <div className="lp-head">
            <h2>Districts often hit in Sindh floods</h2>
            <p>Use these as the city on a help request or volunteer profile so matching stays local.</p>
          </div>
          <div className="dp-areas">
            {floodAreas.map((a) => (
              <div className="dp-area" key={a.name}>
                <MapPin size={16} />
                <div>
                  <strong>{a.name}</strong>
                  <span>{a.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container dp-split">
          <div>
            <h2>How CareConnect responds</h2>
            <ul className="dp-list">
              <li>An admin records a flood crisis. AI suggests Low, Medium or High severity from people affected and the description.</li>
              <li>Families message the Urdu assistant; the platform stores need type, urgency and city.</li>
              <li>Donors attach gifts to that crisis and keep a receipt number for follow-up.</li>
              <li>Volunteers in the same district are ranked first for assignment.</li>
            </ul>
          </div>
          <div className="dp-note">
            <h3>CareConnect flood alerts</h3>
            <p>
              Administrators issue Advisory / Warning / Emergency alerts with map pins and live GDELT
              flood headlines. Official PDMA / NDMA ingest can still be added later.
            </p>
            <Link to="/explore/welfare-news" className="lp-btn ghost">How news filtering works</Link>
          </div>
        </div>
      </section>

      <section className="lp-container" style={{ paddingBottom: 84 }}>
        <div className="lp-cta-band">
          <h2>Help from where you are</h2>
          <p>Register as a donor, volunteer or person in need — for Sindh floods or any other crisis in Pakistan. Administrators already have a seeded login for the demo.</p>
          <Link to={start} className="lp-btn light">{user ? 'Open Dashboard' : 'Create a free account'}</Link>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-container">
          CareConnect · Flood Sindh case study · Final Year Project 2026 · University of Sindh, Jamshoro
        </div>
      </footer>
    </div>
  );
}
