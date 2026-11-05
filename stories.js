/* OtaWeb · Stories de 48 horas */
const ST = { groups: [], seen: new Set(), gi: 0, si: 0, cur: null, el: 0, dur: 5000, paused: false, sheet: false, iv: null, muted: false, react: {}, rt: null, live: false };
const BGS = { b1: 'linear-gradient(135deg,#7a1633,#d64870)', b2: 'linear-gradient(135deg,#1e3a8a,#7c3aed)', b3: 'linear-gradient(135deg,#065f46,#10b981)', b4: 'linear-gradient(135deg,#b45309,#f59e0b)', b5: 'linear-gradient(135deg,#111827,#4b5563)', b6: 'linear-gradient(135deg,#be185d,#f472b6)' };
let SC = { kind: '', file: null, bg: 'b1', hours: 24 };
const DURS = [2, 4, 8, 12, 24, 48];
const durH = () => `<div class="mb-3"><div class="text-xs font-semibold mb-1.5">Duração do story</div><div class="flex gap-1.5 flex-wrap" id="sc-dur">${DURS.map(h => `<button type="button" class="btn2 !py-1.5 !px-3 text-xs ${h === SC.hours ? 'sel' : ''}" data-h="${h}" onclick="stDur(${h})">${h} h</button>`).join('')}</div></div>`;
function stDur(h) { SC.hours = h; document.querySelectorAll('#sc-dur button').forEach(b => b.classList.toggle('sel', +b.dataset.h === h)) }
const ageLeft = t => { const m = Math.max(0, new Date(t) - Date.now()); return m >= 36e5 ? Math.ceil(m / 36e5) + ' h restantes' : Math.max(1, Math.ceil(m / 6e4)) + ' min restantes' };
const stPath = u => { try { return decodeURIComponent(String(u).split('/media/')[1] || '') } catch (e) { return '' } };

/* ---------- início, limpeza e tempo real ---------- */
function storiesStart() {
  if (ST.live) return; ST.live = true;
  sb.channel('stories').on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, () => { clearTimeout(ST.rt); ST.rt = setTimeout(loadStories, 600) }).subscribe();
  cleanupStories();
}
// cada pessoa apaga os próprios stories vencidos (e os arquivos) quando abre o site
async function cleanupStories() {
  const { data, error } = await sb.rpc('cleanup_my_stories'); if (error) return;
  const paths = (data || []).map(r => stPath(r.media_url)).filter(p => p && p.startsWith(P.id + '/'));
  if (paths.length) sb.storage.from('media').remove(paths).then(() => {});
}

/* ---------- barra de stories no feed ---------- */
async function loadStories() {
  if (!P) return; if (document.getElementById('sv')) { ST.stale = true; return }
  const [a, f] = await Promise.all([
    sb.from('stories').select('id,author,media_url,media_type,caption,bg,created_at,expires_at,au:profiles!author(id,name,handle,avatar_url)').gt('expires_at', new Date().toISOString()).order('created_at'),
    sb.from('follows').select('followee').eq('follower', P.id)]);
  if (a.error) { ST.groups = []; drawBar(); return }
  const rows = a.data || [], fol = new Set((f.data || []).map(x => x.followee)), ids = rows.map(r => r.id); ST.seen = new Set();
  if (ids.length) { const { data: v } = await sb.from('story_views').select('story_id').eq('user_id', P.id).in('story_id', ids); (v || []).forEach(x => ST.seen.add(x.story_id)) }
  const g = {}; rows.forEach(r => { (g[r.author] = g[r.author] || { id: r.author, au: r.au || { name: 'Otaku' }, items: [] }).items.push(r) });
  const groups = Object.values(g); groups.forEach(x => { x.unseen = x.id !== P.id && x.items.some(i => !ST.seen.has(i.id)); x.fol = fol.has(x.id); x.last = new Date(x.items[x.items.length - 1].created_at).getTime() });
  groups.sort((x, y) => x.id === P.id ? -1 : y.id === P.id ? 1 : (y.unseen - x.unseen) || (y.fol - x.fol) || (y.last - x.last));
  ST.groups = groups; drawBar();
}
function drawBar() {
  const el = document.getElementById('stbar'); if (!el || !P) return; const own = ST.groups.find(g => g.id === P.id);
  const ring = (u, cls) => `<span class="block p-[2.5px] rounded-full ${cls}"><span class="block rounded-full bg-card p-[2px]">${av(u, 54)}</span></span>`;
  el.innerHTML = `<div class="shrink-0 w-[70px] text-center relative"><button class="block mx-auto" onclick="${own ? `viewStories('${P.id}')` : 'openStoryCreate()'}" aria-label="Seu story">${ring(P, own ? 'bg-brand' : 'bg-line')}</button>
    <button class="absolute top-9 right-1 w-[22px] h-[22px] rounded-full bg-brand text-white grid place-items-center ring-2 ring-card" onclick="openStoryCreate()" aria-label="Novo story">${ic('plus', false, 13)}</button><div class="text-[11px] mt-1 truncate">Seu story</div></div>` +
    ST.groups.filter(g => g.id !== P.id).map(g => `<div class="shrink-0 w-[70px] text-center"><button class="block mx-auto" onclick="viewStories('${g.id}')" aria-label="Story de ${E(g.au.name)}">${ring(g.au, g.unseen ? 'bg-brand' : 'bg-line')}</button><div class="text-[11px] mt-1 truncate ${g.unseen ? 'font-semibold' : 'text-mut'}">${E(g.au.name)}</div></div>`).join('');
}

