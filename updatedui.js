// ══════════════════════════════════════════════════════
//  NAV HISTORY
// ══════════════════════════════════════════════════════
let navHistory = [], navPos = -1;
function pushNav(fn) { if (navPos < navHistory.length - 1) navHistory = navHistory.slice(0, navPos + 1); navHistory.push(fn); navPos++; }
function navBack() { if (navPos > 0) { navPos--; navHistory[navPos](); } }
function navFwd() { if (navPos < navHistory.length - 1) { navPos++; navHistory[navPos](); } }

// ══════════════════════════════════════════════════════
//  VIEW SWITCHING
// ══════════════════════════════════════════════════════
let currentAlbumId = null, currentPlaylistId = null;

function showView(id, push = true) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const viewId = 'view' + id.charAt(0).toUpperCase() + id.slice(1);
  const v = document.getElementById(viewId);
  if (v) v.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (id === 'home') { document.getElementById('navHome')?.classList.add('active'); renderHome(); }
  if (id === 'discover') document.getElementById('navDiscover')?.classList.add('active');
  if (id === 'search') document.getElementById('navSearch')?.classList.add('active');
  if (id === 'settings') document.getElementById('navSettings')?.classList.add('active');
}

function renderHome() {

  // Helper: shuffle array
  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

  // ===============================
  // Featured Artists — 10 random
  // ===============================
  const artistsEl = document.getElementById('homeFeaturedArtists');
  if (artistsEl) {
    artistsEl.innerHTML = '';

    const ALL_ARTISTS = [
      'Kanye West', // added
      'Tyler, the Creator', // added
      'Kendrick Lamar', // added
      'Lil Uzi Vert', // added
      'Playboi Carti', // added
      'JAŸ-Z', // added (unfortinately)
      'Kid Cudi', // added
      'Ty Dolla $ign', // added
      'Kids See Ghosts', // added
      'GOOD Music', // added
      '¥$', // added
      'Rhap5ody' // added
    ];

    const picks = shuffle([...new Set(ALL_ARTISTS)]).slice(0, 10);

    picks.forEach(artist => {
      const profile = getArtistProfile(artist);
      const card = document.createElement('div');
      card.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;flex-shrink:0;width:90px;';
      card.innerHTML = `
        <div style="width:72px;height:72px;border-radius:50%;background:var(--surface3);overflow:hidden;border:2px solid var(--border);transition:border-color .2s;">
          <img src="${profile.pfp || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'}"
               style="width:100%;height:100%;object-fit:cover;"
               onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'"/>
        </div>
        <div style="font-size:11px;text-align:center;font-family:'Space Mono',monospace;color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;">
          ${artist}
        </div>`;
      card.addEventListener('mouseenter', () => card.querySelector('div').style.borderColor = 'var(--accent2)');
      card.addEventListener('mouseleave', () => card.querySelector('div').style.borderColor = 'var(--border)');
      card.addEventListener('click', () => openArtist(artist));
      artistsEl.appendChild(card);
    });
  }

  // ===============================
  // Recently Added — 6 latest
  // ===============================
  const grid = document.getElementById('gridHome');
  if (grid) {
    grid.innerHTML = '';
    const recent = [...ALBUMS]
      .filter(a => a.type !== 'unreleased')
      .slice(-6)
      .reverse();

    recent.forEach(album => grid.appendChild(makeAlbumCard(album)));
  }

  // ===============================
  // Recommended — 18 random
  // ===============================
  const recGrid = document.getElementById('gridHomeRecommended');
  if (recGrid) {
    recGrid.innerHTML = '';

    const pool = shuffle(ALBUMS);
    const picks = pool.slice(0, 18);

    picks.forEach(album => {
      recGrid.appendChild(makeAlbumCard(album));
    });
  }

  // ===============================
  // Unreleased — 6 random
  // ===============================
  const unrelGrid = document.getElementById('gridHomeUnreleased');
  if (unrelGrid) {
    unrelGrid.innerHTML = '';

    const pool = shuffle(ALBUMS.filter(a => a.type === 'unreleased'));
    const picks = pool.slice(0, 6);

    picks.forEach(album => {
      unrelGrid.appendChild(makeAlbumCard(album));
    });
  }
}

// ══════════════════════════════════════════════════════
//  DISCOVER VIEW
// ══════════════════════════════════════════════════════
const DISCOVER_RELEASED_LIMIT = 18;
const DISCOVER_UNRELEASED_LIMIT = 6;

function renderDiscover() {
  const official = document.getElementById('gridOfficial');
  const unreleased = document.getElementById('gridUnreleased');
  official.innerHTML = '';
  unreleased.innerHTML = '';
  const officialAlbums = ALBUMS.filter(a => a.type !== 'unreleased');
  const unreleasedAlbums = ALBUMS.filter(a => a.type === 'unreleased');
  officialAlbums.slice(0, DISCOVER_RELEASED_LIMIT).forEach(album => official.appendChild(makeAlbumCard(album)));
  unreleasedAlbums.slice(0, DISCOVER_UNRELEASED_LIMIT).forEach(album => unreleased.appendChild(makeAlbumCard(album)));
}

function makeAlbumCard(album) {
  const card = document.createElement('div');
  card.className = 'album-card';
  card.innerHTML = `<img class="album-card-art" src="${album.cover}" alt="${album.title}" onerror="this.style.background='#222'"/><div class="album-card-title">${album.title}</div><div class="album-card-sub">${album.artist} · ${album.year}</div>`;
  card.addEventListener('click', () => openAlbum(album.id));
  return card;
}

function openFullList(type, push = true) {
  if (type === 'released') {
    const albums = ALBUMS.filter(a => a.type !== 'unreleased');
    const grid = document.getElementById('gridFullReleased');
    const desc = document.getElementById('fullReleasedDesc');
    grid.innerHTML = '';
    if (desc) desc.textContent = `${albums.length} official albums`;
    albums.forEach(album => grid.appendChild(makeAlbumCard(album)));
    showView('fullReleased');
    if (push) pushNav(() => openFullList('released', false));
  } else {
    const albums = ALBUMS.filter(a => a.type === 'unreleased');
    const grid = document.getElementById('gridFullUnreleased');
    const desc = document.getElementById('fullUnreleasedDesc');
    grid.innerHTML = '';
    if (desc) desc.textContent = `${albums.length} shelved / unreleased projects`;
    albums.forEach(album => grid.appendChild(makeAlbumCard(album)));
    showView('fullUnreleased');
    if (push) pushNav(() => openFullList('unreleased', false));
  } 
}

