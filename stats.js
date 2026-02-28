// ══════════════════════════════════════════════════════
//  GOOGLE SHEETS STATS API
// ══════════════════════════════════════════════════════
const STATS_API = "https://script.google.com/macros/s/AKfycbwbOjxHcujPPF2GKZuMmq5-fisDnVkwsZCpUpGaEFPnHiJ-LVy8biGo5OUg9hYVaag4/exec";

let sheetData = null;
let statsLoaded = false;
let statsLoading = false;

async function fetchSheetData() {
  if (statsLoading) return sheetData;
  if (statsLoaded) return sheetData;
  statsLoading = true;
  try {
    const res = await fetch(STATS_API + '?t=' + Date.now());
    const json = await res.json();
    if (Array.isArray(json)) sheetData = json;
    else if (json && Array.isArray(json.data)) sheetData = json.data;
    else if (json && Array.isArray(json.values)) sheetData = json.values;
    else sheetData = [];
    statsLoaded = true;
  } catch (e) {
    console.warn('Stats fetch failed:', e);
    sheetData = [];
    statsLoaded = true;
  }
  statsLoading = false;
  return sheetData;
}

function parseSheet(rows) {
  if (!rows || !rows.length) return { trackRows: [], topViewed: [], topListened: [], topSaved: [], topDownloaded: [], podium: [] };
  const isObj = typeof rows[0] === 'object' && !Array.isArray(rows[0]);
  let dataRows = rows;
  if (!isObj) {
    const first = rows[0];
    if (isNaN(parseFloat(first[3])) && String(first[0]).toLowerCase().includes('title')) {
      dataRows = rows.slice(1);
    }
  }
  const trackRows = [], topViewed = [], topListened = [], topSaved = [], topDownloaded = [], podium = [];
  dataRows.forEach(row => {
    if (!row) return;
    if (isObj) {
      const id = String(row['id'] || row['c'] || row['C'] || '').trim();
      if (id && id !== 'id') {
        trackRows.push({
          trackId: id,
          views: parseInt(row['total-views'] || row['D'] || 0) || 0,
          listens: parseInt(row['total-full-listens'] || row['E'] || 0) || 0,
          saves: parseInt(row['total-saves'] || row['F'] || 0) || 0,
          downloads: parseInt(row['total-downloads'] || row['G'] || 0) || 0,
          score: parseFloat(row['overAll-score'] || row['H'] || 0) || 0,
        });
      }
      const tv = parseInt(row['top-viewed'] || row['J'] || 0) || 0;
      const tl = parseInt(row['top-listened'] || row['K'] || 0) || 0;
      const ts = parseInt(row['top-saved'] || row['L'] || 0) || 0;
      const td = parseInt(row['top-downloaded'] || row['M'] || 0) || 0;
      if (tv) topViewed.push(tv);
      if (tl) topListened.push(tl);
      if (ts) topSaved.push(ts);
      if (td) topDownloaded.push(td);
      const bs = parseFloat(row['BEST-SCORE'] || row['N'] || 0) || 0;
      const bt = String(row['BEST-TRACK'] || row['O'] || '').trim();
      const ba = String(row['BEST-ARTIST'] || row['P'] || '').trim();
      if (bs && bt) podium.push({ score: bs, trackName: bt, artistName: ba });
    } else {
      const id = String(row[2] || '').trim();
      if (id && id !== 'id') {
        trackRows.push({
          trackId: id,
          views: parseInt(row[3]) || 0,
          listens: parseInt(row[4]) || 0,
          saves: parseInt(row[5]) || 0,
          downloads: parseInt(row[6]) || 0,
          score: parseFloat(row[7]) || 0,
        });
      }
      const tv = parseInt(row[9]) || 0;
      const tl = parseInt(row[10]) || 0;
      const ts = parseInt(row[11]) || 0;
      const td = parseInt(row[12]) || 0;
      if (tv) topViewed.push(tv);
      if (tl) topListened.push(tl);
      if (ts) topSaved.push(ts);
      if (td) topDownloaded.push(td);
      const bs = parseFloat(row[13]) || 0;
      const bt = String(row[14] || '').trim();
      const ba = String(row[15] || '').trim();
      if (bs && bt) podium.push({ score: bs, trackName: bt, artistName: ba });
    }
  });
  return { trackRows, topViewed, topListened, topSaved, topDownloaded, podium };
}

