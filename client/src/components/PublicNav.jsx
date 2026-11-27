import { Link, useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import LanguageToggle from './LanguageToggle';

function NavItem({ to, hash, children, className }) {
  const { pathname } = useLocation();
  if (hash && pathname === '/') {
    return <a href={'#' + hash} className={className}>{children}</a>;
  }
  return <Link to={to} className={className}>{children}</Link>;
}

export default function PublicNav({ active }) {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <header className="lp-nav">
      <div className="lp-container lp-nav-inner">
        <Link to="/" className="lp-logo">
          <span className="lp-logo-icon"><Heart size={20} /></span>
          CareConnect
        </Link>
        <nav className="lp-links">
          <NavItem to="/#about" hash="about" className={active === 'about' ? 'is-active' : ''}>{t('nav.about')}</NavItem>
          <NavItem to="/#explore" hash="explore" className={active === 'explore' ? 'is-active' : ''}>{t('nav.explore')}</NavItem>
          <Link to="/flood-sindh" className={active === 'flood' ? 'is-active' : ''}>{t('nav.floodSindh')}</Link>
          <NavItem to="/#how" hash="how">{t('nav.how')}</NavItem>
        </nav>
        <div className="lp-actions">
          <LanguageToggle variant="light" />
          {user ? (
            <Link to="/dashboard" className="lp-btn primary">{t('nav.dashboard')}</Link>
          ) : (
            <>
              <Link to="/login" className="lp-btn ghost">{t('nav.login')}</Link>
              <Link to="/register" className="lp-btn primary">{t('nav.register')}</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
