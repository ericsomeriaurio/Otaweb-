const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = s => document.querySelector(s);
const E = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let P = null, posts = [], file = null, pollOpts = null, mode = 'in', tt, rt, st;

const T = t => { const x = $('#toast'); x.textContent = String(t).replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').trim(); x.classList.remove('hidden'); clearTimeout(tt); tt = setTimeout(() => x.classList.add('hidden'), 2800) };
const ago = d => { const m = (Date.now() - new Date(d)) / 6e4; return m < 1 ? 'agora' : m < 60 ? Math.floor(m) + ' min' : m < 1440 ? Math.floor(m / 60) + ' h' : Math.floor(m / 1440) + ' d' };
const av = (u, s = 40) => u && u.avatar_url ? `<img src="${E(u.avatar_url)}" style="width:${s}px;height:${s}px" class="rounded-full object-cover shrink-0">` :
  `<div style="width:${s}px;height:${s}px" class="rounded-full bg-brand grid place-items-center font-bold text-white shrink-0">${E((u?.name || '?')[0])}</div>`;
function modal(h) { const m = $('#modal'); m.innerHTML = `<div class="card p-5 w-full max-w-md pop">${h}</div>`; m.classList.remove('hidden') }
const closeM = () => $('#modal').classList.add('hidden');
const ask = (t, ls) => new Promise(r => {
  modal(`<h3 class="font-bold mb-3">${t}</h3>` + ls.map((l, i) => `<input id="ak${i}" placeholder="${l}" class="inp mb-2">`).join('') + `<div class="flex gap-2 justify-end mt-2"><button class="btn2" id="ac">Cancelar</button><button class="btn" id="ok">OK</button></div>`);
  $('#ac').onclick = () => { closeM(); r(null) }; $('#ok').onclick = () => { const v = ls.map((_, i) => $('#ak' + i).value.trim()); closeM(); r(v) };
});
const menu = (t, it) => { modal(`<h3 class="font-bold mb-3 text-sm">${t}</h3>` + it.map((x, i) => `<button class="btn2 w-full mb-2 !justify-start" id="mi${i}">${x[0]}</button>`).join('')); it.forEach((x, i) => $('#mi' + i).onclick = () => { closeM(); x[1]() }) };

/* ---------- UPLOAD ---------- */
async function upload(f) {
  if (f.size > 50 * 1024 * 1024) { T('Arquivo acima de 50 MB.'); return null }
  const ext = (f.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, ''),
    path = `${P.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from('media').upload(path, f, { contentType: f.type });
  if (error) { T('Falha no upload: ' + error.message); return null }
  return { url: sb.storage.from('media').getPublicUrl(path).data.publicUrl, type: f.type.startsWith('video') ? 'video' : f.type.startsWith('audio') ? 'audio' : 'image' };
}
async function dlm(url) {
  try { const b = await (await fetch(url)).blob(), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'otaweb-' + Date.now() + '.' + (b.type.split('/')[1] || 'bin'); a.click(); URL.revokeObjectURL(a.href); T('Download iniciado ⬇️') }
  catch (e) { T('Não foi possível baixar.') }
}
async function copy(t) { try { await navigator.clipboard.writeText(t); T('Copiado! 📋') } catch (e) { T('Não foi possível copiar.') } }

/* ---------- AUTH ---------- */
function authMode(m) { mode = m; $('#up-f').classList.toggle('hidden', m !== 'up'); $('#a-go').textContent = m === 'up' ? 'Criar minha conta' : 'Entrar'; $('#t-in').classList.toggle('tab-on', m === 'in'); $('#t-up').classList.toggle('tab-on', m === 'up'); $('#a-err').textContent = ''; $('#a-forgot').classList.toggle('hidden', m === 'up') }
async function doAuth() {
  const email = $('#a-email').value.trim(), password = $('#a-pass').value, err = $('#a-err'); err.textContent = ''; $('#a-go').disabled = true;
  let r;
  if (mode === 'up') {
    const name = $('#a-name').value.trim(), handle = $('#a-handle').value.trim().replace(/^@/, '').toLowerCase();
    if (name.length < 2) { err.textContent = 'Escolha um nome.'; $('#a-go').disabled = false; return }
    if (!/^[a-z0-9_]{3,20}$/.test(handle)) { err.textContent = 'Usuário: 3-20 letras minúsculas, números ou _'; $('#a-go').disabled = false; return }
    r = await sb.auth.signUp({ email, password, options: { data: { name, handle } } });
    if (!r.error && !r.data.session) { err.textContent = 'Conta criada! Confirme o e-mail e depois entre.'; $('#a-go').disabled = false; return }
  } else r = await sb.auth.signInWithPassword({ email, password });
  $('#a-go').disabled = false;
  if (r.error) err.textContent = /Database error|duplicate|unique/i.test(r.error.message) ? 'Esse @usuario ou e-mail já existe.' : /Invalid login/i.test(r.error.message) ? 'E-mail ou senha incorretos.' : r.error.message;
  else if (r.data && r.data.session) startSession(r.data.session);
}
async function boot() {
  applyTheme(); hydrate(); renderNav(); authMode('in');
  // sem await dentro do callback (evita travar o supabase-js)
  sb.auth.onAuthStateChange((ev, ses) => { setTimeout(() => ev === 'PASSWORD_RECOVERY' ? setTimeout(() => typeof recoveryForm === 'function' && recoveryForm(), 400) : startSession(ses), 0) });
}
async function startSession(ses) {
  if (!ses) { P = null; startSession.busy = false; $('#auth').classList.remove('hidden'); return }
  if ((P && P.id === ses.user.id) || startSession.busy) return;
  startSession.busy = true;
  try {
    const { data, error } = await sb.from('profiles').select('*').eq('id', ses.user.id).single();
    if (error || !data) { T('Não consegui carregar seu perfil: ' + (error ? error.message : 'perfil não encontrado')); return }
    if (typeof gateCheck === 'function' && await gateCheck(data)) return;
    P = data; $('#auth').classList.add('hidden'); go('feed'); if (typeof restrBanner === 'function') restrBanner(); live(); loadBadge(); if (typeof chatLive === 'function') chatLive(); if (typeof socialStart === 'function') socialStart(); if (typeof storiesStart === 'function') storiesStart();
    if (location.hash.startsWith('#u-')) openHandle(location.hash.slice(3));
  } finally { startSession.busy = false }
}
function live() { if (live.on) return; live.on = true;
  sb.channel('feed').on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, soon)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, soon)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, soon)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' }, soon).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, loadBadge).subscribe();
}
const soon = () => { clearTimeout(rt); rt = setTimeout(() => $('#v-feed').classList.contains('hidden') ? 0 : refresh(), 400) };

/* ---------- NAV ---------- */
const VIEWS = ['feed', 'reels', 'groups', 'notif', 'menu', 'msgs', 'other'];
const NAV = [['feed', 'home', 'Início'], ['reels', 'film', 'Reels'], ['groups', 'users', 'Guildas'], ['create', 'plus', 'Criar'], ['notif', 'bell', 'Avisos'], ['menu', 'menu', 'Menu']];
function renderNav() {
  const badge = '<b class="badge b-n hidden"></b>';
  $('#nav-bot').innerHTML = NAV.map(([k, i, l]) => k === 'create' ? `<button class="grid place-items-center py-1.5" onclick="openSheet()" aria-label="Criar"><span class="w-12 h-9 rounded-xl bg-brand text-white grid place-items-center">${ic('plus', false, 22)}</span></button>` : `<button data-nav="${k}" class="bn" onclick="go('${k}')"><span class="relative">${ic(i, false, 23)}${k === 'notif' ? badge : ''}</span>${l}</button>`).join('');
  $('#nav-top').innerHTML = NAV.map(([k, i, l]) => k === 'create' ? `<button class="grid place-items-center w-16" onclick="openSheet()" aria-label="Criar"><span class="w-11 h-9 rounded-lg bg-brand text-white grid place-items-center">${ic('plus', false, 20)}</span></button>` : `<button data-nav="${k}" class="tn" title="${l}" onclick="go('${k}')"><span class="relative">${ic(i, false, 24)}${k === 'notif' ? badge : ''}</span></button>`).join('');
}
function go(v) {
  if (v === 'create') return openSheet();
  VIEWS.forEach(x => $('#v-' + x).classList.toggle('hidden', x !== v));
  document.querySelectorAll('[data-nav]').forEach(e => e.classList.toggle('tab-on', e.dataset.nav === v));
  paintMe(); $('#main').scrollTop = 0;
  const f = { feed: () => { loadFeed(); if (typeof loadStories === 'function') loadStories() }, reels: loadReels, notif: loadNotifs, menu: renderMenu,
    groups: () => soonV('groups', 'users', 'Guildas', 'Comunidades por anime, jogo ou tema, com nome único em toda a rede. Este módulo está em desenvolvimento.'),
    msgs: openMsgs }[v];
  if (f) f();
}
function soonV(v, i, t, d) { $('#v-' + v).innerHTML = `<div class="max-w-md mx-auto p-6 pt-16 text-center space-y-3"><div class="w-16 h-16 mx-auto rounded-full bg-soft text-brand grid place-items-center">${ic(i, false, 30)}</div><h2 class="font-bold text-xl">${t}</h2><p class="text-sm text-mut">${d}</p></div>` }
async function refresh() {
  if (!$('#v-feed').classList.contains('hidden')) await loadFeed();
  else if (!$('#v-reels').classList.contains('hidden')) await loadReels();
  else if (!$('#v-other').classList.contains('hidden')) { const q = $('#q').value.trim(); q ? await search(q) : (window.reloadOther ? await window.reloadOther() : await showProfile(window.lastProfile)) }
}
function toggleSearch() { const b = $('#sbar'); b.classList.toggle('hidden'); if (!b.classList.contains('hidden')) $('#q').focus(); else { $('#q').value = ''; go('feed') } }
/* tema claro/escuro */
function applyTheme() { const t = localStorage.getItem('ow-theme') || 'auto'; document.documentElement.classList.toggle('dark', t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches)) }
function setTheme(t) { localStorage.setItem('ow-theme', t); applyTheme(); renderMenu() }
/* notificações */
async function loadBadge() { const { count } = await sb.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', P.id).eq('read', false); document.querySelectorAll('.b-n').forEach(b => { b.textContent = count > 9 ? '9+' : count; b.classList.toggle('hidden', !count) }) }
/* reels */
async function loadReels() {
  const { data } = await sb.from('posts').select(SEL).eq('media_type', 'video').order('created_at', { ascending: false }).limit(20); posts = await prep(data);
  $('#v-reels').innerHTML = `<div id="rl" class="h-full overflow-y-scroll snap-y snap-mandatory bg-black md:max-w-sm md:mx-auto">` + (posts.map(reelH).join('') || '<div class="h-full grid place-items-center text-center text-sm text-white/70 p-8">Nenhum reel ainda.<br>Publique um vídeo e ele aparece aqui.</div>') + '</div>';
  const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause()), { threshold: .7 }); document.querySelectorAll('#rl video').forEach(v => io.observe(v));
}
function reelH(p) {
  const mine = p.likes.find(l => l.user_id === P.id);
  return `<div class="snap-start h-full relative grid place-items-center"><video src="${E(p.media_url)}" loop playsinline muted class="h-full w-full object-contain" onclick="this.muted=false;this.paused?this.play():this.pause()"></video>
  <div class="absolute bottom-5 left-4 right-20 text-white pointer-events-none"><button class="pointer-events-auto flex items-center gap-2 font-semibold text-sm" onclick="showProfile('${p.author.id}')">${av(p.author, 32)}@${E(p.author.handle)}</button><div class="text-sm opacity-90">${linkify(p.body)}</div></div>
  <div class="absolute bottom-6 right-3 flex flex-col gap-4 text-white items-center text-xs">
   ${reelBtn(p)}
   <button onclick="share('${p.id}')">${ic('share', false, 26)}</button><button onclick="dlm('${E(p.media_url)}')">${ic('download', false, 26)}</button></div></div>`;
}

/* ---------- FEED ---------- */
const SEL = '*, au:profiles!author(id,handle,name,avatar_url), likes(user_id,reaction), comments(count), saves(user_id), poll_options!post_id(id,label,poll_votes!option_id(user_id))';
async function prep(rows) {
  rows = rows || [];
  rows.forEach(r => { r.author = r.au || { id: '', handle: 'otaku', name: 'Otaku' } });
  const ids = [...new Set(rows.map(r => r.repost_of).filter(Boolean))];
  if (ids.length) {
    const { data } = await sb.from('posts').select('id,body,media_url,media_type,au:profiles!author(id,handle,name)').in('id', ids), m = {};
    (data || []).forEach(o => m[o.id] = { ...o, author: o.au || { handle: 'otaku' } });
    rows.forEach(r => { r.orig = m[r.repost_of] || null });
  }
  return rows;
}
function mk(h) { const t = document.createElement('template'); t.innerHTML = h.trim(); const n = t.content.firstElementChild; n.dataset.h = h; return n }
function carry(o, n, id) { const c = o.querySelector('#c-' + id), nc = n.querySelector('#c-' + id); if (c && nc && !c.classList.contains('hidden')) { nc.innerHTML = c.innerHTML; nc.classList.remove('hidden') } }
function paint(el, list) {
  const old = new Map([...el.children].filter(c => c.tagName === 'ARTICLE').map(c => [c.id, c])), first = old.size === 0, out = [];
  list.forEach(p => {
    let h; try { h = postH(p) } catch (e) { console.error(e); return }
    const o = old.get('p-' + p.id);
    if (o && o.dataset.h === h) out.push(o); else { const n = mk(h); if (first) n.classList.add('slide'); if (o) carry(o, n, p.id); out.push(n) }
  });
  el.replaceChildren(...out);
}
function repaintPost(p) {
  const o = document.getElementById('p-' + p.id); if (!o) return; let h; try { h = postH(p) } catch (e) { return }
  if (o.dataset.h !== h) { const n = mk(h); carry(o, n, p.id); o.replaceWith(n) }
}
const errH = e => `<p class="text-center text-xs text-brand py-8 px-4 break-words">Erro: ${E(e.message || e)}</p>`;
const safe = list => list.map(p => { try { return postH(p) } catch (e) { console.error(e); return '' } }).join('');
async function loadFeed() {
  try {
    const { data, error } = await sb.from('posts').select(SEL).order('created_at', { ascending: false }).limit(40);
    if (error) { $('#posts').innerHTML = errH(error); return }
    posts = await prep(data);
    if (!posts.length) $('#posts').innerHTML = '<p class="text-center text-sm text-mut py-10">Nenhum post ainda. Seja o primeiro a postar!</p>'; else paint($('#posts'), posts);
  } catch (e) { $('#posts').innerHTML = errH(e) }
}
function mediaH(url, type, c = 'rounded-xl w-full max-h-[28rem] bg-black') {
  if (!url) return ''; const u = E(url);
  return type === 'video' ? `<video src="${u}" controls playsinline preload="metadata" class="${c}"></video>` : type === 'audio' ? `<audio src="${u}" controls class="w-full"></audio>` : `<img src="${u}" loading="lazy" class="${c} object-contain">`;
}
/* reações */
const RX = { like: ['Curtir', '#2f7de1'], love: ['Amei', '#e0245e'], haha: ['Haha', '#f2a516'], wow: ['Uau', '#f2a516'], sad: ['Triste', '#f2a516'], angry: ['Grr', '#e2571d'] };
const FACE = {
  like: '<path fill="#fff" d="M8 11h1.8v7H8zm2.8 0 2.4-4.6a1.4 1.4 0 0 1 1.6 1.7L14.3 10H17a1 1 0 0 1 1 1.2l-.9 4.8a1.6 1.6 0 0 1-1.6 1.2h-4.7z"/>',
  love: '<path fill="#fff" d="M12 17.5s-4.8-3-4.8-6.2a2.6 2.6 0 0 1 4.8-1.4 2.6 2.6 0 0 1 4.8 1.4c0 3.2-4.8 6.2-4.8 6.2z"/>',
  haha: '<path fill="none" stroke="#5a3a00" stroke-width="1.6" stroke-linecap="round" d="M7.3 10.5q1.2-1.6 2.4 0M14.3 10.5q1.2-1.6 2.4 0"/><path fill="#5a3a00" d="M7.5 13h9a4.5 4.2 0 0 1-9 0z"/>',
  wow: '<circle cx="8.8" cy="10" r="1.2" fill="#5a3a00"/><circle cx="15.2" cy="10" r="1.2" fill="#5a3a00"/><ellipse cx="12" cy="15.4" rx="2" ry="2.6" fill="#5a3a00"/>',
  sad: '<circle cx="8.8" cy="10" r="1.2" fill="#5a3a00"/><circle cx="15.2" cy="10" r="1.2" fill="#5a3a00"/><path fill="none" stroke="#5a3a00" stroke-width="1.6" stroke-linecap="round" d="M8.5 16.5q3.5-3 7 0"/>',
  angry: '<path fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" d="M7 8.5l3.5 1.6M17 8.5l-3.5 1.6M9 16.2q3-2.6 6 0"/>'
};
const rx = (t, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" class="shrink-0"><circle cx="12" cy="12" r="11" fill="${RX[t][1]}"/>${FACE[t]}</svg>`;
let lpT;
const lp = el => { lpT = setTimeout(() => { el.classList.add('open'); el.dataset.lp = 1 }, 450) }, lpEnd = () => clearTimeout(lpT);
function mainReact(b, id, has, def = 'like') { const w = b.closest('.rwrap'); if (w.dataset.lp) { delete w.dataset.lp; return } react(id, has ? null : def) }
document.addEventListener('click', e => { if (!e.target.closest('.rwrap')) document.querySelectorAll('.rwrap.open').forEach(x => x.classList.remove('open')) });
async function react(id, type) {
  const p = posts.find(x => x.id === id); if (!p) return;
  const mine = p.likes.find(l => l.user_id === P.id), remove = !type || (mine && mine.reaction === type);
  p.likes = p.likes.filter(l => l.user_id !== P.id); if (!remove) p.likes.push({ user_id: P.id, reaction: type });
  const rb = document.getElementById('rb-' + id); if (rb) rb.outerHTML = reelBtn(p); else repaintPost(p);
  const { error } = remove ? await sb.from('likes').delete().match({ post_id: id, user_id: P.id }) : await sb.from('likes').upsert({ post_id: id, user_id: P.id, reaction: type }, { onConflict: 'post_id,user_id' });
  if (error) { T('Não salvou a reação: ' + error.message); refresh() }
}
function reelBtn(p) {
  const mine = p.likes.find(l => l.user_id === P.id), mt = mine && (mine.reaction || 'like');
  return `<div id="rb-${p.id}" class="rwrap relative" oncontextmenu="return false" ontouchstart="lp(this)" ontouchend="lpEnd()" ontouchmove="lpEnd()"><div class="rpick" style="left:auto;right:0">${Object.keys(RX).map(k => `<button onclick="react('${p.id}','${k}')" title="${RX[k][0]}">${rx(k, 32)}</button>`).join('')}</div>
  <button onclick="mainReact(this,'${p.id}',${!!mine},'love')" class="act !flex-col !gap-1 !p-1 !text-white" aria-label="Reagir">${mine ? rx(mt, 30) : ic('heart', false, 30)}<span class="text-xs">${p.likes.length}</span></button></div>`;
}
function postH(p) {
  const a = p.author, mine = p.likes.find(l => l.user_id === P.id), mt = mine && (mine.reaction || 'like'), nc = p.comments[0]?.count || 0, rc = p.likes.length,
    types = [...new Set(p.likes.map(l => l.reaction || 'like'))].slice(0, 3), tot = p.poll_options.reduce((n, o) => n + o.poll_votes.length, 0);
  const poll = p.poll_options.length ? `<div class="space-y-1.5 px-4 pb-3">${p.poll_question ? `<div class="text-sm font-semibold">${E(p.poll_question)}</div>` : ''}${p.poll_options.map(o => {
    const n = o.poll_votes.length, pc = tot ? Math.round(n * 100 / tot) : 0, me = o.poll_votes.some(v => v.user_id === P.id);
    return `<button onclick="vote('${p.id}','${o.id}')" class="relative w-full text-left rounded-lg overflow-hidden bg-soft px-3 py-2.5 text-sm ${me ? 'ring-1 ring-brand' : ''}"><div class="absolute inset-y-0 left-0 bg-brand/25 transition-all duration-500" style="width:${pc}%"></div><span class="relative">${E(o.label)}</span><span class="relative float-right text-mut">${pc}%</span></button>`
  }).join('')}<div class="text-xs text-mut">${tot} voto${tot === 1 ? '' : 's'}</div></div>` : '';
  const o = p.orig ? `<div class="mx-4 mb-3 border border-line rounded-lg p-3 space-y-2 text-sm"><button class="text-xs font-semibold text-mut hover:underline" onclick="showProfile('${p.orig.author.id}')">${ic('repeat', false, 13)} ${E(p.orig.author.name || '')} @${E(p.orig.author.handle)}</button><div class="whitespace-pre-wrap break-words">${linkify(p.orig.body)}</div>${mediaH(p.orig.media_url, p.orig.media_type, 'rounded-lg max-h-72')}</div>` : '';
  const sum = rc || nc ? `<div class="flex items-center justify-between px-4 py-2 text-xs text-mut">${rc ? `<button class="flex items-center gap-1.5 hover:underline" onclick="showReactors('post','${p.id}')"><span class="flex -space-x-1">${types.map(t => `<span class="rounded-full ring-2 ring-card">${rx(t, 18)}</span>`).join('')}</span>${rc} reaç${rc > 1 ? 'ões' : 'ão'}</button>` : '<span></span>'}${nc ? `<button class="hover:underline" onclick="toggleC('${p.id}')">${nc} comentário${nc > 1 ? 's' : ''}</button>` : ''}</div>` : '';
  return `<article class="card overflow-hidden" id="p-${p.id}">
  <div class="flex items-center gap-3 px-4 pt-3 pb-2"><div class="cursor-pointer flex items-center gap-3 flex-1 min-w-0" onclick="showProfile('${a.id}')">${av(a, 42)}<div class="min-w-0"><div class="text-sm font-semibold truncate">${E(a.name)}</div><div class="text-xs text-mut">@${E(a.handle)} · ${ago(p.created_at)}${p.edited_at ? ' · editado' : ''}</div></div></div>
   <button class="circ !w-9 !h-9 !bg-transparent" onclick="postMenu('${p.id}')" aria-label="Mais opções">${ic('more', false, 20)}</button></div>
  ${p.body ? `<p class="px-4 pb-3 text-[15px] leading-relaxed whitespace-pre-wrap break-words">${linkify(p.body)}</p>` : ''}${p.media_url ? `<div class="bg-black">${mediaH(p.media_url, p.media_type, 'w-full max-h-[32rem]')}</div>` : ''}${o}${poll}${sum}
  <div class="grid grid-cols-3 gap-1 px-2 py-1 border-t border-line">
   <div class="rwrap relative" oncontextmenu="return false" ontouchstart="lp(this)" ontouchend="lpEnd()" ontouchmove="lpEnd()"><div class="rpick">${Object.keys(RX).map(k => `<button onclick="react('${p.id}','${k}')" title="${RX[k][0]}">${rx(k, 32)}</button>`).join('')}</div>
    <button class="act w-full ${mine ? 'hb' : ''}" style="${mine ? 'color:' + RX[mt][1] : ''}" onclick="mainReact(this,'${p.id}',${!!mine})">${mine ? rx(mt, 20) : ic('like', false, 20)}${mine ? RX[mt][0] : 'Curtir'}</button></div>
   <button class="act" onclick="toggleC('${p.id}')">${ic('msgc', false, 19)}Comentar</button>
   <button class="act" onclick="share('${p.id}')">${ic('share', false, 19)}Compartilhar</button></div>
  </article>`;
}
function postMenu(id) {
  const p = posts.find(x => x.id === id), saved = p.saves.some(x => x.user_id === P.id),
    it = [[ic('bookmark') + (saved ? ' Remover dos salvos' : ' Salvar publicação'), () => save(id, saved)], [ic('repeat') + ' Repostar na rede', () => repost(id)]];
  if (p.media_url) it.push([ic('download') + ' Baixar mídia', () => dlm(p.media_url)]);
  if (p.author.id === P.id) it.push([ic('edit') + ' Editar publicação', () => editPost(id)]);
  if (p.author.id === P.id) it.push([ic('trash') + ' Apagar publicação', async () => { await sb.from('posts').delete().eq('id', id); T('Publicação apagada.'); refresh() }]);
  else it.push([ic('flag') + ' Denunciar', () => reportModal({ post: id })]);
  menu('Opções da publicação', it);
}
async function repost(id) { const v = await ask('Repostar na rede', ['Comentário (opcional)']); if (!v) return; await sb.from('posts').insert({ author: P.id, body: v[0], repost_of: id }); T('Repostado! 🔁'); refresh() }
async function vote(pid, oid) { const { error } = await sb.from('poll_votes').upsert({ post_id: pid, user_id: P.id, option_id: oid }, { onConflict: 'post_id,user_id' }); if (error) T('Erro ao votar.'); refresh() }
function share(id) {
  const p = posts.find(x => x.id === id), url = location.href.split('#')[0], txt = (p.body || 'Veja no OtaWeb') + ' — @' + p.author.handle;
  menu('Compartilhar', [[ic('link') + ' Copiar link', () => copy(url)], [ic('share') + ' Compartilhar fora da rede', async () => { try { await navigator.share({ title: 'OtaWeb', text: txt, url }) } catch (e) { copy(txt + ' ' + url) } }], [ic('repeat') + ' Repostar na rede', () => repost(id)]]);
}

/* ---------- PUBLICAR ---------- */
function pick(f) { if (!f) return; file = f; prevH() }
function prevH() { $('#prev').innerHTML = file ? `<div class="flex items-center gap-2 p-2 rounded-lg bg-soft">${ic('clip', false, 15)}<span class="truncate flex-1">${E(file.name)}</span><button onclick="file=null;prevH()" class="text-mut" aria-label="Remover">${ic('x', false, 15)}</button></div>` : '' }
function openSheet() {
  const o = [['text', 'type', 'Publicação de texto', 'Compartilhe uma ideia'], ['photo', 'image', 'Foto', 'Envie uma imagem'], ['video', 'video', 'Vídeo', 'Também aparece em Reels'], ['poll', 'chart', 'Enquete', 'Pergunte à comunidade'], ['story', 'zap', 'Story', 'Some sozinho no tempo que você escolher']];
  modal(`<div class="flex items-center justify-between mb-2"><h3 class="font-bold text-lg">Criar</h3><button class="circ" onclick="closeM()" aria-label="Fechar">${ic('x', false, 18)}</button></div>` +
    o.map(([k, i, t, d]) => `<button onclick="${k === 'story' ? 'openStoryCreate()' : `openCreate('${k}')`}" class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-soft text-left"><span class="w-10 h-10 rounded-full bg-soft text-brand grid place-items-center">${ic(i, false, 20)}</span><span><span class="block text-sm font-semibold">${t}</span><span class="block text-xs text-mut">${d}</span></span></button>`).join(''));
}
function openCreate(kind) {
  file = null;
  modal(`<div class="flex items-center justify-between mb-3"><h3 class="font-bold text-lg">Nova publicação</h3><button class="circ" onclick="closeM()" aria-label="Fechar">${ic('x', false, 18)}</button></div>
  <div class="flex items-center gap-3 mb-3">${av(P, 40)}<div class="text-sm font-semibold">${E(P.name)}</div></div>
  <textarea id="np" rows="4" class="inp !text-base" placeholder="No que você está pensando?" maxlength="2000"></textarea>
  <div id="pollbox" class="hidden mt-2 space-y-2"><input id="pq" class="inp" placeholder="Pergunta da enquete" maxlength="120">${[0, 1, 2, 3].map(i => `<input id="po${i}" class="inp" placeholder="Opção ${i + 1}${i > 1 ? ' (opcional)' : ''}" maxlength="60">`).join('')}</div>
  <div id="prev" class="text-xs mt-2"></div>
  <div class="flex items-center gap-1 my-3 px-2 py-1 border border-line rounded-lg"><span class="text-sm font-semibold flex-1">Adicionar</span>
   <label class="ic cursor-pointer text-brand" title="Foto">${ic('image', false, 22)}<input id="f-photo" type="file" accept="image/*" class="hidden" onchange="pick(this.files[0])"></label>
   <label class="ic cursor-pointer text-brand" title="Vídeo">${ic('video', false, 22)}<input id="f-video" type="file" accept="video/*" class="hidden" onchange="pick(this.files[0])"></label>
   <label class="ic cursor-pointer text-brand" title="Áudio">${ic('mic', false, 22)}<input type="file" accept="audio/*" class="hidden" onchange="pick(this.files[0])"></label>
   <button class="ic text-brand" title="Enquete" onclick="$('#pollbox').classList.toggle('hidden')">${ic('chart', false, 22)}</button></div>
  <button id="pub" class="btn w-full !py-3" onclick="publish()">Publicar</button>`);
  if (kind === 'photo' || kind === 'video') $('#f-' + kind).click();
  if (kind === 'poll') $('#pollbox').classList.remove('hidden');
}
async function publish() {
  if (typeof restrOk === 'function' && !restrOk('posts')) return;
  const body = $('#np').value.trim(), pq = $('#pollbox').classList.contains('hidden') ? '' : $('#pq').value.trim(), po = [0, 1, 2, 3].map(i => $('#po' + i).value.trim()).filter(Boolean), poll = pq && po.length >= 2;
  if (!body && !file && !poll) return T('Escreva algo, anexe uma mídia ou crie uma enquete.');
  $('#pub').disabled = true; let m = null; if (file) { T('Enviando mídia...'); m = await upload(file); if (!m) { $('#pub').disabled = false; return } }
  const { data, error } = await sb.from('posts').insert({ author: P.id, body, media_url: m?.url, media_type: m?.type, poll_question: poll ? pq : null }).select().single();
  if (error) { T('Erro: ' + error.message); $('#pub').disabled = false; return }
  if (poll) await sb.from('poll_options').insert(po.map(label => ({ post_id: data.id, label })));
  file = null; closeM(); T('Publicado!'); go('feed');
}

/* ---------- PERFIL ---------- */
async function openHandle(h) { const { data } = await sb.from('profiles').select('id').eq('handle', h).maybeSingle(); if (data) showProfile(data.id) }
async function showProfile(id) { try { await _showProfile(id) } catch (e) { go('other'); $('#v-other').innerHTML = errH(e) } }
async function _showProfile(id) { window.lastProfile = id; window.reloadOther = null;
  go('other'); const [{ data: u }, { count: seg }, { count: sing }, { data: f }, { data: ps }] = await Promise.all([
    sb.from('profiles').select('*').eq('id', id).single(), sb.from('follows').select('*', { count: 'exact', head: true }).eq('followee', id),
    sb.from('follows').select('*', { count: 'exact', head: true }).eq('follower', id), sb.from('follows').select('follower').match({ follower: P.id, followee: id }),
    sb.from('posts').select(SEL).eq('author', id).order('created_at', { ascending: false }).limit(30)]);
  if (!u) { $('#v-other').innerHTML = '<p class="text-center text-sm text-mut py-10">Perfil não encontrado.</p>'; return } posts = await prep(ps); const mine = id === P.id, link = location.href.split('#')[0] + '#u-' + u.handle, fl = f && f.length;
  $('#v-other').classList.remove('hidden'); $('#v-feed').classList.add('hidden');
  $('#v-other').innerHTML = `<div class="card p-5 text-center space-y-2 pop"><div class="flex justify-center"><div class="ring"><div class="bg-card rounded-full p-1">${av(u, 92)}</div></div></div>
  <div class="text-lg font-bold">${E(u.name)}</div><div class="text-xs text-brand">@${E(u.handle)}</div><p class="text-sm text-mut">${E(u.bio || '')}</p>${u.fav_anime ? `<div class="text-xs text-brand">${ic('star', true, 13)} ${E(u.fav_anime)}</div>` : ''}
  <div class="flex justify-center gap-6 text-xs text-mut"><span><b>${posts.length}</b> posts</span><span><b>${seg || 0}</b> seguidores</span><span><b>${sing || 0}</b> seguindo</span></div>
  <div class="text-[11px] text-mut break-all">${E(link)}</div>
  <div class="flex gap-2 justify-center flex-wrap"><button class="btn2" onclick="copy('${E(link)}')">${ic('link', false, 15)} Copiar link</button>
  ${mine ? `<label class="btn2 cursor-pointer">${ic('camera', false, 15)} Foto<input type="file" accept="image/*" class="hidden" onchange="setAv(this.files[0])"></label><button class="btn2" onclick="editProfile()">${ic('edit', false, 15)} Editar</button>` : `<button class="btn" onclick="follow('${id}',${!!fl})">${fl ? 'Seguindo' : 'Seguir'}</button><button class="btn2" onclick="startDM('${id}')">${ic('msgc', false, 15)} Mensagem</button>`}</div></div>
  <div class="space-y-3">${safe(posts) || '<p class="text-center text-xs text-mut py-6">Sem posts ainda.</p>'}</div>`;
}
async function setAv(f) { if (!f) return; T('Enviando foto...'); const m = await upload(f); if (!m) return; const { error } = await sb.from('profiles').update({ avatar_url: m.url }).eq('id', P.id); if (error) return T('Não salvou a foto: ' + error.message); P.avatar_url = m.url; paintMe(); T('Foto atualizada!'); showProfile(P.id) }
async function editProfile() { const v = await ask('Editar perfil', ['Nome (vazio = manter)', 'Bio', 'Anime favorito']); if (!v) return; const u = {}; if (v[0]) u.name = v[0]; if (v[1]) u.bio = v[1]; if (v[2]) u.fav_anime = v[2]; const { error } = await sb.from('profiles').update(u).eq('id', P.id); if (error) return T('Não salvou: ' + error.message); Object.assign(P, u); paintMe(); showProfile(P.id) }
async function follow(id, on) { on ? await sb.from('follows').delete().match({ follower: P.id, followee: id }) : await sb.from('follows').insert({ follower: P.id, followee: id }); showProfile(id) }

/* ---------- BUSCA ---------- */
function debSearch(q) { clearTimeout(st); st = setTimeout(() => search(q.trim()), 350) }
async function search(q) { try { await _search(q) } catch (e) { $('#v-other').innerHTML = errH(e) } }
async function _search(q) {
  if (!q) return go('feed'); go('other'); $('#v-feed').classList.add('hidden'); $('#v-other').classList.remove('hidden'); const s = q.replace(/[%,()]/g, ' ');
  const [{ data: u }, { data: ps, error: pe }] = await Promise.all([sb.from('profiles').select('id,name,handle,avatar_url').or(`name.ilike.%${s}%,handle.ilike.%${s}%`).limit(10), sb.from('posts').select(SEL).ilike('body', `%${s}%`).order('created_at', { ascending: false }).limit(20)]);
  posts = await prep(ps);
  $('#v-other').innerHTML = `<h3 class="text-sm font-bold text-brand">Pessoas</h3>` + ((u || []).map(x => `<button onclick="showProfile('${x.id}')" class="card w-full flex items-center gap-3 p-3 text-left">${av(x)}<div><div class="text-sm font-bold">${E(x.name)}</div><div class="text-[11px] text-mut">@${E(x.handle)}</div></div></button>`).join('') || '<p class="text-xs text-mut">Ninguém encontrado.</p>') +
    `<h3 class="text-sm font-bold text-brand">Publicações</h3>` + (pe ? errH(pe) : (safe(posts) || '<p class="text-xs text-mut">Nada encontrado.</p>'));
}
boot();

/* ---------- VISUAL: cartão do usuário e sugestões ---------- */
function paintMe() {
  if (!P) return; { const a = $('#me-av'), h = av(P, 42); if (a.dataset.h !== h) { a.innerHTML = h; a.dataset.h = h } }
  ($('#me-card') || {}).innerHTML = `${av(P, 38)}<div class="min-w-0"><div class="text-sm font-semibold truncate">${E(P.name)}</div><div class="text-[11px] text-mut truncate">@${E(P.handle)}</div></div>`;
}
async function loadSuggest() {
  const { data: f } = await sb.from('follows').select('followee').eq('follower', P.id), seg = (f || []).map(x => x.followee);
  const { data } = await sb.from('profiles').select('id,name,handle,avatar_url').neq('id', P.id).order('created_at', { ascending: false }).limit(12);
  const list = (data || []).filter(u => !seg.includes(u.id)).slice(0, 5);
  $('#sugg').innerHTML = list.map(u => `<div class="flex items-center gap-3"><div class="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onclick="showProfile('${u.id}')">${av(u, 38)}<div class="min-w-0"><div class="text-sm font-medium truncate">${E(u.name)}</div><div class="text-[11px] text-mut truncate">@${E(u.handle)}</div></div></div><button class="btn2 !py-1 !px-3 !text-xs" onclick="quickFollow('${u.id}',this)">Seguir</button></div>`).join('') || '<p class="text-xs text-mut">Convide amigos para o OtaWeb!</p>';
}
async function quickFollow(id, b) { await sb.from('follows').insert({ follower: P.id, followee: id }); b.textContent = 'Seguindo'; b.disabled = true }