// ══════════════════════════════════════════════════════
//  ARTIST PROFILES
// ══════════════════════════════════════════════════════
const ARTIST_PROFILES = {

  "Kanye West": {
    pfp: "https://i.scdn.co/image/ab6761610000e5eb6e835a500e791bf9c27a422a",
    banner: "",
    bio: "Chicago-born rapper, producer, and creative director. One of the most influential artists in hip-hop history."
  },

  "JAŸ-Z": {
    pfp: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Flag_of_Israel.svg/1280px-Flag_of_Israel.svg.png",
    banner: "",
    bio: "Brooklyn rapper, entrepreneur, and business mogul. Co-founder of Roc-A-Fella Records and Tidal. epstien associate, fled the country and changed his name to jaÿ-z."
  },

  "Kid Cudi": {
    pfp: "https://bookingagentinfo.com/wp-content/uploads/2025/04/ab6761610000e5eb876faa285687786c3d314ae0-1.jpg",
    banner: "",
    bio: "Cleveland rapper and singer known for introspective, genre-defying music."
  },

  "Ty Dolla $ign": {
    pfp: "https://thefader-res.cloudinary.com/private_images/w_1440,c_limit,f_auto,q_auto:best/5_sibjco/ty-dolla-sign-beach-house-3-deluxe-lauren-jauregui-interview.jpg",
    banner: "",
    bio: "Los Angeles-based rapper and singer, frequent collaborator on the ¥$ project."
  },

  "Kids See Ghosts": {
    pfp: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDfpzGj1OevZrpaF5Si8udmsr7GBC45v_SFiE2-nRFxyiATU3iQzRiqWk&s=10",
    banner: "",
    bio: "Supergroup formed by Kanye West and Kid Cudi, releasing their self-titled debut in 2018."
  },

  "GOOD Music": {
    pfp: "https://raw.githubusercontent.com/dontevenjokelad/dontevenjokelad.github.io/main/images/artists/goodmusic.png",
    banner: "",
    bio: "Kanye West's record label collective featuring Big Sean, Pusha T, Teyana Taylor, and more."
  },

  "¥$": {
    pfp: "https://www.colorhexa.com/000000.png",
    banner: "",
    bio: "Collaborative project between Kanye West and Ty Dolla $ign, released as Vultures 1 & 2."
  },

  "Playboi Carti": {
    pfp: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRyYjY8Zksm8LgCrHGD_Mwp7eM8xh7tMRuxeBQ-fkcrravILrjWhkGYvn7-&s=10",
    banner: "",
    bio: "Atlanta-based rapper known for his experimental sound and Die Lit."
  },

  "Lil Uzi Vert": {
    pfp: "https://assets-cdn-prod.muso.ai/images/avatar/b9ead624-424b-4385-805f-6cd79b9759c0_7e7c17d5-b7ad-494e-a7aa-6a6cca3dbf41.jpeg",
    banner: "",
    bio: "Philadelphia rapper known for Eternal Atake and melodic rap style."
  },

  "Rhap5ody": {
    pfp: "https://raw.githubusercontent.com/dontevenjokelad/dontevenjokelad.github.io/main/audio/thoth/covers/cover.png",
    banner: "",
    bio: "Upcoming artist with unreleased projects including maybe (Maybe). and Syndicate."
  },

  "Tyler, the Creator": {
    pfp: "https://64.media.tumblr.com/a7e3da5794e7065fd966a0e76da356e7/tumblr_ousywxDiY91vk6sabo1_640.pnj",
    banner: "",
    bio: "Rapper, producer, and creative director from Ladera Heights, CA. Founder of Odd Future."
  },

  "Kendrick Lamar": {
    pfp: "https://cdn.britannica.com/51/259151-050-3D9EDA09/rapper-kendrick-lamar-performs-onstage-at-rolling-loud-miami-2022.jpg",
    banner: "",
    bio: "Compton rapper and Pulitzer Prize-winning lyricist. One of the most acclaimed artists of his generation."
  },

};

function getArtistProfile(name) { return ARTIST_PROFILES[name] || { pfp: '', banner: '', bio: '' }; }

// ══════════════════════════════════════════════════════
//  ALBUM VIEW
// ══════════════════════════════════════════════════════
function openAlbum(id, push = true) {
  const album = ALBUMS.find(a => a.id === id);
  if (!album) return;
  currentAlbumId = id;
  const u = getCurrentUser();
  const saved = u && u.savedAlbums && u.savedAlbums.includes(id);

  const hero = document.getElementById('albumHero');
  hero.innerHTML = `
    <img class="album-hero-art" src="${album.cover}" alt="${album.title}" onerror="this.style.background='#333'"/>
    <div class="album-hero-info">
      <div class="album-hero-label">Album · ${album.type === 'unreleased' ? 'Unreleased' : album.year}</div>
      <div class="album-hero-title">${album.title}</div>
      <div class="album-hero-artist" onclick="openArtist('${(album.primaryArtist || album.artist).replace(/'/g, "\\'")}', true)">${album.primaryArtist || album.artist}</div>
      <div class="album-hero-meta">${album.year} · ${album.tracks.length} tracks</div>
      <div class="album-actions">
        <button class="btn-play-all" onclick="playAlbum('${id}')"><i class="fas fa-play"></i></button>
        <button class="btn-save ${saved ? 'saved' : ''}" id="btnSaveAlbum" onclick="toggleSaveAlbum('${id}')">${saved ? '✓ Saved' : '+ Save'}</button>
      </div>
    </div>`;

  const rows = document.getElementById('albumTrackRows');
  rows.innerHTML = '';
  let logicalNum = 0;
  album.tracks.forEach((t, origIdx) => {
    const unavail = !t.file || t.file === '#';
    if (!unavail) logicalNum++;
    const row = document.createElement('div');
    row.className = 'track-row' + (unavail ? ' unavailable' : '');
    row.dataset.origIdx = origIdx;
    row.dataset.albumId = id;
    row.innerHTML = `
      <div class="track-num">
        <span class="track-num-text">${logicalNum || '·'}</span>
        <span class="track-num-icon" style="display:none"><i class="fas fa-volume-up"></i></span>
      </div>
      <div class="track-name-cell">${t.name}</div>
      <div class="track-dur">—</div>
      ${!unavail ? `<button class="track-menu-btn" onclick="openTrackCtx(event,'${id}',${origIdx})"><i class="fas fa-ellipsis-h"></i></button>` : '<div></div>'}`;
    if (!unavail) {
      row.addEventListener('click', e => {
        if (e.target.closest('.track-menu-btn')) return;
        playAlbumFromTrack(id, origIdx);
      });
    }
    rows.appendChild(row);
  });

  showView('album');
  if (push) pushNav(() => openAlbum(id, false));
  renderSidebarLibrary();
  setTimeout(() => loadDurationsFor(album, (src, dur) => {
    rows.querySelectorAll('.track-row').forEach(row => {
      const oi = parseInt(row.dataset.origIdx);
      const t2 = album.tracks[oi];
      if (!t2) return;
      const files = Array.isArray(t2.file) ? t2.file : [t2.file];
      if (files[0] && files[0] === src) row.querySelector('.track-dur').textContent = dur;
    });
  }), 50);
}

