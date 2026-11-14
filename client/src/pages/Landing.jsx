import { Link } from 'react-router-dom';
import {
  Heart, ShieldAlert, Gift, Users, MessageSquare,
  TrendingUp, Newspaper,
} from 'lucide-react';
import { useAuth } from '../AuthContext';

const features = [
  {
    icon: ShieldAlert,
    title: 'AI crisis severity prediction',
    text: 'Machine learning reads a crisis report and rates it Low, Medium or High, so the most urgent cases are handled first.',
  },
  {
    icon: Users,
    title: 'Smart volunteer matching',
    text: 'Volunteers are ranked by skills, city and availability, so the right person is sent to each request.',
  },
  {
    icon: MessageSquare,
    title: 'Urdu and Roman Urdu assistant',
    text: 'People can describe their problem in their own language. The AI detects the type of need and how urgent it is.',
  },
  {
    icon: Gift,
    title: 'Donations with digital receipts',
    text: 'Donors record contributions toward a cause or a specific crisis and get a printable receipt.',
  },
  {
    icon: Newspaper,
    title: 'Welfare news filtering',
    text: 'An AI classifier separates crisis and welfare news from irrelevant headlines.',
  },
  {
    icon: TrendingUp,
    title: 'Reports and analytics',
    text: 'Administrators see charts of users, donations, crises and requests, and can print a report.',
  },
];

const steps = [
  {
    title: 'Create your account',
    text: 'Register as a donor, volunteer or person in need. It takes less than a minute.',
  },
  {
    title: 'Give, ask or help',
    text: 'Donors support crises, people in need submit requests, and volunteers take on tasks.',
  },
  {
    title: 'Track every step',
    text: 'Follow requests from Pending to Completed, and see where every contribution goes.',
  },
];

