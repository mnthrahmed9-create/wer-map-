'use strict';

/* ============================================================
   ROYAL MAP - MAP ENGINE v2.2.0
   محرك الخريطة: التهيئة، المحافظات، المباني، الطرق، POI، المسارات، الأدوات
   الهوية البصرية: ذهبي ملكي / زمردي عميق / أزرق ملكي
   ============================================================ */

const BACKEND = {
  supabaseUrl: 'https://YOUR-PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR-ANON-KEY',
  aiEndpoint: '/functions/v1/ai-map',
  poisEndpoint: '/functions/v1/pois',
  geocodeEndpoint: '/functions/v1/geocode'
};

const CONFIG = {
  iraqCenter: [43.8, 33.2], iraqZoom: 5.5,
  iraqBounds: [[38.7, 29.0], [48.7, 37.4]],
  overpassServers: [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.private.coffee/api/interpreter'
  ],
  nominatim: 'https://nominatim.openstreetmap.org/search',
  nominatimReverse: 'https://nominatim.openstreetmap.org/reverse',
  osrm: 'https://router.project-osrm.org/route/v1/driving/',
  demTiles: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
  aqiApi: 'https://air-quality-api.open-meteo.com/v1/air-quality',
  minZoomBuilding: 15, minZoomRoad: 13, minZoomWater: 10, minZoomPoi: 10,
  maxFeaturesBuilding: 1200, maxFeaturesRoad: 2200, maxFeaturesPoi: 500,
  debounceMove: 1200, gpsTimeout: 12000,
  isMobile: /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)
};

/* ============================================================
   THÈME ROYAL — الذهبي / الزمردي / الأزرق الملكي
   ============================================================ */
const T = {
  land: '#EDE7D5', water: '#244B78', waterDeep: '#1A3A5E', waterLine: '#142F4A',
  park: '#176B52', parkDeep: '#0E4A38', parkLine: '#0A3A2A',
  building: { light:'#DED1AA', mid:'#CBB97E', dark:'#B7A468', shadow:'#9A8758' },
  road: { motorway:'#C5A45D', trunk:'#C5A45D', primary:'#BCA05F',
    secondary:'#D4C895', tertiary:'#E0D6B0', residential:'#EAE3CC',
    service:'#F0EBDC', casing:'#B5A470' },
  boundary: '#A89568', text: '#1E2E3A', textSecondary: '#415464',
  textHalo: '#F2EDDF', labelHalo: '#F2EDDF',
  accent: '#176B52', accentDark: '#244B78',
  poi: { hospital:'#244B78', restaurant:'#C5A45D', school:'#176B52',
    fuel:'#B89A4A', pharmacy:'#2A7A5E', cafe:'#B89858', bank:'#345680', police:'#1A3E5E' }
};

const PALETTES = {
  'sand-city': { name:'Royal Emerald', nameAr:'زمردي ملكي', land:'#EDE7D5',
    water:'#244B78', waterDeep:'#1A3A5E', waterLine:'#142F4A',
    park:'#176B52', parkDeep:'#0E4A38', parkLine:'#0A3A2A',
    building:{ light:'#DED1AA', mid:'#CBB97E', dark:'#B7A468', shadow:'#9A8758' },
    road:{ motorway:'#C5A45D', trunk:'#C5A45D', primary:'#BCA05F',
      secondary:'#D4C895', tertiary:'#E0D6B0', residential:'#EAE3CC',
      service:'#F0EBDC', casing:'#B5A470' },
    boundary:'#A89568', text:'#1E2E3A', textSecondary:'#415464',
    textHalo:'#F2EDDF', text3:'#7A8A98',
    accent:'#176B52', accentDark:'#244B78', accentLight:'#DCEBE4',
    bg:'#EDE7D5', panel:'rgba(250, 247, 240, .97)', panelBorder:'#D8CCAC',
    basemap:'light',
    poi:{ hospital:'#244B78', restaurant:'#C5A45D', school:'#176B52',
      fuel:'#B89A4A', pharmacy:'#2A7A5E', cafe:'#B89858', bank:'#345680', police:'#1A3E5E' } },
  'soft-stone': { name:'Soft Stone', nameAr:'حجري طبيعي', land:'#e8e5df',
    water:'#a8c0cc', waterDeep:'#94b0bc', waterLine:'#88a8b4',
    park:'#bcc9b0', parkDeep:'#aab89c', parkLine:'#9aa88a',
    building:{ light:'#dcd8d0', mid:'#c8c4bc', dark:'#b0aca4', shadow:'#98948c' },
    road:{ motorway:'#fbfaf6', trunk:'#f5f3ef', primary:'#efede8',
      secondary:'#e8e5e0', tertiary:'#e0ddd8', residential:'#eae7e2',
      service:'#f0edea', casing:'#d0ccc4' },
    boundary:'#b8b0a0', text:'#363636', textSecondary:'#565656',
    textHalo:'#e8e5df', text3:'#8a8884',
    accent:'#7a8d9a', accentDark:'#5a6d7a', accentLight:'#e2e8ec',
    bg:'#e8e5df', panel:'rgba(252,250,246,.97)', panelBorder:'#d8d4cc',
    basemap:'light',
    poi:{ hospital:'#a85a5a', restaurant:'#b88858', school:'#6a7a9a',
      fuel:'#7a8a5a', pharmacy:'#8a6aa0', cafe:'#a08060', bank:'#6a7a8a', police:'#5a6a7a' } },
  'olive-city': { name:'Olive City', nameAr:'أخضر زيتوني', land:'#e8e8d8',
    water:'#a0bfb8', waterDeep:'#8cb0a8', waterLine:'#80a098',
    park:'#b8c898', parkDeep:'#a8b888', parkLine:'#98a878',
    building:{ light:'#dcd8bc', mid:'#c8c4a8', dark:'#b0ac90', shadow:'#989478' },
    road:{ motorway:'#fafaf0', trunk:'#f4f4e8', primary:'#ececdc',
      secondary:'#e4e4d4', tertiary:'#dcdccc', residential:'#e8e8d8',
      service:'#eeeee0', casing:'#c0bca0' },
    boundary:'#a8a888', text:'#3a3a2a', textSecondary:'#5a5a4a',
    textHalo:'#e8e8d8', text3:'#8a8a7a',
    accent:'#7a8a5a', accentDark:'#5a6a3a', accentLight:'#e4ead8',
    bg:'#e8e8d8', panel:'rgba(250,250,238,.97)', panelBorder:'#d0ccb0',
    basemap:'light',
    poi:{ hospital:'#b85a5a', restaurant:'#b89858', school:'#6a8a5a',
      fuel:'#7a8a4a', pharmacy:'#9a6aa8', cafe:'#a88060', bank:'#5a7a8a', police:'#4a6a5a' } },
  'warm-beige': { name:'Warm Beige', nameAr:'بيج دافئ', land:'#f5ede0',
    water:'#b0c8d4', waterDeep:'#9cb8c4', waterLine:'#90aab8',
    park:'#c8d0a8', parkDeep:'#b8c098', parkLine:'#a8b088',
    building:{ light:'#ede0c8', mid:'#d8c8a8', dark:'#c0b090', shadow:'#a89878' },
    road:{ motorway:'#fffdf8', trunk:'#faf6ee', primary:'#f4efe4',
      secondary:'#ece6d8', tertiary:'#e4decc', residential:'#f0ebde',
      service:'#f5f1e6', casing:'#d4c8a8' },
    boundary:'#c0b090', text:'#3a3020', textSecondary:'#5a4a3a',
    textHalo:'#f5ede0', text3:'#9a8a78',
    accent:'#a89070', accentDark:'#887050', accentLight:'#f0e4d0',
    bg:'#f5ede0', panel:'rgba(255,250,240,.97)', panelBorder:'#ddd0b8',
    basemap:'light',
    poi:{ hospital:'#b85a5a', restaurant:'#c89858', school:'#6a8aa0',
      fuel:'#8a9a5a', pharmacy:'#9a6aa8', cafe:'#a87850', bank:'#6a7a8a', police:'#5a6a7a' } },
  'mist-blue': { name:'Mist Blue', nameAr:'أزرق ضبابي', land:'#e4ebf0',
    water:'#96b8cc', waterDeep:'#84a8bc', waterLine:'#789cb0',
    park:'#bcc8c0', parkDeep:'#aab8b0', parkLine:'#98a8a0',
    building:{ light:'#d8dfe4', mid:'#c0c8d0', dark:'#a8b0b8', shadow:'#9098a0' },
    road:{ motorway:'#f8fafc', trunk:'#f0f4f8', primary:'#e8eef2',
      secondary:'#e0e6ec', tertiary:'#d8e0e6', residential:'#e4eaef',
      service:'#eaf0f4', casing:'#c0c8d0' },
    boundary:'#a0aab8', text:'#2a3238', textSecondary:'#4a5258',
    textHalo:'#e4ebf0', text3:'#8a9298',
    accent:'#5a7a9a', accentDark:'#3a5a7a', accentLight:'#dce8f0',
    bg:'#e4ebf0', panel:'rgba(248,250,252,.97)', panelBorder:'#c8d4dc',
    basemap:'light',
    poi:{ hospital:'#a85a6a', restaurant:'#a88858', school:'#5a7a9a',
      fuel:'#5a8a7a', pharmacy:'#7a5aa8', cafe:'#8a7050', bank:'#4a6a8a', police:'#3a5a7a' } },
  'modern-grey': { name:'Modern Grey', nameAr:'رمادي عصري', land:'#e4e4e4',
    water:'#a0b8c8', waterDeep:'#8ca8b8', waterLine:'#8098a8',
    park:'#b8c4b0', parkDeep:'#a8b4a0', parkLine:'#98a490',
    building:{ light:'#d4d4d4', mid:'#bcbcbc', dark:'#a4a4a4', shadow:'#8c8c8c' },
    road:{ motorway:'#fafafa', trunk:'#f4f4f4', primary:'#eeeeee',
      secondary:'#e6e6e6', tertiary:'#dedede', residential:'#eaeaea',
      service:'#f0f0f0', casing:'#bcbcbc' },
    boundary:'#a0a0a0', text:'#2a2a2a', textSecondary:'#4a4a4a',
    textHalo:'#e4e4e4', text3:'#888888',
    accent:'#5a6672', accentDark:'#3a4652', accentLight:'#dce0e4',
    bg:'#e4e4e4', panel:'rgba(248,248,248,.97)', panelBorder:'#c8c8c8',
    basemap:'light',
    poi:{ hospital:'#a85a5a', restaurant:'#a88858', school:'#5a7a9a',
      fuel:'#6a8a5a', pharmacy:'#8a6a9a', cafe:'#8a7050', bank:'#5a6a7a', police:'#3a4a5a' } },
  'natural-earth': { name:'Natural Earth', nameAr:'ألوان الأرض', land:'#e4dccc',
    water:'#8cb0a8', waterDeep:'#78a098', waterLine:'#6c9088',
    park:'#a8b890', parkDeep:'#98a880', parkLine:'#889870',
    building:{ light:'#d8c8a8', mid:'#c0b090', dark:'#a89878', shadow:'#908060' },
    road:{ motorway:'#f8f4e8', trunk:'#f0e8d8', primary:'#e8dfc8',
      secondary:'#ddd0b8', tertiary:'#d0c4a8', residential:'#e4d8c0',
      service:'#eae0c8', casing:'#b0a080' },
    boundary:'#a89878', text:'#3a3020', textSecondary:'#5a4a3a',
    textHalo:'#e4dccc', text3:'#8a7a60',
    accent:'#8a7050', accentDark:'#6a5030', accentLight:'#e8dcc4',
    bg:'#e4dccc', panel:'rgba(248,242,232,.97)', panelBorder:'#d0c0a0',
    basemap:'light',
    poi:{ hospital:'#a05a4a', restaurant:'#a88848', school:'#5a7a80',
      fuel:'#7a8a4a', pharmacy:'#8a5a7a', cafe:'#906040', bank:'#5a6a6a', police:'#3a5a4a' } },
  'ivory-city': { name:'Ivory City', nameAr:'عاجي فاخر', land:'#f8f3e8',
    water:'#b0d0d8', waterDeep:'#9cbcc4', waterLine:'#90aeb8',
    park:'#ccd8b8', parkDeep:'#bcc8a8', parkLine:'#acb898',
    building:{ light:'#f5eddc', mid:'#e8dcc0', dark:'#d0c4a8', shadow:'#b8ac90' },
    road:{ motorway:'#fffef8', trunk:'#fcf9f0', primary:'#f8f4e8',
      secondary:'#f2ece0', tertiary:'#ece6d8', residential:'#f5f0e0',
      service:'#f9f5e8', casing:'#e0d4b8' },
    boundary:'#c8b898', text:'#3a3020', textSecondary:'#5a4a3a',
    textHalo:'#f8f3e8', text3:'#9a8a70',
    accent:'#8a7a5a', accentDark:'#6a5a3a', accentLight:'#f0e8d8',
    bg:'#f8f3e8', panel:'rgba(253,250,242,.97)', panelBorder:'#e0d4b8',
    basemap:'light',
    poi:{ hospital:'#b05a5a', restaurant:'#b89858', school:'#5a7a9a',
      fuel:'#7a8a5a', pharmacy:'#9a6a9a', cafe:'#a87850', bank:'#5a6a7a', police:'#4a5a6a' } },
  'soft-night': { name:'Soft Night', nameAr:'ليلي هادئ', land:'#2a2e33',
    water:'#3a4f5a', waterDeep:'#2e4250', waterLine:'#4a5f6a',
    park:'#3a4535', parkDeep:'#303a2a', parkLine:'#4a5545',
    building:{ light:'#4a4e54', mid:'#3c4046', dark:'#30343a', shadow:'#24282e' },
    road:{ motorway:'#5a6068', trunk:'#525860', primary:'#4a5058',
      secondary:'#424850', tertiary:'#3a4048', residential:'#363c44',
      service:'#30363c', casing:'#252a30' },
    boundary:'#5a6068', text:'#d0d5da', textSecondary:'#a0a5aa',
    textHalo:'#2a2e33', text3:'#7a8088',
    accent:'#7aa0b8', accentDark:'#5a8098', accentLight:'#3a4a58',
    bg:'#2a2e33', panel:'rgba(42,46,51,.97)', panelBorder:'#3a4048',
    basemap:'dark',
    poi:{ hospital:'#e08080', restaurant:'#e0b880', school:'#80a0c0',
      fuel:'#a0c080', pharmacy:'#c080d0', cafe:'#c09878', bank:'#80a0b0', police:'#80a8c8' } },
  'classic-city': { name:'Classic City', nameAr:'مدن كلاسيكية', land:'#efe6d4',
    water:'#a8c0c8', waterDeep:'#94acb4', waterLine:'#88a0a8',
    park:'#b8c898', parkDeep:'#a8b888', parkLine:'#98a878',
    building:{ light:'#e4d4b0', mid:'#ccb890', dark:'#b4a070', shadow:'#9c8858' },
    road:{ motorway:'#fbf6e8', trunk:'#f5ecd4', primary:'#ede0c0',
      secondary:'#e4d4a8', tertiary:'#d8c898', residential:'#eae0c4',
      service:'#f0e6cc', casing:'#bca87c' },
    boundary:'#bca87c', text:'#3a2e18', textSecondary:'#5a4a30',
    textHalo:'#efe6d4', text3:'#9a8a68',
    accent:'#8a7050', accentDark:'#6a5030', accentLight:'#ede0c8',
    bg:'#efe6d4', panel:'rgba(250,244,232,.97)', panelBorder:'#d4c4a0',
    basemap:'light',
    poi:{ hospital:'#a85848', restaurant:'#a88048', school:'#5a7080',
      fuel:'#7a8850', pharmacy:'#8a5878', cafe:'#906040', bank:'#5a6a70', police:'#4a5a50' } }
};

