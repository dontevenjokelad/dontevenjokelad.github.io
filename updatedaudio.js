// ══════════════════════════════════════════════════════
//  AUDIO ENGINE — FULL IMPLEMENTATION
// ══════════════════════════════════════════════════════
let audio = new Audio();
audio.preload = 'auto';

// State
let flatList = [];       // [{name, src, albumId, albumTitle, cover, artist, origIdx, pIdx, lastPIdx, isMulti}]
let trackIdx = -1;       // current index in flatList
let isPlaying = false;
let shuffleOn = false;
let repeatMode = 0;      // 0=off, 1=all, 2=one
let shuffleOrder = [];   // shuffled indices
let shufflePos = 0;      // current position in shuffleOrder
let seekDragging = false;
let cachedDurations = {};
let vizAnimId = null;
let audioCtx = null, analyser = null, source = null, gainNode = null;

// Web Audio API setup (lazy)
function ensureAudioCtx() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 64;
  gainNode = audioCtx.createGain();
  source = audioCtx.createMediaElementSource(audio);
  source.connect(gainNode);
  gainNode.connect(analyser);
  analyser.connect(audioCtx.destination);
}

// Build flat list from album (skip unavailable)
function buildFlat(album) {
  const list = [];
  album.tracks.forEach((t, origIdx) => {
    if (!t.file || t.file === '#') return;
    const files = Array.isArray(t.file) ? t.file : [t.file];
    files.forEach((f, pIdx) => {
      list.push({
        name: t.name,
        src: f,  // use file path as-is, no basePath prepended
        albumId: album.id,
        albumTitle: album.title,
        cover: album.cover,
        artist: album.primaryArtist || album.artist,
        origIdx,
        pIdx,
        lastPIdx: files.length - 1,
        isMulti: files.length > 1,
        statId: t.statId || null
      });
    });
  });
  return list;
}

// Load a track by index into flatList
function loadTrack(idx) {
  if (!flatList.length) return;
  idx = Math.max(0, Math.min(idx, flatList.length - 1));
  trackIdx = idx;
  const t = flatList[idx];

  audio.src = t.src;
  audio.load();

  // Update now-playing UI
  const bar = document.getElementById('playerBar');
  bar.classList.remove('hidden');
  document.getElementById('nowArt').src = t.cover;
  document.getElementById('nowArt').classList.remove('hidden');
  document.getElementById('nowTitle').textContent = t.name;
  document.getElementById('nowArtist').textContent = t.artist + ' · ' + t.albumTitle;
  document.getElementById('currTime').textContent = '0:00';
  document.getElementById('totalTime').textContent = '0:00';
  document.getElementById('seekFill').style.width = '0%';
  document.getElementById('seekSlider').value = 0;

  // Set volume from slider (which respects max)
  applyVolume();

  // Update track highlighting
  renderTrackHighlights();

  // Stats
  if (t.statId) recordTrackView(t.statId);
}

// Play current track
function playTrack() {
  ensureAudioCtx();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  audio.play().then(() => {
    isPlaying = true;
    updatePlayBtn();
    startViz();
    const t = flatList[trackIdx];
    if (t && t.statId) onTrackPlayStart(t.statId, audio.duration);
  }).catch(e => console.warn('Playback failed:', e));
}

// Pause
function pauseTrack() {
  audio.pause();
  isPlaying = false;
  updatePlayBtn();
  stopViz();
}

// Toggle play/pause
function togglePlay() {
  if (!flatList.length) return;
  if (isPlaying) pauseTrack();
  else { ensureAudioCtx(); if (audioCtx.state === 'suspended') audioCtx.resume(); playTrack(); }
}

// Update play/pause button icon
function updatePlayBtn() {
  const icon = document.getElementById('playIcon');
  if (icon) icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';

  // Sync album hero button if visible
  const heroBtn = document.querySelector('#albumHero .btn-play-all i');
  if (heroBtn) {
    const cur = flatList[trackIdx];
    const heroAlbumId = currentAlbumId; // from ui.js scope
    if (cur && cur.albumId === heroAlbumId) {
      heroBtn.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
    } else {
      heroBtn.className = 'fas fa-play'; // different album playing, show play
    }
  }
}

// Previous track
function prevTrack() {
  if (!flatList.length) return;
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  if (shuffleOn) {
    shufflePos = Math.max(0, shufflePos - 1);
    loadTrack(shuffleOrder[shufflePos]);
  } else {
    let ni = trackIdx - 1;
    if (ni < 0) ni = repeatMode === 1 ? flatList.length - 1 : 0;
    loadTrack(ni);
  }
  if (isPlaying) playTrack();
}

// Next track
function nextTrack() {
  if (!flatList.length) return;
  if (shuffleOn) {
    shufflePos++;
    if (shufflePos >= shuffleOrder.length) {
      if (repeatMode === 1) { rebuildShuffle(); shufflePos = 0; }
      else { shufflePos = shuffleOrder.length - 1; pauseTrack(); return; }
    }
    loadTrack(shuffleOrder[shufflePos]);
  } else {
    let ni = trackIdx + 1;
    if (ni >= flatList.length) {
      if (repeatMode === 1) ni = 0;
      else { pauseTrack(); return; }
    }
    loadTrack(ni);
  }
  if (isPlaying) playTrack();
}

// Shuffle
function rebuildShuffle() {
  shuffleOrder = flatList.map((_, i) => i);
  for (let i = shuffleOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffleOrder[i], shuffleOrder[j]] = [shuffleOrder[j], shuffleOrder[i]];
  }
  shufflePos = shuffleOrder.indexOf(trackIdx);
  if (shufflePos < 0) shufflePos = 0;
}