function buildStatsLookup(trackRows) {
  const lookup = {};
  trackRows.forEach(r => { if (r.trackId) lookup[r.trackId] = r; });
  return lookup;
}

function findTrackByStatId(statId) {
  for (const album of ALBUMS) {
    for (let i = 0; i < album.tracks.length; i++) {
      const t = album.tracks[i];
      if (t.statId && t.statId === statId) return { track: t, album, origIdx: i };
    }
  }
  return null;
}

function findTrackByName(trackName, artistName) {
  for (const album of ALBUMS) {
    if (artistName && !album.artist.toLowerCase().includes(artistName.toLowerCase()) &&
      !(album.primaryArtist || '').toLowerCase().includes(artistName.toLowerCase())) continue;
    for (let i = 0; i < album.tracks.length; i++) {
      const t = album.tracks[i];
      if (t.name.toLowerCase().includes(trackName.toLowerCase()) ||
        trackName.toLowerCase().includes(t.name.toLowerCase())) {
        return { track: t, album, origIdx: i };
      }
    }
  }
  for (const album of ALBUMS) {
    for (let i = 0; i < album.tracks.length; i++) {
      const t = album.tracks[i];
      if (t.name.toLowerCase().includes(trackName.toLowerCase()) ||
        trackName.toLowerCase().includes(t.name.toLowerCase())) {
        return { track: t, album, origIdx: i };
      }
    }
  }
  return null;
}

function countTrackIds() {
  let released = new Set(), unreleased = new Set();
  for (const album of ALBUMS) {
    for (const t of album.tracks) {
      if (!t.statId) continue;
      if (t.statId.startsWith('#')) released.add(t.statId);
      else if (t.statId.startsWith('$')) unreleased.add(t.statId);
    }
  }
  return { released: released.size, unreleased: unreleased.size };
}

const STATS_POST_API = "https://script.google.com/macros/s/AKfycbwbOjxHcujPPF2GKZuMmq5-fisDnVkwsZCpUpGaEFPnHiJ-LVy8biGo5OUg9hYVaag4/exec";

function localStatGet(type, statId) { if (!statId) return true; return localStorage.getItem(`ss_${type}_${statId}`) === '1'; }
function localStatSet(type, statId) { if (!statId) return; localStorage.setItem(`ss_${type}_${statId}`, '1'); }

async function postStatIncrement(statId, field) {
  if (!statId) return;
  try {
    await fetch(STATS_POST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'increment', trackId: statId, field })
    });
  } catch (e) { console.warn('Stat post failed', e.message); }
}

function recordTrackView(statId) {
  const u = getCurrentUser(); if (!u || !statId) return;
  if (localStatGet('v', statId)) return;
  localStatSet('v', statId); postStatIncrement(statId, 'views');
}

let _listenStartStatId = null, _listenStarted = false;
function onTrackPlayStart(statId, duration) {
  if (!duration || duration < 1) { _listenStarted = false; return; }
  _listenStartStatId = statId; _listenStarted = true;
}
function onTrackFullListenComplete() {
  const u = getCurrentUser(); if (!u || !_listenStarted || !_listenStartStatId) return;
  const statId = _listenStartStatId; _listenStarted = false; _listenStartStatId = null;
  if (localStatGet('l', statId)) return;
  localStatSet('l', statId); postStatIncrement(statId, 'listens');
}

function recordTrackDownload(statId) {
  const u = getCurrentUser(); if (!u || !statId) return false;
  if (localStatGet('d', statId)) return true;
  localStatSet('d', statId); postStatIncrement(statId, 'downloads'); return true;
}
function hasDownloaded(statId) { if (!statId) return false; return localStatGet('d', statId); }

async function loadAndRenderStats() {
  const rows = await fetchSheetData();
  const parsed = parseSheet(rows);
  const lookup = buildStatsLookup(parsed.trackRows);
  const counts = countTrackIds();
  let releasedMatches = new Set(), unreleasedMatches = new Set();
  Object.keys(lookup).forEach(id => {
    if (id.startsWith('#')) releasedMatches.add(id);
    else if (id.startsWith('$')) unreleasedMatches.add(id);
  });
  const relSpan = document.getElementById('releasedCountSpan');
  const unrelSpan = document.getElementById('unreleasedCountSpan');
  if (relSpan) relSpan.textContent = `(${releasedMatches.size || counts.released} tracks)`;
  if (unrelSpan) unrelSpan.textContent = `(${unreleasedMatches.size || counts.unreleased} tracks)`;
  renderPodium(parsed.podium);
  renderTop100Preview(parsed);
}

