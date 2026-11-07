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
  const [activeCrises, setActiveCrises] = useState(0);

  useEffect(() => {
    api
      .get('/crises')
      .then((res) => {
        setActiveCrises(res.data.filter((c) => c.status === 'Active').length);
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <p>{intro[user.role]}</p>
      <div className="card">
        <h3>Active Crises</h3>
        <p className="big-number">{activeCrises}</p>
      </div>
    </div>
  );
}