// ══════════════════════════════════════════════════════
//  SETTINGS PERSISTENCE
// ══════════════════════════════════════════════════════
function getSettings() {
  try { return JSON.parse(localStorage.getItem('player_settings') || '{}'); } catch { return {}; }
}
function saveSettings(s) { localStorage.setItem('player_settings', JSON.stringify(s)); }

let playerSettings = Object.assign({ maxVol: 300, defaultVol: 100, shuffleDefault: false, repeatDefault: 0 }, getSettings());

function initSettingsUI() {
  const maxVolSlider = document.getElementById('settingsMaxVol');
  const maxVolVal = document.getElementById('settingsMaxVolVal');
  const defVolSlider = document.getElementById('settingsDefaultVol');
  const defVolVal = document.getElementById('settingsDefaultVolVal');
  const shuffleCheck = document.getElementById('settingsShuffle');
  const repeatSel = document.getElementById('settingsRepeat');

  maxVolSlider.value = playerSettings.maxVol;
  maxVolVal.textContent = playerSettings.maxVol + '%';
  defVolSlider.value = playerSettings.defaultVol;
  defVolVal.textContent = playerSettings.defaultVol + '%';
  shuffleCheck.checked = playerSettings.shuffleDefault;
  repeatSel.value = playerSettings.repeatDefault;

  // Update vol slider max based on setting
  document.getElementById('volSlider').max = playerSettings.maxVol;

  maxVolSlider.oninput = () => {
    playerSettings.maxVol = parseInt(maxVolSlider.value);
    maxVolVal.textContent = playerSettings.maxVol + '%';
    document.getElementById('volSlider').max = playerSettings.maxVol;
    saveSettings(playerSettings);
    updateVolFill();
  };
  defVolSlider.oninput = () => {
    playerSettings.defaultVol = parseInt(defVolSlider.value);
    defVolVal.textContent = playerSettings.defaultVol + '%';
    saveSettings(playerSettings);
  };
  shuffleCheck.onchange = () => {
    playerSettings.shuffleDefault = shuffleCheck.checked;
    saveSettings(playerSettings);
  };
  repeatSel.onchange = () => {
    playerSettings.repeatDefault = parseInt(repeatSel.value);
    saveSettings(playerSettings);
  };
}