function renderPodium(podiumRows) {
  const podiumRow = document.getElementById('podiumRow');
  if (!podiumRow) return;
  const top3 = [...podiumRows].sort((a, b) => b.score - a.score).slice(0, 3);
  if (!top3.length) { podiumRow.innerHTML = '<div style="color:var(--muted);font-family:\'Space Mono\',monospace;font-size:12px;">No score data available yet</div>'; return; }
  const classes = ['gold', 'silver', 'bronze'];
  const labels = ['BEST SCORE', '2nd PLACE', '3rd PLACE'];
  const order = top3.length >= 3 ? [1, 0, 2] : top3.map((_, i) => i);
  podiumRow.innerHTML = '';
  order.forEach(idx => {
    if (idx >= top3.length) return;
    const item = top3[idx];
    const info = findTrackByName(item.trackName, item.artistName);
    const card = document.createElement('div');
    card.className = `podium-card ${classes[idx]}`;
    card.innerHTML = `<div class="podium-cover-wrapper"><img class="podium-cover" src="${info ? info.album.cover : ''}" onerror="this.style.background='#222'"/></div><div class="podium-rank">${labels[idx]}</div><div class="podium-track">${item.trackName}</div><div class="podium-artist">${item.artistName}</div><div class="podium-score">${item.score.toFixed ? item.score.toFixed(1) : item.score}</div>`;
    if (info) { card.style.cursor = 'pointer'; card.addEventListener('click', () => openAlbum(info.album.id)); }
    podiumRow.appendChild(card);
  });
}

function renderTop100Preview(parsed) {
  const grid = document.getElementById('top100Grid');
  if (!grid) return;
  const byViews = [...parsed.trackRows].filter(r => r.views > 0).sort((a, b) => b.views - a.views).slice(0, 6);
  const byListens = [...parsed.trackRows].filter(r => r.listens > 0).sort((a, b) => b.listens - a.listens).slice(0, 6);
  const bySaves = [...parsed.trackRows].filter(r => r.saves > 0).sort((a, b) => b.saves - a.saves).slice(0, 6);
  const byDownloads = [...parsed.trackRows].filter(r => r.downloads > 0).sort((a, b) => b.downloads - a.downloads).slice(0, 6);
  const categories = [
    { key: 'views', label: 'Top Viewed', icon: 'fa-eye', color: '#00e5ff', rows: byViews },
    { key: 'listens', label: 'Top Listened', icon: 'fa-headphones', color: '#a259ff', rows: byListens },
    { key: 'saves', label: 'Top Saved', icon: 'fa-heart', color: '#ff6b6b', rows: bySaves },
    { key: 'downloads', label: 'Top Downloaded', icon: 'fa-download', color: '#51cf66', rows: byDownloads },
  ];
  grid.innerHTML = '';
  categories.forEach(cat => {
    const card = document.createElement('div');
    card.className = 'top100-card';
    card.innerHTML = `<div class="top100-card-header"><div class="top100-card-title" style="color:${cat.color}"><i class="fas ${cat.icon}"></i>${cat.label}</div></div><div class="top100-list" id="top100list_${cat.key}"></div>`;
    grid.appendChild(card);
    const list = document.getElementById(`top100list_${cat.key}`);
    if (!cat.rows.length) { list.innerHTML = '<div style="padding:12px 14px;color:var(--muted);font-family:\'Space Mono\',monospace;font-size:11px;">No data yet - archieved each month!</div>'; return; }
    cat.rows.forEach((item, i) => {
      const info = findTrackByStatId(item.trackId);
      const numClass = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
      const val = item[cat.key];
      const valStr = val >= 1000000 ? (val / 1000000).toFixed(1) + 'M' : val >= 1000 ? (val / 1000).toFixed(1) + 'k' : String(val);
      const row = document.createElement('div');
      row.className = 'top100-row';
      row.innerHTML = `<div class="top100-num ${numClass}">${i + 1}</div><img class="top100-art" src="${info ? info.album.cover : ''}" onerror="this.style.background='#222'"/><div class="top100-info"><div class="top100-name">${info ? info.track.name : item.trackId}</div><div class="top100-sub">${info ? info.album.artist : '—'}</div></div><div class="top100-val" style="color:${cat.color}">${valStr}</div>`;
      if (info) row.addEventListener('click', () => playAlbumFromTrack(info.album.id, info.origIdx));
      list.appendChild(row);
    });
  });
}