/* ---------- criar story ---------- */
function openStoryCreate(kind) {
  if (typeof restrOk === 'function' && !restrOk('posts')) return;
  SC = { kind: kind || '', file: null, bg: 'b1', hours: 24 };
  if (kind === 'text') return stTextEditor(); if (kind) return stMediaEditor(kind);
  modal(`<div class="flex items-center justify-between mb-1"><h3 class="font-bold text-lg">Novo story</h3><button class="circ" onclick="closeM()" aria-label="Fechar">${ic('x', false, 18)}</button></div><p class="text-xs text-mut mb-3">Você escolhe por quanto tempo ele fica visível. Depois some sozinho.</p>` +
    [['photo', 'image', 'Foto'], ['video', 'video', 'Vídeo (até 60 segundos)'], ['text', 'type', 'Texto']].map(([k, i, l]) => `<button class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-soft text-left" onclick="openStoryCreate('${k}')"><span class="w-10 h-10 rounded-full bg-soft text-brand grid place-items-center">${ic(i, false, 20)}</span><span class="text-sm font-semibold">${l}</span></button>`).join(''));
}
function stMediaEditor(kind) {
  const v = kind === 'video';
  modal(`<div class="flex items-center justify-between mb-3"><h3 class="font-bold text-lg">Story de ${v ? 'vídeo' : 'foto'}</h3><button class="circ" onclick="closeM()" aria-label="Fechar">${ic('x', false, 18)}</button></div>
  <div id="sc-prev" class="rounded-xl bg-soft grid place-items-center min-h-48 overflow-hidden mb-3 text-sm text-mut">Escolha um arquivo</div>
  <label class="btn2 w-full mb-3 cursor-pointer">${ic(v ? 'video' : 'image', false, 18)} Escolher ${v ? 'vídeo' : 'foto'}<input id="sc-f" type="file" accept="${v ? 'video/*' : 'image/*'}" class="hidden" onchange="stPick(this.files[0])"></label>
  <input id="sc-cap" class="inp mb-3" maxlength="200" placeholder="Legenda (opcional)">${durH()}<button id="sc-go" class="btn w-full !py-3" onclick="stPublish()" disabled>Publicar story</button>`);
  $('#sc-f').click();
}
async function stPick(f) {
  if (!f) return; if (f.size > 50 * 1024 * 1024) return T('Arquivo acima de 50 MB.');
  const url = URL.createObjectURL(f), isV = f.type.startsWith('video');
  if (isV) { const ok = await new Promise(res => { const v = document.createElement('video'); v.preload = 'metadata'; v.onloadedmetadata = () => res(v.duration <= 61); v.onerror = () => res(true); v.src = url; setTimeout(() => res(true), 4000) }); if (!ok) return T('O vídeo do story pode ter no máximo 60 segundos.') }
  SC.file = f; $('#sc-prev').innerHTML = isV ? `<video src="${url}" controls playsinline class="max-h-72 w-full"></video>` : `<img src="${url}" class="max-h-72 w-full object-contain" alt="">`; $('#sc-go').disabled = false;
}
function stTextEditor() {
  modal(`<div class="flex items-center justify-between mb-3"><h3 class="font-bold text-lg">Story de texto</h3><button class="circ" onclick="closeM()" aria-label="Fechar">${ic('x', false, 18)}</button></div>
  <div id="sc-box" class="rounded-xl grid place-items-center min-h-56 p-5 mb-3" style="background:${BGS.b1}"><textarea id="sc-txt" rows="4" maxlength="300" class="w-full bg-transparent text-white text-2xl font-bold text-center outline-none resize-none placeholder-white/60" placeholder="Escreva algo..."></textarea></div>
  <div class="flex gap-2 mb-3 justify-center">${Object.keys(BGS).map(k => `<button class="w-8 h-8 rounded-full ring-2 ${k === 'b1' ? 'ring-ink' : 'ring-transparent'}" style="background:${BGS[k]}" data-k="${k}" onclick="stBg(this.dataset.k)" aria-label="Escolher fundo"></button>`).join('')}</div>
  ${durH()}<button id="sc-go" class="btn w-full !py-3" onclick="stPublish()">Publicar story</button>`);
}
function stBg(k) { SC.bg = k; $('#sc-box').style.background = BGS[k]; document.querySelectorAll('[data-k]').forEach(b => b.classList.toggle('ring-ink', b.dataset.k === k)) }
async function stPublish() {
  const go = $('#sc-go'); go.disabled = true; const row = { author: P.id, expires_at: new Date(Date.now() + SC.hours * 36e5).toISOString() };
  if (SC.kind === 'text') { const t = $('#sc-txt').value.trim(); if (!t) { T('Escreva algo para o story.'); go.disabled = false; return } row.caption = t.slice(0, 300); row.bg = SC.bg }
  else {
    if (!SC.file) { go.disabled = false; return } T('Enviando...'); const m = await upload(SC.file); if (!m) { go.disabled = false; return }
    row.media_url = m.url; row.media_type = m.type === 'video' ? 'video' : 'image'; row.caption = ($('#sc-cap').value || '').trim().slice(0, 200) || null;
  }
  const { error } = await sb.from('stories').insert(row);
  if (error) { T(/bg/.test(error.message) ? 'Falta rodar a migração 9 no Supabase.' : 'Não publicou: ' + error.message); go.disabled = false; return }
  closeM(); T('Story publicado por ' + SC.hours + ' h.'); loadStories();
}