function playAlbum(id) {
  const album = ALBUMS.find(a => a.id === id);
  if (!album) return;

  // If this album is already loaded, just toggle play/pause
  const cur = flatList[trackIdx];
  if (cur && cur.albumId === id && flatList.length) {
    togglePlay();
    updateAlbumPlayBtn(id);
    return;
  }

  // Otherwise, load and play from scratch
  flatList = buildFlat(album);
  if (shuffleOn) { rebuildShuffle(); loadTrack(shuffleOrder[0]); }
  else loadTrack(0);
  playTrack();
  updateAlbumPlayBtn(id);
}

function updateAlbumPlayBtn(id) {
  const btn = document.querySelector(`#albumHero .btn-play-all`);
  if (!btn) return;
  const icon = btn.querySelector('i');
  if (!icon) return;
  // Sync icon with actual play state (isPlaying is set after playTrack/pauseTrack)
  setTimeout(() => {
    icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
  }, 50);
}

function playAlbumFromTrack(albumId, origIdx) {
  const album = ALBUMS.find(a => a.id === albumId);
  if (!album) return;
  flatList = buildFlat(album);
  if (shuffleOn) { rebuildShuffle(); }
  const fi = flatList.findIndex(f => f.origIdx === origIdx && f.pIdx === 0);
  loadTrack(fi === -1 ? 0 : fi);
  playTrack();
}

function loadDurationsFor(album, onEach) {
  const fl = buildFlat(album);
  let i = 0;
  function next() {
    if (i >= fl.length) return;
    const t = fl[i++];
    if (t.pIdx > 0) { next(); return; }
    if (cachedDurations[t.src]) { onEach(t.src, cachedDurations[t.src]); next(); return; }
    const a = new Audio();
    a.preload = 'metadata';
    a.src = t.src;
    const to = setTimeout(() => { a.src = ''; next(); }, 4000);
    a.onloadedmetadata = () => {
      clearTimeout(to);
      const d = fmt(a.duration);
      cachedDurations[t.src] = d;
      onEach(t.src, d);
      next();
    };
    a.onerror = () => { clearTimeout(to); next(); };
  }
  next();
}

// ══════════════════════════════════════════════════════
//  ARTIST VIEW
// ══════════════════════════════════════════════════════
function openArtist(artistName, push = true) {
  const primaryAlbums = ALBUMS.filter(a => a.artist === artistName || a.primaryArtist === artistName);
  const featuredOnAlbums = ALBUMS.filter(a => a.featuredArtists && a.featuredArtists.includes(artistName) && a.primaryArtist !== artistName && a.artist !== artistName);
  const u = getCurrentUser();
  const following = u && u.following && u.following.includes(artistName);
  const profile = getArtistProfile(artistName);

  const hero = document.getElementById('artistHero');
  hero.style.cssText = 'display:flex;align-items:flex-end;gap:24px;padding:36px 24px 24px;background:linear-gradient(180deg,rgba(255,0,0,.08) 0%,transparent 100%);border-bottom:1px solid var(--border);flex-shrink:0;';
  const pfpHtml = profile.pfp
    ? `<div class="artist-pfp"><img src="${profile.pfp}" alt="${artistName}" onerror="this.parentNode.innerHTML='<img src=\'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png\'/>'"/></div>`
    : `<div class="artist-pfp"><img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png"/></div>`;
  hero.innerHTML = `${pfpHtml}<div>
    <div style="font-size:10px;font-family:'Space Mono',monospace;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">Artist</div>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:44px;letter-spacing:2px;">${artistName}</div>
    <div style="font-size:12px;color:var(--muted);margin-top:4px;">${primaryAlbums.length} release${primaryAlbums.length !== 1 ? 's' : ''}${featuredOnAlbums.length ? ` · Featured on ${featuredOnAlbums.length} more` : ''}</div>
    ${profile.bio ? `<div style="font-size:12px;color:var(--muted);margin-top:6px;max-width:460px;line-height:1.5;">${profile.bio}</div>` : ''}
    <div style="display:flex;gap:10px;margin-top:14px;align-items:center;">
      <button class="btn-play-all" onclick="playArtist('${artistName.replace(/'/g, "\\'")}')"><i class="fas fa-play"></i></button>
      <button class="btn-follow ${following ? 'following' : ''}" id="btnFollowArtist" onclick="toggleFollowArtist('${artistName.replace(/'/g, "\\'")}')">${following ? 'Following' : 'Follow'}</button>
    </div>
  </div>`;

  const aa = document.getElementById('artistAlbums');
  aa.innerHTML = '';
  aa.style.cssText = 'padding:0 24px 24px;';

  if (primaryAlbums.length) {
    const sec = document.createElement('div');
    sec.innerHTML = `<div class="section-title">Discography</div><div class="album-grid" id="artistPrimaryGrid" style="padding:0 0 20px;"></div>`;
    aa.appendChild(sec);
    primaryAlbums.forEach(album => document.getElementById('artistPrimaryGrid').appendChild(makeAlbumCard(album)));
  }

  if (featuredOnAlbums.length) {
    const sec = document.createElement('div');
    sec.innerHTML = `<div class="section-title">Featured On</div><div class="album-grid" id="artistFeatGrid" style="padding:0 0 20px;"></div>`;
    aa.appendChild(sec);
    featuredOnAlbums.forEach(album => document.getElementById('artistFeatGrid').appendChild(makeAlbumCard(album)));
  }

  showView('artist');
  if (push) pushNav(() => openArtist(artistName, false));
}