const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
let toastTimer;
function toast(msg, ms = 3000) {
  const el = $('toast'); if (!el) return;
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}
function setStatus(html) { const el = $('status-text'); if (el) el.innerHTML = html; }
function progress(p, hint) {
  const bar = $('load-bar'); const h = $('load-hint');
  if (bar) bar.style.width = Math.min(100, p) + '%';
  if (h && hint) h.textContent = hint;
}
let loadingHidden = false;
function hideLoading() {
  if (loadingHidden) return; loadingHidden = true;
  const l = $('loading'); if (!l) return;
  l.classList.add('hidden');
  setTimeout(() => { l.style.display = 'none'; }, 650);
}
async function fetchWithTimeout(url, opts = {}, ms = 15000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ctrl.signal }); }
  finally { clearTimeout(timer); }
}
async function fetchOverpass(query, ms = 20000) {
  for (const server of CONFIG.overpassServers) {
    try {
      const res = await fetchWithTimeout(server, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query)
      }, ms);
      if (!res.ok) continue;
      const data = await res.json();
      if (data && data.elements && data.elements.length) return data;
    } catch (e) {}
  }
  return null;
}
let osmtogeojsonLoaded = false;
function ensureOSMToGeoJSON() {
  if (osmtogeojsonLoaded || window.osmtogeojson) { osmtogeojsonLoaded = true; return Promise.resolve(); }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/osmtogeojson@3.0.0/osmtogeojson.js';
    s.onload = () => { osmtogeojsonLoaded = true; resolve(); };
    s.onerror = () => reject(new Error('load fail'));
    document.head.appendChild(s);
  });
}
function norm(s) {
  return String(s || '').replace(/[أإآٱ]/g, 'ا').replace(/[ىئ]/g, 'ي').replace(/ؤ/g, 'و').replace(/ة/g, 'ه')
    .replace(/[\u064B-\u0652\u0640]/g, '').replace(/^ال/, '')
    .replace(/[\s\-_]+/g, '').trim().toLowerCase();
}
function fmtNum(n) { return n == null ? '—' : Number(n).toLocaleString('en-US'); }
function haversine(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180, lat2 = b.lat * Math.PI / 180;
  const x = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

const Cache = {
  prefix: 'iqmap:',
  get(key) {
    try {
      const raw = localStorage.getItem(this.prefix + key); if (!raw) return null;
      const obj = JSON.parse(raw);
      if (obj.expires && Date.now() > obj.expires) { localStorage.removeItem(this.prefix + key); return null; }
      return obj.value;
    } catch (e) { return null; }
  },
  set(key, value, ttlMs) {
    try { localStorage.setItem(this.prefix + key, JSON.stringify({ value, expires: Date.now() + (ttlMs || 3600000) })); } catch (e) {}
  },
  async fetchJSON(url, opts, ttlMs) {
    const key = 'fetch:' + url + '|' + (opts && opts.body ? opts.body.slice(0, 100) : '');
    const cached = this.get(key); if (cached) return cached;
    const res = await fetchWithTimeout(url, opts, 15000);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    this.set(key, data, ttlMs || 3600000);
    return data;
  }
};

const PROVINCES_DATA = [
  { ar:'بغداد', en:'Baghdad', cap:'بغداد', area:4555, pop:9780429, c:[44.366,33.315], note:'العاصمة الاتحادية ومركز الثقل السياسي والاقتصادي.' },
  { ar:'البصرة', en:'Basra', cap:'البصرة', area:19070, pop:3664168, c:[47.783,30.508], note:'الميناء الرئيسي وقلب العراق الاقتصادي البحري.' },
  { ar:'نينوى', en:'Nineveh', cap:'الموصل', area:37323, pop:4261980, c:[43.118,36.335], note:'أكبر المحافظات سكاناً في شمال العراق.' },
  { ar:'أربيل', en:'Erbil', cap:'أربيل', area:15074, pop:2517534, c:[44.009,36.191], note:'عاصمة إقليم كردستان وأقدم المدن المأهولة.' },
  { ar:'النجف', en:'Najaf', cap:'النجف', area:28824, pop:1950833, c:[44.333,32.000], note:'مركز ديني عالمي وموطن مرقد الإمام علي.' },
  { ar:'كربلاء', en:'Karbala', cap:'كربلاء', area:5034, pop:1754065, c:[44.024,32.616], note:'مدينة الإمام الحسين ومحطة زيارة عالمية.' },
  { ar:'بابل', en:'Babylon', cap:'الحلة', area:5603, pop:2482324, c:[44.433,32.483], note:'موطن حضارة بابل وآثارها المدرجة عالمياً.' },
  { ar:'الأنبار', en:'Anbar', cap:'الرمادي', area:138501, pop:2004418, c:[43.300,33.425], note:'أكبر محافظات العراق مساحةً.' },
  { ar:'ديالى', en:'Diyala', cap:'بعقوبة', area:17685, pop:1934504, c:[44.643,33.745], note:'بوابة العراق الشرقية وسلة حمضيات البلاد.' },
  { ar:'ذي قار', en:'Dhi Qar', cap:'الناصرية', area:12900, pop:2499468, c:[46.257,31.043], note:'موطن حضارة أور السومرية والزقورة الشهيرة.' },
  { ar:'ميسان', en:'Maysan', cap:'العمارة', area:16072, pop:1294503, c:[47.144,31.835], note:'أرض الأهوار والمسطحات المائية الجنوبية.' },
  { ar:'المثنى', en:'Muthanna', cap:'السماوة', area:51740, pop:1043087, c:[45.280,31.311], note:'محافظة صحراوية واسعة على الحدود الجنوبية.' },
  { ar:'القادسية', en:'Qadisiyyah', cap:'الديوانية', area:8153, pop:1477310, c:[44.925,31.992], note:'سلة الحبوب في الفرات الأوسط.' },
  { ar:'واسط', en:'Wasit', cap:'الكوت', area:17153, pop:1643406, c:[45.818,32.512], note:'تحتضن سد الكوت وأراضي زراعية خصبة.' },
  { ar:'صلاح الدين', en:'Saladin', cap:'تكريت', area:24751, pop:1774542, c:[43.678,34.607], note:'محافظة تاريخية على ضفاف دجلة.' },
  { ar:'كركوك', en:'Kirkuk', cap:'كركوك', area:9679, pop:2034627, c:[44.392,35.468], note:'مدينة النفط والتعدد القومي.' },
  { ar:'دهوك', en:'Duhok', cap:'دهوك', area:6553, pop:1599871, c:[42.988,36.867], note:'محافظة جبلية خلابة على الحدود الشمالية.' },
  { ar:'السليمانية', en:'Sulaymaniyah', cap:'السليمانية', area:17023, pop:2401724, c:[45.436,35.561], note:'مركز ثقافي كردي وموطن جبال حمرين.' }
];

const state = {
  map: null, ready: false,
  selectedIdx: null, hoveredIdx: null,
  buildingsActive: true, roadsActive: true, waterActive: true,
  parksActive: true, labelsActive: true, terrainActive: true,
  userLocation: null, userMarker: null,
  destination: null, destMarker: null,
  routeLayers: [], routeData: [], selectedRouteIdx: 0,
  buildingRequestId: 0, roadRequestId: 0,
  lastBuildingBBox: null, lastRoadBBox: null, buildingsVisible: false,
  routeMode: false, measureMode: false,
  measureStart: null, measureMarkers: [],
  tourActive: false,
  poiActive: {}, poiData: {}, poiRequestId: {},
  aiHistory: [], aiBusy: false,
  voiceRecognition: null, isListening: false,
  currentPalette: 'sand-city',
  mapType: 'auto',
  autoEffective: null,
  baseLayerIds: [],
  basemapReady: false,
  roadsData: null,
  bikeActive: false,
  trafficActive: false,
  transitActive: false,
  firesActive: false,
  airActive: false
};

function buildFallbackStyle() {
  return {
    version: 8,
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      'carto-light': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
          'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
          'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png'
        ],
        tileSize: 512, maxzoom: 19
      }
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': T.land } },
      { id: 'carto-base', type: 'raster', source: 'carto-light',
        paint: { 'raster-opacity': 0.95, 'raster-saturation': -0.15, 'raster-brightness-max': 0.98 } }
    ]
  };
}

function applyCalmTheme(map) {
  if (!map) return;
  const style = map.getStyle(); if (!style || !style.layers) return;
  const set = (id, prop, val) => { try { map.setPaintProperty(id, prop, val); } catch (e) {} };
  style.layers.forEach(layer => {
    const id = layer.id;
    const sl = layer['source-layer'] || '';
    const type = layer.type;
    try {
      if (type === 'background') { set(id, 'background-color', T.land); return; }
      if (sl === 'water' && type === 'fill') { set(id, 'fill-color', T.water); set(id, 'fill-opacity', 0.92); return; }
      if (sl === 'water' && type === 'line') { set(id, 'line-color', T.waterLine); return; }
      if (sl === 'waterway' && type === 'line') { set(id, 'line-color', T.water); set(id, 'line-opacity', 0.9); return; }
      if ((sl === 'park' || sl === 'landcover' || sl === 'landuse') && type === 'fill') {
        const isGreen = sl === 'park' || /grass|forest|wood|park|meadow|scrub/i.test(id + ' ' + sl);
        if (isGreen) { set(id, 'fill-color', T.park); set(id, 'fill-opacity', 0.88); }
        else if (/sand|beach|desert/i.test(id + ' ' + sl)) { set(id, 'fill-color', T.building.light); set(id, 'fill-opacity', 0.7); }
        return;
      }
      if (sl === 'building' && type === 'fill') {
        set(id, 'fill-color', T.building.light); set(id, 'fill-opacity', 0.55);
        set(id, 'fill-outline-color', 'rgba(168,149,104,0.55)'); return;
      }
      if (sl === 'transportation' && type === 'line') {
        if (/casing|outline|bridge.casing|tunnel.casing/i.test(id)) {
          set(id, 'line-color', T.road.casing); set(id, 'line-opacity', 0.9); return;
        }
        if (/rail/i.test(id)) { set(id, 'line-color', T.boundary); return; }
        let color = T.road.residential, baseW = 1.2;
        if (/motorway/i.test(id)) { color = T.road.motorway; baseW = 4.5; }
        else if (/trunk/i.test(id)) { color = T.road.trunk; baseW = 4; }
        else if (/primary/i.test(id)) { color = T.road.primary; baseW = 3.2; }
        else if (/secondary/i.test(id)) { color = T.road.secondary; baseW = 2.6; }
        else if (/tertiary/i.test(id)) { color = T.road.tertiary; baseW = 2; }
        else if (/service|footway|path|pedestrian|cycleway|steps/i.test(id)) { color = T.road.service; baseW = 0.8; }
        set(id, 'line-color', color);
        set(id, 'line-width', ['interpolate', ['linear'], ['zoom'], 8, baseW * 0.4, 14, baseW, 18, baseW * 1.15]);
        set(id, 'line-opacity', 0.98); return;
      }
      if (sl === 'boundary' && type === 'line') { set(id, 'line-color', T.boundary); set(id, 'line-opacity', 0.8); return; }
      if (type === 'symbol') {
        try { map.setPaintProperty(id, 'text-color', T.text); } catch (e) {}
        try { map.setPaintProperty(id, 'text-halo-color', T.textHalo); } catch (e) {}
        try { map.setPaintProperty(id, 'text-halo-width', 1.4); } catch (e) {}
        try { map.setPaintProperty(id, 'text-halo-blur', 0.4); } catch (e) {}
        if (sl === 'transportation_name') { try { map.setPaintProperty(id, 'text-color', T.textSecondary); } catch (e) {} }
        try {
          const tf = layer.layout && layer.layout['text-field'];
          if (tf && JSON.stringify(tf).includes('"name"') && !JSON.stringify(tf).includes('"name:ar"')) {
            map.setLayoutProperty(id, 'text-field', ['coalesce', ['get', 'name:ar'], ['get', 'name']]);
          }
        } catch (e) {}
      }
    } catch (e) {}
  });
  try {
    const isDark = state.currentPalette === 'soft-night';
    map.setLight({ anchor: 'viewport', color: isDark ? '#a0b0c0' : '#F2EDDF', intensity: 0.4, position: [1.5, 90, 55] });
  } catch (e) {}
  try {
    map.setFog({ range: [1.5, 8], color: T.textHalo, 'horizon-blend': 0.08,
      'high-color': T.land, 'space-color': T.textHalo, 'star-intensity': 0 });
  } catch (e) {}
}

async function initMap() {
  try {
    maplibregl.setRTLTextPlugin(
      'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.3.0/mapbox-gl-rtl-text.js',
      null, true
    );
  } catch (e) {}
  progress(10, 'جاري تحميل الخريطة الأساسية...');
  let style = null;
  try {
    const res = await fetchWithTimeout('https://tiles.openfreemap.org/styles/liberty', {}, 12000);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    style = await res.json();
    style.glyphs = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
  } catch (err) {
    console.warn('[Map] Liberty style failed, using fallback:', err);
    style = buildFallbackStyle();
    toast('⚠️ تم استخدام الستايل الاحتياطي', 5000);
  }
  progress(25, 'جاري تهيئة المحرك...');
  try {
    state.map = new maplibregl.Map({
      container: 'map', style,
      center: CONFIG.iraqCenter, zoom: CONFIG.iraqZoom,
      pitch: 48, bearing: 0, maxPitch: 85,
      minZoom: 4, maxZoom: 18.5,
      maxBounds: [[36, 27], [51, 39]],
      antialias: true, attributionControl: false,
      preserveDrawingBuffer: true, fadeDuration: 200
    });
  } catch (err) {
    console.error('[Map] init error', err);
    progress(100, '⚠️ تعذر تهيئة الخريطة');
    setTimeout(hideLoading, 800); return;
  }
  const map = state.map;
  map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
  map.addControl(new maplibregl.ScaleControl({ unit: 'metric', maxWidth: 120 }), 'bottom-right');

  map.on('error', e => {
    const msg = e && e.error && e.error.message;
    if (msg && !/tile|404|fetch|abort/i.test(msg)) console.warn('[Map] error', msg);
  });

  map.on('style.load', () => {
    try { applyCalmTheme(map); } catch (e) {}
    if (!state.basemapReady) {
      try {
        state.baseLayerIds = map.getStyle().layers.map(l => l.id);
        addBasemapRasters();
        state.basemapReady = true;
      } catch (e) { console.warn('[Basemap]', e); }
    }
  });

  map.on('rotate', () => {
    const needle = $('compass-needle');
    if (needle) needle.style.transform = `translate(-50%,-100%) rotate(${-map.getBearing()}deg)`;
  });
  map.on('zoom', () => {
    const z = $('zoom-display');
    if (z) z.textContent = 'z ' + map.getZoom().toFixed(1);
    if (state.mapType === 'auto' && state.basemapReady) {
      const newEff = map.getZoom() < 10 ? 'terrain' : 'satellite';
      if (newEff !== state.autoEffective) {
        state.autoEffective = newEff;
        applyEffectiveMapType(newEff);
      }
    }
  });

  map.on('load', () => {
    state.ready = true;
    progress(45, 'جاري إعداد التضاريس...'); try { setupTerrain(); } catch (e) {}
    progress(60, 'جاري تلوين الخريطة...'); try { applyCalmTheme(map); } catch (e) {}
    progress(75, 'جاري رسم المحافظات...'); try { initProvinces(); } catch (e) {}
    progress(90, 'جاري تجهيز المباني...'); try { ensureBuilding3DLayer(); } catch (e) {}
    progress(100, 'جاهز!');
    setStatus('جاهز — ' + PROVINCES_DATA.length + ' محافظة');
    try { updateRasterTiles(PALETTES[state.currentPalette]); } catch (e) {}
    try { updateBuildingColor(map); } catch (e) {}
    try { applyMapType(state.mapType); } catch (e) {}
    setTimeout(hideLoading, 400);
    setTimeout(() => {
      map.easeTo({ center: [43.8, 33.2], zoom: 5.8, pitch: 50, bearing: 0, duration: 1400 });
    }, 200);
    setTimeout(() => { try { applyCalmTheme(map); } catch (e) {} }, 2500);
    setTimeout(() => {
      const wc = $('welcome-card'); if (wc) wc.classList.add('show');
      const wt = $('welcome-title');
      if (wt) wt.textContent = getGreeting() + ' — أهلاً بك';
    }, 700);
    $('compass-needle').style.transform = 'translate(-50%,-100%) rotate(0deg)';
    $('zoom-display').textContent = 'z ' + map.getZoom().toFixed(1);
  });

  map.on('moveend', debounce(() => {
    if (state.buildingsActive) loadBuildingsForViewport(true);
    if (state.roadsActive) loadRoadsForViewport(true);
    if (state.waterActive) loadWaterForViewport(true);
    if (state.parksActive) loadParksForViewport(true);
    Object.keys(state.poiActive).forEach(cat => { if (state.poiActive[cat]) loadPois(cat, true); });
    if (state.bikeActive) loadBikePaths(true);
    if (state.trafficActive) loadTraffic(true);
    if (state.transitActive) loadTransit(true);
  }, CONFIG.debounceMove));

  map.on('click', e => {
    if (state.tourActive) { stopTour(); toast('⏸️ توقفت الجولة'); return; }
    if (state.measureMode) { handleMeasureClick(e.lngLat); return; }
    if (state.routeMode) {
      state.routeMode = false;
      map.getCanvas().style.cursor = '';
      $('btn-route').classList.remove('on');
      setDestination(e.lngLat.lng, e.lngLat.lat);
      return;
    }
    const provLayers = ['province-border'].filter(id => map.getLayer(id));
    const hits = map.queryRenderedFeatures(e.point, { layers: provLayers });
    if (!hits.length) deselectProvince();
  });

  setTimeout(() => {
    if (!state.ready) { progress(100, '⚠️ تأخر التحميل'); setTimeout(hideLoading, 1200); }
  }, 20000);
}