/* ---------- visualizador ---------- */
function viewStories(id, start) {
  const gi = ST.groups.findIndex(g => g.id === id); if (gi < 0) return openStoryCreate();
  ST.gi = gi; const g = ST.groups[gi]; ST.si = start != null ? start : id === P.id ? 0 : Math.max(0, g.items.findIndex(i => !ST.seen.has(i.id)));
  const old = document.getElementById('sv'); if (old) old.remove();
  const v = document.createElement('div'); v.id = 'sv'; v.className = 'fixed inset-0 z-[75] bg-black'; v.innerHTML = '<div id="sv-stage" class="relative w-full h-full max-w-md mx-auto overflow-hidden"></div>';
  document.body.appendChild(v); document.body.style.overflow = 'hidden'; addEventListener('keydown', stKey); ST.sheet = false; ST.paused = false; stShow();
}
const stKey = e => { if (e.key === 'Escape') stClose(); else if (e.key === 'ArrowRight') stNext(); else if (e.key === 'ArrowLeft') stPrev() };
function stClose() {
  clearInterval(ST.iv); const v = document.getElementById('sv'); if (v) v.remove(); document.body.style.overflow = ''; removeEventListener('keydown', stKey); ST.cur = null; ST.sheet = false; loadStories();
}
function stShow() {
  const g = ST.groups[ST.gi], it = g && g.items[ST.si], st = document.getElementById('sv-stage'); if (!it || !st) return stClose();
  ST.cur = it; ST.el = 0; ST.dur = it.media_type === 'video' ? 60000 : it.media_url ? 5000 : 6500; const own = g.id === P.id;
  const media = it.media_type === 'video' ? `<video id="sv-v" src="${E(it.media_url)}" playsinline autoplay class="max-w-full max-h-full"></video>` : it.media_url ? `<img src="${E(it.media_url)}" class="max-w-full max-h-full object-contain" alt="">` :
    `<div class="w-full h-full grid place-items-center p-8 text-center" style="background:${BGS[it.bg] || BGS.b1}"><p class="text-white text-2xl font-bold leading-snug whitespace-pre-wrap break-words">${E(it.caption)}</p></div>`;
  st.innerHTML = `<div class="absolute inset-0 grid place-items-center">${media}</div><div id="sv-tap" class="absolute inset-0 z-[5]"></div>
  <div class="absolute top-0 inset-x-0 z-10 px-3 pb-6 bg-gradient-to-b from-black/60 to-transparent" style="padding-top:max(10px,env(safe-area-inset-top))">
   <div class="flex gap-1">${g.items.map((_, i) => `<div class="h-[3px] flex-1 rounded bg-white/30 overflow-hidden"><div id="sp-${i}" class="h-full bg-white" style="width:${i < ST.si ? 100 : 0}%"></div></div>`).join('')}</div>
   <div class="flex items-center gap-2 mt-3 text-white"><button class="flex items-center gap-2 min-w-0 flex-1 text-left" onclick="stClose();showProfile('${g.id}')">${av(g.au, 36)}<span class="min-w-0"><span class="block text-sm font-semibold truncate">${E(g.au.name)}</span><span class="block text-[11px] opacity-80">${ago(it.created_at)}${own ? ' · <span id="sv-left">' + ageLeft(it.expires_at) + '</span>' : ''}</span></span></button>
    ${it.media_type === 'video' ? `<button id="sv-mute" class="circ !bg-black/40 !text-white" onclick="stMute()" aria-label="Som">${ic(ST.muted ? 'mute' : 'vol', false, 18)}</button>` : ''}
    <button class="circ !bg-black/40 !text-white" onclick="stMenu()" aria-label="Mais opções">${ic('more', false, 20)}</button><button class="circ !bg-black/40 !text-white" onclick="stClose()" aria-label="Fechar">${ic('x', false, 18)}</button></div></div>
  ${it.media_url && it.caption ? `<div class="absolute inset-x-0 bottom-24 z-10 px-5 text-center text-white text-sm pointer-events-none"><span class="inline-block bg-black/45 rounded-xl px-3 py-1.5 whitespace-pre-wrap break-words">${E(it.caption)}</span></div>` : ''}
  <div id="sv-bot" class="absolute bottom-0 inset-x-0 z-10 p-3 bg-gradient-to-t from-black/60 to-transparent flex justify-center" style="padding-bottom:max(12px,env(safe-area-inset-bottom))"></div><div id="sv-sheet"></div>`;
  const tap = document.getElementById('sv-tap'); let t0 = 0;
  tap.onpointerdown = () => { t0 = Date.now(); stPause(true) };
  tap.onpointerup = e => { stPause(false); if (Date.now() - t0 < 260) { const r = tap.getBoundingClientRect(); (e.clientX - r.left) < r.width * .33 ? stPrev() : stNext() } };
  tap.onpointercancel = tap.onpointerleave = () => stPause(false);
  const v = document.getElementById('sv-v');
  if (v) { v.muted = ST.muted; v.onended = stNext; v.onloadedmetadata = () => { ST.dur = (v.duration || 60) * 1000 }; v.play().catch(() => { v.muted = true; ST.muted = true; v.play().catch(() => {}) }) }
  if (own) { stOwnBar(null); stCountViews(it.id) } else { stReactRow(ST.react[it.id] || null); stMarkSeen(it) }
  stLoop();
}
function stLoop() {
  clearInterval(ST.iv);
  ST.iv = setInterval(() => {
    if (ST.paused || !ST.cur) return; const v = document.getElementById('sv-v');
    if (ST.cur.media_type === 'video') { if (v && v.duration) stBar(v.currentTime / v.duration); return }
    ST.el += 60; stBar(ST.el / ST.dur); if (ST.el >= ST.dur) stNext();
  }, 60);
}
const stBar = f => { const b = document.getElementById('sp-' + ST.si); if (b) b.style.width = Math.min(100, f * 100) + '%' };
function stPause(p) { ST.paused = p || ST.sheet; const v = document.getElementById('sv-v'); if (v) ST.paused ? v.pause() : v.play().catch(() => {}) }
function stNext() { const g = ST.groups[ST.gi]; if (!g) return; if (ST.si < g.items.length - 1) { ST.si++; stShow() } else if (ST.gi < ST.groups.length - 1) { ST.gi++; ST.si = 0; stShow() } else stClose() }
function stPrev() { if (ST.si > 0) { ST.si--; stShow() } else if (ST.gi > 0) { ST.gi--; ST.si = 0; stShow() } else stShow() }
function stMute() { ST.muted = !ST.muted; const v = document.getElementById('sv-v'); if (v) v.muted = ST.muted; const b = document.getElementById('sv-mute'); if (b) b.innerHTML = ic(ST.muted ? 'mute' : 'vol', false, 18) }

