import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Gift, HeartHandshake, LifeBuoy, ShieldAlert, User } from 'lucide-react';
import api from '../api';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { useLiveReload } from '../SocketContext';
import ReliefTransparency from '../components/ReliefTransparency';

const nextByRole = {
  admin: [
    { to: '/dashboard/crises', icon: ShieldAlert, titleKey: 'dash.next.crisis', hintKey: 'dash.next.crisisHint' },
    { to: '/dashboard/tasks', icon: ClipboardList, titleKey: 'dash.next.assign', hintKey: 'dash.next.assignHint' },
    { to: '/dashboard/requests', icon: LifeBuoy, titleKey: 'dash.next.requests', hintKey: 'dash.next.requestsHint' },
    { to: '/dashboard/donations', icon: Gift, titleKey: 'dash.next.donations', hintKey: 'dash.next.donationsHint' },
  ],
  donor: [
    { to: '/dashboard/donations', icon: Gift, titleKey: 'dash.next.give', hintKey: 'dash.next.giveHint' },
  ],
  volunteer: [
    { to: '/dashboard/tasks', icon: ClipboardList, titleKey: 'dash.next.myTasks', hintKey: 'dash.next.myTasksHint' },
    { to: '/dashboard/profile', icon: User, titleKey: 'dash.next.skills', hintKey: 'dash.next.skillsHint' },
  ],
  needy: [
    { to: '/dashboard/requests', icon: HeartHandshake, titleKey: 'dash.next.ask', hintKey: 'dash.next.askHint' },
  ],
};

export default function DashboardHome() {
  const { user } = useAuth();
  const { t, tName } = useLanguage();
  const [stats, setStats] = useState([]);
  const [crises, setCrises] = useState([]);
  const [transparency, setTransparency] = useState(null);
  const nextSteps = nextByRole[user.role] || [];

  const load = () => {
    api.get('/dashboard/stats').then((res) => setStats(res.data)).catch(() => {});
    api.get('/dashboard/transparency').then((res) => setTransparency(res.data)).catch(() => {});
    api
      .get('/crises')
      .then((res) => setCrises(res.data.filter((c) => c.status === 'Active').slice(0, 5)))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  useLiveReload(
    ['crisis:updated', 'request:created', 'request:updated', 'donation:created', 'task:assigned', 'task:updated'],
    load
  );

  return (
    <div className="dash-home">
      <h1>{tName('dash.welcome', { name: user.name })}</h1>
      <p className="page-intro">{t('dash.intro.' + user.role)}</p>

      {nextSteps.length > 0 && (
        <section>
          <h3 className="section-label">{t('dash.nextTitle')}</h3>
          <div className="next-grid">
            {nextSteps.map((step) => {
              const Icon = step.icon;
              return (
                <Link to={step.to} className="next-card" key={step.to}>
                  <div className="next-icon"><Icon size={20} /></div>
                  <strong>{t(step.titleKey)}</strong>
                  <span>{t(step.hintKey)}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="stats quiet">
        {stats.map((s) => (
          <div className="card" key={s.label}>
            <h3>{t('stats.' + s.label, s.label)}</h3>
            <p className="big-number">{s.value}</p>
          </div>
        ))}
      </div>

      {(user.role === 'admin' || user.role === 'donor') && (
        <ReliefTransparency data={transparency} />
      )}

      <div className="card">
        <h3>{t('dash.latestCrises')}</h3>
        <p className="card-hint">{t('dash.latestHint')}</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('col.title')}</th>
                <th>{t('col.location')}</th>
                <th>{t('col.severity')}</th>
              </tr>
            </thead>
            <tbody>
              {crises.length === 0 && (
                <tr><td colSpan="3">{t('dash.noCrises')}</td></tr>
              )}
              {crises.map((c) => (
                <tr key={c.id}>
                  <td>{c.title}</td>
                  <td>{c.location}</td>
                  <td><span className={'badge ' + c.severity}>{t('severity.' + c.severity, c.severity)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
