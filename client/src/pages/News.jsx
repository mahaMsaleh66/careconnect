import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import TranslateButton from '../components/TranslateButton';
import SpeakButton from '../components/SpeakButton';

export default function News() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isAdmin = user.role === 'admin';
  const [items, setItems] = useState([]);
  const [headline, setHeadline] = useState('');
  const [result, setResult] = useState(null);
  const [live, setLive] = useState([]);
  const [loadingLive, setLoadingLive] = useState(false);
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

  const saveItem = async (n) => {
    await api.post('/news', {
      headline: n.headline,
      category: n.category,
      is_relevant: n.is_relevant,
      url: n.url,
      source: n.source,
    });
  };

  const saveTyped = async () => {
    try {
      await saveItem({
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

  const fetchLive = async () => {
    setLoadingLive(true);
    setMsg('');
    try {
      const res = await api.get('/news/live');
      setLive(res.data);
      if (res.data.length === 0) {
        setMsg('No matching headlines in the last 3 days');
      }
    } catch (err) {
      setMsg(err.response?.data?.message || 'Could not fetch live news');
    }
    setLoadingLive(false);
  };

  const saveLive = async (n) => {
    try {
      await saveItem(n);
      setMsg('Saved to the news feed');
      load();
    } catch (err) {
      setMsg('Could not save');
    }
  };

  const saveAllRelevant = async () => {
    try {
      const relevant = live.filter((n) => n.is_relevant);
      for (const n of relevant) {
        await saveItem(n);
      }
      setMsg('Saved ' + relevant.length + ' relevant headlines');
      load();
    } catch (err) {
      setMsg('Could not save');
    }
  };

  return (
    <div>
      <h1>{t('page.news')}</h1>
      {msg && <p className="info">{msg}</p>}

      {isAdmin && (
        <div className="card">
          <h3>Live News (AI filtered)</h3>
          <p>
            Fetches recent Pakistan crisis and welfare headlines, then the AI marks which ones are
            relevant. Review them before saving.
          </p>
          <button className="btn" onClick={fetchLive} disabled={loadingLive}>
            {loadingLive ? 'Fetching...' : 'Fetch live news'}
          </button>
          {live.length > 0 && (
            <button className="btn" style={{ marginLeft: 8 }} onClick={saveAllRelevant}>
              Save all relevant
            </button>
          )}
          {live.length > 0 && (
            <div className="table-wrap" style={{ marginTop: 14 }}>
              <table>
                <thead>
                  <tr>
                    <th>Headline</th>
                    <th>Source</th>
                    <th>AI category</th>
                    <th>Relevant</th>
                    <th>Confidence</th>
                    <th>Save</th>
                  </tr>
                </thead>
                <tbody>
                  {live.map((n, i) => (
                    <tr key={i}>
                      <td>
                        <a href={n.url} target="_blank" rel="noreferrer">{n.headline}</a>
                        <div className="voice-inline">
                          <TranslateButton text={n.headline} />
                          <SpeakButton text={n.headline} />
                        </div>
                      </td>
                      <td>{n.source}</td>
                      <td>{n.category}</td>
                      <td>{n.is_relevant ? 'Yes' : 'No'}</td>
                      <td>{n.confidence}%</td>
                      <td>
                        <button className="btn small" onClick={() => saveLive(n)}>Save</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p><small>Live headlines provided by the GDELT Project.</small></p>
        </div>
      )}

      {isAdmin && (
        <div className="card">
          <h3>Classify a Headline Manually (AI)</h3>
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
              <button className="btn small" onClick={saveTyped}>Save to feed</button>
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
                <th>Source</th>
                {isAdmin && <th>Relevant</th>}
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan="5">{t('news.none')}</td></tr>
              )}
              {items.map((n) => (
                <tr key={n.id}>
                  <td>
                    {n.url ? (
                      <a href={n.url} target="_blank" rel="noreferrer">{n.headline}</a>
                    ) : (
                      n.headline
                    )}
                    <div className="voice-inline">
                      <TranslateButton text={n.headline} />
                      <SpeakButton text={n.headline} />
                    </div>
                  </td>
                  <td>{n.category}</td>
                  <td>{n.source || '-'}</td>
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