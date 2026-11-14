import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Home, ShieldAlert, Newspaper, MessageSquare, User, Gift,
  LifeBuoy, ClipboardList, Users, TrendingUp, Sparkles, Heart, LogOut,
} from 'lucide-react';
import { useAuth } from '../AuthContext';

const common = [
  { to: '/dashboard', label: 'Home', end: true, icon: Home },
  { to: '/dashboard/crises', label: 'Crises', icon: ShieldAlert },
  { to: '/dashboard/news', label: 'News', icon: Newspaper },
  { to: '/dashboard/feedback', label: 'Feedback', icon: MessageSquare },
  { to: '/dashboard/account', label: 'My Account', icon: User },
];

const menus = {
  admin: [
    ...common,
    { to: '/dashboard/donations', label: 'Donations', icon: Gift },
    { to: '/dashboard/requests', label: 'Help Requests', icon: LifeBuoy },
    { to: '/dashboard/tasks', label: 'Assign Tasks', icon: ClipboardList },
    { to: '/dashboard/users', label: 'Users', icon: Users },
    { to: '/dashboard/reports', label: 'Reports', icon: TrendingUp },
  ],
  donor: [...common, { to: '/dashboard/donations', label: 'Donations', icon: Gift }],
  volunteer: [
    ...common,
    { to: '/dashboard/profile', label: 'Skills Profile', icon: Sparkles },
    { to: '/dashboard/tasks', label: 'My Tasks', icon: ClipboardList },
  ],
  needy: [...common, { to: '/dashboard/requests', label: 'Help Requests', icon: LifeBuoy }],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = menus[user.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Heart size={20} /></div>
          CareConnect
        </div>
        <div className="user-info">
          <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
          <div>
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.role}</div>
          </div>
        </div>
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <NavLink key={l.to} to={l.to} end={l.end}>
              <Icon size={18} />
              <span>{l.label}</span>
            </NavLink>
          );
        })}
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          Logout
        </button>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}