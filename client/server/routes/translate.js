const express = require('express');

const router = express.Router();
const cache = new Map();
const MAX_LEN = 1000;

function cacheKey(text, targetLang) {
  return targetLang + '::' + text;
}

function hasArabic(text) {
  return /[\u0600-\u06FF]/.test(text);
}

async function fromMyMemory(text, targetLang) {
  const source = targetLang === 'ur' ? 'en' : 'ur';
  const pair = source + '|' + targetLang;
  const url =
    'https://api.mymemory.translated.net/get?q=' +
    encodeURIComponent(text) +
    '&langpair=' +
    encodeURIComponent(pair);
  const response = await fetch(url);
  if (!response.ok) throw new Error('MyMemory HTTP ' + response.status);
  const data = await response.json();
  const translated = data && data.responseData && data.responseData.translatedText;
  if (!translated || /INVALID SOURCE LANGUAGE/i.test(translated)) {
    throw new Error('MyMemory returned no translation');
  }
  return translated;
}

async function fromGoogleGtx(text, targetLang) {
  const url =
    'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=' +
    encodeURIComponent(targetLang) +
    '&dt=t&q=' +
    encodeURIComponent(text);
  const response = await fetch(url);
  if (!response.ok) throw new Error('Google gtx HTTP ' + response.status);
  const data = await response.json();
  const translated = (data[0] || []).map((part) => part[0]).join('');
  if (!translated) throw new Error('Google gtx returned no translation');
  return translated;
}

router.post('/', async (req, res) => {
  try {
    const text = String(req.body.text || '').trim();
    const targetLang = req.body.targetLang === 'ur' ? 'ur' : 'en';
    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }
    if (text.length > MAX_LEN) {
      return res.status(400).json({ message: 'Text is too long to translate' });
    }

    if ((targetLang === 'ur' && hasArabic(text)) || (targetLang === 'en' && !hasArabic(text))) {
      return res.json({ translated: text, cached: true, skipped: true });
    }

    const key = cacheKey(text, targetLang);
    if (cache.has(key)) {
      return res.json({ translated: cache.get(key), cached: true });
    }

    let translated;
    try {
      translated = await fromMyMemory(text, targetLang);
    } catch (err) {
      translated = await fromGoogleGtx(text, targetLang);
    }

    cache.set(key, translated);
    res.json({ translated: translated, cached: false });
  } catch (err) {
    res.status(502).json({ message: 'Translation service is unavailable' });
  }
});

module.exports = router;