function setupTerrain() {
  const map = state.map;
  try {
    map.addSource('iraq-dem', {
      type: 'raster-dem', tiles: [CONFIG.demTiles],
      tileSize: 256, encoding: 'terrarium', maxzoom: 14
    });
    map.setTerrain({ source: 'iraq-dem', exaggeration: CONFIG.isMobile ? 1.0 : 1.25 });
  } catch (e) { console.warn('[Terrain]', e); }
  try {
    map.addLayer({
      id: 'iraq-hillshade', type: 'hillshade', source: 'iraq-dem',
      paint: {
        'hillshade-exaggeration': 0.35,
        'hillshade-shadow-color': T.building.shadow,
        'hillshade-highlight-color': T.building.light,
        'hillshade-accent-color': T.boundary
      }
    });
  } catch (e) {}
}

/* ============================================================
   MAP TYPE SYSTEM
   ============================================================ */
function addBasemapRasters() {
  const map = state.map;
  if (!map) return;
  const layers = map.getStyle().layers;
  const beforeId = layers.length > 1 ? layers[1].id : undefined;

  try {
    if (!map.getSource('basemap-topo')) {
      map.addSource('basemap-topo', {
        type: 'raster',
        tiles: [
          'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
          'https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
          'https://c.tile.opentopomap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256, maxzoom: 17,
        attribution: '© OpenTopoMap'
      });
    }
    if (!map.getLayer('basemap-topo-layer')) {
      map.addLayer({
        id: 'basemap-topo-layer', type: 'raster', source: 'basemap-topo',
        layout: { visibility: 'none' },
        paint: { 'raster-opacity': 1 }
      }, beforeId);
    }
  } catch (e) { console.warn('[Topo]', e); }

  try {
    if (!map.getSource('basemap-satellite')) {
      map.addSource('basemap-satellite', {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256, maxzoom: 19,
        attribution: '© Esri, Maxar, Earthstar Geographics'
      });
    }
    if (!map.getLayer('basemap-satellite-layer')) {
      map.addLayer({
        id: 'basemap-satellite-layer', type: 'raster', source: 'basemap-satellite',
        layout: { visibility: 'none' },
        paint: { 'raster-opacity': 1 }
      }, beforeId);
    }
  } catch (e) { console.warn('[Satellite]', e); }
}

function applyMapType(type) {
  state.mapType = type;
  document.querySelectorAll('.mt-type').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
  try { localStorage.setItem('iqmap:maptype', type); } catch (e) {}

  let effective = type;
  if (type === 'auto') {
    const z = state.map.getZoom();
    effective = z < 10 ? 'terrain' : 'satellite';
    state.autoEffective = effective;
  } else {
    state.autoEffective = null;
  }
  applyEffectiveMapType(effective);
}

function applyEffectiveMapType(effective) {
  const map = state.map;
  if (!map || !state.basemapReady) return;

  const useRaster = effective === 'terrain' || effective === 'satellite';
  const useTerrain = effective === 'terrain';
  const useSatellite = effective === 'satellite';

  state.baseLayerIds.forEach(id => {
    try {
      const layer = map.getLayer(id);
      if (!layer) return;
      if (layer.type === 'background') return;
      if (id.startsWith('basemap-')) return;
      map.setLayoutProperty(id, 'visibility', useRaster ? 'none' : 'visible');
    } catch (e) {}
  });

  try {
    if (map.getLayer('basemap-topo-layer')) {
      map.setLayoutProperty('basemap-topo-layer', 'visibility', useTerrain ? 'visible' : 'none');
    }
    if (map.getLayer('basemap-satellite-layer')) {
      map.setLayoutProperty('basemap-satellite-layer', 'visibility', useSatellite ? 'visible' : 'none');
    }
  } catch (e) {}

  if (map.getLayer('iraq-hillshade')) {
    try { map.setLayoutProperty('iraq-hillshade', 'visibility', useSatellite ? 'none' : 'visible'); } catch (e) {}
  }

  const customLayers = [
    'building-3d', 'building-roof-edge',
    'roads-minor', 'roads-mid', 'roads-major', 'roads-bridges', 'roads-tunnels',
    'water-detail-fill', 'water-detail-line', 'parks-detail-fill',
    'bike-paths-layer', 'traffic-layer', 'transit-layer', 'fires-layer', 'air-layer'
  ];
  customLayers.forEach(id => {
    try {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'visible');
    } catch (e) {}
  });
}

function setMapTypeFromUI(type) {
  applyMapType(type);
  const labels = { terrain: '⛰️ تضاريس', satellite: '🛰️ قمر صناعي', auto: '🔄 تلقائي' };
  toast('🗺️ نوع الخريطة: ' + labels[type], 2200);
}

/* ============================================================
   BIKE PATHS
   ============================================================ */
async function loadBikePaths(silent) {
  const map = state.map;
  if (!map || !state.ready) return;
  const bounds = map.getBounds();
  if (map.getZoom() < 12) {
    if (!silent) toast('🚴 قرّب الخريطة لعرض مسارات الدراجات');
    return;
  }
  const bbox = [bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast()].join(',');
  const query = `[out:json][timeout:20];
    (way["highway"="cycleway"](${bbox});
     way["cycleway"~"lane|track|opposite"](${bbox});
     way["bicycle"="designated"](${bbox}););
    out geom 1500;`;
  if (!silent) toast('🚴 جاري تحميل مسارات الدراجات...', 6000);
  const data = await fetchOverpass(query, 15000);
  if (!data || !data.elements || !data.elements.length) {
    if (!silent) toast('لا توجد مسارات دراجات في هذه المنطقة');
    return;
  }
  try {
    await ensureOSMToGeoJSON();
    let gj = window.osmtogeojson(data, { flatProperties: true });
    if (gj && typeof gj.then === 'function') gj = await gj;
    const features = (gj.features || []).filter(f => f.geometry &&
      (f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString'));
    if (!features.length) { if (!silent) toast('لا توجد مسارات دراجات'); return; }
    const fc = { type: 'FeatureCollection', features };
    if (map.getSource('bike-paths')) {
      map.getSource('bike-paths').setData(fc);
    } else {
      map.addSource('bike-paths', { type: 'geojson', data: fc });
      const firstSymbol = map.getStyle().layers.find(l => l.type === 'symbol');
      addLayerSafe({
        id: 'bike-paths-layer', type: 'line', source: 'bike-paths',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#176B52',
          'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1.5, 16, 3.5, 18, 5],
          'line-dasharray': [2, 1],
          'line-opacity': 0.9
        }
      }, firstSymbol ? firstSymbol.id : undefined);
    }
    if (!silent) toast('🚴 ' + features.length + ' مسار دراجات');
  } catch (e) { console.warn('[Bike]', e); }
}

function toggleBikePaths(show) {
  state.bikeActive = show;
  const map = state.map;
  if (!show) {
    if (map && map.getLayer('bike-paths-layer')) {
      try { map.setLayoutProperty('bike-paths-layer', 'visibility', 'none'); } catch (e) {}
    }
    toast('🚴 مسارات الدراجات مخفية');
    return;
  }
  if (map && map.getLayer('bike-paths-layer')) {
    try { map.setLayoutProperty('bike-paths-layer', 'visibility', 'visible'); } catch (e) {}
    toast('🚴 مسارات الدراجات مفعلة');
  } else {
    loadBikePaths(false);
  }
}

/* ============================================================
   TRAFFIC
   ============================================================ */
function getTrafficLevel(coords) {
  if (!coords || !coords.length) return 'low';
  const pt = (Array.isArray(coords[0]) && typeof coords[0][0] === 'number') ? coords[0] : coords[0][0];
  if (!pt) return 'low';
  const seed = Math.abs(Math.sin(pt[0] * 12345 + pt[1] * 54321)) % 1;
  if (seed > 0.65) return 'high';
  if (seed > 0.30) return 'medium';
  return 'low';
}

async function loadTraffic(silent) {
  const map = state.map;
  if (!map || !state.ready) return;
  if (!state.roadsData) {
    if (!silent) toast('🚗 انتظر تحميل الشوارع...');
    await loadRoadsForViewport(true);
    if (!state.roadsData) return;
  }
  const features = state.roadsData.features
    .filter(f => f.geometry && f.geometry.coordinates)
    .map(f => {
      const level = getTrafficLevel(f.geometry.coordinates);
      return { ...f, properties: { ...f.properties, _traffic: level } };
    });
  if (!features.length) return;
  const fc = { type: 'FeatureCollection', features };
  if (map.getSource('traffic')) {
    map.getSource('traffic').setData(fc);
  } else {
    map.addSource('traffic', { type: 'geojson', data: fc });
    const firstSymbol = map.getStyle().layers.find(l => l.type === 'symbol');
    addLayerSafe({
      id: 'traffic-layer', type: 'line', source: 'traffic',
      filter: ['match', ['get', '_class'], ['motorway','trunk','primary','secondary'], true, false],
      paint: {
        'line-color': ['match', ['get', '_traffic'],
          'high', '#244B78', 'medium', '#C5A45D', 'low', '#176B52', '#A89568'
        ],
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.5, 14, 3, 18, 6],
        'line-opacity': 0.72
      }
    }, firstSymbol ? firstSymbol.id : undefined);
  }
  if (!silent) toast('🚗 حركة المرور (محاكاة)');
}

function toggleTraffic(show) {
  state.trafficActive = show;
  const map = state.map;
  if (!show) {
    if (map && map.getLayer('traffic-layer')) {
      try { map.setLayoutProperty('traffic-layer', 'visibility', 'none'); } catch (e) {}
    }
    toast('🚗 حركة المرور مخفية');
    return;
  }
  if (map && map.getLayer('traffic-layer')) {
    try { map.setLayoutProperty('traffic-layer', 'visibility', 'visible'); } catch (e) {}
    toast('🚗 حركة المرور مفعلة (محاكاة)');
  } else {
    loadTraffic(false);
  }
}

/* ============================================================
   PUBLIC TRANSPORT
   ============================================================ */
async function loadTransit(silent) {
  const map = state.map;
  if (!map || !state.ready) return;
  if (map.getZoom() < 11) {
    if (!silent) toast('🚌 قرّب الخريطة لعرض النقل العام');
    return;
  }
  const bounds = map.getBounds();
  const bbox = [bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast()].join(',');
  const query = `[out:json][timeout:20];
    (node["public_transport"="station"](${bbox});
     node["railway"="station"](${bbox});
     node["highway"="bus_stop"](${bbox});
     node["amenity"="bus_station"](${bbox}););
    out 800;`;
  if (!silent) toast('🚌 جاري تحميل النقل العام...', 6000);
  const data = await fetchOverpass(query, 15000);
  if (!data || !data.elements || !data.elements.length) {
    if (!silent) toast('لا توجد محطات نقل عام في هذه المنطقة');
    return;
  }
  const features = data.elements.filter(e => e.lat && e.lon).map(e => {
    const tags = e.tags || {};
    let kind = 'bus';
    let color = '#176B52';
    if (tags.railway === 'station' || tags.public_transport === 'station') { kind = 'train'; color = '#244B78'; }
    if (tags.amenity === 'bus_station') { kind = 'bus_station'; color = '#C5A45D'; }
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [e.lon, e.lat] },
      properties: {
        name: tags['name:ar'] || tags.name || (kind === 'train' ? 'محطة قطار' : kind === 'bus_station' ? 'محطة حافلات' : 'موقف حافلة'),
        kind, color
      }
    };
  });
  const fc = { type: 'FeatureCollection', features };
  if (map.getSource('transit')) {
    map.getSource('transit').setData(fc);
  } else {
    map.addSource('transit', { type: 'geojson', data: fc });
    const firstSymbol = map.getStyle().layers.find(l => l.type === 'symbol');
    addLayerSafe({
      id: 'transit-layer', type: 'circle', source: 'transit',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 5, 15, 9, 18, 12],
        'circle-color': ['get', 'color'],
        'circle-stroke-width': 2.5,
        'circle-stroke-color': '#F2EDDF',
        'circle-opacity': 0.92
      }
    }, firstSymbol ? firstSymbol.id : undefined);
    map.on('click', 'transit-layer', e => {
      if (!e.features || !e.features.length) return;
      const p = e.features[0].properties;
      new maplibregl.Popup({ offset: 12 })
        .setLngLat(e.lngLat)
        .setHTML('<div style="direction:rtl;text-align:right;font-family:inherit">' +
          '<b style="color:#1E2E3A">' + (p.kind === 'train' ? '🚆 ' : '🚌 ') + p.name + '</b>' +
          '<div style="font-size:11px;color:#415464;margin-top:4px">' +
          (p.kind === 'train' ? 'محطة قطار' : p.kind === 'bus_station' ? 'محطة حافلات' : 'موقف حافلة') +
          '</div></div>')
        .addTo(map);
    });
    map.on('mouseenter', 'transit-layer', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'transit-layer', () => { map.getCanvas().style.cursor = ''; });
  }
  if (!silent) toast('🚌 ' + features.length + ' محطة نقل عام');
}

