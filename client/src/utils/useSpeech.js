import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../LanguageContext';

const URDU_SCRIPT = /[\u0600-\u06FF]/;

function recognitionCtor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function hasSynthesis() {
  return typeof window !== 'undefined' && Boolean(window.speechSynthesis);
}

export function sttLocale(lang) {
  return lang === 'ur' ? 'ur-PK' : 'en-US';
}

export function speakLocale(text, overrideLang, appLang) {
  if (overrideLang === 'ur' || overrideLang === 'ur-PK') return 'ur-PK';
  if (overrideLang === 'en' || overrideLang === 'en-US') return 'en-US';
  if (URDU_SCRIPT.test(text || '')) return 'ur-PK';
  return appLang === 'ur' ? 'ur-PK' : 'en-US';
}

function pickVoice(locale) {
  if (!hasSynthesis()) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  const prefix = String(locale || 'en').slice(0, 2).toLowerCase();
  return (
    voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(locale.toLowerCase())) ||
    voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(prefix)) ||
    null
  );
}

export function useSpeech() {
  const { lang } = useLanguage();
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recRef = useRef(null);
  const wantListen = useRef(false);
  const onResultRef = useRef(null);
  const utterRef = useRef(null);

  const sttSupported = Boolean(recognitionCtor());
  const ttsSupported = hasSynthesis();

  useEffect(() => {
    if (!hasSynthesis()) return undefined;
    const warm = () => window.speechSynthesis.getVoices();
    warm();
    window.speechSynthesis.addEventListener('voiceschanged', warm);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', warm);
  }, []);

  const stopListening = () => {
    wantListen.current = false;
    const rec = recRef.current;
    recRef.current = null;
    if (rec) {
      rec.onend = null;
      rec.onerror = null;
      rec.onresult = null;
      try {
        rec.stop();
      } catch (err) {
        /* ignore */
      }
    }
    setListening(false);
  };

  const startListening = (onResult) => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    stopListening();
    onResultRef.current = typeof onResult === 'function' ? onResult : null;
    const rec = new Ctor();
    rec.lang = sttLocale(lang);
    rec.interimResults = false;
    rec.continuous = true;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) {
          text += event.results[i][0].transcript;
        }
      }
      text = text.trim();
      if (text && onResultRef.current) onResultRef.current(text);
    };
    rec.onerror = () => {
      wantListen.current = false;
      setListening(false);
    };
    rec.onend = () => {
      if (wantListen.current) {
        try {
          rec.start();
        } catch (err) {
          wantListen.current = false;
          setListening(false);
        }
      } else {
        setListening(false);
      }
    };
    recRef.current = rec;
    wantListen.current = true;
    setListening(true);
    try {
      rec.start();
    } catch (err) {
      wantListen.current = false;
      setListening(false);
    }
  };

  const stopSpeaking = () => {
    if (hasSynthesis()) {
      window.speechSynthesis.cancel();
    }
    utterRef.current = null;
    setSpeaking(false);
  };

  const speak = (text, overrideLang) => {
    const source = String(text || '').trim();
    if (!hasSynthesis() || !source) return;
    stopSpeaking();
    const utter = new SpeechSynthesisUtterance(source);
    utter.lang = speakLocale(source, overrideLang, lang);
    const voice = pickVoice(utter.lang);
    if (voice) utter.voice = voice;
    utter.rate = utter.lang.startsWith('ur') ? 0.92 : 1;
    utter.onend = () => {
      if (utterRef.current === utter) {
        utterRef.current = null;
        setSpeaking(false);
      }
    };
    utter.onerror = () => {
      if (utterRef.current === utter) {
        utterRef.current = null;
        setSpeaking(false);
      }
    };
    utterRef.current = utter;
    setSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

  useEffect(() => () => {
    wantListen.current = false;
    stopListening();
    stopSpeaking();
  }, []);

  return {
    sttSupported,
    ttsSupported,
    listening,
    speaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    lang,
  };
}
