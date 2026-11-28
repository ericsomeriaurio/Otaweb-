/* OtaWeb · player de vídeo (feed, aba Reels e tela cheia), no jeito de rede social, sem os controles do navegador
   toque = tocar/pausar · toque duplo = Amei · som · barra de progresso arrastável · reels em tela cheia · reprodução automática e troca automática configuráveis */
const VP = { muted: true, net: 'unknown' };
const VP_SVG = {
  play: '<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  off: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="m22 9-6 6M16 9l6 6"/></svg>',
  on: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>',
  full: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>'
};
const vpFmt = s => { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2) };
const vpPref = () => { try { return localStorage.getItem('ow-autoplay') || 'wifi' } catch (e) { return 'wifi' } };
const vpAutoNext = () => { try { return localStorage.getItem('ow-reel-next') === '1' } catch (e) { return false } };

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

/* ---------- peças de tela ---------- */
const vpCtrH = open => `<div class="vp-ctr absolute inset-0 grid place-items-center pointer-events-none" style="transition:opacity .2s;opacity:${open ? 1 : 0}"><span class="w-16 h-16 rounded-full bg-black/50 text-white grid place-items-center pl-1">${VP_SVG.play}</span></div>
   <div class="vp-heart absolute inset-0 grid place-items-center pointer-events-none text-7xl" style="opacity:0">❤️</div>`;
const vpMuteBtn = pos => `<button class="vp-mute absolute ${pos} w-9 h-9 rounded-full bg-black/55 text-white grid place-items-center" onclick="event.stopPropagation();vpMute()" aria-label="Som">${VP_SVG.off}</button>`;
// barra de progresso que dá para arrastar (voltar/avançar); big = reel (mostra o tempo grande no meio ao arrastar)
function vpSeekH(big) {
  return (big ? '<div class="vp-tbig absolute inset-x-0 top-1/3 text-center text-white text-3xl font-bold pointer-events-none" style="opacity:0;transition:opacity .15s;text-shadow:0 1px 6px #000"></div>'
    : '<span class="vp-time absolute bottom-10 left-3 text-white text-xs bg-black/55 rounded-full px-2 py-0.5">0:00</span>')
   + '<div class="vp-seek absolute left-0 right-0 bottom-0 h-9" style="touch-action:none" onclick="event.stopPropagation()" onpointerdown="vpDown(event,this)"><div class="vp-track absolute left-0 right-0 bottom-0 h-[3px] bg-white/30" style="transition:height .12s"><div class="vp-bar h-full bg-white" style="width:0%"></div><span class="vp-thumb absolute rounded-full bg-white shadow" style="display:none;width:14px;height:14px;top:50%;left:0;transform:translate(-50%,-50%)"></span></div></div>';
}
const vpReelUI = () => vpCtrH(false) + vpMuteBtn('top-3 right-3');

function vidH(p) {
  return `<div class="vp relative bg-black select-none" data-pid="${p.id}" onclick="vpTap(event,this)">
   <video src="${E(p.media_url)}#t=0.1" data-vp="1" playsinline preload="metadata" loop muted class="w-full max-h-[75vh] object-contain block"></video>
   ${vpCtrH(true)}
   <button class="vp-full absolute top-3 right-3 w-9 h-9 rounded-full bg-black/55 text-white grid place-items-center" onclick="event.stopPropagation();vpOpen('${p.id}')" aria-label="Tela cheia">${VP_SVG.full}</button>
   ${vpMuteBtn('bottom-10 right-3')}${vpSeekH(false)}</div>`;
}

/* ---------- reprodução ---------- */
function vpPlay(v) {
  document.querySelectorAll('video[data-vp]').forEach(o => { if (o !== v && !o.paused) o.pause() });   // um vídeo de cada vez
  v.muted = VP.muted;
  const r = v.play(); if (r && r.catch) r.catch(() => { VP.muted = true; v.muted = true; vpSyncMute(); const r2 = v.play(); if (r2 && r2.catch) r2.catch(() => {}) });
}
function vpVis(v, on) {
  if (on) { if (v.dataset.user !== 'paused' && (v.hasAttribute('data-rl') || vpAllowed())) vpPlay(v) }
  else { delete v.dataset.user; if (!v.paused) v.pause() }
}
const vpIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => vpVis(e.target, e.isIntersecting && e.intersectionRatio >= 0.6)), { threshold: [0, 0.6] }) : null;