function toggleTransit(show) {
  state.transitActive = show;
  const map = state.map;
  if (!show) {
    if (map && map.getLayer('transit-layer')) {
      try { map.setLayoutProperty('transit-layer', 'visibility', 'none'); } catch (e) {}
    }
    toast('🚌 النقل العام مخفي');
    return;
  }
  if (map && map.getLayer('transit-layer')) {
    try { map.setLayoutProperty('transit-layer', 'visibility', 'visible'); } catch (e) {}
    toast('🚌 النقل العام مفعل');
  } else {
    loadTransit(false);
  }
}

/* ============================================================
   FOREST FIRES (SIMULATION LAYER - بيانات توضيحية لطبقة المحاكاة)
   ============================================================ */
function loadFires() {
  const map = state.map;
  if (!map) return;
  const regions = [
    { c: [44.5, 36.5], n: 3 },
    { c: [45.0, 35.5], n: 2 },
    { c: [43.5, 37.0], n: 2 },
    { c: [43.0, 34.5], n: 1 }
  ];
  const features = [];
  regions.forEach(r => {
    for (let i = 0; i < r.n; i++) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [r.c[0] + (Math.random() - 0.5) * 0.7, r.c[1] + (Math.random() - 0.5) * 0.4]
        },
        properties: {
          intensity: ['منخفضة', 'متوسطة', 'عالية'][Math.floor(Math.random() * 3)],
          time: new Date(Date.now() - Math.random() * 3600000).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
        }
      });
    }
  });
  const fc = { type: 'FeatureCollection', features };
  if (map.getSource('fires')) {
    map.getSource('fires').setData(fc);
  } else {
    map.addSource('fires', { type: 'geojson', data: fc });
    const firstSymbol = map.getStyle().layers.find(l => l.type === 'symbol');
    addLayerSafe({
      id: 'fires-glow', type: 'circle', source: 'fires',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 12, 10, 22, 14, 35],
        'circle-color': '#C5A45D',
        'circle-opacity': 0.22,
        'circle-blur': 1
      }
    }, firstSymbol ? firstSymbol.id : undefined);
    addLayerSafe({
      id: 'fires-layer', type: 'circle', source: 'fires',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 4, 10, 7, 14, 10],
        'circle-color': '#8A6B38',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#F2EDDF',
        'circle-opacity': 0.95
      }
    }, firstSymbol ? firstSymbol.id : undefined);
    map.on('click', 'fires-layer', e => {
      if (!e.features || !e.features.length) return;
      const p = e.features[0].properties;
      new maplibregl.Popup({ offset: 12 })
        .setLngLat(e.lngLat)
        .setHTML('<div style="direction:rtl;text-align:right;font-family:inherit">' +
          '<b style="color:#1E2E3A">🔥 حريق غابة</b>' +
          '<div style="font-size:11px;color:#415464;margin-top:4px">الشدة: ' + p.intensity +
          '<br>الوقت: ' + p.time + '</div>' +
          '<div style="font-size:10px;color:#A88438;margin-top:4px">⚠️ بيانات محاكاة</div></div>')
        .addTo(map);
    });
    map.on('mouseenter', 'fires-layer', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'fires-layer', () => { map.getCanvas().style.cursor = ''; });
  }
  toast('🔥 حرائق الغابات (محاكاة)');
}

function toggleFires(show) {
  state.firesActive = show;
  const map = state.map;
  if (!show) {
    ['fires-layer', 'fires-glow'].forEach(id => {
      if (map && map.getLayer(id)) {
        try { map.setLayoutProperty(id, 'visibility', 'none'); } catch (e) {}
      }
    });
    toast('🔥 حرائق الغابات مخفية');
    return;
  }
  if (map && map.getLayer('fires-layer')) {
    ['fires-layer', 'fires-glow'].forEach(id => {
      try { map.setLayoutProperty(id, 'visibility', 'visible'); } catch (e) {}
    });
    toast('🔥 حرائق الغابات مفعلة (محاكاة)');
  } else {
    loadFires();
  }
}

/* ============================================================
   AIR QUALITY (بيانات حقيقية من Open-Meteo)
   ============================================================ */
async function loadAirQuality(silent) {
  const map = state.map;
  if (!map || !state.ready) return;
  if (!silent) toast('🌫️ جاري جلب جودة الهواء...', 6000);
  const sample = PROVINCES_DATA.slice(0, 8);
  const features = [];
  await Promise.all(sample.map(async p => {
    try {
      const url = CONFIG.aqiApi + '?latitude=' + p.c[1] + '&longitude=' + p.c[0] +
        '&current=european_aqi,pm2_5,pm10&timezone=Asia/Baghdad';
      const res = await fetchWithTimeout(url, {}, 8000);
      if (!res.ok) return;
      const data = await res.json();
      if (!data.current) return;
      const aqi = data.current.european_aqi;
      let level = 'good', color = '#176B52';
      if (aqi > 80) { level = 'very_poor'; color = '#1A3A5E'; }
      else if (aqi > 60) { level = 'poor'; color = '#244B78'; }
      else if (aqi > 40) { level = 'moderate'; color = '#C5A45D'; }
      else if (aqi > 20) { level = 'fair'; color = '#D4C895'; }
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: p.c },
        properties: {
          name: p.ar, aqi, pm25: data.current.pm2_5, pm10: data.current.pm10,
          level, color
        }
      });
    } catch (e) {}
  }));
  if (!features.length) {
    if (!silent) toast('تعذر جلب بيانات جودة الهواء');
    return;
  }
  const fc = { type: 'FeatureCollection', features };
  if (map.getSource('air')) {
    map.getSource('air').setData(fc);
  } else {
    map.addSource('air', { type: 'geojson', data: fc });
    const firstSymbol = map.getStyle().layers.find(l => l.type === 'symbol');
    addLayerSafe({
      id: 'air-glow', type: 'circle', source: 'air',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 20, 10, 45, 14, 70],
        'circle-color': ['get', 'color'],
        'circle-opacity': 0.2,
        'circle-blur': 1.5
      }
    }, firstSymbol ? firstSymbol.id : undefined);
    addLayerSafe({
      id: 'air-layer', type: 'circle', source: 'air',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 8, 10, 14, 14, 20],
        'circle-color': ['get', 'color'],
        'circle-stroke-width': 2.5,
        'circle-stroke-color': '#F2EDDF',
        'circle-opacity': 0.9
      }
    }, firstSymbol ? firstSymbol.id : undefined);
    map.on('click', 'air-layer', e => {
      if (!e.features || !e.features.length) return;
      const p = e.features[0].properties;
      const levelNames = { good: 'جيد', fair: 'مقبول', moderate: 'متوسط', poor: 'سيئ', very_poor: 'سيئ جداً' };
      new maplibregl.Popup({ offset: 12 })
        .setLngLat(e.lngLat)
        .setHTML('<div style="direction:rtl;text-align:right;font-family:inherit;min-width:160px">' +
          '<b style="color:#1E2E3A">🌫️ ' + p.name + '</b>' +
          '<div style="font-size:12px;margin-top:6px;color:#1E2E3A">' +
          '<div>AQI: <b style="color:' + p.color + '">' + p.aqi + '</b> — ' + (levelNames[p.level] || '') + '</div>' +
          '<div style="font-size:11px;color:#415464;margin-top:2px">PM2.5: ' + p.pm25 + ' μg/m³</div>' +
          '<div style="font-size:11px;color:#415464">PM10: ' + p.pm10 + ' μg/m³</div>' +
          '<div style="font-size:9px;color:#7A8A98;margin-top:4px">المصدر: Open-Meteo</div>' +
          '</div></div>')
        .addTo(map);
    });
    map.on('mouseenter', 'air-layer', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'air-layer', () => { map.getCanvas().style.cursor = ''; });
  }
  if (!silent) toast('🌫️ جودة الهواء: ' + features.length + ' مدينة');
}

function toggleAirQuality(show) {
  state.airActive = show;
  const map = state.map;
  if (!show) {
    ['air-layer', 'air-glow'].forEach(id => {
      if (map && map.getLayer(id)) {
        try { map.setLayoutProperty(id, 'visibility', 'none'); } catch (e) {}
      }
    });
    toast('🌫️ جودة الهواء مخفية');
    return;
  }
  if (map && map.getLayer('air-layer')) {
    ['air-layer', 'air-glow'].forEach(id => {
      try { map.setLayoutProperty(id, 'visibility', 'visible'); } catch (e) {}
    });
    toast('🌫️ جودة الهواء مفعلة');
  } else {
    loadAirQuality(false);
  }
}

/* ============================================================
   PROVINCES
   ============================================================ */
function initProvinces() {
  (async () => {
    try {
      const query = `[out:json][timeout:25];
        area["ISO3166-1"="IQ"]["admin_level"="2"]->.a;
        relation["boundary"="administrative"]["admin_level"="4"](area.a);
        out body geom;`;
      const data = await fetchOverpass(query, 20000);
      if (!data || !data.elements) throw new Error('no data');
      await ensureOSMToGeoJSON();
      let gj = window.osmtogeojson(data, { flatProperties: false });
      if (gj && typeof gj.then === 'function') gj = await gj;
      buildProvinceLayersFromGeoJSON(gj);
      setStatus('جاهز — ' + PROVINCES_DATA.length + ' محافظة');
    } catch (e) {
      console.warn('[Provinces]', e);
      buildProvinceMarkers();
    }
  })();
  renderProvinceList();
}

