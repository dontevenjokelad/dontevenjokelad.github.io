// ══════════════════════════════════════════════════════
//  ACCOUNT SYSTEM
// ══════════════════════════════════════════════════════
const INACTIVE_DAYS = 160, DELETE_DAYS = 80;
function getAccounts() { try { return JSON.parse(localStorage.getItem('player_accounts') || '{}') } catch { return {} } }
function saveAccounts(a) { localStorage.setItem('player_accounts', JSON.stringify(a)) }
function getSession() { return localStorage.getItem('player_session') || null }
function setSession(id) { localStorage.setItem('player_session', id || '') }
function getCurrentUser() { const s = getSession(); if (!s) return null; const a = getAccounts(); const u = a[s]; if (!u) return null; if (isInactive(u)) return null; return u; }
function isInactive(u) { return (Date.now() - u.lastActive) > (INACTIVE_DAYS * 86400000); }
function isPendingDelete(u) { return (Date.now() - u.lastActive) > ((INACTIVE_DAYS + DELETE_DAYS) * 86400000); }
function touchActivity() { const u = getCurrentUser(); if (!u) return; const a = getAccounts(); a[u.id].lastActive = Date.now(); saveAccounts(a); }
function genId() { const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; let r = '#'; for (let i = 0; i < 8; i++) r += c[Math.floor(Math.random() * c.length)]; return r; }
function cleanInactive() { const a = getAccounts(); let changed = false; Object.keys(a).forEach(id => { if (isPendingDelete(a[id])) { delete a[id]; changed = true; } }); if (changed) saveAccounts(a); }