function playArtist(artistName) {
  const albums = ALBUMS.filter(a => a.artist === artistName || a.primaryArtist === artistName);
  if (!albums.length) return;
  let all = [];
  albums.forEach(a => all = all.concat(buildFlat(a)));
  flatList = all;
  if (shuffleOn) { rebuildShuffle(); loadTrack(shuffleOrder[0]); }
  else loadTrack(0);
  playTrack();
}

// ══════════════════════════════════════════════════════
//  SAVE ALBUM / FOLLOW ARTIST
// ══════════════════════════════════════════════════════
function toggleSaveAlbum(albumId) {
  const u = getCurrentUser(); if (!u) { openModal('modalAuth'); return; }
  const a = getAccounts(); const acc = a[u.id];
  if (!acc.savedAlbums) acc.savedAlbums = [];
  const i = acc.savedAlbums.indexOf(albumId);
  if (i === -1) { acc.savedAlbums.push(albumId); showToast('Album saved to library'); }
  else { acc.savedAlbums.splice(i, 1); showToast('Removed from library'); }
  saveAccounts(a);
  const btn = document.getElementById('btnSaveAlbum');
  if (btn) { const saved2 = acc.savedAlbums.includes(albumId); btn.textContent = saved2 ? '✓ Saved' : '+ Save'; btn.classList.toggle('saved', saved2); }
  renderSidebarLibrary();
}

function toggleFollowArtist(artistName) {
  const u = getCurrentUser(); if (!u) { openModal('modalAuth'); return; }
  const a = getAccounts(); const acc = a[u.id];
  if (!acc.following) acc.following = [];
  const i = acc.following.indexOf(artistName);
  if (i === -1) { acc.following.push(artistName); showToast('Following ' + artistName); }
  else { acc.following.splice(i, 1); showToast('Unfollowed ' + artistName); }
  saveAccounts(a);
  const btn = document.getElementById('btnFollowArtist');
  if (btn) { const f2 = acc.following.includes(artistName); btn.textContent = f2 ? 'Following' : 'Follow'; btn.classList.toggle('following', f2); }
}