function vpReg(v) {
  if (v.dataset.vpo) return; v.dataset.vpo = '1'; const box = v.closest('.vp,.vp-r'); if (!box) return;
  const feed = box.classList.contains('vp'), ctr = box.querySelector('.vp-ctr'), bar = box.querySelector('.vp-bar'), th = box.querySelector('.vp-thumb'), tm = box.querySelector('.vp-time');
  const ui = () => { if (ctr) ctr.style.opacity = v.paused && !v.dataset.seeking && (feed || v.dataset.user === 'paused') ? 1 : 0; if (tm) tm.textContent = vpFmt(v.paused && v.currentTime < 0.5 ? v.duration : v.duration - v.currentTime) };
  v.addEventListener('play', ui); v.addEventListener('pause', ui); v.addEventListener('loadedmetadata', ui); v.addEventListener('durationchange', ui);
  v.addEventListener('timeupdate', () => { if (v.duration && !v.dataset.seeking) { const f = v.currentTime / v.duration * 100; if (bar) bar.style.width = f + '%'; if (th) th.style.left = f + '%'; if (tm) tm.textContent = vpFmt(v.duration - v.currentTime) } });
  v.muted = VP.muted; vpSyncMute(); ui();
}
function vpScan() { document.querySelectorAll('video[data-vp]:not([data-vpo]),video[data-rl]:not([data-vpo])').forEach(v => { vpReg(v); if (vpIO && v.hasAttribute('data-vp')) vpIO.observe(v) }) }
let vpT; new MutationObserver(() => { clearTimeout(vpT); vpT = setTimeout(vpScan, 60) }).observe(document.documentElement, { childList: true, subtree: true });

// reavalia o que está na tela (ao mudar a opção, a rede ou voltar para o app)
function vpRefreshAll() {
  const h = window.innerHeight || 700;
  document.querySelectorAll('video[data-vp],video[data-rl]').forEach(v => {
    const r = v.getBoundingClientRect(), vis = r.height > 0 && Math.max(0, Math.min(r.bottom, h) - Math.max(r.top, 0)) >= Math.min(r.height * 0.6, h * 0.6);
    if (vis) vpVis(v, true); else if (!v.paused) v.pause();
  });
}
document.addEventListener('visibilitychange', () => { if (document.hidden) document.querySelectorAll('video[data-vp],video[data-rl]').forEach(v => { if (!v.paused) v.pause() }); else vpRefreshAll() });
try { const N = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Network; if (N && N.addListener) N.addListener('networkStatusChange', s => { VP.net = s.connectionType || 'unknown'; vpRefreshAll() }); else if (navigator.connection && navigator.connection.addEventListener) navigator.connection.addEventListener('change', () => { vpNet().then(vpRefreshAll) }) } catch (e) {}
vpNet();

/* ---------- toques ---------- */
function vpTap(ev, box) {
  const v = box.querySelector('video'), now = Date.now(), last = +box.dataset.tt || 0; box.dataset.tt = now;
  if (now - last < 300) { clearTimeout(box._t); vpLike(box); return }        // toque duplo
  box._t = setTimeout(() => { if (v.paused) { delete v.dataset.user; vpPlay(v) } else { v.dataset.user = 'paused'; v.pause() } }, 280);
}
function vpLike(box) {
  const h = box.querySelector('.vp-heart'); if (h) { h.style.transition = 'none'; h.style.opacity = 1; h.style.transform = 'scale(.6)';
    requestAnimationFrame(() => requestAnimationFrame(() => { h.style.transition = 'transform .35s, opacity .7s'; h.style.transform = 'scale(1.15)'; h.style.opacity = 0 })) }
  const p = (typeof posts !== 'undefined' ? posts : []).find(x => x.id === box.dataset.pid);
  if (p && !(p.likes || []).some(l => l.user_id === P.id)) react(p.id, 'love');   // só reage se ainda não reagiu
}
function vpSyncMute() { document.querySelectorAll('.vp-mute').forEach(b => { b.innerHTML = VP.muted ? VP_SVG.off : VP_SVG.on }) }
function vpMute() { VP.muted = !VP.muted; document.querySelectorAll('video[data-vp],video[data-rl]').forEach(o => { o.muted = VP.muted }); vpSyncMute() }