const roles = [
  { title: 'Donors', text: 'Contribute to a cause or crisis and keep a record of every donation.' },
  { title: 'Volunteers', text: 'Share your skills and city, then take assigned tasks and update their progress.' },
  { title: 'People in need', text: 'Ask for help in Urdu, Roman Urdu or English and follow the status of your request.' },
  { title: 'Administrators', text: 'Manage crises, assign volunteers, review reports and keep the platform running.' },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-container lp-nav-inner">
          <Link to="/" className="lp-logo">
            <span className="lp-logo-icon"><Heart size={20} /></span>
            CareConnect
          </Link>
          <nav className="lp-links">
            <a href="#about">About</a>
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#roles">Who it is for</a>
          </nav>
          <div className="lp-actions">
            {user ? (
              <Link to="/dashboard" className="lp-btn primary">Open Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="lp-btn ghost">Login</Link>
                <Link to="/register" className="lp-btn primary">Register</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="lp-hero">
        <div className="lp-container lp-hero-grid">
          <div>
            <div className="lp-pill">
              <Heart size={14} /> AI-powered social welfare platform
            </div>
            <h1>
              Connecting <span>care</span> with those who need it most
            </h1>
            <p>
              CareConnect brings donors, volunteers, people in need and NGOs
              onto one platform, and uses AI to prioritise crises, understand
              requests in Urdu and match the right volunteer to every task.
            </p>
            <div className="lp-cta">
              {user ? (
                <Link to="/dashboard" className="lp-btn primary">Go to Dashboard</Link>
              ) : (
                <>
                  <Link to="/register" className="lp-btn primary">Get started</Link>
                  <Link to="/login" className="lp-btn ghost">I already have an account</Link>
                </>
              )}
            </div>
            <div className="lp-mini-stats">
              <div><b>4</b><span>User roles</span></div>
              <div><b>4</b><span>AI models</span></div>
              <div><b>Urdu</b><span>and Roman Urdu support</span></div>
            </div>
          </div>

          <div className="lp-mock">
            <div className="lp-mock-card">
              <div className="lp-mock-label">AI severity prediction</div>
              <div className="lp-mock-row">
                <div>
                  <div className="lp-mock-title">Flood in Dadu</div>
                  <div className="lp-mock-sub">8,000 people affected</div>
                </div>
                <span className="badge High">High</span>
              </div>
              <div className="lp-bar"><div style={{ width: '94%' }}></div></div>
            </div>
            <div className="lp-mock-card">
              <div className="lp-mock-label">Smart volunteer match</div>
              <div className="lp-mock-row">
                <div>
                  <div className="lp-mock-title">Best match: 92%</div>
                  <div className="lp-mock-sub">medical, nurse - Hyderabad</div>
                </div>
                <span className="badge Low">Available</span>
              </div>
              <div className="lp-bar"><div style={{ width: '92%' }}></div></div>
            </div>
            <div className="lp-mock-card">
              <div className="lp-mock-label">Urdu assistant</div>
              <div className="lp-mock-sub">mere walid sahab bohat bimar hain, foran doctor chahiye</div>
              <div className="lp-mock-row" style={{ marginTop: 10 }}>
                <span className="badge Low">Medical</span>
                <span className="badge High">High urgency</span>
              </div>
            </div>
            <div className="lp-sample">Sample output, for illustration</div>
          </div>
        </div>
      </section>

      <section className="lp-section" id="about">
        <div className="lp-container">
          <div className="lp-head">
            <h2>Why CareConnect exists</h2>
            <p>
              Welfare organisations still rely on phone calls, messaging apps
              and paper records. That makes it hard to see which cases are most
              urgent and who can help.
            </p>
          </div>
          <div className="lp-about">
            <div className="lp-about-card problem">
              <h3>The problem</h3>
              <ul>
                <li>Donations, requests, volunteers and crises are handled separately.</li>
                <li>Administrators decide by hand which case is most urgent.</li>
                <li>Finding the right volunteer for a request takes time.</li>
                <li>Many people ask for help in Urdu, which most platforms do not understand.</li>
              </ul>
            </div>
            <div className="lp-about-card solution">
              <h3>How CareConnect helps</h3>
              <ul>
                <li>One platform for donors, volunteers, people in need and administrators.</li>
                <li>AI rates every crisis as Low, Medium or High severity.</li>
                <li>AI ranks volunteers by skills, city and availability.</li>
                <li>Requests in Urdu and Roman Urdu are understood and prioritised.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section alt" id="features">
        <div className="lp-container">
          <div className="lp-head">
            <h2>Everything welfare work needs, in one place</h2>
            <p>Traditional welfare work runs on phone calls and paper. CareConnect organises it and adds AI where it helps most.</p>
          </div>
          <div className="lp-grid">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div className="lp-feature" key={f.title}>
                  <div className="lp-feature-icon"><Icon size={22} /></div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="lp-section" id="how">
        <div className="lp-container">
          <div className="lp-head">
            <h2>How it works</h2>
            <p>Three simple steps from sign-up to real help.</p>
          </div>
          <div className="lp-steps">
            {steps.map((s, i) => (
              <div className="lp-step" key={s.title}>
                <div className="lp-step-num">{i + 1}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section alt" id="roles">
        <div className="lp-container">
          <div className="lp-head">
            <h2>Built for everyone involved</h2>
            <p>Each role gets its own dashboard with only what it needs.</p>
          </div>
          <div className="lp-roles">
            {roles.map((r) => (
              <div className="lp-role" key={r.title}>
                <h3>{r.title}</h3>
                <p>{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-head">
            <h2>Supporting the UN Sustainable Development Goals</h2>
          </div>
          <div className="lp-sdg">
            <span style={{ background: '#e5243b' }}>No Poverty</span>
            <span style={{ background: '#dda63a' }}>Zero Hunger</span>
            <span style={{ background: '#dd1367' }}>Reduced Inequalities</span>
          </div>
        </div>
      </section>

      <section className="lp-container" style={{ paddingBottom: 84 }}>
        <div className="lp-cta-band">
          <h2>Ready to make a difference?</h2>
          <p>Join CareConnect today as a donor, volunteer or someone who needs support.</p>
          {user ? (
            <Link to="/dashboard" className="lp-btn light">Open Dashboard</Link>
          ) : (
            <Link to="/register" className="lp-btn light">Create a free account</Link>
          )}
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-container">
          CareConnect - An AI-Powered Social Welfare Management System
          <br />
          Final Year Project 2026 - Department of Information Technology,
          Faculty of Engineering and Technology, University of Sindh, Jamshoro
        </div>
      </footer>
    </div>
  );
}