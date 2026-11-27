import { useLanguage } from '../LanguageContext';

export default function LanguageToggle({ variant = 'light' }) {
  const { lang, setLang } = useLanguage();
  return (
    <div className={'lang-toggle ' + variant} role="group" aria-label="Language">
      <button type="button" className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>
        EN
      </button>
      <span className="lang-sep">|</span>
      <button type="button" className={lang === 'ur' ? 'on' : ''} onClick={() => setLang('ur')}>
        اردو
      </button>
    </div>
  );
}