// ══════════════════════════════════════════════════════
//  PLAYLISTS
// ══════════════════════════════════════════════════════
function getUserPlaylists() { const u = getCurrentUser(); if (!u) return []; return u.playlists || []; }
function openCreatePlaylist() { const u = getCurrentUser(); if (!u) { openModal('modalAuth'); return; } document.getElementById('newPlaylistName').value = ''; document.getElementById('newPlaylistDesc').value = ''; openModal('modalCreatePlaylist'); }
let pendingAddTrack = null;
function openCreatePlaylistFromAdd() { closeModal('modalAddToPlaylist'); document.getElementById('newPlaylistName').value = ''; document.getElementById('newPlaylistDesc').value = ''; openModal('modalCreatePlaylist'); }
function doCreatePlaylist() {
  const name = document.getElementById('newPlaylistName').value.trim();
  if (!name) { showToast('Enter a playlist name'); return; }
  const u = getCurrentUser(); if (!u) return;
  const a = getAccounts(); const acc = a[u.id];
  if (!acc.playlists) acc.playlists = [];
  const pid = 'pl_' + Date.now();
  acc.playlists.push({ id: pid, name, desc: document.getElementById('newPlaylistDesc').value.trim(), tracks: [] });
  saveAccounts(a); closeModal('modalCreatePlaylist'); showToast('Playlist created');
  if (pendingAddTrack) { doAddToPlaylist(pid, pendingAddTrack.albumId, pendingAddTrack.origIdx); pendingAddTrack = null; }
  renderSidebarLibrary();
}
function openTrackCtx(e, albumId, origIdx) {
  e.stopPropagation();
  const album = ALBUMS.find(a => a.id === albumId); const track = album?.tracks[origIdx]; if (!track) return;
  showCtxMenu(e.clientX, e.clientY, [
    { icon: 'fa-plus', label: 'Add to Playlist', action: () => openAddToPlaylist(albumId, origIdx) },
    { icon: 'fa-compact-disc', label: 'Go to Album', action: () => openAlbum(albumId) },
    { icon: 'fa-user', label: 'Go to Artist', action: () => openArtist(album.primaryArtist || album.artist) },
    track.url ? { icon: 'fa-spotify', label: 'Open on Spotify', action: () => window.open(track.url, '_blank') } : null
  ].filter(Boolean));
}
function openAddToPlaylist(albumId, origIdx) {
  const u = getCurrentUser(); if (!u) { openModal('modalAuth'); return; }
  const album = ALBUMS.find(a => a.id === albumId); const track = album?.tracks[origIdx]; if (!track) return;
  pendingAddTrack = { albumId, origIdx };
  document.getElementById('addToPlaylistTrackName').textContent = '"' + track.name + '"';
  const list = document.getElementById('addToPlaylistList'); list.innerHTML = '';
  const playlists = getUserPlaylists();
  if (!playlists.length) { list.innerHTML = '<div style="color:var(--muted);font-family:\'Space Mono\',monospace;font-size:12px;padding:10px 0;">No playlists yet</div>'; openModal('modalAddToPlaylist'); return; }
  playlists.forEach(pl => {
    const already = pl.tracks.some(t => t.albumId === albumId && t.origIdx === origIdx);
    const row = document.createElement('div'); row.className = 'saved-item'; row.style.cursor = 'pointer';
    row.innerHTML = `<div class="saved-item-art playlist-icon" style="font-size:18px;">♪</div><div class="saved-item-info"><div class="saved-item-name">${pl.name}</div><div class="saved-item-sub">${pl.tracks.length} tracks${already ? ' · Already added' : ''}</div></div>`;
    if (!already) row.addEventListener('click', () => { doAddToPlaylist(pl.id, albumId, origIdx); closeModal('modalAddToPlaylist'); });
    else row.style.opacity = '0.5';
    list.appendChild(row);
  }); openModal('modalAddToPlaylist');
}
function doAddToPlaylist(playlistId, albumId, origIdx) {
  const u = getCurrentUser(); if (!u) return;
  const album = ALBUMS.find(a => a.id === albumId); const track = album?.tracks[origIdx]; if (!track) return;
  const a = getAccounts(); const acc = a[u.id];
  const pl = acc.playlists.find(p => p.id === playlistId); if (!pl) return;
  pl.tracks.push({ albumId, origIdx, name: track.name, cover: album.cover, artist: album.artist, albumTitle: album.title });
  saveAccounts(a); showToast(`Added to "${pl.name}"`); renderSidebarLibrary();
}
function openPlaylistView(playlistId, push = true) {
  const u = getCurrentUser(); if (!u) return;
  const pl = (u.playlists || []).find(p => p.id === playlistId); if (!pl) return;
  currentPlaylistId = playlistId;
  renderPlaylistView(playlistId);
  showView('playlist');
  if (push) pushNav(() => openPlaylistView(playlistId, false));
}
function renderPlaylistView(playlistId) {
  const u = getCurrentUser(); if (!u) return;
  const pl = (u.playlists || []).find(p => p.id === playlistId); if (!pl) return;
  const hero = document.getElementById('playlistHero');
  hero.innerHTML = `<div class="playlist-hero-icon">♪</div><div><div style="font-size:10px;color:var(--muted);font-family:'Space Mono',monospace;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">Playlist</div><div class="playlist-hero-name">${pl.name}</div><div class="playlist-hero-owner">${u.displayName || u.username}</div><div class="playlist-hero-count">${pl.tracks.length} tracks</div>${pl.desc ? `<div style="font-size:12px;color:var(--muted);margin-top:4px;">${pl.desc}</div>` : ''}</div>`;
  document.getElementById('playlistActionRow').innerHTML = `<button class="btn-play-all" onclick="playPlaylist('${playlistId}')"><i class="fas fa-play"></i></button><button class="btn-save" onclick="openAddTrackToPlaylistSearch('${playlistId}')">+ Add Songs</button>`;
  const rows = document.getElementById('playlistTrackRows'); rows.innerHTML = '';
  if (!pl.tracks.length) { rows.innerHTML = '<div class="empty-state" style="padding:20px 0;"><i class="fas fa-music"></i>No tracks yet — add some from any album</div>'; return; }
  pl.tracks.forEach((t, i) => {
    const row = document.createElement('div'); row.className = 'playlist-track-row';
    row.innerHTML = `<div style="font-size:12px;color:var(--muted);font-family:'Space Mono',monospace;text-align:center;">${i + 1}</div><img class="playlist-track-art" src="${t.cover}" onerror="this.style.background='#222'"/><div class="playlist-track-info"><div class="playlist-track-name">${t.name}</div><div class="playlist-track-album">${t.artist} · ${t.albumTitle}</div></div><div style="font-size:11px;color:var(--muted);font-family:'Space Mono',monospace;text-align:right;">—</div><button style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:13px;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;" onclick="openPlaylistTrackCtx(event,'${playlistId}',${i})"><i class="fas fa-ellipsis-h"></i></button>`;
    row.addEventListener('click', e => { if (e.target.closest('button')) return; playPlaylistFromIndex(playlistId, i); });
    rows.appendChild(row);
  });
}
function openPlaylistTrackCtx(e, playlistId, trackIndex2) {
  e.stopPropagation();
  showCtxMenu(e.clientX, e.clientY, [
    { icon: 'fa-trash', label: 'Remove from Playlist', action: () => { removePlaylistTrack(playlistId, trackIndex2); }, class: 'danger' },
    { icon: 'fa-compact-disc', label: 'Go to Album', action: () => { const u = getCurrentUser(); const pl = (u.playlists || []).find(p => p.id === playlistId); if (pl && pl.tracks[trackIndex2]) openAlbum(pl.tracks[trackIndex2].albumId); } }
  ]);
}
function removePlaylistTrack(playlistId, index) {
  const u = getCurrentUser(); if (!u) return;
  const a = getAccounts(); const pl = a[u.id].playlists.find(p => p.id === playlistId); if (!pl) return;
  pl.tracks.splice(index, 1); saveAccounts(a); renderPlaylistView(playlistId); showToast('Track removed'); renderSidebarLibrary();
}
function playPlaylist(playlistId) {
  const u = getCurrentUser(); if (!u) return;
  const pl = (u.playlists || []).find(p => p.id === playlistId); if (!pl || !pl.tracks.length) return;
  flatList = pl.tracks.map(t => {
    const album = ALBUMS.find(a => a.id === t.albumId); if (!album) return null;
    const files = Array.isArray(album.tracks[t.origIdx]?.file) ? album.tracks[t.origIdx].file : [album.tracks[t.origIdx]?.file];
    return { name: t.name, src: files[0], albumId: t.albumId, albumTitle: t.albumTitle, cover: t.cover, artist: t.artist, origIdx: t.origIdx, pIdx: 0, lastPIdx: 0, isMulti: false };
  }).filter(Boolean);
  if (shuffleOn) rebuildShuffle();
  loadTrack(0);
  playTrack();
}
function playPlaylistFromIndex(playlistId, startIdx) {
  const u = getCurrentUser(); if (!u) return;
  const pl = (u.playlists || []).find(p => p.id === playlistId); if (!pl) return;
  flatList = pl.tracks.map(t => {
    const album = ALBUMS.find(a => a.id === t.albumId); if (!album) return null;
    const files = Array.isArray(album.tracks[t.origIdx]?.file) ? album.tracks[t.origIdx].file : [album.tracks[t.origIdx]?.file];
    return { name: t.name, src: files[0], albumId: t.albumId, albumTitle: t.albumTitle, cover: t.cover, artist: t.artist, origIdx: t.origIdx, pIdx: 0, lastPIdx: 0, isMulti: false };
  }).filter(Boolean);
  if (shuffleOn) rebuildShuffle();
  loadTrack(startIdx);
  playTrack();
}

