import { useState } from 'react';
import api from '../api';
import { useLanguage } from '../LanguageContext';

export default function TranslateButton({ text }) {
  const { t } = useLanguage();
  const [translated, setTranslated] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!text || !String(text).trim()) return null;

  const source = String(text).trim();
  const looksUrdu = /[\u0600-\u06FF]/.test(source);
  const targetLang = looksUrdu ? 'en' : 'ur';

  const run = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    if (translated) {
      setOpen(true);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/translate', {
        text: source,
        targetLang: targetLang,
      });
      setTranslated(res.data.translated || '');
      setOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Translation failed');
    }
    setBusy(false);
  };

  const targetIsUrdu = targetLang === 'ur';

  return (
    <div className="translate-box">
      <button type="button" className="translate-btn" onClick={run} disabled={busy}>
        {busy ? t('btn.translating') : open ? t('btn.hideTranslation') : 'ترجمہ کریں / Translate'}
      </button>
      {error && <p className="translate-error">{error}</p>}
      {open && translated && (
        <p className="translate-result" dir={targetIsUrdu ? 'rtl' : 'ltr'}>
          {translated}
        </p>
      )}
    </div>
  );
}