/* ---------- arrastar a barra para voltar ou avançar ---------- */
const vpDrag = { v: null, zone: null, box: null, was: false };
const vpFrac = (ev, zone) => { const r = zone.getBoundingClientRect(); return r.width ? Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)) : 0 };
function vpDown(ev, zone) {
  const box = zone.closest('.vp,.vp-r'), v = box && box.querySelector('video'); if (!v || !v.duration) return;
  if (ev.preventDefault) ev.preventDefault(); if (ev.stopPropagation) ev.stopPropagation();
  try { zone.setPointerCapture(ev.pointerId) } catch (e) {}
  vpDrag.v = v; vpDrag.zone = zone; vpDrag.box = box; vpDrag.was = !v.paused; v.dataset.seeking = '1'; if (!v.paused) v.pause();
  const tr = zone.querySelector('.vp-track'), th = zone.querySelector('.vp-thumb'), big = box.querySelector('.vp-tbig');
  if (tr) tr.style.height = '7px'; if (th) th.style.display = 'block'; if (big) big.style.opacity = 1;
  zone.onpointermove = vpSeekTo; zone.onpointerup = zone.onpointercancel = vpUp; vpSeekTo(ev);
}
function vpSeekTo(ev) {
  const v = vpDrag.v; if (!v) return; const f = vpFrac(ev, vpDrag.zone), box = vpDrag.box; v.currentTime = f * v.duration;
  const bar = box.querySelector('.vp-bar'), th = box.querySelector('.vp-thumb'), tm = box.querySelector('.vp-time'), big = box.querySelector('.vp-tbig');
  if (bar) bar.style.width = f * 100 + '%'; if (th) th.style.left = f * 100 + '%';
  if (tm) tm.textContent = vpFmt(v.duration - f * v.duration); if (big) big.textContent = vpFmt(f * v.duration) + ' / ' + vpFmt(v.duration);
}
function vpUp(ev) {
  const v = vpDrag.v; if (!v) return; const zone = vpDrag.zone, box = vpDrag.box;
  zone.onpointermove = zone.onpointerup = zone.onpointercancel = null; try { zone.releasePointerCapture(ev.pointerId) } catch (e) {}
  const tr = zone.querySelector('.vp-track'), th = zone.querySelector('.vp-thumb'), big = box.querySelector('.vp-tbig');
  if (tr) tr.style.height = '3px'; if (th) th.style.display = 'none'; if (big) big.style.opacity = 0;
  delete v.dataset.seeking; const was = vpDrag.was; vpDrag.v = null; if (was) vpPlay(v);
}

