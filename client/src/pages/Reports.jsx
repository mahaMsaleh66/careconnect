import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../api';

const COLORS = ['#0f766e', '#d97706', '#dc2626', '#2563eb', '#7c3aed', '#16a34a'];
const SEVERITY_COLORS = { Low: '#16a34a', Medium: '#d97706', High: '#dc2626' };

export default function Reports() {
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api
      .get('/reports/summary')
      .then((res) => setData(res.data))
      .catch(() => setMsg('Could not load report'));
  }, []);

  if (msg) return <p className="info">{msg}</p>;
  if (!data) return <p>Loading report...</p>;

  const totalUsers = data.users.reduce((s, u) => s + u.count, 0);
  const totalRequests = data.requests.reduce((s, r) => s + r.count, 0);

  return (
    <div>
      <h1>Reports and Analytics</h1>
      <button className="btn no-print" onClick={() => window.print()}>Print Report</button>

      <div className="stats">
        <div className="card">
          <h3>Total Users</h3>
          <p className="big-number">{totalUsers}</p>
        </div>
        <div className="card">
          <h3>Total Donated (PKR)</h3>
          <p className="big-number">{data.donationTotal.toLocaleString()}</p>
        </div>
        <div className="card">
          <h3>Active Crises</h3>
          <p className="big-number">{data.activeCrises}</p>
        </div>
        <div className="card">
          <h3>Help Requests</h3>
          <p className="big-number">{totalRequests}</p>
        </div>
      </div>

      <div className="charts">
        <div className="card">
          <h3>Users by Role</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={data.users}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="role" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0f766e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3>Crises by Severity</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.crises} dataKey="count" nameKey="severity" outerRadius={90} label>
                  {data.crises.map((c) => (
                    <Cell key={c.severity} fill={SEVERITY_COLORS[c.severity] || '#999'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3>Donations by Category (PKR)</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={data.donationsByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3>Help Requests by Status</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.requests} dataKey="count" nameKey="status" outerRadius={90} label>
                  {data.requests.map((r, i) => (
                    <Cell key={r.status} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}