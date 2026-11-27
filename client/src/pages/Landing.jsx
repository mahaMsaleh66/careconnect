import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import PublicNav from '../components/PublicNav';
import { crisisThemes, highlightCards } from '../content/landing';

const roleKeys = [
  { key: 'admins', to: '/explore/administrators', accent: 'accent-navy' },
  { key: 'donors', to: '/explore/donors', accent: 'accent-terracotta' },
  { key: 'volunteers', to: '/explore/volunteers', accent: 'accent-teal' },
  { key: 'needy', to: '/explore/needy', accent: 'accent-amber' },
];

const crisisAccent = {
  'flood-sindh': 'accent-terracotta',
  'earthquake-response': 'accent-navy',
  'pandemic-health': 'accent-teal',
  'nationwide-relief': 'accent-amber',
};

const scopeItems = [
  { labelKey: 'filter.Earthquake', to: '/explore/earthquake-response' },
  { labelKey: 'filter.Pandemic', to: '/explore/pandemic-health' },
  { labelKey: 'filter.Flood', to: '/flood-sindh' },
  { labelKey: 'filter.Fire', to: '/explore/nationwide-relief' },
  { labelKey: 'filter.Hunger', to: '/explore/nationwide-relief' },
];

export default function Landing() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const tiles = highlightCards.filter((c) => c.slug !== 'flood-sindh');

  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="lp">
      <PublicNav />

      <section className="lp-hero photo">
        <img
          className="lp-hero-photo"
          src="/sindh-flood-hero.jpg"
          alt="Village in Sindh standing in floodwater during the 2022 Pakistan floods"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="lp-hero-scrim" aria-hidden="true" />
        <div className="lp-container lp-hero-copy">
          <p className="lp-kicker">{t('landing.pill')}</p>
          <h1>
            {t('landing.heroTitleBefore')} {t('landing.heroTitleEm')}{' '}
            {t('landing.heroTitleAfter')}
          </h1>
          <p className="lp-lead">{t('landing.heroLead')}</p>
          <ul className="lp-hero-types">
            {scopeItems.map((item) => (
              <li key={item.labelKey}>
                <Link to={item.to}>{t(item.labelKey)}</Link>
              </li>
            ))}
          </ul>
          <div className="lp-cta">
            {user ? (
              <>
                <Link to="/dashboard" className="lp-btn accent">{t('landing.goDashboard')}</Link>
                <Link to="/flood-sindh" className="lp-btn ghost">{t('landing.floodBtn')}</Link>
              </>
            ) : (
              <>
                <Link to="/register" className="lp-btn accent">{t('landing.getStarted')}</Link>
                <Link to="/login" className="lp-btn ghost">{t('nav.login')}</Link>
                <Link to="/flood-sindh" className="lp-text-link">{t('landing.floodBtn')}</Link>
              </>
            )}
          </div>
          <dl className="lp-facts">
            <div>
              <dt>{t('landing.statRoles')}</dt>
              <dd>4</dd>
            </div>
            <div>
              <dt>{t('landing.statModels')}</dt>
              <dd>4</dd>
            </div>
            <div>
              <dt>{t('landing.statSindh')}</dt>
              <dd>{t('landing.statPakistan')}</dd>
            </div>
          </dl>
          <p className="lp-hero-credit">{t('landing.photoCredit')}</p>
        </div>
      </section>

      <section className="lp-section" id="how">
        <div className="lp-container">
          <header className="lp-head left">
            <h2>{t('landing.howTitle')}</h2>
            <p>{t('landing.howLead')}</p>
          </header>
          <ol className="lp-steps lp-how-strip">
            {[1, 2, 3].map((n) => (
              <li className="lp-step" key={n}>
                <span className="lp-step-num">0{n}</span>
                <h3>{t('step.' + n + '.title')}</h3>
                <p>{t('step.' + n + '.text')}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="lp-section alt" id="explore">
        <div className="lp-container">
          <header className="lp-head left">
            <h2>{t('landing.crisisTypesTitle')}</h2>
            <p>{t('landing.crisisTypesLead')}</p>
          </header>
          <div className="lp-crisis-grid">
            {crisisThemes.map((theme) => (
              <Link to={theme.to} className={'lp-crisis-card ' + (crisisAccent[theme.slug] || 'accent-navy')} key={theme.slug}>
                <span className="lp-kicker">
                  {theme.slug === 'flood-sindh' ? t('landing.caseStudy') : t('landing.crisisType')}
                </span>
                <h3>{t('tile.' + theme.slug + '.title')}</h3>
                <p>{t('tile.' + theme.slug + '.text')}</p>
                <span className="lp-tile-go">{t('landing.openDesk')}</span>
              </Link>
            ))}
          </div>

          <header className="lp-head left">
            <h2>{t('landing.exploreTitle')}</h2>
            <p>{t('landing.exploreLead')}</p>
          </header>
          <div className="lp-link-list">
            {tiles.map((card) => (
              <Link to={card.to} key={card.slug}>
                <strong>{t('tile.' + card.slug + '.title')}</strong>
                <span>{t('tile.' + card.slug + '.text')}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section" id="roles">
        <div className="lp-container">
          <header className="lp-head left">
            <h2>{t('landing.rolesTitle')}</h2>
            <p>{t('landing.rolesLead')}</p>
          </header>
          <div className="lp-roles">
            {roleKeys.map((r) => (
              <Link className={'lp-role ' + r.accent} to={r.to} key={r.key}>
                <h3>{t('roleCard.' + r.key + '.title')}</h3>
                <p>{t('roleCard.' + r.key + '.text')}</p>
                <span className="lp-tile-go">{t('landing.viewRole')}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section alt" id="about">
        <div className="lp-container">
          <header className="lp-head left">
            <h2>{t('landing.aboutTitle')}</h2>
            <p>{t('landing.aboutLead')}</p>
          </header>
          <div className="lp-about">
            <div className="lp-about-card">
              <h3>{t('landing.problem')}</h3>
              <ul>
                <li>{t('landing.problem1')}</li>
                <li>{t('landing.problem2')}</li>
                <li>{t('landing.problem3')}</li>
                <li>{t('landing.problem4')}</li>
              </ul>
            </div>
            <div className="lp-about-card">
              <h3>{t('landing.solution')}</h3>
              <ul>
                <li>{t('landing.solution1')}</li>
                <li>{t('landing.solution2')}</li>
                <li>{t('landing.solution3')}</li>
                <li>{t('landing.solution4')}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section" id="donate">
        <div className="lp-container">
          <header className="lp-head left">
            <h2>{t('landing.donateTitle')}</h2>
            <p>{t('landing.donateLead')}</p>
          </header>
          <ol className="lp-steps">
            <li className="lp-step">
              <span className="lp-step-num">01</span>
              <h3>{t('landing.donateStep1Title')}</h3>
              <p>{t('landing.donateStep1')}</p>
            </li>
            <li className="lp-step">
              <span className="lp-step-num">02</span>
              <h3>{t('landing.donateStep2Title')}</h3>
              <p>{t('landing.donateStep2')}</p>
            </li>
            <li className="lp-step">
              <span className="lp-step-num">03</span>
              <h3>{t('landing.donateStep3Title')}</h3>
              <p>{t('landing.donateStep3')}</p>
            </li>
          </ol>
          <div className="lp-donate-cta">
            {user ? (
              <Link to="/dashboard/donations" className="lp-btn accent">{t('landing.donateOpen')}</Link>
            ) : (
              <Link to="/login" className="lp-btn accent">{t('landing.donateLogin')}</Link>
            )}
          </div>
        </div>
      </section>

      <section className="lp-section alt">
        <div className="lp-container">
          <header className="lp-head left">
            <h2>{t('landing.sdgTitle')}</h2>
          </header>
          <ul className="lp-sdg">
            <li>{t('landing.sdgPoverty')}</li>
            <li>{t('landing.sdgHunger')}</li>
            <li>{t('landing.sdgInequalities')}</li>
          </ul>
        </div>
      </section>

      <section className="lp-section lp-end-band">
        <div className="lp-container lp-end">
          <h2>{t('landing.ctaTitle')}</h2>
          <p>{t('landing.ctaLead')}</p>
          {user ? (
            <Link to="/dashboard" className="lp-btn accent">{t('landing.openDashboard')}</Link>
          ) : (
            <Link to="/register" className="lp-btn accent">{t('landing.createFree')}</Link>
          )}
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-container">
          {t('landing.footer1')}
          <br />
          {t('landing.footer2')}
        </div>
      </footer>
    </div>
  );
}
