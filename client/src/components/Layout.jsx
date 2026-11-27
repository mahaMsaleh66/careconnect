import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Home, ShieldAlert, Newspaper, MessageSquare, User, Gift,
  LifeBuoy, ClipboardList, Users, TrendingUp, Sparkles, Heart, LogOut, Wallet, Droplets,
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import LanguageToggle from './LanguageToggle';
import NotificationBell from './NotificationBell';

const common = [
  { to: '/dashboard', labelKey: 'nav.home', end: true, icon: Home },
  { to: '/dashboard/crises', labelKey: 'nav.crises', icon: ShieldAlert },
  { to: '/dashboard/flood', labelKey: 'nav.floodAlerts', icon: Droplets },
  { to: '/dashboard/news', labelKey: 'nav.news', icon: Newspaper },
  { to: '/dashboard/feedback', labelKey: 'nav.feedback', icon: MessageSquare },
  { to: '/dashboard/account', labelKey: 'nav.account', icon: User },
];

const menus = {
  admin: [
    ...common,
    { to: '/dashboard/donations', labelKey: 'nav.donations', icon: Gift },
    { to: '/dashboard/requests', labelKey: 'nav.requests', icon: LifeBuoy },
    { to: '/dashboard/tasks', labelKey: 'nav.tasks', icon: ClipboardList },
    { to: '/dashboard/users', labelKey: 'nav.users', icon: Users },
    { to: '/dashboard/payment-accounts', labelKey: 'nav.paymentAccounts', icon: Wallet },
    { to: '/dashboard/reports', labelKey: 'nav.reports', icon: TrendingUp },
  ],
  donor: [...common, { to: '/dashboard/donations', labelKey: 'nav.donations', icon: Gift }],
  volunteer: [
    ...common,
    { to: '/dashboard/profile', labelKey: 'nav.profile', icon: Sparkles },
    { to: '/dashboard/tasks', labelKey: 'nav.myTasks', icon: ClipboardList },
  ],
  needy: [...common, { to: '/dashboard/requests', labelKey: 'nav.requests', icon: LifeBuoy }],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
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
            <div className="user-role">{t('role.' + user.role, user.role)}</div>
          </div>
        </div>
        <LanguageToggle variant="dark" />
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <NavLink key={l.to} to={l.to} end={l.end}>
              <Icon size={18} />
              <span>{t(l.labelKey)}</span>
            </NavLink>
          );
        })}
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          {t('nav.logout')}
        </button>
      </aside>
      <main className="content">
        <header className="dash-header">
          <NotificationBell />
          <LanguageToggle variant="light" />
        </header>
        <Outlet />
      </main>
    </div>
  );
}
