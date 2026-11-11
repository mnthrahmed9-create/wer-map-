'use strict';

/* ============================================================
   ROYAL MAP - AI ASSISTANT
   المساعد الذكي: تحليل النوايا، أدوات الخريطة، الصوت العربي
   يعتمد على window.TaxiMap من map-engine.js
   ============================================================ */

const AI_TOOLS = {
  flyTo: ({ lng, lat, zoom }) => {
    if (typeof lng === 'number' && typeof lat === 'number') {
      state.map.flyTo({ center: [lng, lat], zoom: zoom || 13, duration: 1400 });
    }
  },
  searchPlace: async ({ query }) => {
    const r = await geocodeText(query);
    if (r) {
      state.map.flyTo({ center: [r.lon, r.lat], zoom: 15, duration: 1400 });
      if (window.__searchMarker) window.__searchMarker.remove();
      const el = document.createElement('div');
      el.className = 'dest-marker';
      window.__searchMarker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([r.lon, r.lat]).addTo(state.map);
    } else AI.addMessage('bot', 'لم أجد "' + query + '" داخل العراق.');
  },
  routeTo: async ({ destination }) => {
    if (!state.userLocation) { AI.addMessage('bot', 'حدد موقعك أولاً بالضغط على 📍 موقعي.'); return; }
    if (destination.lng != null && destination.lat != null) { await setDestination(destination.lng, destination.lat); return; }
    const r = await geocodeText(destination.query || '');
    if (r) await setDestination(r.lon, r.lat);
    else AI.addMessage('bot', 'لم أجد الوجهة داخل العراق.');
  },
  showProvince: ({ name }) => {
    const idx = PROVINCES_DATA.findIndex(p => norm(p.ar) === norm(name));
    if (idx >= 0) selectProvince(idx);
    else AI.addMessage('bot', 'لا توجد محافظة بهذا الاسم.');
  },
  nearestPoi: async ({ category }) => {
    if (!state.userLocation) { AI.addMessage('bot', 'حدد موقعك أولاً.'); return; }
    await loadPois(category, true);
    const data = state.poiData[category];
    if (!data || !data.features || !data.features.length) {
      AI.addMessage('bot', 'لم أجد أي ' + POI_META[category].label + ' قريب.'); return;
    }
    let best = null, bestD = Infinity;
    const [ulng, ulat] = state.userLocation;
    data.features.forEach(f => {
      const [lng, lat] = f.geometry.coordinates;
      const d = haversine({ lng: ulng, lat: ulat }, { lng, lat });
      if (d < bestD) { bestD = d; best = { lng, lat, name: f.properties.name }; }
    });
    if (best) {
      state.map.flyTo({ center: [best.lng, best.lat], zoom: 15, pitch: 55, duration: 1600 });
      setDestination(best.lng, best.lat);
      AI.addMessage('bot', 'أقرب ' + POI_META[category].label + ' على بعد ' + bestD.toFixed(1) + ' كم: ' + (best.name || POI_META[category].label));
    }
  },
  addPoiLayer: async ({ category }) => { if (POI_META[category]) await togglePoiCategory(category); },
  locateUser: () => locateUser(),
  resetView: () => state.map.fitBounds(CONFIG.iraqBounds, { padding: 60, pitch: 48, bearing: 0, duration: 1600 }),
  measureMode: () => { if (!state.measureMode) toggleMeasure(); },
  stopTour: () => stopTour(),
  screenshot: () => takeScreenshot(),
  showAlternatives: async ({ destination }) => {
    if (!state.userLocation) { AI.addMessage('bot', 'حدد موقعك أولاً.'); return; }
    const r = await geocodeText(destination);
    if (r) await requestRoute(state.userLocation, [r.lon, r.lat], true);
  },
  reverseGeocodeHere: async () => {
    const c = state.map.getCenter();
    const place = await reverseGeocode(c.lng, c.lat);
    AI.addMessage('bot', place ? 'أنت قرب: ' + place : 'لم أتعرف على المكان.');
  },
  changePalette: ({ paletteId }) => {
    if (PALETTES[paletteId]) {
      applyPalette(paletteId);
      AI.addMessage('bot', '🎨 تم تطبيق ألوان: ' + PALETTES[paletteId].nameAr);
    } else AI.addMessage('bot', 'المجموعة غير معروفة.');
  },
  setMapType: ({ type }) => {
    if (['terrain', 'satellite', 'auto'].includes(type)) {
      applyMapType(type);
      AI.addMessage('bot', '🗺️ نوع الخريطة: ' + (type === 'terrain' ? 'تضاريس' : type === 'satellite' ? 'قمر صناعي' : 'تلقائي'));
    }
  },
  toggleLayer: ({ layer, on }) => {
    const show = on !== false;
    if (layer === 'bike') toggleBikePaths(show);
    else if (layer === 'traffic') toggleTraffic(show);
    else if (layer === 'transit') toggleTransit(show);
    else if (layer === 'fires') toggleFires(show);
    else if (layer === 'air') toggleAirQuality(show);
    else if (layer === 'tour' && show) startTour();
  }
};

