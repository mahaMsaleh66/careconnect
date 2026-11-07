import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

const intro = {
  admin: 'Manage crises, requests, donations and volunteers.',
  donor: 'Donate to causes and track your contributions.',
  volunteer: 'See tasks assigned to you and manage your profile.',
  needy: 'Submit help requests and track their status.',
};

export default function DashboardHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState([]);
  const [crises, setCrises] = useState([]);

  useEffect(() => {
    api.get('/dashboard/stats').then((res) => setStats(res.data)).catch(() => {});
    api
      .get('/crises')
      .then((res) => setCrises(res.data.filter((c) => c.status === 'Active').slice(0, 5)))
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <p>{intro[user.role]}</p>

      <div className="stats">
        {stats.map((s) => (
          <div className="card" key={s.label}>
            <h3>{s.label}</h3>
            <p className="big-number">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Latest Active Crises</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Location</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {crises.length === 0 && (
                <tr><td colSpan="3">No active crises</td></tr>
              )}
              {crises.map((c) => (
                <tr key={c.id}>
                  <td>{c.title}</td>
                  <td>{c.location}</td>
                  <td><span className={'badge ' + c.severity}>{c.severity}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}