let currentFSTab = 'best';
function openFullStats() { document.getElementById('fullStatsOverlay').classList.add('open'); switchFSTab('best'); }
function closeFullStats() { document.getElementById('fullStatsOverlay').classList.remove('open'); }
function switchFSTab(tab) {
  currentFSTab = tab;
  document.querySelectorAll('.fstab').forEach(b => b.classList.remove('active'));
  const tabOrder = ['best', 'views', 'listens', 'saves', 'downloads'];
  const idx = tabOrder.indexOf(tab);
  const tabs = document.querySelectorAll('.fstab');
  if (tabs[idx]) tabs[idx].classList.add('active');
  renderFSTab(tab);
}
async function renderFSTab(tab) {
  const body = document.getElementById('fullStatsBody');
  body.innerHTML = '<div class="fs-loading"><span class="stats-dot"></span>Loading…</div>';
  const rows = await fetchSheetData();
  const parsed = parseSheet(rows);
  body.innerHTML = '';
  if (tab === 'best') {
    const top3 = [...parsed.podium].sort((a, b) => b.score - a.score).slice(0, 3);
    const podiumDiv = document.createElement('div'); podiumDiv.className = 'fs-podium';
    const inner = document.createElement('div'); inner.style.cssText = 'display:flex;gap:10px;margin-bottom:20px;';
    podiumDiv.appendChild(inner); body.appendChild(podiumDiv);
    const classes = ['gold', 'silver', 'bronze']; const labels = ['BEST SCORE', '2nd PLACE', '3rd PLACE'];
    top3.forEach((item, idx) => {
      const info = findTrackByName(item.trackName, item.artistName);
      const card = document.createElement('div'); card.className = `podium-card ${classes[idx]}`; card.style.flex = '1';
      card.innerHTML = `<div class="podium-cover-wrapper"><img class="podium-cover" src="${info ? info.album.cover : ''}" onerror="this.style.background='#222'"/></div><div class="podium-rank">${labels[idx]}</div><div class="podium-track">${item.trackName}</div><div class="podium-artist">${item.artistName}</div><div class="podium-score">${item.score.toFixed ? item.score.toFixed(1) : item.score}</div>`;
      if (info) { card.style.cursor = 'pointer'; card.addEventListener('click', () => { closeFullStats(); openAlbum(info.album.id); }); }
      inner.appendChild(card);
    });
    const sorted = [...parsed.trackRows].filter(r => r.score > 0).sort((a, b) => b.score - a.score);
    if (!sorted.length) { body.innerHTML += '<div class="fs-empty">No score data available</div>'; return; }
    sorted.forEach((item, i) => renderFSRow(body, item, i, 'score', item.score.toFixed ? item.score.toFixed(1) : String(item.score)));
  } else {
    const sorted = [...parsed.trackRows].filter(r => r[tab] > 0).sort((a, b) => b[tab] - a[tab]);
    if (!sorted.length) { body.innerHTML = '<div class="fs-empty">No data available</div>'; return; }
    sorted.forEach((item, i) => {
      const v = item[tab];
      const s = v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(1) + 'k' : String(v);
      renderFSRow(body, item, i, tab, s);
    });
  }
}
function renderFSRow(container, item, i, key, displayVal) {
  const info = findTrackByStatId(item.trackId);
  const rankClass = i === 0 ? 'r1' : i === 1 ? 'r2' : i === 2 ? 'r3' : '';
  const row = document.createElement('div'); row.className = 'fs-row';
  row.innerHTML = `<div class="fs-rank ${rankClass}">${i + 1}</div><img class="fs-art" src="${info ? info.album.cover : ''}" onerror="this.style.background='#222'"/><div class="fs-info"><div class="fs-name">${info ? info.track.name : item.trackId}</div><div class="fs-sub">${info ? info.album.artist : '—'}${info ? ' · ' + info.album.title : ''}</div></div><div class="fs-val">${displayVal}</div>`;
  if (info) row.addEventListener('click', () => { closeFullStats(); openAlbum(info.album.id); });
  container.appendChild(row);
}