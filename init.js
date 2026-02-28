cleanInactive();
renderDiscover();
renderTopbarRight();
renderSidebarLibrary();
initSettingsUI();
showView('home');
pushNav(() => { showView('home'); });
loadAndRenderStats().catch(e => console.warn('Stats load error:', e));

// Apply saved settings on load
document.getElementById('volSlider').max = playerSettings.maxVol;
document.getElementById('volSlider').value = playerSettings.defaultVol;
updateVolFill();
shuffleOn = playerSettings.shuffleDefault;
repeatMode = playerSettings.repeatDefault;
if (shuffleOn) document.getElementById('btnRandom').classList.add('active');
if (repeatMode === 1) { document.getElementById('btnRepeat').classList.add('active'); }
else if (repeatMode === 2) { document.getElementById('btnRepeat').classList.add('active'); document.getElementById('repeatIcon').className = 'fas fa-redo-alt'; }

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  const tag = document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
  if (e.code === 'ArrowRight' && e.shiftKey) nextTrack();
  if (e.code === 'ArrowLeft' && e.shiftKey) prevTrack();
});