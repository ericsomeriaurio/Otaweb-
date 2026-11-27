/* OtaWeb · player de vídeo do feed (jeito de rede social, sem os controles do navegador)
   toque = tocar/pausar · toque duplo = Amei · botão de som · barra fina · tela cheia estilo reel · reprodução automática configurável */
const VP = { muted: true, net: 'unknown' };
const VP_SVG = {
  play: '<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  off: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="m22 9-6 6M16 9l6 6"/></svg>',
  on: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>',
  full: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>'
};
const vpFmt = s => { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2) };
const vpPref = () => { try { return localStorage.getItem('ow-autoplay') || 'wifi' } catch (e) { return 'wifi' } };

/* ---------- rede: Wi-Fi ou dados móveis ---------- */
async function vpNet() {
  try { const N = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Network; if (N && N.getStatus) { VP.net = (await N.getStatus()).connectionType || 'unknown'; return } } catch (e) {}
  const c = navigator.connection; VP.net = c && c.type ? c.type : 'unknown'; VP.save = !!(c && c.saveData);
}
function vpAllowed() {
  const p = vpPref(); if (p === 'never') return false; if (p === 'always') return true;
  if (VP.save) return false;
  if (VP.net === 'wifi' || VP.net === 'ethernet') return true;
  if (VP.net === 'unknown') return !/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent || '');   // computador: libera; celular sem informação: não gasta dados
  return false;                                                                                         // dados móveis
}

/* ---------- peça do feed ---------- */
function vidH(p) {
  return `<div class="vp relative bg-black select-none" data-pid="${p.id}" onclick="vpTap(event,this)">
   <video src="${E(p.media_url)}#t=0.1" data-vp="1" playsinline preload="metadata" loop muted class="w-full max-h-[75vh] object-contain block"></video>
   <div class="vp-ctr absolute inset-0 grid place-items-center pointer-events-none" style="transition:opacity .2s"><span class="w-16 h-16 rounded-full bg-black/50 text-white grid place-items-center pl-1">${VP_SVG.play}</span></div>
   <div class="vp-heart absolute inset-0 grid place-items-center pointer-events-none text-7xl" style="opacity:0">❤️</div>
   <button class="vp-full absolute top-3 right-3 w-9 h-9 rounded-full bg-black/55 text-white grid place-items-center" onclick="event.stopPropagation();vpOpen('${p.id}')" aria-label="Tela cheia">${VP_SVG.full}</button>
   <button class="vp-mute absolute bottom-5 right-3 w-9 h-9 rounded-full bg-black/55 text-white grid place-items-center" onclick="event.stopPropagation();vpMute()" aria-label="Som">${VP_SVG.off}</button>
   <span class="vp-time absolute bottom-6 left-3 text-white text-xs bg-black/55 rounded-full px-2 py-0.5">0:00</span>
   <div class="vp-seek absolute left-0 right-0 bottom-0 h-4" onclick="event.stopPropagation();vpSeek(event,this)"><div class="absolute bottom-0 left-0 right-0 h-[3px] bg-white/30"><div class="vp-bar h-full bg-white" style="width:0%"></div></div></div></div>`;
}

/* ---------- reprodução ---------- */
function vpPlay(v) {
  document.querySelectorAll('video[data-vp]').forEach(o => { if (o !== v && !o.paused) o.pause() });   // um vídeo de cada vez
  v.muted = VP.muted;
  const r = v.play(); if (r && r.catch) r.catch(() => { VP.muted = true; v.muted = true; vpSyncMute(); const r2 = v.play(); if (r2 && r2.catch) r2.catch(() => {}) });
}
function vpVis(v, on) {
  if (on) { if (v.dataset.user !== 'paused' && vpAllowed()) vpPlay(v) }
  else { delete v.dataset.user; if (!v.paused) v.pause() }
}
const vpIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => vpVis(e.target, e.isIntersecting && e.intersectionRatio >= 0.6)), { threshold: [0, 0.6] }) : null;

function vpReg(v) {
  if (v.dataset.vpo) return; v.dataset.vpo = '1'; const box = v.closest('.vp'); if (!box) return;
  const ctr = box.querySelector('.vp-ctr'), bar = box.querySelector('.vp-bar'), tm = box.querySelector('.vp-time');
  const ui = () => { ctr.style.opacity = v.paused ? 1 : 0; tm.textContent = vpFmt(v.paused && v.currentTime < 0.5 ? v.duration : v.duration - v.currentTime) };
  v.addEventListener('play', ui); v.addEventListener('pause', ui); v.addEventListener('loadedmetadata', ui); v.addEventListener('durationchange', ui);
  v.addEventListener('timeupdate', () => { if (v.duration) { bar.style.width = (v.currentTime / v.duration * 100) + '%'; tm.textContent = vpFmt(v.duration - v.currentTime) } });
  v.muted = VP.muted; vpSyncMute(); ui();
}
function vpScan() { document.querySelectorAll('video[data-vp]:not([data-vpo])').forEach(v => { vpReg(v); if (vpIO) vpIO.observe(v) }) }
let vpT; new MutationObserver(() => { clearTimeout(vpT); vpT = setTimeout(vpScan, 60) }).observe(document.documentElement, { childList: true, subtree: true });

