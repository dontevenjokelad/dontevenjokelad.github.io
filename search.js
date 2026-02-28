// ══════════════════════════════════════════════════════
//  SEARCH
// ══════════════════════════════════════════════════════
let searchTimer = null;
document.getElementById('globalSearch').addEventListener('input', function () {
  clearTimeout(searchTimer);
  const q = this.value.trim();
  if (!q) { showView('home'); return; }
  showView('search');
  searchTimer = setTimeout(() => doSearch(q), 200);
});

function doSearch(q) {
  const lq = q.toLowerCase();
  const res = document.getElementById('searchResults');
  res.innerHTML = '';
  const albumMatches = ALBUMS.filter(a => a.title.toLowerCase().includes(lq) || a.artist.toLowerCase().includes(lq) || (a.tags && a.tags.some(t => t.toLowerCase().includes(lq))));
  const trackMatches = [];
  ALBUMS.forEach(album => {
    album.tracks.forEach((t, origIdx) => {
      if (!t.file || t.file === '#') return;
      if (t.name.toLowerCase().includes(lq) || album.artist.toLowerCase().includes(lq) || album.title.toLowerCase().includes(lq)) {
        trackMatches.push({ track: t, album, origIdx });
      }
    });
  });
  const artistSet = new Set();
  ALBUMS.forEach(a => { [a.artist, a.primaryArtist, ...(a.featuredArtists || [])].forEach(n => { if (n && n.toLowerCase().includes(lq)) artistSet.add(n); }); });
  const accounts = getAccounts();
  const userMatches = Object.values(accounts).filter(u => { if (isInactive(u)) return false; const uid = u.id.toLowerCase(), uname = (u.username || '').toLowerCase(); return uid.includes(lq) || uname.includes(lq); });
  if (!albumMatches.length && !trackMatches.length && !artistSet.size && !userMatches.length) { res.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i>No results found</div>'; return; }
  if (userMatches.length) {
    const sec = document.createElement('div'); sec.className = 'results-section'; sec.innerHTML = '<h3>Users</h3>';
    userMatches.slice(0, 5).forEach(u => {
      const card = document.createElement('div'); card.className = 'user-card';
      card.innerHTML = `<div class="user-card-pfp">${u.pfp ? `<img src="${u.pfp}" alt=""/>` : '<img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png"/>'}</div><div><div class="user-card-name">${u.displayName || u.username}</div><div class="user-card-sub">@${u.username} · ${u.id}</div></div>`;
      card.addEventListener('click', () => openUserProfile(u.id)); sec.appendChild(card);
    }); res.appendChild(sec);
  }
  if (artistSet.size) {
    const sec = document.createElement('div'); sec.className = 'results-section'; sec.innerHTML = '<h3>Artists</h3>';
    const artistGrid = document.createElement('div'); artistGrid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:8px;';
    [...artistSet].slice(0, 9).forEach(artist => {
      const profile = getArtistProfile(artist);
      const card = document.createElement('div');
      card.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;cursor:pointer;transition:background .15s;';
      card.onmouseover = () => card.style.background = 'var(--surface2)';
      card.onmouseout = () => card.style.background = 'transparent';
      const pfpHtml = profile.pfp
        ? `<img src="${profile.pfp}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none'">`
        : `<div style="width:44px;height:44px;border-radius:50%;background:var(--surface3);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;"><img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png" style="width:100%;height:100%;border-radius:50%;"/></div>`;
      card.innerHTML = `${pfpHtml}<div><div style="font-size:13px;font-weight:500;">${artist}</div><div style="font-size:10px;color:var(--muted);font-family:'Space Mono',monospace;margin-top:2px;">Artist</div></div>`;
      card.addEventListener('click', () => openArtist(artist)); artistGrid.appendChild(card);
    }); sec.appendChild(artistGrid); res.appendChild(sec);
  }
  if (albumMatches.length) {
    const sec = document.createElement('div'); sec.className = 'results-section'; sec.innerHTML = '<h3>Albums</h3>';
    const grid = document.createElement('div'); grid.className = 'album-grid'; grid.style.padding = '0';
    albumMatches.slice(0, 8).forEach(album => grid.appendChild(makeAlbumCard(album)));
    sec.appendChild(grid); res.appendChild(sec);
  }
  if (trackMatches.length) {
    const sec = document.createElement('div'); sec.className = 'results-section'; sec.innerHTML = '<h3>Tracks</h3>';
    trackMatches.slice(0, 10).forEach(({ track, album, origIdx }) => {
      const row = document.createElement('div'); row.className = 'result-track-row';
      row.innerHTML = `<img class="result-track-art" src="${album.cover}" onerror="this.style.background='#222'"/><div class="result-track-info"><div class="result-track-name">${track.name}</div><div class="result-track-album">${album.artist} · ${album.title}</div></div>`;
      row.addEventListener('click', () => playAlbumFromTrack(album.id, origIdx)); sec.appendChild(row);
    }); res.appendChild(sec);
  }
}