/* ---------- visto, reações e menu ---------- */
async function stMarkSeen(it) {
  ST.seen.add(it.id);
  await sb.from('story_views').upsert({ story_id: it.id, user_id: P.id }, { onConflict: 'story_id,user_id', ignoreDuplicates: true });
  const { data } = await sb.from('story_views').select('reaction').match({ story_id: it.id, user_id: P.id }).maybeSingle();
  ST.react[it.id] = data ? data.reaction : null; if (ST.cur && ST.cur.id === it.id) stReactRow(ST.react[it.id]);
}
function stReactRow(sel) {
  const b = document.getElementById('sv-bot'); if (!b) return;
  b.innerHTML = `<div class="flex justify-center gap-3">${Object.keys(RX).map(k => `<button onclick="stReact('${k}')" class="transition ${sel === k ? 'scale-125' : 'opacity-90'}" aria-label="${RX[k][0]}">${rx(k, 34)}</button>`).join('')}</div>`;
}
async function stReact(k) {
  const it = ST.cur; if (!it) return; const nv = ST.react[it.id] === k ? null : k;
  const { error } = await sb.from('story_views').upsert({ story_id: it.id, user_id: P.id, reaction: nv }, { onConflict: 'story_id,user_id' });
  if (error) return T(/reaction|story_views/.test(error.message) ? 'Falta rodar a migração 9 no Supabase.' : 'Não reagiu: ' + error.message);
  ST.react[it.id] = nv; stReactRow(nv); if (nv) T('Reação enviada.');
}
async function stCountViews(id) {
  const { count } = await sb.from('story_views').select('*', { count: 'exact', head: true }).eq('story_id', id), b = document.getElementById('sv-bot');
  if (b && ST.cur && ST.cur.id === id) stOwnBar(count);
}
function stSheet(html) {
  ST.sheet = true; stPause(true); const s = document.getElementById('sv-sheet'); if (!s) return;
  s.className = 'absolute inset-0 z-30 bg-black/60 grid items-end'; s.onclick = e => { if (e.target === s) stSheetClose() };
  s.innerHTML = `<div class="bg-card text-ink rounded-t-2xl p-4 max-h-[70%] overflow-y-auto">${html}</div>`;
}
function stSheetClose() { ST.sheet = false; const s = document.getElementById('sv-sheet'); if (s) { s.className = ''; s.innerHTML = '' } stPause(false) }
function stMenu() {
  const g = ST.groups[ST.gi], it = ST.cur; if (!g || !it) return;
  const row = (i, l, f, d) => `<button class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-soft text-left text-sm font-medium ${d ? 'text-brand' : ''}" onclick="${f}">${ic(i, false, 18)}${l}</button>`;
  stSheet(g.id === P.id ? row('eye', 'Ver quem viu', 'stViewers()') + row('clock', 'Reduzir a duração', 'stDuration()') + row('trash', 'Apagar story', 'stAskDelete()', true) : row('user', 'Ver perfil', `stClose();showProfile('${g.id}')`) + row('flag', 'Denunciar', `stClose();reportModal({story:'${it.id}'})`, true));
}
async function stViewers() {
  const it = ST.cur; if (!it) return; stSheet('<div class="sk h-16"></div>');
  const { data, error } = await sb.from('story_views').select('reaction,viewed_at,v:profiles!user_id(id,name,handle,avatar_url)').eq('story_id', it.id).order('viewed_at', { ascending: false });
  const box = document.querySelector('#sv-sheet > div'); if (!box) return; if (error) { box.innerHTML = errH(error); return }
  box.innerHTML = `<div class="text-sm font-semibold mb-2">Visto por ${(data || []).length}</div>` + ((data || []).map(r => `<button class="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-soft text-left" onclick="stClose();showProfile('${r.v.id}')">${av(r.v, 40)}<span class="min-w-0 flex-1"><span class="block text-sm font-semibold truncate">${E(r.v.name)}</span><span class="block text-xs text-mut">@${E(r.v.handle)} · ${ago(r.viewed_at)}</span></span>${r.reaction ? rx(r.reaction, 24) : ''}</button>`).join('') || '<p class="text-sm text-mut text-center py-4">Ninguém viu ainda.</p>');
}
function stAskDelete() { stSheet('<div class="text-sm font-semibold mb-1">Apagar este story?</div><div class="text-xs text-mut mb-3">Ele some para todos e não dá para desfazer.</div><div class="flex gap-2 justify-end"><button class="btn2" onclick="stSheetClose()">Cancelar</button><button class="btn" onclick="stDelete()">Apagar</button></div>') }
async function stDelete() {
  const it = ST.cur, g = ST.groups[ST.gi]; if (!it || !g) return; stSheetClose();
  const { error } = await sb.from('stories').delete().eq('id', it.id); if (error) return T('Não apagou: ' + error.message);
  const p = stPath(it.media_url); if (p && p.startsWith(P.id + '/')) sb.storage.from('media').remove([p]).then(() => {});
  g.items.splice(ST.si, 1); T('Story apagado.');
  if (!g.items.length) { ST.groups.splice(ST.gi, 1); return stClose() }
  if (ST.si >= g.items.length) ST.si = g.items.length - 1; stShow();
}
// usado pelas notificações de reação
async function openOwnStories(id) {
  await loadStories(); const g = ST.groups.find(x => x.id === P.id), i = g ? g.items.findIndex(x => x.id === id) : -1;
  if (i < 0) return T('Esse story já expirou.'); viewStories(P.id, i);
}