// reavalia o que está na tela (ao mudar a opção, a rede ou voltar para o app)
function vpRefreshAll() {
  const h = window.innerHeight || 700;
  document.querySelectorAll('video[data-vp]').forEach(v => {
    const r = v.getBoundingClientRect(), vis = Math.max(0, Math.min(r.bottom, h) - Math.max(r.top, 0)) >= Math.min(r.height * 0.6, h * 0.6) && r.height > 0;
    if (vis) vpVis(v, true); else if (!v.paused) v.pause();
  });
}
document.addEventListener('visibilitychange', () => { if (document.hidden) document.querySelectorAll('video[data-vp]').forEach(v => { if (!v.paused) v.pause() }); else vpRefreshAll() });
try { const N = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Network; if (N && N.addListener) N.addListener('networkStatusChange', s => { VP.net = s.connectionType || 'unknown'; vpRefreshAll() }); else if (navigator.connection && navigator.connection.addEventListener) navigator.connection.addEventListener('change', () => { vpNet().then(vpRefreshAll) }) } catch (e) {}
vpNet();

/* ---------- toques ---------- */
function vpTap(ev, box) {
  const v = box.querySelector('video'), now = Date.now(), last = +box.dataset.tt || 0; box.dataset.tt = now;
  if (now - last < 300) { clearTimeout(box._t); vpLike(box); return }        // toque duplo
  box._t = setTimeout(() => { if (v.paused) { delete v.dataset.user; vpPlay(v) } else { v.dataset.user = 'paused'; v.pause() } }, 280);
}
function vpLike(box) {
  const h = box.querySelector('.vp-heart'); h.style.transition = 'none'; h.style.opacity = 1; h.style.transform = 'scale(.6)';
  requestAnimationFrame(() => requestAnimationFrame(() => { h.style.transition = 'transform .35s, opacity .7s'; h.style.transform = 'scale(1.15)'; h.style.opacity = 0 }));
  const p = (typeof posts !== 'undefined' ? posts : []).find(x => x.id === box.dataset.pid);
  if (p && !(p.likes || []).some(l => l.user_id === P.id)) react(p.id, 'love');   // só reage se ainda não reagiu
}
function vpSyncMute() { document.querySelectorAll('.vp-mute').forEach(b => { b.innerHTML = VP.muted ? VP_SVG.off : VP_SVG.on }) }
function vpMute() { VP.muted = !VP.muted; document.querySelectorAll('video[data-vp]').forEach(o => { o.muted = VP.muted }); vpSyncMute() }
function vpSeek(ev, el) {
  const r = el.getBoundingClientRect(), v = el.closest('.vp').querySelector('video'); if (v.duration && r.width) v.currentTime = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)) * v.duration;
}

/* ---------- tela cheia (igual à aba Reels) ---------- */
function vpOpen(id) {
  const p = (typeof posts !== 'undefined' ? posts : []).find(x => x.id === id); if (!p) return;
  document.querySelectorAll('video[data-vp]').forEach(o => { if (!o.paused) o.pause() });
  const d = document.createElement('div'); d.id = 'vpf'; d.className = 'fixed inset-0 z-[45] bg-black';
  d.innerHTML = `<div class="h-full md:max-w-sm md:mx-auto relative">${reelH(p)}<button class="absolute top-3 left-3 z-10 w-10 h-10 rounded-full bg-black/55 text-white grid place-items-center text-lg" onclick="vpClose()" aria-label="Fechar">✕</button></div>`;
  document.body.appendChild(d);
  const v = d.querySelector('video'); if (v) { v.muted = VP.muted; const r = v.play(); if (r && r.catch) r.catch(() => { v.muted = true; v.play().catch(() => {}) }) }
  if (typeof layerOpen === 'function') layerOpen('vpf', () => vpClose(true));
}
function vpClose(fromBack) {
  const d = document.getElementById('vpf'); if (d) d.remove();
  if (fromBack !== true && typeof layerClosed === 'function') layerClosed('vpf');
  setTimeout(vpRefreshAll, 100);
}

/* ---------- opção nas Definições ---------- */
function vpPaintSettings() {
  const el = document.getElementById('vp-card'); if (!el) return; const cur = vpPref();
  el.innerHTML = `<div class="text-sm font-semibold">Reprodução automática de vídeos</div><div class="text-xs text-mut mb-2">Os vídeos do feed tocam sozinhos, sem som, quando aparecem na tela. "Só no Wi-Fi" economiza seus dados móveis.</div>
   <div class="grid grid-cols-3 gap-2">${[['always', 'Sempre'], ['wifi', 'Só no Wi-Fi'], ['never', 'Nunca']].map(o => `<button class="btn2 ${cur === o[0] ? 'sel' : ''}" onclick="vpSet('${o[0]}')">${o[1]}</button>`).join('')}</div>`;
}
function vpSet(v) { try { localStorage.setItem('ow-autoplay', v) } catch (e) {} vpPaintSettings(); vpRefreshAll(); T('Salvo!') }