function openPlaylistEditor(playlistId) {
  const u = getCurrentUser(); if (!u) return;
  const pl = (u.playlists || []).find(p => p.id === playlistId); if (!pl) return;
  document.getElementById('editorPlaylistName').textContent = pl.name + ' · ' + pl.tracks.length + ' tracks';
  renderEditorTracks(playlistId);
  const artists = [...new Set(pl.tracks.map(t => t.artist))];
  document.getElementById('editorRemoveArtistBtn').onclick = () => {
    document.getElementById('removeGroupTitle').textContent = 'REMOVE ARTIST';
    const list = document.getElementById('removeGroupList'); list.innerHTML = '';
    artists.forEach(ar => {
      const cnt = pl.tracks.filter(t => t.artist === ar).length;
      const row = document.createElement('div'); row.className = 'editor-track';
      row.innerHTML = `<div style="flex:1;font-family:'Space Mono',monospace;font-size:12px;">${ar} <span style="color:var(--muted);">(${cnt} tracks)</span></div><button class="btn btn-danger" style="padding:5px 12px;font-size:11px;">Remove</button>`;
      row.querySelector('button').addEventListener('click', () => { removeArtistFromPlaylist(playlistId, ar); closeModal('modalRemoveGroup'); });
      list.appendChild(row);
    }); openModal('modalRemoveGroup');
  };
  const albumTitles = [...new Set(pl.tracks.map(t => t.albumTitle))];
  document.getElementById('editorRemoveAlbumBtn').onclick = () => {
    document.getElementById('removeGroupTitle').textContent = 'REMOVE ALBUM';
    const list = document.getElementById('removeGroupList'); list.innerHTML = '';
    albumTitles.forEach(at => {
      const cnt = pl.tracks.filter(t => t.albumTitle === at).length;
      const row = document.createElement('div'); row.className = 'editor-track';
      row.innerHTML = `<div style="flex:1;font-family:'Space Mono',monospace;font-size:12px;">${at} <span style="color:var(--muted);">(${cnt} tracks)</span></div><button class="btn btn-danger" style="padding:5px 12px;font-size:11px;">Remove</button>`;
      row.querySelector('button').addEventListener('click', () => { removeAlbumFromPlaylist(playlistId, at); closeModal('modalRemoveGroup'); });
      list.appendChild(row);
    }); openModal('modalRemoveGroup');
  };
  openModal('modalPlaylistEditor');
}
function renderEditorTracks(playlistId) {
  const u = getCurrentUser(); if (!u) return;
  const pl = (u.playlists || []).find(p => p.id === playlistId); if (!pl) return;
  const list = document.getElementById('editorTrackList'); list.innerHTML = '';
  if (!pl.tracks.length) { list.innerHTML = '<div style="color:var(--muted);font-family:\'Space Mono\',monospace;font-size:12px;padding:10px;">No tracks</div>'; return; }
  pl.tracks.forEach((t, i) => {
    const row = document.createElement('div'); row.className = 'editor-track';
    row.innerHTML = `<img class="editor-track-art" src="${t.cover}" onerror="this.style.background='#222'"/><div class="editor-track-info"><div class="editor-track-name">${t.name}</div><div class="editor-track-album">${t.albumTitle}</div></div><button class="editor-remove" onclick="removePlaylistTrack('${playlistId}',${i});renderEditorTracks('${playlistId}')"><i class="fas fa-times"></i></button>`;
    list.appendChild(row);
  });
}
function editorRemoveAll() {
  const u = getCurrentUser(); if (!u || !currentPlaylistId) return;
  if (!confirm('Remove all tracks from this playlist?')) return;
  const a = getAccounts(); const pl = a[u.id].playlists.find(p => p.id === currentPlaylistId); if (!pl) return;
  pl.tracks = []; saveAccounts(a); renderEditorTracks(currentPlaylistId); document.getElementById('editorPlaylistName').textContent = pl.name + ' · 0 tracks'; showToast('Playlist cleared');
}
function removeArtistFromPlaylist(playlistId, artistName) {
  const u = getCurrentUser(); if (!u) return;
  const a = getAccounts(); const pl = a[u.id].playlists.find(p => p.id === playlistId); if (!pl) return;
  const before = pl.tracks.length; pl.tracks = pl.tracks.filter(t => t.artist !== artistName);
  saveAccounts(a); showToast(`Removed ${before - pl.tracks.length} tracks by ${artistName}`); renderEditorTracks(playlistId); renderPlaylistView(playlistId);
}
function removeAlbumFromPlaylist(playlistId, albumTitle) {
  const u = getCurrentUser(); if (!u) return;
  const a = getAccounts(); const pl = a[u.id].playlists.find(p => p.id === playlistId); if (!pl) return;
  const before = pl.tracks.length; pl.tracks = pl.tracks.filter(t => t.albumTitle !== albumTitle);
  saveAccounts(a); showToast(`Removed ${before - pl.tracks.length} tracks from ${albumTitle}`); renderEditorTracks(playlistId); renderPlaylistView(playlistId);
}

function renderSidebarLibrary() {
  const lib = document.getElementById('sidebarLibrary');
  lib.innerHTML = '';
  const u = getCurrentUser();
  if (!u) { lib.innerHTML = '<div style="padding:12px 10px;font-family:\'Space Mono\',monospace;font-size:11px;color:var(--muted);">Sign in to save albums & create playlists</div>'; return; }
  (u.playlists || []).forEach(pl => {
    const item = document.createElement('div'); item.className = 'saved-item' + (currentPlaylistId === pl.id ? ' active' : '');
    item.innerHTML = `<div class="saved-item-art playlist-icon" style="background:linear-gradient(135deg,var(--surface3),var(--surface2));font-size:18px;border-radius:5px;width:38px;height:38px;display:flex;align-items:center;justify-content:center;color:var(--accent2);">♪</div><div class="saved-item-info"><div class="saved-item-name">${pl.name}</div><div class="saved-item-sub">Playlist · ${pl.tracks.length}</div></div>`;
    item.addEventListener('click', () => openPlaylistView(pl.id)); lib.appendChild(item);
  });
  (u.savedAlbums || []).forEach(aid => {
    const album = ALBUMS.find(a => a.id === aid); if (!album) return;
    const item = document.createElement('div'); item.className = 'saved-item' + (currentAlbumId === aid ? ' active' : '');
    item.innerHTML = `<img class="saved-item-art" src="${album.cover}" onerror="this.style.background='#222'"/><div class="saved-item-info"><div class="saved-item-name">${album.title}</div><div class="saved-item-sub">${album.artist}</div></div>`;
    item.addEventListener('click', () => openAlbum(aid)); lib.appendChild(item);
  });
  if (!u.playlists?.length && !u.savedAlbums?.length) lib.innerHTML += '<div style="padding:8px 10px;font-family:\'Space Mono\',monospace;font-size:11px;color:var(--muted);">Save albums & create playlists to see them here</div>';
}