function buildProvinceLayersFromGeoJSON(gj) {
  const map = state.map;
  if (!gj || !gj.features) { buildProvinceMarkers(); return; }
  const features = gj.features.filter(f => f.geometry &&
    (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'));
  if (!features.length) { buildProvinceMarkers(); return; }
  const merged = features.map((f, i) => {
    const tags = (f.properties && f.properties.tags) || {};
    const rawName = tags['name:ar'] || tags.name || tags['name:en'] || ('محافظة ' + (i + 1));
    const meta = PROVINCES_DATA.find(p =>
      norm(p.ar) === norm(rawName) || norm(p.en) === norm(tags['name:en'] || '') || norm(p.en) === norm(tags.name || '')
    );
    return {
      type: 'Feature', id: i, geometry: f.geometry,
      properties: {
        idx: i, name: meta ? meta.ar : rawName,
        nameEn: meta ? meta.en : (tags['name:en'] || ''),
        pop: meta ? meta.pop : 0, area: meta ? meta.area : 0
      }
    };
  });
  const fc = { type: 'FeatureCollection', features: merged };
  map.addSource('provinces', { type: 'geojson', data: fc });
  map.addLayer({
    id: 'province-border', type: 'line', source: 'provinces',
    paint: { 'line-color': T.boundary, 'line-width': 1.5, 'line-opacity': 0.75 }
  });
  map.addLayer({
    id: 'province-highlight', type: 'line', source: 'provinces',
    paint: {
      'line-color': ['case',
        ['boolean', ['feature-state', 'selected'], false], T.accentDark,
        ['boolean', ['feature-state', 'hover'], false], T.accent, 'rgba(0,0,0,0)'],
      'line-width': ['case',
        ['boolean', ['feature-state', 'selected'], false], 3,
        ['boolean', ['feature-state', 'hover'], false], 2.5, 0],
      'line-opacity': 0.9
    }
  });
  const tooltip = $('prov-tooltip');
  map.on('mousemove', 'province-border', e => {
    map.getCanvas().style.cursor = 'pointer';
    if (!e.features || !e.features.length) return;
    const id = e.features[0].id;
    if (state.hoveredIdx !== id) {
      if (state.hoveredIdx !== null) {
        try { map.setFeatureState({ source: 'provinces', id: state.hoveredIdx }, { hover: false }); } catch (err) {}
      }
      state.hoveredIdx = id;
      try { map.setFeatureState({ source: 'provinces', id }, { hover: true }); } catch (err) {}
    }
    if (tooltip) {
      tooltip.textContent = (e.features[0].properties && e.features[0].properties.name) || '';
      if (e.originalEvent) {
        tooltip.style.left = (e.originalEvent.clientX + 14) + 'px';
        tooltip.style.top = (e.originalEvent.clientY + 14) + 'px';
      }
      tooltip.style.display = 'block';
    }
  });
  map.on('mouseleave', 'province-border', () => {
    map.getCanvas().style.cursor = '';
    if (state.hoveredIdx !== null) {
      try { map.setFeatureState({ source: 'provinces', id: state.hoveredIdx }, { hover: false }); } catch (err) {}
      state.hoveredIdx = null;
    }
    if (tooltip) tooltip.style.display = 'none';
  });
  map.on('click', 'province-border', e => {
    if (!e.features || !e.features.length) return;
    selectProvince(Number(e.features[0].id));
  });
  buildProvinceMarkers();
}

function buildProvinceMarkers() {
  const map = state.map;
  PROVINCES_DATA.forEach((p, i) => {
    const el = document.createElement('div');
    el.className = 'province-marker';
    el.style.cssText = 'cursor:pointer;pointer-events:auto;';
    el.innerHTML = `<div style="
      background:var(--panel);border:1px solid var(--panel-border);
      border-radius:14px;padding:3px 9px;font-size:11px;font-weight:600;
      color:var(--accent-2);box-shadow:0 2px 8px rgba(30,46,58,.14);
      white-space:nowrap;transform:translate(-50%,-50%);">${p.ar}</div>`;
    el.addEventListener('click', ev => { ev.stopPropagation(); selectProvince(i); });
    p.marker = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(p.c).addTo(map);
  });
}

function renderProvinceList() {
  const box = $('prov-list'); if (!box) return;
  box.innerHTML = '';
  const sorted = [...PROVINCES_DATA].sort((a, b) => a.ar.localeCompare(b.ar, 'ar'));
  sorted.forEach(p => {
    const idx = PROVINCES_DATA.indexOf(p);
    const row = document.createElement('div');
    row.className = 'prov-item';
    row.dataset.idx = idx;
    row.innerHTML = '<span class="dot-mini"></span><span><bdi>' + p.ar + '</bdi></span>';
    row.addEventListener('click', () => selectProvince(idx));
    row.addEventListener('mouseenter', () => {
      try { state.map.setFeatureState({ source: 'provinces', id: idx }, { hover: true }); } catch (e) {}
    });
    row.addEventListener('mouseleave', () => {
      try { state.map.setFeatureState({ source: 'provinces', id: idx }, { hover: false }); } catch (e) {}
    });
    box.appendChild(row);
  });
  const cnt = $('prov-count');
  if (cnt) cnt.textContent = PROVINCES_DATA.length + ' محافظة';
}

function selectProvince(idx) {
  const p = PROVINCES_DATA[idx]; if (!p) return;
  const map = state.map;
  if (state.selectedIdx !== null) {
    try { map.setFeatureState({ source: 'provinces', id: state.selectedIdx }, { selected: false }); } catch (e) {}
  }
  state.selectedIdx = idx;
  try { map.setFeatureState({ source: 'provinces', id: idx }, { selected: true }); } catch (e) {}
  document.querySelectorAll('.prov-item').forEach(el => {
    el.classList.toggle('active', Number(el.dataset.idx) === idx);
  });
  $('p-name').textContent = p.ar;
  $('p-en').textContent = p.en.toUpperCase();
  $('p-info').textContent = p.note;
  const grid = $('p-stats'); grid.innerHTML = '';
  [
    ['المركز', p.cap],
    ['المساحة', fmtNum(p.area) + ' <em>كم²</em>'],
    ['السكان', fmtNum(p.pop) + ' <em>نسمة</em>'],
    ['الكثافة', fmtNum(Math.round(p.pop / p.area)) + ' <em>ن/كم²</em>']
  ].forEach(([label, val]) => {
    const d = document.createElement('div');
    d.className = 'stat';
    d.innerHTML = '<span>' + label + '</span><b><bdi>' + val + '</bdi></b>';
    grid.appendChild(d);
  });
  const admin = $('p-admin'); admin.innerHTML = '';
  [
    ['الاسم العربي', p.ar, false],
    ['الاسم الإنجليزي', p.en, false],
    ['المركز الإداري', p.cap, false],
    ['الإحداثيات', p.c[1].toFixed(3) + '°N, ' + p.c[0].toFixed(3) + '°E', true]
  ].forEach(([k, v, ltr]) => {
    const el = document.createElement('p');
    el.appendChild(document.createTextNode(k + ': '));
    const val = document.createElement('bdi');
    if (ltr) val.setAttribute('dir', 'ltr');
    val.textContent = String(v == null ? '' : v);
    el.appendChild(val); admin.appendChild(el);
  });
  $('panel').classList.add('show');
  map.flyTo({ center: p.c, zoom: 7.8, pitch: 55, bearing: 0, duration: 1400 });
}

function deselectProvince() {
  if (state.selectedIdx === null) return;
  try { state.map.setFeatureState({ source: 'provinces', id: state.selectedIdx }, { selected: false }); } catch (e) {}
  state.selectedIdx = null;
  document.querySelectorAll('.prov-item').forEach(el => el.classList.remove('active'));
  $('panel').classList.remove('show');
}

/* ============================================================
   3D BUILDINGS
   ============================================================ */
function ensureBuilding3DLayer() {
  const map = state.map;
  if (!map || map.getLayer('building-3d')) return;
}

async function loadBuildingsForViewport(silent) {
  const map = state.map;
  if (!map || !state.ready) return;
  if (map.getZoom() < CONFIG.minZoomBuilding) {
    if (!silent) toast('⚠️ قرّب الخريطة أكثر (zoom ≥ ' + CONFIG.minZoomBuilding + ')');
    return;
  }
  const bounds = map.getBounds();
  const bboxKey = [bounds.getSouth().toFixed(3), bounds.getWest().toFixed(3),
    bounds.getNorth().toFixed(3), bounds.getEast().toFixed(3)].join(',');
  if (bboxKey === state.lastBuildingBBox) return;
  const myReq = ++state.buildingRequestId;
  const bbox = [bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast()].join(',');
  const query = `[out:json][timeout:20];
    (way["building"](${bbox}); relation["building"](${bbox}););
    out geom ${CONFIG.maxFeaturesBuilding};`;
  if (!silent) toast('🏢 جاري تحميل المباني...', 8000);
  const data = await fetchOverpass(query, 15000);
  if (myReq !== state.buildingRequestId) return;
  if (!data || !data.elements || !data.elements.length) {
    if (!silent) toast('لا توجد مبانٍ في هذه المنطقة');
    return;
  }
  try {
    await ensureOSMToGeoJSON();
    let gj = window.osmtogeojson(data, { flatProperties: false });
    if (gj && typeof gj.then === 'function') gj = await gj;
    const features = (gj.features || []).filter(f =>
      f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'));
    if (!features.length) return;
    features.forEach(f => {
      const tags = (f.properties && f.properties.tags) || f.properties || {};
      const rawH = parseFloat(tags.height);
      const rawL = parseFloat(tags['building:levels']);
      let h = 6;
      if (Number.isFinite(rawH)) h = rawH;
      else if (Number.isFinite(rawL)) h = rawL * 3.2;
      else {
        const type = String(tags.building || '').toLowerCase();
        if (/house|hut|shed|garage/.test(type)) h = 3.5;
        else if (/apartments|residential|dormitory/.test(type)) h = 15;
        else if (/commercial|retail|office/.test(type)) h = 20;
        else if (/industrial|warehouse/.test(type)) h = 10;
        else if (/school|university|hospital|government|civic/.test(type)) h = 12;
        else if (/mosque|church|temple|cathedral/.test(type)) h = 10;
        else if (/tower|skyscraper/.test(type)) h = 60;
        else h = 7;
      }
      h = Math.max(3, Math.min(200, h));
      f.properties._h = h;
      f.properties._base = 0;
      const type = String(tags.building || 'yes').toLowerCase();
      let cat = 'generic';
      if (/residential|house|apartments|dormitory/.test(type)) cat = 'residential';
      else if (/commercial|office|retail|hotel/.test(type)) cat = 'commercial';
      else if (/industrial|warehouse/.test(type)) cat = 'industrial';
      else if (/school|university|hospital|government|civic/.test(type)) cat = 'civic';
      else if (/mosque|church|temple|cathedral|religious/.test(type)) cat = 'religious';
      else if (/tower|skyscraper/.test(type)) cat = 'tower';
      f.properties._cat = cat;
    });
    const fc = { type: 'FeatureCollection', features };
    if (map.getSource('buildings')) {
      map.getSource('buildings').setData(fc);
      updateBuildingColor(map);
    } else {
      map.addSource('buildings', { type: 'geojson', data: fc });
      const firstSymbol = map.getStyle().layers.find(l => l.type === 'symbol');
      const beforeId = firstSymbol ? firstSymbol.id : undefined;
      const buildingLayer = {
        id: 'building-3d', type: 'fill-extrusion', source: 'buildings',
        minzoom: CONFIG.minZoomBuilding - 0.5,
        paint: {
          'fill-extrusion-color': getBuildingColorExpr(),
          'fill-extrusion-height': ['get', '_h'],
          'fill-extrusion-base': ['get', '_base'],
          'fill-extrusion-opacity': 0.95,
          'fill-extrusion-vertical-gradient': true
        }
      };
      addLayerSafe(buildingLayer, beforeId);
      addLayerSafe({
        id: 'building-roof-edge', type: 'line', source: 'buildings',
        minzoom: CONFIG.minZoomBuilding,
        paint: { 'line-color': T.boundary, 'line-width': 0.6, 'line-opacity': 0.5 }
      }, beforeId);
    }
    state.lastBuildingBBox = bboxKey;
    state.buildingsVisible = true;
    if (!state.buildingsActive) {
      try { map.setLayoutProperty('building-3d', 'visibility', 'none'); } catch (e) {}
      try { map.setLayoutProperty('building-roof-edge', 'visibility', 'none'); } catch (e) {}
    }
    if (!silent) toast('🏢 تم تحميل ' + features.length + ' مبنى');
  } catch (err) {
    console.warn('[Buildings]', err);
    if (!silent) toast('تعذر تحميل المباني');
  }
}

function getBuildingColorExpr() {
  return ['match', ['get', '_cat'],
    'residential', T.building.mid, 'commercial', T.building.light,
    'industrial', T.building.dark, 'civic', T.building.light,
    'religious', T.building.mid, 'tower', T.building.dark, T.building.light];
}

function updateBuildingColor(map) {
  if (!map || !map.getLayer('building-3d')) return;
  try { map.setPaintProperty('building-3d', 'fill-extrusion-color', getBuildingColorExpr()); } catch (e) {}
  try { map.setPaintProperty('building-roof-edge', 'line-color', T.boundary); } catch (e) {}
  try { map.setPaintProperty('building-3d', 'fill-extrusion-opacity', state.currentPalette === 'soft-night' ? 0.85 : 0.95); } catch (e) {}
}

/* ============================================================
   ROADS
   ============================================================ */
async function loadRoadsForViewport(silent) {
  const map = state.map;
  if (!map || !state.ready) return;
  if (map.getZoom() < CONFIG.minZoomRoad) return;
  const bounds = map.getBounds();
  const bboxKey = [bounds.getSouth().toFixed(3), bounds.getWest().toFixed(3),
    bounds.getNorth().toFixed(3), bounds.getEast().toFixed(3)].join(',');
  if (bboxKey === state.lastRoadBBox && state.roadsData) return;
  const myReq = ++state.roadRequestId;
  const bbox = [bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast()].join(',');
  const query = `[out:json][timeout:25];
    (way["highway"~"motorway|trunk|primary|secondary|tertiary|residential|service|unclassified"](${bbox});
     way["bridge"="yes"](${bbox}); way["tunnel"="yes"](${bbox}););
    out geom ${CONFIG.maxFeaturesRoad};`;
  if (!silent) toast('🛣️ جاري تحميل الشوارع...', 8000);
  const data = await fetchOverpass(query, 18000);
  if (myReq !== state.roadRequestId) return;
  if (!data || !data.elements || !data.elements.length) return;
  try {
    await ensureOSMToGeoJSON();
    let gj = window.osmtogeojson(data, { flatProperties: true });
    if (gj && typeof gj.then === 'function') gj = await gj;
    const features = (gj.features || []).filter(f => f.geometry &&
      (f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString'));
    if (!features.length) return;
    features.forEach(f => {
      const tags = f.properties || {};
      const hw = tags.highway || '';
      f.properties._class = tags.bridge === 'yes' ? 'bridge'
        : tags.tunnel === 'yes' ? 'tunnel' : hw;
    });
    const fc = { type: 'FeatureCollection', features };
    state.roadsData = fc;
    if (map.getSource('roads')) {
      map.getSource('roads').setData(fc);
    } else {
      map.addSource('roads', { type: 'geojson', data: fc });
      const firstSymbol = map.getStyle().layers.find(l => l.type === 'symbol');
      const beforeId = firstSymbol ? firstSymbol.id : undefined;
      addLayerSafe({
        id: 'roads-minor', type: 'line', source: 'roads',
        minzoom: CONFIG.minZoomRoad,
        filter: ['match', ['get', '_class'],
          ['service', 'residential', 'living_street', 'unclassified', 'pedestrian'], true, false],
        paint: { 'line-color': T.road.residential, 'line-width':
          ['interpolate', ['linear'], ['zoom'], 13, 1, 16, 2.2, 18, 3], 'line-opacity': 0.95 }
      }, beforeId);
      addLayerSafe({
        id: 'roads-mid', type: 'line', source: 'roads',
        minzoom: CONFIG.minZoomRoad,
        filter: ['match', ['get', '_class'], ['tertiary', 'secondary'], true, false],
        paint: { 'line-color': T.road.primary, 'line-width':
          ['interpolate', ['linear'], ['zoom'], 13, 1.5, 16, 2.8, 18, 4], 'line-opacity': 0.98 }
      }, beforeId);
      addLayerSafe({
        id: 'roads-major', type: 'line', source: 'roads',
        minzoom: CONFIG.minZoomRoad - 1,
        filter: ['match', ['get', '_class'], ['primary', 'trunk', 'motorway'], true, false],
        paint: { 'line-color': T.road.motorway, 'line-width':
          ['interpolate', ['linear'], ['zoom'], 10, 1.8, 14, 3.5, 18, 6], 'line-opacity': 1 }
      }, beforeId);
      addLayerSafe({
        id: 'roads-bridges', type: 'line', source: 'roads',
        minzoom: CONFIG.minZoomRoad,
        filter: ['==', ['get', '_class'], 'bridge'],
        paint: { 'line-color': T.road.motorway, 'line-width': 3.5, 'line-opacity': 1 }
      }, beforeId);
      addLayerSafe({
        id: 'roads-tunnels', type: 'line', source: 'roads',
        minzoom: CONFIG.minZoomRoad,
        filter: ['==', ['get', '_class'], 'tunnel'],
        paint: { 'line-color': T.road.casing, 'line-width': 2,
          'line-dasharray': [2, 2], 'line-opacity': 0.8 }
      }, beforeId);
    }
    state.lastRoadBBox = bboxKey;
    if (!silent) toast('🛣️ تم تحميل ' + features.length + ' مقطع طريق');
    if (state.trafficActive) loadTraffic(true);
  } catch (err) { console.warn('[Roads]', err); }
}

function addLayerSafe(layer, beforeId) {
  const map = state.map;
  try {
    if (beforeId && map.getLayer(beforeId)) map.addLayer(layer, beforeId);
    else map.addLayer(layer);
  } catch (e) {
    try { map.addLayer(layer); } catch (e2) { console.warn('[Layer]', e2); }
  }
}

/* ============================================================
   WATER & PARKS
   ============================================================ */
async function loadWaterForViewport(silent) {
  const map = state.map;
  if (!map || !state.ready) return;
  if (map.getZoom() < CONFIG.minZoomWater) return;
  const bounds = map.getBounds();
  const bbox = [bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast()].join(',');
  const query = `[out:json][timeout:20];
    (way["natural"="water"](${bbox}); relation["natural"="water"](${bbox});
     way["waterway"~"river|canal|stream"](${bbox});); out geom 800;`;
  const data = await fetchOverpass(query, 12000);
  if (!data || !data.elements || !data.elements.length) return;
  try {
    await ensureOSMToGeoJSON();
    let gj = window.osmtogeojson(data, { flatProperties: true });
    if (gj && typeof gj.then === 'function') gj = await gj;
    const feats = (gj.features || []).filter(f => f.geometry);
    if (!feats.length) return;
    const fc = { type: 'FeatureCollection', features: feats };
    if (map.getSource('water-detail')) {
      map.getSource('water-detail').setData(fc);
    } else {
      const firstSymbol = map.getStyle().layers.find(l => l.type === 'symbol');
      const beforeId = firstSymbol ? firstSymbol.id : undefined;
      map.addSource('water-detail', { type: 'geojson', data: fc });
      addLayerSafe({
        id: 'water-detail-fill', type: 'fill', source: 'water-detail',
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: { 'fill-color': T.water, 'fill-opacity': 0.92 }
      }, beforeId);
      addLayerSafe({
        id: 'water-detail-line', type: 'line', source: 'water-detail',
        paint: { 'line-color': T.waterLine, 'line-width': 1.2, 'line-opacity': 0.85 }
      }, beforeId);
    }
  } catch (e) { console.warn('[Water]', e); }
}

async function loadParksForViewport(silent) {
  const map = state.map;
  if (!map || !state.ready) return;
  if (map.getZoom() < CONFIG.minZoomWater) return;
  const bounds = map.getBounds();
  const bbox = [bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast()].join(',');
  const query = `[out:json][timeout:20];
    (way["leisure"~"park|garden|playground"](${bbox});
     way["landuse"~"grass|forest|meadow"](${bbox});); out geom 600;`;
  const data = await fetchOverpass(query, 12000);
  if (!data || !data.elements || !data.elements.length) return;
  try {
    await ensureOSMToGeoJSON();
    let gj = window.osmtogeojson(data, { flatProperties: true });
    if (gj && typeof gj.then === 'function') gj = await gj;
    const feats = (gj.features || []).filter(f => f.geometry);
    if (!feats.length) return;
    const fc = { type: 'FeatureCollection', features: feats };
    if (map.getSource('parks-detail')) {
      map.getSource('parks-detail').setData(fc);
    } else {
      const firstSymbol = map.getStyle().layers.find(l => l.type === 'symbol');
      const beforeId = firstSymbol ? firstSymbol.id : undefined;
      map.addSource('parks-detail', { type: 'geojson', data: fc });
      addLayerSafe({
        id: 'parks-detail-fill', type: 'fill', source: 'parks-detail',
        paint: { 'fill-color': T.park, 'fill-opacity': 0.82, 'fill-outline-color': T.parkLine }
      }, beforeId);
    }
  } catch (e) { console.warn('[Parks]', e); }
}

/* ============================================================
   POI
   ============================================================ */
const POI_META = {
  hospital: { label:'مستشفى', emoji:'🏥', color:T.poi.hospital },
  restaurant: { label:'مطعم', emoji:'🍽️', color:T.poi.restaurant },
  school: { label:'مدرسة', emoji:'🎓', color:T.poi.school },
  fuel: { label:'وقود', emoji:'⛽', color:T.poi.fuel },
  pharmacy: { label:'صيدلية', emoji:'💊', color:T.poi.pharmacy },
  cafe: { label:'مقهى', emoji:'☕', color:T.poi.cafe },
  bank: { label:'مصرف', emoji:'🏦', color:T.poi.bank },
  police: { label:'شرطة', emoji:'🚓', color:T.poi.police }
};

async function loadPois(category, silent) {
  const map = state.map;
  if (!map || !state.ready) return;
  const bounds = map.getBounds();
  if (map.getZoom() < CONFIG.minZoomPoi && bounds.getNorth() - bounds.getSouth() > 3) {
    if (!silent) toast('قرّب الخريطة لعرض ' + POI_META[category].label);
    return;
  }
  const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
  const reqId = (state.poiRequestId[category] || 0) + 1;
  state.poiRequestId[category] = reqId;
  if (!silent) toast(POI_META[category].emoji + ' جاري تحميل ' + POI_META[category].label + '...', 6000);
  let geojson = null;
  try {
    const url = BACKEND.supabaseUrl + BACKEND.poisEndpoint + '?category=' + category + '&bbox=' + bbox.join(',');
    const res = await fetchWithTimeout(url, {
      headers: { 'apikey': BACKEND.supabaseAnonKey, 'Authorization': 'Bearer ' + BACKEND.supabaseAnonKey }
    }, 10000);
    if (res.ok) {
      const data = await res.json();
      if (data && data.features) geojson = data;
    }
  } catch (e) {}
  if (!geojson) {
    const b = bbox[1] + ',' + bbox[0] + ',' + bbox[3] + ',' + bbox[2];
    const tagMap = {
      hospital: 'node["amenity"="hospital"]', restaurant: 'node["amenity"="restaurant"]',
      school: 'node["amenity"="school"]', fuel: 'node["amenity"="fuel"]',
      pharmacy: 'node["amenity"="pharmacy"]', cafe: 'node["amenity"="cafe"]',
      bank: 'node["amenity"="bank"]', police: 'node["amenity"="police"]'
    };
    const q = `[out:json][timeout:20];(${tagMap[category]}(${b}););out ${CONFIG.maxFeaturesPoi};`;
    const data = await fetchOverpass(q, 15000);
    if (data && data.elements && data.elements.length) {
      geojson = {
        type: 'FeatureCollection',
        features: data.elements.filter(e => e.lat && e.lon).map(e => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [e.lon, e.lat] },
          properties: {
            name: (e.tags && (e.tags['name:ar'] || e.tags.name)) || POI_META[category].label,
            nameEn: (e.tags && e.tags['name:en']) || '',
            category, tags: e.tags || {}
          }
        }))
      };
    }
  }
  if (reqId !== state.poiRequestId[category]) return;
  if (!geojson || !geojson.features || !geojson.features.length) {
    if (!silent) toast('لا توجد ' + POI_META[category].label + ' في هذه المنطقة');
    return;
  }
  state.poiData[category] = geojson;
  const srcId = 'poi-' + category;
  if (map.getSource(srcId)) {
    map.getSource(srcId).setData(geojson);
    if (map.getLayer(srcId + '-circle')) {
      try { map.setPaintProperty(srcId + '-circle', 'circle-color', T.poi[category]); } catch (e) {}
    }
  } else {
    map.addSource(srcId, { type: 'geojson', data: geojson });
    const firstSymbol = map.getStyle().layers.find(l => l.type === 'symbol');
    const beforeId = firstSymbol ? firstSymbol.id : undefined;
    addLayerSafe({
      id: srcId + '-circle', type: 'circle', source: srcId,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 4, 15, 8, 18, 11],
        'circle-color': T.poi[category],
        'circle-stroke-width': 2, 'circle-stroke-color': '#F2EDDF',
        'circle-opacity': 0.92
      }
    }, beforeId);
    map.on('click', srcId + '-circle', e => {
      if (!e.features || !e.features.length) return;
      const p = e.features[0].properties;
      const meta = POI_META[category];
      new maplibregl.Popup({ offset: 12, maxWidth: '280px' })
        .setLngLat(e.lngLat)
        .setHTML('<div style="font-family:inherit;text-align:right;direction:rtl">' +
          '<div style="font-weight:700;color:' + T.poi[category] + ';margin-bottom:4px">' +
          meta.emoji + ' ' + (p.name || meta.label) + '</div>' +
          '<div style="font-size:11px;color:#415464">' + meta.label +
          (p.nameEn ? ' — ' + p.nameEn : '') + '</div>' +
          '<button onclick="window.__setDest(' + e.lngLat.lng + ',' + e.lngLat.lat + ')" ' +
          'style="margin-top:8px;padding:6px 10px;background:' + T.poi[category] +
          ';color:#F2EDDF;border:0;border-radius:6px;font-size:11px;cursor:pointer;font-family:inherit">' +
          '🧭 مسار إلى هنا</button></div>')
        .addTo(map);
    });
    map.on('mouseenter', srcId + '-circle', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', srcId + '-circle', () => { map.getCanvas().style.cursor = ''; });
  }
  if (!state.poiActive[category]) togglePoiVisibility(category, true);
  const btn = document.getElementById('btn-poi-' + category);
  if (btn) {
    btn.classList.add('on', 'has-data');
    const c = btn.querySelector('.poi-count');
    if (c) c.textContent = geojson.features.length;
  }
  if (!silent) toast(POI_META[category].emoji + ' ' + geojson.features.length + ' ' + POI_META[category].label);
}

function togglePoiVisibility(category, show) {
  const map = state.map;
  const layerId = 'poi-' + category + '-circle';
  try {
    if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', show ? 'visible' : 'none');
  } catch (e) {}
  state.poiActive[category] = show;
}

function updatePoiColors(map) {
  if (!map) return;
  Object.keys(POI_META).forEach(cat => {
    if (T.poi[cat]) POI_META[cat].color = T.poi[cat];
    const id = 'poi-' + cat + '-circle';
    if (map.getLayer(id)) {
      try { map.setPaintProperty(id, 'circle-color', T.poi[cat]); } catch (e) {}
    }
  });
}

async function togglePoiCategory(category) {
  if (state.poiActive[category]) {
    togglePoiVisibility(category, false);
    const btn = document.getElementById('btn-poi-' + category);
    if (btn) btn.classList.remove('on');
    toast(POI_META[category].emoji + ' ' + POI_META[category].label + ' مخفية');
  } else {
    await loadPois(category, false);
  }
}

window.__setDest = (lng, lat) => { setDestination(lng, lat); };

/* ============================================================
   ROUTING
   ============================================================ */
async function setDestination(lng, lat) {
  state.destination = [lng, lat];
  if (state.destMarker) state.destMarker.remove();
  const el = document.createElement('div');
  el.className = 'dest-marker';
  state.destMarker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
    .setLngLat([lng, lat]).addTo(state.map);
  if (!state.userLocation) {
    toast('⚠️ اضغط 📍 موقعي أولاً لحساب المسار');
    return;
  }
  await requestRoute(state.userLocation, [lng, lat], true);
}

async function requestRoute(from, to, withAlternatives = false) {
  if (!from || !to) return;
  toast('🧭 جاري حساب المسار...', 6000);
  const url = CONFIG.osrm + from[0] + ',' + from[1] + ';' + to[0] + ',' + to[1] +
    '?overview=full&geometries=geojson&alternatives=' + (withAlternatives ? 'true' : 'false') + '&steps=false';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('OSRM ' + res.status);
    const json = await res.json();
    if (!json.routes || !json.routes.length) { toast('❌ تعذر حساب المسار'); return; }
    state.routeData = json.routes;
    state.selectedRouteIdx = 0;
    clearRouteLayers();
    drawAllRoutes(json.routes);
    showAltLegend();
    const route = json.routes[0];
    const km = (route.distance / 1000).toFixed(1);
    const min = Math.round(route.duration / 60);
    toast('✨ المسار: ' + km + ' كم — ' + min + ' دقيقة' +
      (json.routes.length > 1 ? ' (+' + (json.routes.length - 1) + ' بديل)' : ''), 5000);
    fitRouteBounds(route);
  } catch (err) {
    console.warn('[Route]', err);
    toast('❌ تعذر الاتصال بخدمة المسارات');
  }
}

