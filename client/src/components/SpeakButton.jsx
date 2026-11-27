import { Square, Volume2 } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useSpeech } from '../utils/useSpeech';

export default function SpeakButton({ text, lang }) {
  const { t } = useLanguage();
  const { ttsSupported, speaking, speak, stopSpeaking } = useSpeech();
  const source = String(text || '').trim();

  if (!ttsSupported || !source) return null;

  const toggle = () => {
    if (speaking) {
      stopSpeaking();
      return;
    }
    speak(source, lang);
  };

  return (
    <button
      type="button"
      className={'voice-btn speak' + (speaking ? ' speaking' : '')}
      onClick={toggle}
      title={speaking ? t('voice.stop') : t('voice.listen')}
      aria-label={speaking ? t('voice.stop') : t('voice.listen')}
      aria-pressed={speaking}
    >
      {speaking ? <Square size={14} /> : <Volume2 size={16} />}
      <span>{speaking ? t('voice.stop') : t('voice.listen')}</span>
    </button>
  );
}