// ══════════════════════════════════════════════════════
//  PROFILE
// ══════════════════════════════════════════════════════
function openOwnProfile() { const u = getCurrentUser(); if (!u) { openModal('modalAuth'); return; } renderOwnProfile(); showView('profile'); pushNav(() => { renderOwnProfile(); showView('profile'); }); }
function renderOwnProfile() {
  const u = getCurrentUser(); if (!u) return;
  const content = document.getElementById('profileContent');
  const stats = [{ num: (u.savedAlbums || []).length, label: 'SAVED' }, { num: (u.playlists || []).length, label: 'PLAYLISTS' }, { num: (u.following || []).length, label: 'FOLLOWING' }];
  content.innerHTML = `<div class="profile-hero"><div class="profile-avatar" onclick="promptPfpChange()">${u.pfp ? `<img src="${u.pfp}" alt=""/>` : '<span style="font-size:50px;"><img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png"/></span>'}<div class="profile-avatar-edit"><i class="fas fa-camera"></i></div></div><div><div class="profile-displayname">${u.displayName || u.username}</div><div class="profile-username">@${u.username}</div><div class="profile-id">${u.id}</div><div class="profile-stats">${stats.map(s => `<div class="profile-stat"><div class="profile-stat-num">${s.num}</div><div class="profile-stat-label">${s.label}</div></div>`).join('')}</div><div class="profile-actions"><button class="btn btn-secondary" onclick="openModal('modalEditProfile');loadEditProfile()"><i class="fas fa-edit"></i> Edit</button><button class="btn btn-secondary" onclick="doLogout()"><i class="fas fa-sign-out-alt"></i> Sign Out</button></div></div></div><div class="profile-section"><h3>Playlists</h3><div id="profilePlaylists" style="display:flex;flex-wrap:wrap;gap:8px;"></div></div><div class="profile-section"><h3>Saved Albums</h3><div class="album-grid" id="profileAlbums" style="padding:0;"></div></div>`;
  const ppEl = document.getElementById('profilePlaylists');
  (u.playlists || []).forEach(pl => { const card = document.createElement('div'); card.className = 'playlist-card'; card.innerHTML = `<div class="playlist-card-icon">♪</div><div class="playlist-card-name">${pl.name}</div><div class="playlist-card-count">${pl.tracks.length} tracks</div>`; card.addEventListener('click', () => openPlaylistView(pl.id)); ppEl.appendChild(card); });
  if (!(u.playlists || []).length) ppEl.innerHTML = '<div style="font-family:\'Space Mono\',monospace;font-size:12px;color:var(--muted);">No playlists yet</div>';
  const paEl = document.getElementById('profileAlbums');
  (u.savedAlbums || []).forEach(aid => { const album = ALBUMS.find(a => a.id === aid); if (!album) return; paEl.appendChild(makeAlbumCard(album)); });
  if (!(u.savedAlbums || []).length) paEl.innerHTML = '<div style="font-family:\'Space Mono\',monospace;font-size:12px;color:var(--muted);">No saved albums yet</div>';
}
function openUserProfile(userId) {
  const accounts = getAccounts(); const u = accounts[userId]; if (!u) return;
  if (isInactive(u)) { showToast('This account is inactive'); return; }
  const me = getCurrentUser(); const isMe = me && me.id === userId; if (isMe) { openOwnProfile(); return; }
  const content = document.getElementById('userContent');
  content.innerHTML = `<div class="profile-hero"><div class="profile-avatar" style="cursor:default;">${u.pfp ? `<img src="${u.pfp}" alt=""/>` : '<span style="font-size:50px;"><img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png"/></span>'}</div><div><div class="profile-displayname">${u.displayName || u.username}</div><div class="profile-username">@${u.username}</div><div class="profile-id">${u.id}</div><div class="profile-stats"><div class="profile-stat"><div class="profile-stat-num">${(u.savedAlbums || []).length}</div><div class="profile-stat-label">SAVED</div></div><div class="profile-stat"><div class="profile-stat-num">${(u.playlists || []).length}</div><div class="profile-stat-label">PLAYLISTS</div></div></div></div></div><div class="profile-section"><h3>Playlists</h3><div id="userPlaylists" style="display:flex;flex-wrap:wrap;gap:8px;"></div></div>`;
  const ppEl = document.getElementById('userPlaylists');
  (u.playlists || []).forEach(pl => { const card = document.createElement('div'); card.className = 'playlist-card'; card.innerHTML = `<div class="playlist-card-icon">♪</div><div class="playlist-card-name">${pl.name}</div><div class="playlist-card-count">${pl.tracks.length} tracks</div>`; ppEl.appendChild(card); });
  if (!(u.playlists || []).length) ppEl.innerHTML = '<div style="font-family:\'Space Mono\',monospace;font-size:12px;color:var(--muted);">No public playlists</div>';
  showView('user'); pushNav(() => openUserProfile(userId));
}
function promptPfpChange() {
  const url = prompt('Enter image URL for profile picture:', ''); if (url === null) return;
  const u = getCurrentUser(); if (!u) return;
  const a = getAccounts(); a[u.id].pfp = url.trim(); saveAccounts(a); renderOwnProfile(); renderTopbarRight(); showToast('Profile picture updated');
}
function loadEditProfile() {
  const u = getCurrentUser(); if (!u) return;
  document.getElementById('editDisplayName').value = u.displayName || '';
  document.getElementById('editPfpUrl').value = u.pfp || '';
  document.getElementById('editOldPass').value = '';
  document.getElementById('editNewPass').value = '';
  document.getElementById('editPassError').style.display = 'none';
}
function saveProfileEdit() {
  const u = getCurrentUser(); if (!u) return;
  const a = getAccounts(); const acc = a[u.id];
  acc.displayName = document.getElementById('editDisplayName').value.trim() || acc.displayName;
  const newPfp = document.getElementById('editPfpUrl').value.trim(); if (newPfp) acc.pfp = newPfp;
  const oldP = document.getElementById('editOldPass').value; const newP = document.getElementById('editNewPass').value;
  if (oldP || newP) {
    if (oldP !== acc.password) { document.getElementById('editPassError').textContent = 'Current password incorrect'; document.getElementById('editPassError').style.display = 'block'; return; }
    if (newP.length < 6) { document.getElementById('editPassError').textContent = 'New password too short'; document.getElementById('editPassError').style.display = 'block'; return; }
    acc.password = newP;
  }
  saveAccounts(a); closeModal('modalEditProfile'); renderOwnProfile(); renderTopbarRight(); showToast('Profile updated');
}