const AI = {
  async send(message) {
    if (!message || state.aiBusy) return;
    state.aiBusy = true;
    AI.addMessage('user', message);
    const typing = AI.addTyping();
    try {
      const endpoint = BACKEND.supabaseUrl + BACKEND.aiEndpoint;
      const res = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': BACKEND.supabaseAnonKey,
          'Authorization': 'Bearer ' + BACKEND.supabaseAnonKey
        },
        body: JSON.stringify({
          message,
          context: {
            center: state.map.getCenter(), zoom: state.map.getZoom(),
            userLocation: state.userLocation,
            provinces: PROVINCES_DATA.map(p => p.ar),
            palettes: Object.keys(PALETTES),
            mapType: state.mapType
          }
        })
      }, 20000);
      typing.remove();
      if (!res.ok) { AI.addMessage('error', 'تعذر الاتصال بالمساعد (' + res.status + ').'); return; }
      const data = await res.json();
      if (data.tool && AI_TOOLS[data.tool]) {
        AI.addMessage('tool', '🔧 ' + data.tool);
        try { await AI_TOOLS[data.tool](data.args || {}); }
        catch (e) { AI.addMessage('error', 'فشل تنفيذ الأمر: ' + e.message); }
      } else if (data.answer) AI.addMessage('bot', data.answer);
      else AI.addMessage('bot', 'لم أفهم الطلب.');
    } catch (e) {
      typing.remove();
      AI.addMessage('error', 'خطأ في الاتصال: ' + e.message);
    } finally { state.aiBusy = false; }
  },
  addMessage(role, text) {
    const box = $('ai-messages');
    const div = document.createElement('div');
    div.className = 'ai-msg ' + role;
    div.textContent = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  },
  addTyping() {
    const box = $('ai-messages');
    const div = document.createElement('div');
    div.className = 'ai-msg bot typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    return div;
  },
  open() {
    $('ai-chat').classList.add('show');
    setTimeout(() => $('ai-input').focus(), 100);
    const box = $('ai-messages');
    if (box.children.length === 0) {
      AI.addMessage('bot', 'مرحباً! 👋 أنا مساعدك الجغرافي.\nجرّب: "خذني لأقرب مستشفى" · "غيّر الألوان إلى ليلي" · "فعّل حركة المرور".');
    }
  },
  close() { $('ai-chat').classList.remove('show'); }
};

/* ============================================================
   VOICE RECOGNITION (Arabic)
   ============================================================ */
function initVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    $('ai-mic').title = 'المتصفح لا يدعم الإدخال الصوتي';
    $('ai-mic').addEventListener('click', () => toast('⚠️ المتصفح لا يدعم الإدخال الصوتي'));
    return;
  }
  const rec = new SR();
  rec.lang = 'ar-IQ';
  rec.interimResults = false;
  rec.continuous = false;
  rec.maxAlternatives = 1;
  state.voiceRecognition = rec;
  rec.onresult = e => {
    const text = e.results[0][0].transcript;
    $('ai-input').value = text;
    AI.send(text);
  };
  rec.onerror = e => { toast('⚠️ خطأ في الصوت: ' + (e.error || 'unknown')); stopListening(); };
  rec.onend = () => stopListening();
  $('ai-mic').addEventListener('click', toggleListening);
}

function toggleListening() {
  const rec = state.voiceRecognition;
  if (!rec) return;
  if (state.isListening) { rec.stop(); stopListening(); }
  else {
    try {
      rec.start();
      state.isListening = true;
      $('ai-mic').classList.add('listening');
      $('ai-fab').classList.add('listening');
      toast('🎤 تحدث الآن...');
    } catch (e) { toast('تعذر بدء الاستماع'); }
  }
}

function stopListening() {
  state.isListening = false;
  $('ai-mic').classList.remove('listening');
  $('ai-fab').classList.remove('listening');
}

/* ============================================================
   EXPOSE - الواجهة العامة للمساعد
   ============================================================ */
AI.initVoice = initVoice;
AI.toggleListening = toggleListening;
AI.stopListening = stopListening;
AI.TOOLS = AI_TOOLS;

window.AIAssistant = AI;