function toggleShuffle() {
  shuffleOn = !shuffleOn;
  if (shuffleOn) rebuildShuffle();
  document.getElementById('btnRandom').classList.toggle('active', shuffleOn);
  showToast(shuffleOn ? 'Shuffle on' : 'Shuffle off');
}

// Repeat: 0=off, 1=all, 2=one
function cycleRepeat() {
  repeatMode = (repeatMode + 1) % 3;
  const btn = document.getElementById('btnRepeat');
  const icon = document.getElementById('repeatIcon');
  btn.classList.remove('active');
  if (repeatMode === 0) { icon.className = 'fas fa-redo'; showToast('Repeat off'); }
  else if (repeatMode === 1) { icon.className = 'fas fa-redo'; btn.classList.add('active'); showToast('Repeat all'); }
  else { icon.className = 'fas fa-redo-alt'; btn.classList.add('active'); showToast('Repeat one'); }
}

// Audio events
audio.addEventListener('timeupdate', () => {
  if (seekDragging) return;
  const cur = audio.currentTime, dur = audio.duration || 0;
  document.getElementById('currTime').textContent = fmt(cur);
  document.getElementById('totalTime').textContent = fmt(dur);
  const pct = dur ? (cur / dur) * 100 : 0;
  document.getElementById('seekFill').style.width = pct + '%';
  document.getElementById('seekSlider').value = dur ? (cur / dur) * 100 : 0;

  // Full listen check (90%)
  if (dur > 0 && cur / dur >= 0.9) onTrackFullListenComplete();
});

audio.addEventListener('loadedmetadata', () => {
  const dur = audio.duration || 0;
  document.getElementById('totalTime').textContent = fmt(dur);
  const t = flatList[trackIdx];
  if (t && t.statId) onTrackPlayStart(t.statId, dur);
});

audio.addEventListener('ended', () => {
  if (repeatMode === 2) {
    audio.currentTime = 0;
    audio.play();
  } else {
    nextTrack();
  }
});

audio.addEventListener('error', (e) => {
  console.warn('Audio error for:', audio.src, e);
  // Try auto-advance on error
  if (flatList.length > 1) setTimeout(() => nextTrack(), 500);
});

// Seek slider
const seekSlider = document.getElementById('seekSlider');
seekSlider.addEventListener('mousedown', () => seekDragging = true);
seekSlider.addEventListener('touchstart', () => seekDragging = true);
seekSlider.addEventListener('input', () => {
  const dur = audio.duration || 0;
  if (dur) {
    const t = (seekSlider.value / 100) * dur;
    document.getElementById('currTime').textContent = fmt(t);
    document.getElementById('seekFill').style.width = seekSlider.value + '%';
  }
});
seekSlider.addEventListener('change', () => {
  const dur = audio.duration || 0;
  if (dur) audio.currentTime = (seekSlider.value / 100) * dur;
  seekDragging = false;
});
seekSlider.addEventListener('mouseup', () => seekDragging = false);
seekSlider.addEventListener('touchend', () => seekDragging = false);

// Volume slider
const volSlider = document.getElementById('volSlider');
volSlider.value = 100;
volSlider.addEventListener('input', () => {
  applyVolume();
  updateVolFill();
});

function applyVolume() {
  const val = parseInt(volSlider.value);
  const maxVol = playerSettings.maxVol || 300;
  if (gainNode) {
    gainNode.gain.value = val / 100;
  } else {
    // fallback before WebAudio init: clamp to 0-1
    audio.volume = Math.min(1, val / 100);
  }
  updateVolFill();
}

function updateVolFill() {
  const val = parseInt(volSlider.value);
  const max = parseInt(volSlider.max) || 300;
  document.getElementById('volFill').style.width = (val / max * 100) + '%';
}
updateVolFill();

// Format seconds to m:ss
function fmt(s) {
  if (!s || isNaN(s) || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60), ss = Math.floor(s % 60);
  return m + ':' + String(ss).padStart(2, '0');
}

// ── VISUALIZER ──
const waveStrokes = document.querySelectorAll('#waveViz .stroke');
let vizFrameId = null;
const vizHeights = Array.from({length: waveStrokes.length}, () => 20);

function startViz() {
  document.getElementById('waveViz').classList.add('visible');
  if (vizFrameId) return;
  function frame() {
    if (!isPlaying) { stopViz(); return; }
    if (analyser) {
      const buf = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(buf);
      const step = Math.floor(buf.length / waveStrokes.length);
      waveStrokes.forEach((s, i) => {
        const val = buf[i * step] || 0;
        const h = Math.max(10, (val / 255) * 18);
        vizHeights[i] = vizHeights[i] * 0.7 + h * 0.3;
        s.style.height = vizHeights[i] + 'px';
      });
    } else {
      waveStrokes.forEach((s, i) => {
        const h = 4 + Math.abs(Math.sin(Date.now() / 300 + i * 0.8)) * 14;
        s.style.height = h + 'px';
      });
    }
    vizFrameId = requestAnimationFrame(frame);
  }
  vizFrameId = requestAnimationFrame(frame);
}

function stopViz() {
  document.getElementById('waveViz').classList.remove('visible');
  if (vizFrameId) { cancelAnimationFrame(vizFrameId); vizFrameId = null; }
  waveStrokes.forEach(s => s.style.height = '3px');
}

// Helper: highlight playing track rows
function renderTrackHighlights() {
  document.querySelectorAll('[data-orig-idx]').forEach(row => {
    const oi = parseInt(row.dataset.origIdx);
    const aid = row.dataset.albumId;
    const cur = flatList[trackIdx];
    const active = cur && cur.origIdx === oi && cur.albumId === aid;
    row.classList.toggle('playing', active);
  });
}