// ══════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════
function switchAuthTab(tab) {
  document.querySelectorAll('#modalAuth .tab').forEach((t, i) => t.classList.toggle('active', i === (tab === 'login' ? 0 : 1)));
  document.getElementById('authLogin').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('authRegister').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('authSuccess').style.display = 'none';
}
function doLogin() {
  const raw = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  const accounts = getAccounts();
  const err = document.getElementById('loginError'); err.style.display = 'none';
  const match = Object.values(accounts).find(u => (u.id.toLowerCase() === raw.toLowerCase() || u.username.toLowerCase() === raw.toLowerCase().replace('@', '')) && u.password === pass);
  if (!match) { err.style.display = 'block'; return; }
  if (isInactive(match)) { err.textContent = 'Account inactive (>160 days).'; err.style.display = 'block'; return; }
  setSession(match.id); const a = getAccounts(); a[match.id].lastActive = Date.now(); saveAccounts(a);
  closeModal('modalAuth'); renderTopbarRight(); renderSidebarLibrary(); showToast('Welcome back, ' + (match.displayName || match.username) + '!');
}
function doRegister() {
  const username = document.getElementById('regUser').value.trim().toLowerCase();
  const display = document.getElementById('regDisplay').value.trim();
  const pass = document.getElementById('regPass').value;
  const fallback = document.getElementById('regFallback').value.trim();
  const ue = document.getElementById('regUserError'), re = document.getElementById('regError');
  ue.style.display = 'none'; re.style.display = 'none';
  if (!/^[a-z0-9_]{3,20}$/.test(username)) { ue.textContent = '3–20 chars, letters/numbers/underscores'; ue.style.display = 'block'; return; }
  if (pass.length < 6) { re.textContent = 'Password must be at least 6 characters'; re.style.display = 'block'; return; }
  if (!fallback) { re.textContent = 'Recovery answer is required'; re.style.display = 'block'; return; }
  const accounts = getAccounts();
  if (Object.values(accounts).some(u => u.username === username)) { ue.textContent = 'Username taken'; ue.style.display = 'block'; return; }
  let id; do { id = genId(); } while (accounts[id]);
  const now = Date.now();
  accounts[id] = { id, username, displayName: display || username, password: pass, fallback, pfp: '', playlists: [], savedAlbums: [], following: [], createdAt: now, lastActive: now };
  saveAccounts(accounts); setSession(id);
  document.getElementById('newIdBadge').textContent = id;
  document.getElementById('authLogin').style.display = 'none';
  document.getElementById('authRegister').style.display = 'none';
  document.getElementById('authSuccess').style.display = 'block';
  renderTopbarRight(); renderSidebarLibrary();
}
function doLogout() { setSession(null); renderTopbarRight(); renderSidebarLibrary(); showView('home'); showToast('Signed out'); }

// ══════════════════════════════════════════════════════
//  TOPBAR RIGHT
// ══════════════════════════════════════════════════════
function renderTopbarRight() {
  const right = document.getElementById('topbarRight');
  const u = getCurrentUser();
  if (u) {
    right.innerHTML = `<button class="pfp-btn" id="pfpBtn" onclick="openOwnProfile()" title="${u.displayName || u.username}">${u.pfp ? `<img src="${u.pfp}" alt=""/>` : '<img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png"/>'}</button>`;
  } else {
    right.innerHTML = `<button class="topbar-btn" onclick="switchAuthTab('login');openModal('modalAuth')">Sign In</button><button class="topbar-btn primary" onclick="switchAuthTab('register');openModal('modalAuth')">Create Account</button>`;
  }
}

// ══════════════════════════════════════════════════════
//  MODAL / TOAST / CTX MENU
// ══════════════════════════════════════════════════════
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(el => { el.addEventListener('click', e => { if (e.target === el) el.classList.remove('open'); }); });
function showToast(msg, dur = 2200) {
  const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), dur);
}
let ctxCleanup = null;
function showCtxMenu(x, y, items) {
  const menu = document.getElementById('ctxMenu'); menu.innerHTML = '';
  items.forEach(item => {
    if (!item) return;
    const el = document.createElement('div'); el.className = 'ctx-item' + (item.class ? ' ' + item.class : '');
    el.innerHTML = `<i class="fas ${item.icon}"></i>${item.label}`;
    el.addEventListener('click', () => { menu.classList.remove('open'); item.action(); }); menu.appendChild(el);
  });
  const vw = window.innerWidth, vh = window.innerHeight;
  let mx = x, my = y;
  menu.style.visibility = 'hidden'; menu.style.display = 'block'; menu.classList.add('open');
  const r = menu.getBoundingClientRect(); menu.style.display = '';
  if (mx + r.width > vw) mx = vw - r.width - 8; if (my + r.height > vh) my = vh - r.height - 8;
  menu.style.left = mx + 'px'; menu.style.top = my + 'px';
  if (ctxCleanup) ctxCleanup();
  const close = e => { if (!menu.contains(e.target)) { menu.classList.remove('open'); document.removeEventListener('click', close); } };
  setTimeout(() => document.addEventListener('click', close), 10); ctxCleanup = close;
}
