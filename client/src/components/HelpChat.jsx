import { useEffect, useRef, useState } from 'react';
import api from '../api';
import VoiceMicButton from './VoiceMicButton';
import SpeakButton from './SpeakButton';

const WELCOME =
  'السلام علیکم! میں CareConnect کا مددگار ہوں۔ اپنی ضرورت اردو یا Roman Urdu میں لکھیں۔';

const QUICK = [
  { id: 'medical', label: 'Medical', ur: 'طبی امداد', text: 'مجھے فوری طبی امداد چاہیے' },
  { id: 'ration', label: 'Ration / Water', ur: 'راشن / پانی', text: 'مجھے راشن اور صاف پانی چاہیے' },
  { id: 'shelter', label: 'Shelter', ur: 'رہائش', text: 'گھر متاثر ہوا ہے، رہنے کی جگہ چاہیے' },
  { id: 'city', label: 'Share City', ur: 'شہر', text: '' },
];

function isUrdu(text) {
  return /[\u0600-\u06FF]/.test(text || '');
}

export default function HelpChat({ form, setForm, onConfirmSubmit }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const threadRef = useRef(null);

  const scrollToEnd = () => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    api
      .get('/requests/chat')
      .then((res) => {
        setMessages(res.data);
        const lastBot = [...res.data].reverse().find((m) => m.sender === 'bot');
        const lastUser = [...res.data].reverse().find((m) => m.sender === 'user');
        if (lastBot && lastBot.detected_need) {
          setForm((prev) => ({
            ...prev,
            message: lastUser ? lastUser.message : prev.message,
            need_type: lastBot.detected_need,
            urgency: lastBot.detected_urgency || prev.urgency,
          }));
          setReady(lastBot.message.includes('Confirm & Submit Request'));
        }
      })
      .catch(() => setError('Could not load chat'));
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages]);

  const applyExtraction = (data, userText) => {
    setForm((prev) => ({
      ...prev,
      message: userText || prev.message,
      need_type: data.need_type || prev.need_type,
      urgency: data.urgency || prev.urgency,
      city: data.city || prev.city,
    }));
    setReady(Boolean(data.ready_to_submit));
  };

  const send = async (text) => {
    const message = (text || draft).trim();
    if (!message || sending) return;
    setSending(true);
    setError('');
    setDraft('');
    try {
      const res = await api.post('/requests/chat', { message: message, city: form.city });
      setMessages((prev) => [...prev, res.data.user_message, res.data.bot_message]);
      applyExtraction(res.data, message);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send message');
    }
    setSending(false);
  };

  const clearChat = async () => {
    if (!window.confirm('Clear this chat?')) return;
    try {
      await api.delete('/requests/chat');
      setMessages([]);
      setReady(false);
      setError('');
    } catch (err) {
      setError('Could not clear chat');
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(draft);
    }
  };

  return (
    <div className="card chat-panel">
      <div className="chat-header">
        <div>
          <h3>Urdu AI Help Assistant</h3>
          <p className="chat-sub" dir="rtl">مددگار چیٹ بوٹ</p>
        </div>
        <button type="button" className="btn small" onClick={clearChat}>Clear Chat</button>
      </div>

      {error && <p className="info">{error}</p>}

      <div className="chat-thread" ref={threadRef}>
        {messages.length === 0 && (
          <div className={'chat-bubble bot' + (isUrdu(WELCOME) ? ' rtl' : '')} dir="rtl">
            {WELCOME}
            <SpeakButton text={WELCOME} lang="ur" />
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={'chat-bubble ' + m.sender + (isUrdu(m.message) ? ' rtl' : '')}
            dir={isUrdu(m.message) ? 'rtl' : 'ltr'}
          >
            <span className="chat-who">{m.sender === 'bot' ? 'CareConnect Assistant' : 'You'}</span>
            {m.message}
            {m.sender === 'bot' && <SpeakButton text={m.message} />}
          </div>
        ))}
      </div>

      <p className="card-hint">Tap a need, or type / speak below.</p>
      <div className="chat-quick">
        {QUICK.map((item) => (
          <button
            key={item.id}
            type="button"
            className="chat-quick-btn"
            disabled={sending}
            onClick={() => {
              if (item.id === 'city') {
                if (form.city) {
                  send('میرا شہر ' + form.city + ' ہے');
                } else {
                  setDraft('میرا شہر ');
                }
                return;
              }
              send(item.text);
            }}
          >
            <b>{item.label}</b>
            <span dir="rtl">{item.ur}</span>
          </button>
        ))}
      </div>

      {ready && (
        <button
          type="button"
          className="btn chat-confirm"
          onClick={async () => {
            const ok = await onConfirmSubmit();
            if (ok) setReady(false);
          }}
          disabled={sending}
        >
          Confirm &amp; Submit Request
        </button>
      )}

      <div className="chat-compose">
        <VoiceMicButton
          onTranscript={(text) => setDraft((prev) => (prev ? prev + ' ' + text : text))}
        />
        <textarea
          rows="2"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="اردو یا Roman Urdu میں لکھیں..."
          dir={isUrdu(draft) ? 'rtl' : 'ltr'}
        />
        <button type="button" className="btn" onClick={() => send(draft)} disabled={sending || !draft.trim()}>
          {sending ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