function drawAllRoutes(routes) {
  const map = state.map;
  const firstSymbol = map.getStyle().layers.find(l => l.type === 'symbol');
  const beforeId = firstSymbol ? firstSymbol.id : undefined;
  routes.forEach((route, i) => {
    const isPrimary = i === state.selectedRouteIdx;
    const srcId = 'route-' + i;
    map.addSource(srcId, {
      type: 'geojson',
      data: { type: 'Feature', geometry: route.geometry, properties: {} }
    });
    addLayerSafe({
      id: srcId + '-casing', type: 'line', source: srcId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': T.textHalo, 'line-width': isPrimary ? 10 : 7, 'line-opacity': isPrimary ? 0.95 : 0.7 }
    }, beforeId);
    addLayerSafe({
      id: srcId + '-line', type: 'line', source: srcId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': isPrimary ? T.accent : T.boundary, 'line-width': isPrimary ? 6 : 3.5, 'line-opacity': isPrimary ? 0.95 : 0.75 }
    }, beforeId);
    if (isPrimary) {
      addLayerSafe({
        id: srcId + '-glow', type: 'line', source: srcId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': T.accent, 'line-width': 18, 'line-opacity': 0.22, 'line-blur': 10 }
      }, beforeId);
    }
    state.routeLayers.push(srcId + '-casing', srcId + '-line');
    if (isPrimary) state.routeLayers.push(srcId + '-glow');
    if (!isPrimary) {
      map.on('click', srcId + '-line', e => { e.preventDefault?.(); selectRoute(i); });
      map.on('mouseenter', srcId + '-line', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', srcId + '-line', () => { map.getCanvas().style.cursor = ''; });
    }
  });
}

function selectRoute(idx) {
  if (idx === state.selectedRouteIdx) return;
  if (!state.routeData[idx]) return;
  state.selectedRouteIdx = idx;
  clearRouteLayers();
  drawAllRoutes(state.routeData);
  updateAltLegend();
  const r = state.routeData[idx];
  toast('✅ تم اختيار المسار: ' + (r.distance/1000).toFixed(1) + ' كم — ' + Math.round(r.duration/60) + ' دقيقة');
}

function clearRouteLayers() {
  const map = state.map;
  state.routeLayers.forEach(id => { try { if (map.getLayer(id)) map.removeLayer(id); } catch (e) {} });
  state.routeLayers = [];
  state.routeData.forEach((_, i) => {
    try { if (map.getSource('route-' + i)) map.removeSource('route-' + i); } catch (e) {}
  });
}

function fitRouteBounds(route) {
  const coords = route.geometry.coordinates;
  let minX = 180, minY = 90, maxX = -180, maxY = -90;
  coords.forEach(([x, y]) => {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  });
  state.map.fitBounds([[minX, minY], [maxX, maxY]], {
    padding: { top: 100, bottom: 180, left: 80, right: 80 },
    pitch: 50, duration: 1400
  });
}

function showAltLegend() {
  if (state.routeData.length < 2) { $('alt-legend').classList.remove('show'); return; }
  updateAltLegend();
  $('alt-legend').classList.add('show');
}

function updateAltLegend() {
  const list = $('alt-list'); if (!list) return;
  list.innerHTML = '';
  state.routeData.forEach((route, i) => {
    const km = (route.distance / 1000).toFixed(1);
    const min = Math.round(route.duration / 60);
    const item = document.createElement('div');
    item.className = 'alt-item' + (i === state.selectedRouteIdx ? ' active' : '');
    item.innerHTML = '<span class="swatch" style="background:' +
      (i === state.selectedRouteIdx ? T.accent : T.boundary) + '"></span>' +
      '<span class="info"><b>' + (i === 0 ? 'الأساسي' : 'بديل ' + i) + '</b>' +
      '<span>' + km + ' كم · ' + min + ' د</span></span>';
    item.addEventListener('click', () => selectRoute(i));
    list.appendChild(item);
  });
}

function clearRoute() {
  clearRouteLayers();
  state.routeData = [];
  state.selectedRouteIdx = 0;
  if (state.destMarker) { state.destMarker.remove(); state.destMarker = null; }
  state.destination = null;
  $('alt-legend').classList.remove('show');
  toast('🗑️ تم مسح المسار');
}

/* ============================================================
   SEARCH
   ============================================================ */
const searchInput = $('search');
const searchResults = $('search-results');
const runSearch = debounce(async () => {
  const q = searchInput.value.trim();
  if (q.length < 2) { searchResults.classList.remove('show'); return; }
  searchResults.innerHTML = '<div class="search-result loading">جاري البحث...</div>';
  searchResults.classList.add('show');
  const params = new URLSearchParams({
    q, format: 'json', limit: '6',
    viewbox: '38.7,29.0,48.7,37.4', bounded: '1',
    'accept-language': 'ar,en', addressdetails: '1'
  });
  try {
    const data = await Cache.fetchJSON(CONFIG.nominatim + '?' + params.toString(),
      { headers: { 'Accept': 'application/json' } }, 24 * 3600 * 1000);
    if (!data || !data.length) { searchResults.innerHTML = '<div class="search-result">لا توجد نتائج</div>'; return; }
    searchResults.innerHTML = '';
    data.forEach(item => {
      const row = document.createElement('div');
      row.className = 'search-result';
      const type = (item.type || item.class || '').replace(/_/g, ' ');
      row.innerHTML = '<div class="name"><bdi>' + item.display_name.split(',')[0] + '</bdi></div>' +
        '<div class="type"><bdi>' + type + '</bdi> — <bdi>' +
        (item.display_name.split(',').slice(1, 3).join(',').trim() || '') + '</bdi></div>';
      row.addEventListener('click', () => {
        const lng = parseFloat(item.lon), lat = parseFloat(item.lat);
        state.map.flyTo({ center: [lng, lat], zoom: 15, pitch: 55, duration: 1600 });
        searchResults.classList.remove('show');
        searchInput.value = item.display_name.split(',')[0];
        if (window.__searchMarker) window.__searchMarker.remove();
        const el = document.createElement('div');
        el.className = 'dest-marker';
        window.__searchMarker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([lng, lat]).addTo(state.map);
      });
      searchResults.appendChild(row);
    });
  } catch (err) { searchResults.innerHTML = '<div class="search-result">تعذر البحث</div>'; }
}, 500);

if (searchInput) {
  searchInput.addEventListener('input', runSearch);
  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim().length >= 2 && searchResults.children.length) searchResults.classList.add('show');
  });
  document.addEventListener('click', e => {
    if (!searchResults.contains(e.target) && e.target !== searchInput) searchResults.classList.remove('show');
  });
}

async function geocodeText(query) {
  const params = new URLSearchParams({
    q: query, format: 'json', limit: '1',
    viewbox: '38.7,29.0,48.7,37.4', bounded: '1', 'accept-language': 'ar,en'
  });
  try {
    const data = await Cache.fetchJSON(CONFIG.nominatim + '?' + params.toString(),
      { headers: { 'Accept': 'application/json' } }, 24 * 3600 * 1000);
    if (data && data.length) {
      return { lon: parseFloat(data[0].lon), lat: parseFloat(data[0].lat), display: data[0].display_name };
    }
  } catch (e) {}
  return null;
}

