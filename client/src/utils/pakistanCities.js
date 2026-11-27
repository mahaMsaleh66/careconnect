export const PAKISTAN_CITIES = [
  { name: 'Karachi', lat: 24.8607, lng: 67.0011 },
  { name: 'Hyderabad', lat: 25.3960, lng: 68.3578 },
  { name: 'Jamshoro', lat: 25.4300, lng: 68.2810 },
  { name: 'Thatta', lat: 24.7475, lng: 67.9239 },
  { name: 'Badin', lat: 24.6558, lng: 68.8383 },
  { name: 'Mirpurkhas', lat: 25.5276, lng: 69.0158 },
  { name: 'Umerkot', lat: 25.3614, lng: 69.7361 },
  { name: 'Nawabshah', lat: 26.2442, lng: 68.4100 },
  { name: 'Dadu', lat: 26.7329, lng: 67.7791 },
  { name: 'Sehwan', lat: 26.4253, lng: 67.8613 },
  { name: 'Larkana', lat: 27.5590, lng: 68.2120 },
  { name: 'Qambar Shahdadkot', lat: 27.5870, lng: 68.0000 },
  { name: 'Shikarpur', lat: 27.9571, lng: 68.6379 },
  { name: 'Jacobabad', lat: 28.2769, lng: 68.4516 },
  { name: 'Sukkur', lat: 27.7052, lng: 68.8574 },
  { name: 'Khairpur', lat: 27.5295, lng: 68.7616 },
  { name: 'Lahore', lat: 31.5204, lng: 74.3587 },
  { name: 'Islamabad', lat: 33.6844, lng: 73.0479 },
  { name: 'Rawalpindi', lat: 33.5651, lng: 73.0169 },
  { name: 'Peshawar', lat: 34.0151, lng: 71.5249 },
  { name: 'Quetta', lat: 30.1798, lng: 66.9750 },
  { name: 'Multan', lat: 30.1575, lng: 71.5249 },
];

export const SINDH_CENTER = { lat: 26.25, lng: 68.55, zoom: 7 };
export const PAKISTAN_CENTER = { lat: 30.3753, lng: 69.3451, zoom: 5 };
export const PAKISTAN_BOUNDS = { north: 37.1, south: 23.6, west: 60.9, east: 77.8 };

export function toMapPercent(lat, lng) {
  const x = ((Number(lng) - PAKISTAN_BOUNDS.west) / (PAKISTAN_BOUNDS.east - PAKISTAN_BOUNDS.west)) * 100;
  const y = ((PAKISTAN_BOUNDS.north - Number(lat)) / (PAKISTAN_BOUNDS.north - PAKISTAN_BOUNDS.south)) * 100;
  return {
    left: Math.min(96, Math.max(4, x)) + '%',
    top: Math.min(96, Math.max(4, y)) + '%',
  };
}

export function hasCoords(item) {
  const lat = Number(item && item.lat);
  const lng = Number(item && item.lng);
  return Number.isFinite(lat) && Number.isFinite(lng);
}
