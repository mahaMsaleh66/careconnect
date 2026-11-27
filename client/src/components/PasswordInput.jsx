import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

export default function PasswordInput({ className = '', ...props }) {
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();
  const label = visible ? t('auth.hidePassword') : t('auth.showPassword');

  return (
    <div className={'password-field' + (className ? ' ' + className : '')}>
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((open) => !open)}
        title={label}
        aria-label={label}
        aria-pressed={visible}
      >
        {visible ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
      </button>
    </div>
  );
}
