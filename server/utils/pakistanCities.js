const CITIES = [
  { name: 'Karachi', aliases: ['khi', 'کراچی'], lat: 24.8607, lng: 67.0011 },
  { name: 'Hyderabad', aliases: ['حیدرآباد'], lat: 25.3960, lng: 68.3578 },
  { name: 'Jamshoro', aliases: ['جامشورو'], lat: 25.4300, lng: 68.2810 },
  { name: 'Kotri', aliases: ['کوٹری'], lat: 25.3650, lng: 68.3080 },
  { name: 'Thatta', aliases: ['ٹھٹہ', 'تھٹہ'], lat: 24.7475, lng: 67.9239 },
  { name: 'Badin', aliases: ['بدین'], lat: 24.6558, lng: 68.8383 },
  { name: 'Tando Muhammad Khan', aliases: ['tando muhammad', 'tmk'], lat: 25.1230, lng: 68.5360 },
  { name: 'Tando Allahyar', aliases: ['tando allayar'], lat: 25.4600, lng: 68.7190 },
  { name: 'Mirpurkhas', aliases: ['mirpur khas', 'میرپور خاص'], lat: 25.5276, lng: 69.0158 },
  { name: 'Umerkot', aliases: ['umar kot', 'عمرکوٹ'], lat: 25.3614, lng: 69.7361 },
  { name: 'Sanghar', aliases: ['سانگھڑ'], lat: 26.0468, lng: 68.9481 },
  { name: 'Nawabshah', aliases: ['shaheed benazirabad', 'benazirabad', 'sba', 'نوابشاہ'], lat: 26.2442, lng: 68.4100 },
  { name: 'Matiari', aliases: ['مٹیاری'], lat: 25.5971, lng: 68.4467 },
  { name: 'Dadu', aliases: ['دادو'], lat: 26.7329, lng: 67.7791 },
  { name: 'Sehwan', aliases: ['sehwan sharif', 'سیہون'], lat: 26.4253, lng: 67.8613 },
  { name: 'Larkana', aliases: ['لاڑکانہ'], lat: 27.5590, lng: 68.2120 },
  { name: 'Qambar Shahdadkot', aliases: ['qambar', 'shahdadkot', 'kamber'], lat: 27.5870, lng: 68.0000 },
  { name: 'Shikarpur', aliases: ['شکارپور'], lat: 27.9571, lng: 68.6379 },
  { name: 'Jacobabad', aliases: ['جیکب آباد'], lat: 28.2769, lng: 68.4516 },
  { name: 'Kashmore', aliases: ['kashmor'], lat: 28.4440, lng: 69.5830 },
  { name: 'Sukkur', aliases: ['سکھر'], lat: 27.7052, lng: 68.8574 },
  { name: 'Khairpur', aliases: ['khairpur mirs', 'خیرپور'], lat: 27.5295, lng: 68.7616 },
  { name: 'Ghotki', aliases: ['گھوٹکی'], lat: 28.0064, lng: 69.3161 },
  { name: 'Lahore', aliases: ['لاہور'], lat: 31.5204, lng: 74.3587 },
  { name: 'Islamabad', aliases: ['isb', 'اسلام آباد'], lat: 33.6844, lng: 73.0479 },
  { name: 'Rawalpindi', aliases: ['pindi', 'راولپنڈی'], lat: 33.5651, lng: 73.0169 },
  { name: 'Peshawar', aliases: ['پشاور'], lat: 34.0151, lng: 71.5249 },
  { name: 'Quetta', aliases: ['کوئٹہ'], lat: 30.1798, lng: 66.9750 },
  { name: 'Multan', aliases: ['ملتان'], lat: 30.1575, lng: 71.5249 },
  { name: 'Faisalabad', aliases: ['فیصل آباد'], lat: 31.4504, lng: 73.1350 },
  { name: 'Sialkot', aliases: ['سیالکوٹ'], lat: 32.4945, lng: 74.5229 },
  { name: 'Gujranwala', aliases: ['گوجرانوالہ'], lat: 32.1877, lng: 74.1945 },
  { name: 'Bahawalpur', aliases: ['بہاولپور'], lat: 29.3956, lng: 71.6836 },
  { name: 'Sargodha', aliases: ['سرگودھا'], lat: 32.0836, lng: 72.6711 },
  { name: 'Abbottabad', aliases: ['ایبٹ آباد'], lat: 34.1463, lng: 73.2117 },
  { name: 'Mardan', aliases: ['مردان'], lat: 34.1989, lng: 72.0231 },
  { name: 'Swat', aliases: ['mingora', 'سوات'], lat: 34.7717, lng: 72.3600 },
  { name: 'Gilgit', aliases: ['گلگت'], lat: 35.9208, lng: 74.3080 },
];

function toNullableNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function lookupCity(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  const ranked = [...CITIES].sort((a, b) => b.name.length - a.name.length);
  for (const city of ranked) {
    const names = [city.name, ...(city.aliases || [])];
    for (const name of names) {
      if (!name) continue;
      if (raw.includes(name) || lower.includes(String(name).toLowerCase())) {
        return city;
      }
    }
  }
  return null;
}

function citiesMatch(a, b) {
  if (!a || !b) return false;
  if (String(a).trim().toLowerCase() === String(b).trim().toLowerCase()) return true;
  const cityA = lookupCity(a);
  const cityB = lookupCity(b);
  return Boolean(cityA && cityB && cityA.name === cityB.name);
}

function resolveCoords(lat, lng, placeText) {
  const parsedLat = toNullableNumber(lat);
  const parsedLng = toNullableNumber(lng);
  if (parsedLat !== null && parsedLng !== null) {
    return { lat: parsedLat, lng: parsedLng };
  }
  const city = lookupCity(placeText);
  if (city) {
    return { lat: city.lat, lng: city.lng };
  }
  return { lat: null, lng: null };
}

module.exports = {
  CITIES,
  lookupCity,
  citiesMatch,
  resolveCoords,
  toNullableNumber,
};
