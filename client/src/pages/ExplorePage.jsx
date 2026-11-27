import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import PublicNav from '../components/PublicNav';
import { useAuth } from '../AuthContext';
import { crisisThemes, explorePages, highlightCards } from '../content/landing';

export default function ExplorePage() {
  const { slug } = useParams();
  const { user } = useAuth();

  if (slug === 'flood-sindh') {
    return <Navigate to="/flood-sindh" replace />;
  }

  const page = explorePages[slug];
  if (!page) {
    return <Navigate to="/" replace />;
  }

  const related = [
    ...crisisThemes.filter((c) => c.slug !== slug),
    ...highlightCards.filter((c) => c.slug !== slug && !crisisThemes.some((theme) => theme.slug === c.slug)),
  ].slice(0, 4);
  const ctaTo = user || !page.cta.to.startsWith('/dashboard') ? page.cta.to : '/login';

  return (
    <div className="lp">
      <PublicNav active="explore" />

      <section className="dp-hero">
        <div className="lp-container">
          <nav className="dp-crumb">
            <Link to="/">Landing</Link>
            <span>/</span>
            <Link to="/#explore">Explore</Link>
            <span>/</span>
            <span>{page.title}</span>
          </nav>
          <Link to="/" className="dp-back"><ArrowLeft size={16} /> Back to landing</Link>
          <div className="lp-pill">{page.badge}</div>
          <h1>{page.title}</h1>
          <p className="dp-kicker">{page.kicker}</p>
          <p>{page.summary}</p>
          <div className="lp-cta">
            <Link to={ctaTo} className="lp-btn primary">{page.cta.label}</Link>
            {slug === 'nationwide-relief' || slug === 'earthquake-response' || slug === 'pandemic-health' ? (
              <Link to="/flood-sindh" className="lp-btn ghost">Sindh flood case study</Link>
            ) : (
              <Link to="/explore/nationwide-relief" className="lp-btn ghost">Nationwide relief</Link>
            )}
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container dp-split">
          <div>
            <h2>How it works in CareConnect</h2>
            <ul className="dp-list">
              {page.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <p className="dp-who"><b>Who uses it:</b> {page.who}</p>
          </div>
          <div className="dp-note">
            <h3>Related</h3>
            {related.map((c) => (
              <Link key={c.slug} to={c.to} className="dp-related">
                {c.title} <ArrowRight size={14} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-container">
          CareConnect · {page.title} · Final Year Project 2026 · University of Sindh, Jamshoro
        </div>
      </footer>
    </div>
  );
}