async function reverseGeocode(lng, lat) {
  const params = new URLSearchParams({ lat, lon: lng, format: 'json', 'accept-language': 'ar,en' });
  try {
    const data = await Cache.fetchJSON(CONFIG.nominatimReverse + '?' + params.toString(),
      { headers: { 'Accept': 'application/json' } }, 24 * 3600 * 1000);
    return data && data.display_name ? data.display_name : null;
  } catch (e) { return null; }
}

/* ============================================================
   GPS + CLOCK + MEASURE + TOUR + SCREENSHOT
   ============================================================ */
function locateUser() {
  if (!navigator.geolocation) { toast('⚠️ المتصفح لا يدعم تحديد الموقع'); return; }
  toast('📡 جاري تحديد موقعك...', 4000);
  navigator.geolocation.getCurrentPosition(pos => {
    const lng = pos.coords.longitude, lat = pos.coords.latitude;
    const accuracy = pos.coords.accuracy || 30;
    state.userLocation = [lng, lat];
    const map = state.map;
    map.flyTo({ center: [lng, lat], zoom: 16, pitch: 55, bearing: 0, duration: 1600 });
    if (state.userMarker) state.userMarker.remove();
    const el = document.createElement('div');
    el.className = 'user-marker';
    el.innerHTML = '<div class="user-pulse"></div><div class="user-dot"></div>';
    state.userMarker = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([lng, lat]).addTo(map);
    try {
      if (map.getLayer('user-accuracy')) map.removeLayer('user-accuracy');
      if (map.getSource('user-accuracy')) map.removeSource('user-accuracy');
      const pts = 64, coords = [];
      const dx = accuracy / (111320 * Math.cos(lat * Math.PI / 180));
      const dy = accuracy / 110574;
      for (let i = 0; i < pts; i++) {
        const theta = (i / pts) * 2 * Math.PI;
        coords.push([lng + dx * Math.cos(theta), lat + dy * Math.sin(theta)]);
      }
      coords.push(coords[0]);
      map.addSource('user-accuracy', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] } }
      });
      map.addLayer({
        id: 'user-accuracy', type: 'fill', source: 'user-accuracy',
        paint: { 'fill-color': T.accent, 'fill-opacity': 0.12, 'fill-outline-color': T.accent }
      });
    } catch (e) {}
    toast('✨ تم تحديد موقعك بدقة ±' + Math.round(accuracy) + ' م');
    $('btn-locate').classList.add('on');
  }, err => {
    let msg = '❌ تعذر تحديد الموقع';
    if (err.code === 1) msg = '❌ تم رفض إذن الموقع';
    else if (err.code === 2) msg = '❌ الموقع غير متاح';
    else if (err.code === 3) msg = '❌ استغرق وقتاً طويلاً';
    toast(msg, 4000);
  }, { enableHighAccuracy: true, timeout: CONFIG.gpsTimeout, maximumAge: 0 });
}

function updateClock() {
  try {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Baghdad', hour: '2-digit', minute: '2-digit', hour12: false });
    const dateStr = now.toLocaleDateString('ar-IQ', { timeZone: 'Asia/Baghdad', weekday: 'short', day: 'numeric', month: 'short' });
    const tEl = $('clock-time'); if (tEl) tEl.textContent = timeStr;
    const dEl = $('clock-date'); if (dEl) dEl.textContent = dateStr;
  } catch (e) {}
}

function getGreeting() {
  try {
    const hour = parseInt(new Date().toLocaleString('en-GB', { timeZone: 'Asia/Baghdad', hour: 'numeric', hour12: false }), 10);
    if (hour >= 5 && hour < 12) return 'صباح الخير ☀️';
    if (hour >= 12 && hour < 17) return 'طاب يومك 🌤️';
    if (hour >= 17 && hour < 21) return 'مساء الخير 🌆';
    return 'ليلة سعيدة 🌙';
  } catch (e) { return 'مرحباً'; }
}

function toggleMeasure() {
  state.measureMode = !state.measureMode;
  const btn = $('btn-measure');
  if (state.measureMode) {
    btn.classList.add('on');
    state.map.getCanvas().style.cursor = 'crosshair';
    $('measure-hint').classList.add('show');
    $('measure-hint').textContent = '📏 انقر على نقطة البداية';
    toast('📏 اختر نقطة البداية على الخريطة');
  } else {
    btn.classList.remove('on');
    state.map.getCanvas().style.cursor = '';
    $('measure-hint').classList.remove('show');
    clearMeasure();
  }
}

function clearMeasure() {
  const map = state.map;
  state.measureMarkers.forEach(m => { try { m.remove(); } catch (e) {} });
  state.measureMarkers = [];
  state.measureStart = null;
  ['measure-line', 'measure-label-bg', 'measure-label'].forEach(id => {
    try { if (map.getLayer(id)) map.removeLayer(id); } catch (e) {}
  });
  try { if (map.getSource('measure-line')) map.removeSource('measure-line'); } catch (e) {}
  try { if (map.getSource('measure-label')) map.removeSource('measure-label'); } catch (e) {}
}

function handleMeasureClick(lngLat) {
  const map = state.map;
  if (!state.measureStart) {
    state.measureStart = lngLat;
    const el = document.createElement('div');
    el.style.cssText = 'width:14px;height:14px;background:' + T.accent + ';border:2px solid #F2EDDF;border-radius:50%;box-shadow:0 2px 8px rgba(30,46,58,.3)';
    const m = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(lngLat).addTo(map);
    state.measureMarkers.push(m);
    $('measure-hint').textContent = '📏 انقر على النقطة الثانية';
    toast('📏 الآن انقر على النقطة الثانية');
    return;
  }
  const start = state.measureStart;
  const end = { lng: lngLat.lng, lat: lngLat.lat };
  const dist = haversine(start, end);
  const el2 = document.createElement('div');
  el2.style.cssText = 'width:14px;height:14px;background:#1A3A5E;border:2px solid #F2EDDF;border-radius:50%;box-shadow:0 2px 8px rgba(30,46,58,.3)';
  const m2 = new maplibregl.Marker({ element: el2, anchor: 'center' }).setLngLat(end).addTo(map);
  state.measureMarkers.push(m2);
  map.addSource('measure-line', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [[start.lng, start.lat], [end.lng, end.lat]] } }
  });
  map.addLayer({
    id: 'measure-line', type: 'line', source: 'measure-line',
    paint: { 'line-color': '#244B78', 'line-width': 3, 'line-dasharray': [2, 1.5], 'line-opacity': 0.9 }
  });
  const mid = [(start.lng + end.lng) / 2, (start.lat + end.lat) / 2];
  const distStr = dist >= 1 ? dist.toFixed(2) + ' كم' : (dist * 1000).toFixed(0) + ' م';
  map.addSource('measure-label', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'Point', coordinates: mid }, properties: { label: '📏 ' + distStr } }
  });
  map.addLayer({
    id: 'measure-label-bg', type: 'circle', source: 'measure-label',
    paint: { 'circle-color': '#244B78', 'circle-radius': 18, 'circle-opacity': 0.95 }
  });
  map.addLayer({
    id: 'measure-label', type: 'symbol', source: 'measure-label',
    layout: { 'text-field': ['get', 'label'], 'text-size': 11, 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'] },
    paint: { 'text-color': '#F2EDDF' }
  });
  toast('📏 المسافة: ' + distStr, 5000);
  $('measure-hint').textContent = '📏 انقر مرة أخرى لقياس مسافة جديدة';
  state.measureStart = null;
}

let tourTimer = null;
let tourUsedIdx = new Set();
function startTour() {
  if (state.tourActive) { stopTour(); return; }
  state.tourActive = true; tourUsedIdx.clear();
  $('btn-tour').classList.add('on');
  const mt = $('mt-tour'); if (mt) mt.checked = true;
  toast('🎲 جولة استكشافية — انقر على الخريطة لإيقافها', 4000);
  tourNext();
}
function tourNext() {
  if (!state.tourActive) return;
  if (tourUsedIdx.size >= PROVINCES_DATA.length) tourUsedIdx.clear();
  let idx, attempts = 0;
  do { idx = Math.floor(Math.random() * PROVINCES_DATA.length); attempts++; }
  while (tourUsedIdx.has(idx) && attempts < 40);
  tourUsedIdx.add(idx);
  selectProvince(idx);
  tourTimer = setTimeout(tourNext, 5500);
}
function stopTour() {
  state.tourActive = false;
  clearTimeout(tourTimer);
  const btn = $('btn-tour'); if (btn) btn.classList.remove('on');
  const mt = $('mt-tour'); if (mt) mt.checked = false;
}

function takeScreenshot() {
  try {
    const canvas = state.map.getCanvas();
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    link.download = 'iraq-map-' + stamp + '.png';
    link.href = dataURL; link.click();
    toast('📸 تم حفظ الصورة');
  } catch (err) { toast('❌ تعذر حفظ الصورة'); }
}

/* ============================================================
   LAYER TOGGLES
   ============================================================ */
function toggleLayerGroup(active, layerIds) {
  const map = state.map; if (!map) return;
  layerIds.forEach(id => {
    try { if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', active ? 'visible' : 'none'); } catch (e) {}
  });
}
function toggleBaseLayerPattern(active, patterns) {
  const map = state.map;
  if (!map || !map.getStyle().layers) return;
  map.getStyle().layers.forEach(layer => {
    const sl = layer['source-layer'] || '';
    const id = layer.id;
    if (id.startsWith('basemap-')) return;
    const hit = patterns.some(p => p.test(id) || p.test(sl));
    if (hit) { try { map.setLayoutProperty(id, 'visibility', active ? 'visible' : 'none'); } catch (e) {} }
  });
}
function applyToggles() {
  toggleLayerGroup(state.buildingsActive, ['building-3d', 'building-roof-edge']);
  toggleLayerGroup(state.roadsActive, ['roads-minor', 'roads-mid', 'roads-major', 'roads-bridges', 'roads-tunnels']);
  toggleBaseLayerPattern(state.roadsActive, [/transportation/, /road/]);
  toggleLayerGroup(state.waterActive, ['water-detail-fill', 'water-detail-line']);
  toggleBaseLayerPattern(state.waterActive, [/water/, /waterway/]);
  toggleLayerGroup(state.parksActive, ['parks-detail-fill']);
  toggleBaseLayerPattern(state.parksActive, [/park/, /grass/, /forest/, /landcover/]);
  const map = state.map;
  if (map && map.getStyle().layers) {
    map.getStyle().layers.forEach(layer => {
      if (layer.type === 'symbol') {
        try { map.setLayoutProperty(layer.id, 'visibility', state.labelsActive ? 'visible' : 'none'); } catch (e) {}
      }
    });
  }
  PROVINCES_DATA.forEach(p => {
    if (p.marker) {
      const el = p.marker.getElement();
      if (el) el.style.display = state.labelsActive ? '' : 'none';
    }
  });
}

/* ============================================================
   KEYBOARD
   ============================================================ */
function bindKeyboard() {
  document.addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    switch (e.key) {
      case 'Escape':
        if ($('palette-panel').classList.contains('show')) closePalettePanel();
        else if ($('maptype-menu').classList.contains('show')) closeMapTypeMenu();
        else if ($('welcome-card').classList.contains('show')) $('welcome-card').classList.remove('show');
        else if ($('ai-chat').classList.contains('show') && window.AIAssistant) window.AIAssistant.close();
        else if ($('panel').classList.contains('show')) { $('panel').classList.remove('show'); deselectProvince(); }
        else if (state.measureMode) toggleMeasure();
        else if (state.routeMode) {
          state.routeMode = false;
          state.map.getCanvas().style.cursor = '';
          $('btn-route').classList.remove('on');
        } else if (state.tourActive) stopTour();
        break;
      case 'r': case 'R': state.map.fitBounds(CONFIG.iraqBounds, { padding: 60, pitch: 48, bearing: 0, duration: 1400 }); break;
      case 'l': case 'L': locateUser(); break;
      case 'm': case 'M': toggleMeasure(); break;
      case 't': case 'T': startTour(); break;
      case 'c': case 'C': openPalettePanel(); break;
      case 'g': case 'G': toggleMapTypeMenu(); break;
      case 'a': case 'A':
        if (window.AIAssistant) {
          if ($('ai-chat').classList.contains('show')) window.AIAssistant.close();
          else window.AIAssistant.open();
        }
        break;
      case '+': case '=': state.map.zoomIn(); break;
      case '-': case '_': state.map.zoomOut(); break;
      case 'ArrowUp': state.map.panBy([0, -100]); e.preventDefault(); break;
      case 'ArrowDown': state.map.panBy([0, 100]); e.preventDefault(); break;
      case 'ArrowLeft': state.map.panBy([100, 0]); e.preventDefault(); break;
      case 'ArrowRight': state.map.panBy([-100, 0]); e.preventDefault(); break;
    }
  });
}

/* ============================================================
   PALETTE
   ============================================================ */
function updateRasterTiles(palette) {
  const map = state.map;
  if (!map || !palette) return;
  const src = map.getSource('carto-light');
  if (!src || typeof src.setTiles !== 'function') return;
  const variant = palette.basemap === 'dark' ? 'dark_all' : 'light_all';
  try {
    src.setTiles([
      `https://a.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}@2x.png`,
      `https://b.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}@2x.png`,
      `https://c.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}@2x.png`
    ]);
  } catch (e) {}
}

function applyPalette(id, options = {}) {
  const p = PALETTES[id];
  if (!p) return;
  T.land = p.land; T.water = p.water; T.waterDeep = p.waterDeep; T.waterLine = p.waterLine;
  T.park = p.park; T.parkDeep = p.parkDeep; T.parkLine = p.parkLine;
  T.building = { ...p.building }; T.road = { ...p.road };
  T.boundary = p.boundary; T.text = p.text; T.textSecondary = p.textSecondary;
  T.textHalo = p.textHalo; T.accent = p.accent; T.accentDark = p.accentDark;
  T.poi = { ...p.poi };

  const root = document.documentElement;
  root.style.setProperty('--bg', p.bg);
  root.style.setProperty('--panel', p.panel);
  root.style.setProperty('--panel-border', p.panelBorder);
  root.style.setProperty('--text', p.text);
  root.style.setProperty('--text-2', p.textSecondary);
  root.style.setProperty('--text-3', p.text3 || p.textSecondary);
  root.style.setProperty('--accent', p.accent);
  root.style.setProperty('--accent-2', p.accentDark);
  root.style.setProperty('--accent-light', p.accentLight);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', p.bg);

  Object.keys(POI_META).forEach(cat => { if (p.poi[cat]) POI_META[cat].color = p.poi[cat]; });

  if (state.map && state.ready) {
    try { applyCalmTheme(state.map); } catch (e) {}
    try { updateBuildingColor(state.map); } catch (e) {}
    try { updatePoiColors(state.map); } catch (e) {}
    try { updateRasterTiles(p); } catch (e) {}
    try {
      if (state.map.getLayer('iraq-hillshade')) {
        state.map.setPaintProperty('iraq-hillshade', 'hillshade-shadow-color', T.building.shadow);
        state.map.setPaintProperty('iraq-hillshade', 'hillshade-highlight-color', T.building.light);
        state.map.setPaintProperty('iraq-hillshade', 'hillshade-accent-color', T.boundary);
      }
    } catch (e) {}
  }

  state.currentPalette = id;
  try { localStorage.setItem('iqmap:palette', id); } catch (e) {}
  document.querySelectorAll('.palette-card').forEach(card => {
    card.classList.toggle('active', card.dataset.pid === id);
  });
  if (!options.silent) toast('🎨 تم تطبيق: ' + p.nameAr, 2200);
}

