import { Mic, MicOff } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useSpeech } from '../utils/useSpeech';

export default function VoiceMicButton({ onTranscript }) {
  const { t } = useLanguage();
  const { sttSupported, listening, startListening, stopListening } = useSpeech();

  if (!sttSupported) return null;

  const toggle = () => {
    if (listening) {
      stopListening();
      return;
    }
    startListening((text) => {
      if (typeof onTranscript === 'function' && text) onTranscript(text);
    });
  };

  return (
    <button
      type="button"
      className={'voice-btn mic' + (listening ? ' listening' : '')}
      onClick={toggle}
      title={listening ? t('voice.listening') : t('voice.speak')}
      aria-label={listening ? t('voice.listening') : t('voice.speak')}
      aria-pressed={listening}
    >
      {listening ? <MicOff size={16} /> : <Mic size={16} />}
      <span>{listening ? t('voice.listening') : t('voice.speak')}</span>
    </button>
  );
}
