import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function News() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';
  const [items, setItems] = useState([]);
  const [headline, setHeadline] = useState('');
  const [result, setResult] = useState(null);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/news');
      setItems(res.data);
    } catch (err) {
      setMsg('Could not load news');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const classify = async () => {
    if (!headline.trim()) {
      setMsg('Please type a headline first');
      return;
    }
    try {
      const res = await api.post('/news/classify', { headline: headline });
      setResult(res.data);
      setMsg('');
    } catch (err) {
      setMsg('AI service is not running');
    }
  };

  const save = async () => {
    try {
      await api.post('/news', {
        headline: headline,
        category: result.category,
        is_relevant: result.is_relevant,
      });
      setHeadline('');
      setResult(null);
      setMsg('Saved to the news feed');
      load();
    } catch (err) {
      setMsg('Could not save');
    }
  };

  return (
    <div>
      <h1>Welfare News</h1>
      {msg && <p className="info">{msg}</p>}

      {isAdmin && (
        <div className="card">
          <h3>Classify a Headline (AI)</h3>
          <textarea
            rows="3"
            placeholder="Paste a news headline here"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
          <button className="btn" onClick={classify}>Classify</button>
          {result && (
            <div style={{ marginTop: 12 }}>
              <p>
                Category: <b>{result.category}</b> | Relevant:{' '}
                <b>{result.is_relevant ? 'Yes' : 'No'}</b> | Confidence: {result.confidence}%
              </p>
              <button className="btn small" onClick={save}>Save to feed</button>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h3>{isAdmin ? 'All Saved Headlines' : 'Welfare and Crisis News'}</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Headline</th>
                <th>Category</th>
                {isAdmin && <th>Relevant</th>}
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan="4">No news yet</td></tr>
              )}
              {items.map((n) => (
                <tr key={n.id}>
                  <td>{n.headline}</td>
                  <td>{n.category}</td>
                  {isAdmin && <td>{n.is_relevant ? 'Yes' : 'No'}</td>}
                  <td>{new Date(n.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}