/* ---------- controles do dono: quem viu, duração e apagar (sempre visíveis) ---------- */
function stOwnBar(count) {
  const b = document.getElementById('sv-bot'); if (!b) return;
  b.innerHTML = `<div class="flex flex-wrap items-center justify-center gap-2 text-white text-sm">
   <button class="flex items-center gap-1.5 bg-black/40 rounded-full px-3 py-2" onclick="stViewers()">${ic('eye', false, 17)} ${count == null ? 'Visto por' : count ? 'Visto por ' + count : 'Ninguém viu ainda'}</button>
   <button class="flex items-center gap-1.5 bg-black/40 rounded-full px-3 py-2" onclick="stDuration()">${ic('clock', false, 17)} Duração</button>
   <button class="flex items-center gap-1.5 bg-black/40 rounded-full px-3 py-2" onclick="stAskDelete()">${ic('trash', false, 17)} Apagar</button></div>`;
}
function stDuration() {
  const it = ST.cur; if (!it) return; const left = new Date(it.expires_at) - Date.now(), ops = DURS.filter(h => h * 36e5 < left - 6e4);
  stSheet(`<div class="text-sm font-semibold mb-1">Reduzir a duração</div><div class="text-xs text-mut mb-3">Faltam ${ageLeft(it.expires_at)}. Dá para encurtar, mas não para aumentar.</div>` +
    (ops.length ? `<div class="grid grid-cols-3 gap-2 mb-3">${ops.map(h => `<button class="btn2" onclick="stSetDuration(${h})">Fica ${h} h</button>`).join('')}</div>` : '<div class="text-sm text-mut mb-3">Este story já termina em breve.</div>') +
    '<button class="btn2 w-full !text-brand" onclick="stAskDelete()">Apagar agora</button>');
}
async function stSetDuration(h) {
  const it = ST.cur; if (!it) return; const nv = new Date(Date.now() + h * 36e5).toISOString();
  const { error } = await sb.from('stories').update({ expires_at: nv }).eq('id', it.id);
  if (error) return T(/reduzida|duração|policy|row-level/i.test(error.message) ? 'Falta rodar a migração 10 no Supabase.' : 'Não alterou: ' + error.message);
  it.expires_at = nv; stSheetClose(); const l = document.getElementById('sv-left'); if (l) l.textContent = ageLeft(nv); T('Pronto: o story some em ' + h + ' h.');
}
