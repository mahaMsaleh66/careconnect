import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const common = [
  { to: '/dashboard', label: 'Home', end: true },
  { to: '/dashboard/crises', label: 'Crises' },
  { to: '/dashboard/news', label: 'News' },
  { to: '/dashboard/feedback', label: 'Feedback' },
  { to: '/dashboard/account', label: 'My Account' },
];

const menus = {
  admin: [
    ...common,
    { to: '/dashboard/donations', label: 'Donations' },
    { to: '/dashboard/requests', label: 'Help Requests' },
    { to: '/dashboard/tasks', label: 'Assign Tasks' },
    { to: '/dashboard/users', label: 'Users' },
    { to: '/dashboard/reports', label: 'Reports' },
  ],
  donor: [...common, { to: '/dashboard/donations', label: 'Donations' }],
  volunteer: [
    ...common,
    { to: '/dashboard/profile', label: 'Skills Profile' },
    { to: '/dashboard/tasks', label: 'My Tasks' },
  ],
  needy: [...common, { to: '/dashboard/requests', label: 'Help Requests' }],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = menus[user.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>CareConnect</h2>
        <div className="user-info">
          {user.name}
          <br />
          ({user.role})
        </div>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end}>
            {l.label}
          </NavLink>
        ))}
        <button onClick={handleLogout}>Logout</button>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}