function restoreSavedPalette() {
  let saved = null;
  try { saved = localStorage.getItem('iqmap:palette'); } catch (e) {}
  if (saved && PALETTES[saved]) state.currentPalette = saved;
  const p = PALETTES[state.currentPalette];
  if (!p) return;
  T.land = p.land; T.water = p.water; T.waterDeep = p.waterDeep;
  T.waterLine = p.waterLine; T.park = p.park; T.parkDeep = p.parkDeep;
  T.parkLine = p.parkLine; T.building = { ...p.building };
  T.road = { ...p.road }; T.boundary = p.boundary;
  T.text = p.text; T.textSecondary = p.textSecondary; T.textHalo = p.textHalo;
  T.accent = p.accent; T.accentDark = p.accentDark; T.poi = { ...p.poi };
  const root = document.documentElement;
  root.style.setProperty('--bg', p.bg);
  root.style.setProperty('--panel', p.panel);
  root.style.setProperty('--panel-border', p.panelBorder);
  root.style.setProperty('--text', p.text);
  root.style.setProperty('--text-2', p.textSecondary);
  root.style.setProperty('--text-3', p.text3 || p.textSecondary);
  root.style.setProperty('--accent', p.accent);
  root.style.setProperty('--accent-2', p.accentDark);
  root.style.setProperty('--accent-light', p.accentLight);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', p.bg);
  Object.keys(POI_META).forEach(cat => { if (p.poi[cat]) POI_META[cat].color = p.poi[cat]; });
}

function renderPaletteGrid() {
  const grid = $('palette-grid'); if (!grid) return;
  grid.innerHTML = '';
  Object.keys(PALETTES).forEach(id => {
    const p = PALETTES[id];
    const card = document.createElement('div');
    card.className = 'palette-card' + (state.currentPalette === id ? ' active' : '');
    card.dataset.pid = id;
    card.innerHTML =
      '<span class="palette-check">✓</span>' +
      '<div class="preview">' +
        '<div style="background:' + p.land + '"></div>' +
        '<div style="background:' + p.water + '"></div>' +
        '<div style="background:' + p.park + '"></div>' +
        '<div style="background:' + p.building.mid + '"></div>' +
        '<div style="background:' + p.road.residential + '"></div>' +
        '<div style="background:' + p.accent + '"></div>' +
      '</div>' +
      '<div class="name">' + p.nameAr + '</div>' +
      '<div class="name-en">' + p.name + '</div>';
    card.addEventListener('click', () => applyPalette(id));
    grid.appendChild(card);
  });
}

function openPalettePanel() {
  renderPaletteGrid();
  $('palette-panel').classList.add('show');
  $('btn-palette').classList.add('on');
}
function closePalettePanel() {
  $('palette-panel').classList.remove('show');
  $('btn-palette').classList.remove('on');
}

/* ============================================================
   MAP TYPE MENU UI
   ============================================================ */
function openMapTypeMenu() {
  $('maptype-menu').classList.add('show');
  $('btn-maptype').classList.add('on');
}
function closeMapTypeMenu() {
  $('maptype-menu').classList.remove('show');
  $('btn-maptype').classList.remove('on');
}
function toggleMapTypeMenu() {
  if ($('maptype-menu').classList.contains('show')) closeMapTypeMenu();
  else openMapTypeMenu();
}

function restoreSavedMapType() {
  let saved = null;
  try { saved = localStorage.getItem('iqmap:maptype'); } catch (e) {}
  if (saved && ['terrain', 'satellite', 'auto'].includes(saved)) state.mapType = saved;
  document.querySelectorAll('.mt-type').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === state.mapType);
  });
}

/* ============================================================
   UI HANDLERS
   ============================================================ */
function bindUI() {
  $('close-panel').addEventListener('click', () => { $('panel').classList.remove('show'); deselectProvince(); });
  $('close-sidebar').addEventListener('click', () => {
    $('sidebar').classList.add('hidden');
    $('btn-sidebar').classList.remove('on');
    toast('📋 القائمة مخفية');
  });
  $('zoom-prov').addEventListener('click', () => {
    if (state.selectedIdx === null) return;
    const p = PROVINCES_DATA[state.selectedIdx];
    state.map.flyTo({ center: p.c, zoom: 9.5, pitch: 60, duration: 1400 });
  });
  $('show-all').addEventListener('click', () => {
    $('panel').classList.remove('show'); deselectProvince();
    state.map.fitBounds(CONFIG.iraqBounds, { padding: 60, pitch: 50, bearing: 0, duration: 1600 });
  });
  $('btn-reset').addEventListener('click', () => {
    state.map.fitBounds(CONFIG.iraqBounds, { padding: 60, pitch: 48, bearing: 0, duration: 1600 });
  });
  $('btn-maptype').addEventListener('click', toggleMapTypeMenu);
  $('maptype-close').addEventListener('click', closeMapTypeMenu);
  $('btn-locate').addEventListener('click', locateUser);
  $('btn-buildings').addEventListener('click', function () {
    state.buildingsActive = !state.buildingsActive;
    this.classList.toggle('on', state.buildingsActive);
    toggleLayerGroup(state.buildingsActive, ['building-3d', 'building-roof-edge']);
    const mt = $('mt-buildings'); if (mt) mt.checked = state.buildingsActive;
    if (state.buildingsActive) loadBuildingsForViewport(false);
    toast(state.buildingsActive ? '🏢 المباني مفعلة' : '🏢 المباني مخفية');
  });
  $('btn-roads').addEventListener('click', function () {
    state.roadsActive = !state.roadsActive;
    this.classList.toggle('on', state.roadsActive);
    toggleLayerGroup(state.roadsActive, ['roads-minor', 'roads-mid', 'roads-major', 'roads-bridges', 'roads-tunnels']);
    toggleBaseLayerPattern(state.roadsActive, [/transportation/, /road/]);
    if (state.roadsActive) loadRoadsForViewport(false);
    toast(state.roadsActive ? '🛣️ الشوارع مفعلة' : '🛣️ الشوارع مخفية');
  });
  $('btn-water').addEventListener('click', function () {
    state.waterActive = !state.waterActive;
    this.classList.toggle('on', state.waterActive);
    toggleLayerGroup(state.waterActive, ['water-detail-fill', 'water-detail-line']);
    toggleBaseLayerPattern(state.waterActive, [/water/, /waterway/]);
    toast(state.waterActive ? '💧 المياه مفعلة' : '💧 المياه مخفية');
  });
  $('btn-parks').addEventListener('click', function () {
    state.parksActive = !state.parksActive;
    this.classList.toggle('on', state.parksActive);
    toggleLayerGroup(state.parksActive, ['parks-detail-fill']);
    toggleBaseLayerPattern(state.parksActive, [/park/, /grass/, /forest/]);
    toast(state.parksActive ? '🌳 الحدائق مفعلة' : '🌳 الحدائق مخفية');
  });
  $('btn-labels').addEventListener('click', function () {
    state.labelsActive = !state.labelsActive;
    this.classList.toggle('on', state.labelsActive);
    applyToggles();
    toast(state.labelsActive ? '🏷️ الأسماء مفعلة' : '🏷️ الأسماء مخفية');
  });
  $('btn-sidebar').addEventListener('click', function () {
    const sidebar = $('sidebar');
    sidebar.classList.toggle('hidden');
    this.classList.toggle('on', !sidebar.classList.contains('hidden'));
  });
  $('btn-route').addEventListener('click', function () {
    if (!state.userLocation) { toast('⚠️ اضغط 📍 موقعي أولاً'); return; }
    state.routeMode = !state.routeMode;
    this.classList.toggle('on', state.routeMode);
    if (state.routeMode) {
      state.map.getCanvas().style.cursor = 'crosshair';
      toast('🎯 انقر على الخريطة لاختيار الوجهة');
    } else { state.map.getCanvas().style.cursor = ''; }
  });
  $('btn-measure').addEventListener('click', toggleMeasure);
  $('btn-tour').addEventListener('click', startTour);
  $('btn-screenshot').addEventListener('click', takeScreenshot);
  $('btn-palette').addEventListener('click', openPalettePanel);
  $('palette-close').addEventListener('click', closePalettePanel);
  $('palette-panel').addEventListener('click', e => {
    if (e.target === $('palette-panel')) closePalettePanel();
  });

  document.querySelectorAll('.mt-type').forEach(btn => {
    btn.addEventListener('click', () => setMapTypeFromUI(btn.dataset.type));
  });

  $('mt-buildings').addEventListener('change', function () {
    state.buildingsActive = this.checked;
    $('btn-buildings').classList.toggle('on', this.checked);
    toggleLayerGroup(this.checked, ['building-3d', 'building-roof-edge']);
    if (this.checked) loadBuildingsForViewport(false);
    toast(this.checked ? '🏢 المباني ثلاثية الأبعاد مفعلة' : '🏢 المباني مخفية');
  });
  $('mt-terrain3d').addEventListener('change', function () {
    state.terrainActive = this.checked;
    try {
      if (this.checked) {
        state.map.setTerrain({ source: 'iraq-dem', exaggeration: CONFIG.isMobile ? 1.0 : 1.25 });
        toast('⛰️ التضاريس ثلاثية الأبعاد مفعلة');
      } else {
        state.map.setTerrain(null);
        toast('🗺️ عرض مسطح');
      }
    } catch (e) {}
  });
  $('mt-bike').addEventListener('change', function () { toggleBikePaths(this.checked); });
  $('mt-traffic').addEventListener('change', function () { toggleTraffic(this.checked); });
  $('mt-transit').addEventListener('change', function () { toggleTransit(this.checked); });
  $('mt-tour').addEventListener('change', function () {
    if (this.checked) startTour();
    else stopTour();
  });
  $('mt-fires').addEventListener('change', function () { toggleFires(this.checked); });
  $('mt-air').addEventListener('change', function () { toggleAirQuality(this.checked); });

  $('compass').addEventListener('click', () => {
    state.map.easeTo({ bearing: 0, duration: 500 });
    toast('🧭 تم توجيه الشمال للأعلى');
  });
  $('welcome-start').addEventListener('click', () => {
    $('welcome-card').classList.remove('show');
    state.map.flyTo({ center: CONFIG.iraqCenter, zoom: 5.8, pitch: 50, bearing: 0, duration: 1400 });
    setTimeout(() => toast(getGreeting() + ' — أهلاً بك في العراق 🇮🇶', 3500), 800);
  });

  ['hospital', 'restaurant', 'school', 'fuel', 'pharmacy'].forEach(cat => {
    const btn = $('btn-poi-' + cat);
    if (btn) btn.addEventListener('click', () => togglePoiCategory(cat));
  });

  $('ai-fab').addEventListener('click', () => {
    if (window.AIAssistant) window.AIAssistant.open();
  });
  $('ai-close').addEventListener('click', () => {
    if (window.AIAssistant) window.AIAssistant.close();
  });
  $('ai-send').addEventListener('click', () => {
    const v = $('ai-input').value.trim();
    if (v && window.AIAssistant) { window.AIAssistant.send(v); $('ai-input').value = ''; }
  });
  $('ai-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const v = $('ai-input').value.trim();
      if (v && window.AIAssistant) { window.AIAssistant.send(v); $('ai-input').value = ''; }
    }
  });
  $$('#ai-suggestions button').forEach(b => {
    b.addEventListener('click', () => {
      if (window.AIAssistant) window.AIAssistant.send(b.dataset.q);
    });
  });

  if (window.AIAssistant && window.AIAssistant.initVoice) {
    window.AIAssistant.initVoice();
  }

  document.addEventListener('click', e => {
    const menu = $('maptype-menu');
    const btn = $('btn-maptype');
    if (menu.classList.contains('show') && !menu.contains(e.target) && !btn.contains(e.target)) {
      closeMapTypeMenu();
    }
  });
}

/* ============================================================
   TAXI API
   ============================================================ */
window.TaxiMap = {
  getMap: () => state.map,
  isReady: () => state.ready,
  getCenter: () => state.map ? state.map.getCenter() : null,
  getBounds: () => state.map ? state.map.getBounds() : null,
  getZoom: () => state.map ? state.map.getZoom() : null,
  getUserLocation: () => state.userLocation,
  locateUser: () => locateUser(),
  setUserLocation: (lng, lat) => {
    state.userLocation = [lng, lat];
    if (state.userMarker) state.userMarker.remove();
    const el = document.createElement('div');
    el.className = 'user-marker';
    el.innerHTML = '<div class="user-pulse"></div><div class="user-dot"></div>';
    state.userMarker = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([lng, lat]).addTo(state.map);
  },
  flyTo: (lng, lat, opts = {}) => { if (state.map) state.map.flyTo({ center: [lng, lat], ...opts }); },
  fitBounds: (bounds, opts = {}) => { if (state.map) state.map.fitBounds(bounds, opts); },
  setDestination: (lng, lat) => setDestination(lng, lat),
  requestRoute: (from, to, alt) => requestRoute(from, to, alt),
  clearRoute: () => clearRoute(),
  getRoute: () => state.routeData,
  onMapClick: (cb) => { if (state.map) state.map.on('click', e => cb(e.lngLat)); },
  onMoveEnd: (cb) => {
    if (state.map) state.map.on('moveend', () => cb({
      center: state.map.getCenter(), bounds: state.map.getBounds(), zoom: state.map.getZoom()
    }));
  },
  loadPois: (cat) => togglePoiCategory(cat),
  searchPlace: (query) => geocodeText(query),
  askAI: (msg) => { if (window.AIAssistant) window.AIAssistant.send(msg); },
  getGreeting: () => getGreeting(),
  screenshot: () => takeScreenshot(),
  startTour: () => startTour(),
  stopTour: () => stopTour(),
  toggleMeasure: () => toggleMeasure(),
  toast: (msg, ms) => toast(msg, ms),
  setPalette: (id) => applyPalette(id),
  getPalette: () => state.currentPalette,
  listPalettes: () => Object.keys(PALETTES).map(id => ({ id, name: PALETTES[id].name, nameAr: PALETTES[id].nameAr })),
  openPalettePanel: () => openPalettePanel(),
  setMapType: (type) => applyMapType(type),
  getMapType: () => state.mapType,
  openMapTypeMenu: () => openMapTypeMenu(),
  toggleBikePaths: (on) => toggleBikePaths(on !== false),
  toggleTraffic: (on) => toggleTraffic(on !== false),
  toggleTransit: (on) => toggleTransit(on !== false),
  toggleFires: (on) => toggleFires(on !== false),
  toggleAirQuality: (on) => toggleAirQuality(on !== false),
  version: '2.2.0'
};

/* ============================================================
   BOOT
   ============================================================ */
async function boot() {
  if (!window.AIAssistant) {
    setTimeout(boot, 50);
    return;
  }
  try {
    bindUI();
    bindKeyboard();
    updateClock();
    setInterval(updateClock, 15000);
    restoreSavedPalette();
    restoreSavedMapType();
    await initMap();
    setTimeout(() => { if (state.ready) loadBuildingsForViewport(true); }, 1500);
    if (CONFIG.isMobile) {
      setTimeout(() => {
        $('sidebar').classList.add('hidden');
        $('btn-sidebar').classList.remove('on');
      }, 4000);
    }
    $('ai-fab').classList.add('ready');
  } catch (err) {
    console.error('[Boot] fatal', err);
    progress(100, '⚠️ تعذر بدء التطبيق');
    setTimeout(hideLoading, 800);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  setTimeout(boot, 0);
}

window.__state = state;
window.__config = CONFIG;
window.__theme = T;
window.__palettes = PALETTES;