/* ---------- reels (aba Reels e tela cheia) ---------- */
function vpEnded(v) {
  if (!vpAutoNext()) return;
  const cur = v.closest('.vp-r'), nx = cur && cur.nextElementSibling;
  if (nx && nx.classList.contains('vp-r') && nx.scrollIntoView) nx.scrollIntoView({ behavior: 'smooth' });
  else { v.currentTime = 0; const r = v.play(); if (r && r.catch) r.catch(() => {}) }   // era o último: recomeça
}
function vpApplyLoop() { document.querySelectorAll('video[data-rl]').forEach(v => { v.loop = !vpAutoNext() }) }
// liga o autoplay por rolagem nos reels de um contêiner (pode ser chamado de novo quando chegam mais reels)
function vpReelsInit(root) {
  if (!root) return;
  if (!root._io && 'IntersectionObserver' in window) root._io = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) { if (v.dataset.user !== 'paused') vpPlay(v) }
    else { delete v.dataset.user; if (!v.paused) v.pause(); try { v.currentTime = 0 } catch (x) {} }
  }), { threshold: 0.7 });
  root.querySelectorAll('video[data-rl]:not([data-rlb])').forEach(v => {
    v.dataset.rlb = '1'; v.loop = !vpAutoNext(); v.addEventListener('ended', () => vpEnded(v)); vpReg(v); if (root._io) root._io.observe(v);
  });
}
// o post da tela cheia é o mesmo objeto do feed, então reações e comentários ficam em sincronia
function vpCanon(p) { if (!p || typeof posts === 'undefined') return p; const o = posts.find(x => x.id === p.id); if (o) return o; posts.push(p); return p }
async function vpOpen(id) {
  const cur = (typeof posts !== 'undefined' ? posts : []).find(x => x.id === id); if (!cur) return;
  document.querySelectorAll('video[data-vp]').forEach(o => { if (!o.paused) o.pause() });
  vpClose(true);
  const d = document.createElement('div'); d.id = 'vpf'; d.className = 'fixed inset-0 z-[45] bg-black';
  d.innerHTML = `<div class="h-full md:max-w-sm md:mx-auto relative"><div id="rl2" class="h-full overflow-y-scroll snap-y snap-mandatory bg-black">${reelH(cur)}</div>
   <button class="absolute top-3 left-3 z-10 w-10 h-10 rounded-full bg-black/55 text-white grid place-items-center text-lg" onclick="vpClose()" aria-label="Fechar">✕</button></div>`;
  document.body.appendChild(d); const root = d.querySelector('#rl2'); vpReelsInit(root);
  if (typeof layerOpen === 'function') layerOpen('vpf', () => vpClose(true));
  try {                                                                   // os outros reels chegam logo depois, abaixo do escolhido
    const { data } = await sb.from('posts').select(SEL).is('guild_id', null).eq('media_type', 'video').order('created_at', { ascending: false }).limit(20);
    if (!document.getElementById('vpf')) return;
    const more = (await prep(data || [])).filter(x => x.id !== id).map(vpCanon);
    root.insertAdjacentHTML('beforeend', more.map(reelH).join('')); vpReelsInit(root);
  } catch (e) {}
}
function vpClose(fromBack) {
  const d = document.getElementById('vpf'); if (d) d.remove();
  if (fromBack !== true && typeof layerClosed === 'function') layerClosed('vpf');
  setTimeout(vpRefreshAll, 100);
}
const vpLeave = () => { if (document.getElementById('vpf')) vpClose() };      // fecha a tela cheia antes de ir para um perfil

/* ---------- opções nas Definições ---------- */
function vpPaintSettings() {
  const el = document.getElementById('vp-card'); if (!el) return; const cur = vpPref(), nx = vpAutoNext();
  el.innerHTML = `<div class="text-sm font-semibold">Reprodução automática de vídeos</div><div class="text-xs text-mut mb-2">Os vídeos do feed tocam sozinhos, sem som, quando aparecem na tela. "Só no Wi-Fi" economiza seus dados móveis.</div>
   <div class="grid grid-cols-3 gap-2">${[['always', 'Sempre'], ['wifi', 'Só no Wi-Fi'], ['never', 'Nunca']].map(o => `<button class="btn2 ${cur === o[0] ? 'sel' : ''}" onclick="vpSet('${o[0]}')">${o[1]}</button>`).join('')}</div>
   <div class="text-sm font-semibold mt-4">Reels: ao terminar um vídeo</div><div class="text-xs text-mut mb-2">Vale para a aba Reels e para a tela cheia.</div>
   <div class="grid grid-cols-2 gap-2"><button class="btn2 ${nx ? '' : 'sel'}" onclick="vpSetNext(false)">Repetir</button><button class="btn2 ${nx ? 'sel' : ''}" onclick="vpSetNext(true)">Passar para o próximo</button></div>`;
}
function vpSet(v) { try { localStorage.setItem('ow-autoplay', v) } catch (e) {} vpPaintSettings(); vpRefreshAll(); T('Salvo!') }
function vpSetNext(on) { try { localStorage.setItem('ow-reel-next', on ? '1' : '0') } catch (e) {} vpApplyLoop(); vpPaintSettings(); T('Salvo!') }
