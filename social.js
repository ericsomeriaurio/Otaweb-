/* OtaWeb · social: comentários (respostas e reações), lista de reações, edição, presença */
const SH = { post: null, rows: [], reply: null, open: false };
const goProfile = id => { closeSheet(); closeM(); showProfile(id) };
function sheet(h) { const s = $('#sheet'); s.innerHTML = h; s.classList.remove('hidden'); SH.open = true }
function closeSheet() { $('#sheet').classList.add('hidden'); SH.open = false; SH.post = null }
const askText = (t, v) => new Promise(r => {
  modal(`<h3 class="font-bold mb-3">${t}</h3><textarea id="atx" rows="4" class="inp !text-base" maxlength="2000">${E(v)}</textarea><div class="flex gap-2 justify-end mt-3"><button class="btn2" id="ac">Cancelar</button><button class="btn" id="ok">Salvar</button></div>`);
  const x = $('#atx'); x.focus(); x.setSelectionRange(x.value.length, x.value.length);
  $('#ac').onclick = () => { closeM(); r(null) }; $('#ok').onclick = () => { const v2 = x.value.trim(); closeM(); r(v2) };
});

/* ---------- editar post ---------- */
async function editPost(id) {
  const p = posts.find(x => x.id === id); if (!p) return; const v = await askText('Editar publicação', p.body || ''); if (v === null) return;
  const at = new Date().toISOString(), { error } = await sb.from('posts').update({ body: v, edited_at: at }).eq('id', id);
  if (error) return T('Não salvou: ' + error.message); p.body = v; p.edited_at = at; repaintPost(p); T('Publicação editada.');
}

/* ---------- comentários ---------- */
function toggleC(id) { openComments(id) }
async function openComments(pid) {
  SH.post = pid; SH.reply = null;
  sheet(`<div class="bg-card w-full max-w-xl h-[88vh] md:h-[80vh] rounded-t-2xl md:rounded-2xl flex flex-col pop overflow-hidden">
   <div class="shrink-0 flex items-center justify-between px-4 py-3 border-b border-line"><h3 class="font-bold">Comentários</h3><button class="circ" onclick="closeSheet()" aria-label="Fechar">${ic('x', false, 18)}</button></div>
   <div id="clist" class="flex-1 overflow-y-auto p-3 space-y-4"><div class="sk h-14"></div><div class="sk h-14"></div></div>
   <div id="creply" class="hidden shrink-0 px-3 py-1.5 text-xs bg-soft items-center justify-between"></div>
   <div class="shrink-0 flex items-center gap-2 p-2 border-t border-line" style="padding-bottom:calc(.5rem + env(safe-area-inset-bottom,0px))">${av(P, 34)}
    <input id="cin2" class="inp !rounded-full" placeholder="Escreva um comentário" onkeydown="if(event.key==='Enter')sendComment()" autocomplete="off">
    <button class="circ !bg-brand !text-white" onclick="sendComment()" aria-label="Enviar">${ic('send', false, 18)}</button></div></div>`);
  await loadComments();
}
async function loadComments() {
  const pid = SH.post; if (!pid) return;
  const { data, error } = await sb.from('comments').select('id,body,created_at,edited_at,parent_id,au:profiles!author(id,name,handle,avatar_url),cl:comment_likes(user_id,reaction)').eq('post_id', pid).order('created_at').limit(500);
  if (error) { $('#clist').innerHTML = errH(error); return }
  if (SH.post !== pid) return; SH.rows = data || []; drawComments();
}
function drawComments() {
  const el = $('#clist'); if (!el) return;
  const top = SH.rows.filter(c => !c.parent_id), kids = {}; SH.rows.filter(c => c.parent_id).forEach(c => (kids[c.parent_id] = kids[c.parent_id] || []).push(c));
  const old = new Map([...el.children].map(x => [x.dataset.id, x])), out = [];
  top.forEach(c => {
    const h = `<div>${cmtH(c)}${(kids[c.id] || []).length ? `<div class="ml-10 mt-3 space-y-3 border-l border-line pl-3">${kids[c.id].map(cmtH).join('')}</div>` : ''}</div>`; let n = old.get(c.id);
    if (!n || n.dataset.h !== h) { const t = document.createElement('template'); t.innerHTML = h.trim(); n = t.content.firstElementChild; n.dataset.id = c.id; n.dataset.h = h }
    out.push(n);
  });
  const st = el.scrollTop; el.replaceChildren(...out);
  if (!out.length) el.innerHTML = '<p class="text-center text-sm text-mut py-12">Nenhum comentário ainda.<br>Seja o primeiro a comentar.</p>'; el.scrollTop = st;
}
function cmtH(c) {
  const a = c.au || { id: '', name: 'Otaku' }, cl = c.cl || [], mine = cl.find(l => l.user_id === P.id), mt = mine && (mine.reaction || 'like'), n = cl.length, types = [...new Set(cl.map(l => l.reaction || 'like'))].slice(0, 3);
  return `<div class="flex gap-2"><button onclick="goProfile('${a.id}')" class="shrink-0 self-start" aria-label="Ver perfil">${av(a, 34)}</button><div class="min-w-0 flex-1">
  <div class="relative inline-block max-w-full"><div class="bg-soft rounded-2xl px-3 py-2 text-sm"><button class="font-semibold text-[13px] hover:underline" onclick="goProfile('${a.id}')">${E(a.name)}</button><div class="whitespace-pre-wrap break-words">${E(c.body)}</div></div>
   ${n ? `<button onclick="showReactors('comment','${c.id}')" class="absolute -bottom-3 right-0 flex items-center bg-card border border-line rounded-full pl-0.5 pr-1.5 py-px text-[11px] shadow-sm"><span class="flex -space-x-1">${types.map(t => rx(t, 14)).join('')}</span><span class="ml-1">${n}</span></button>` : ''}</div>
  <div class="flex items-center gap-4 ${n ? 'mt-4' : 'mt-1.5'} px-2 text-xs font-semibold text-mut"><span class="font-normal">${ago(c.created_at)}${c.edited_at ? ' · editado' : ''}</span>
   <span class="rwrap relative" oncontextmenu="return false" ontouchstart="lp(this)" ontouchend="lpEnd()" ontouchmove="lpEnd()"><span class="rpick">${Object.keys(RX).map(k => `<button onclick="creact('${c.id}','${k}')" title="${RX[k][0]}">${rx(k, 30)}</button>`).join('')}</span>
    <button style="${mine ? 'color:' + RX[mt][1] : ''}" onclick="cMain(this,'${c.id}',${!!mine})">${mine ? RX[mt][0] : 'Curtir'}</button></span>
   <button onclick="replyTo('${c.id}')">Responder</button>${a.id === P.id ? `<button class="ml-auto" onclick="cmtMenu('${c.id}')" aria-label="Opções">${ic('more', false, 16)}</button>` : ''}</div></div></div>`;
}
function cMain(b, id, has) { const w = b.closest('.rwrap'); if (w.dataset.lp) { delete w.dataset.lp; return } creact(id, has ? null : 'like') }
async function creact(id, type) {
  const c = SH.rows.find(x => x.id === id); if (!c) return; c.cl = c.cl || [];
  const mine = c.cl.find(l => l.user_id === P.id), remove = !type || (mine && mine.reaction === type);
  c.cl = c.cl.filter(l => l.user_id !== P.id); if (!remove) c.cl.push({ user_id: P.id, reaction: type }); drawComments();
  const { error } = remove ? await sb.from('comment_likes').delete().match({ comment_id: id, user_id: P.id }) : await sb.from('comment_likes').upsert({ comment_id: id, user_id: P.id, reaction: type }, { onConflict: 'comment_id,user_id' });
  if (error) { T('Não salvou a reação: ' + error.message); loadComments() }
}
function replyTo(id) {
  const c = SH.rows.find(x => x.id === id); if (!c) return; SH.reply = { id: c.parent_id || c.id };
  const b = $('#creply'); b.innerHTML = `<span>Respondendo a <b>${E((c.au || {}).name || 'Otaku')}</b></span><button onclick="cancelReply()" aria-label="Cancelar">${ic('x', false, 14)}</button>`; b.classList.remove('hidden'); b.classList.add('flex'); $('#cin2').focus();
}
function cancelReply() { SH.reply = null; const b = $('#creply'); b.classList.add('hidden'); b.classList.remove('flex') }
async function sendComment() {
  const i = $('#cin2'), b = i.value.trim(); if (!b || !SH.post) return;
  const row = { post_id: SH.post, author: P.id, body: b }; if (SH.reply) row.parent_id = SH.reply.id; i.value = ''; cancelReply();
  const { error } = await sb.from('comments').insert(row); if (error) { T('Não comentou: ' + error.message); i.value = b; return }
  await loadComments(); const el = $('#clist'); if (el) el.scrollTop = el.scrollHeight; refresh();
}
function cmtMenu(id) {
  const c = SH.rows.find(x => x.id === id); if (!c) return;
  menu('Comentário', [[ic('edit') + ' Editar', async () => { const v = await askText('Editar comentário', c.body); if (!v) return; const { error } = await sb.from('comments').update({ body: v, edited_at: new Date().toISOString() }).eq('id', id); if (error) return T('Não editou: ' + error.message); loadComments() }],
    [ic('trash') + ' Apagar', async () => { const { error } = await sb.from('comments').delete().eq('id', id); if (error) return T('Não apagou: ' + error.message); loadComments(); refresh() }]]);
}

/* ---------- quem reagiu ---------- */
async function showReactors(kind, id) {
  const tb = kind === 'post' ? 'likes' : 'comment_likes', col = kind === 'post' ? 'post_id' : 'comment_id'; modal('<div class="sk h-40"></div>');
  const { data, error } = await sb.from(tb).select('reaction,u:profiles!user_id(id,name,handle,avatar_url)').eq(col, id);
  if (error) return modal(errH(error));
  window._rxRows = (data || []).filter(r => r.u).map(r => ({ ...r, reaction: r.reaction || 'like' })); rxTab('all');
}
function rxTab(t) {
  const rows = window._rxRows || [], types = [...new Set(rows.map(r => r.reaction))], list = t === 'all' ? rows : rows.filter(r => r.reaction === t);
  const tab = (k, h, n) => `<button onclick="rxTab('${k}')" class="shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border-b-2 ${t === k ? 'border-brand text-brand' : 'border-transparent text-mut'}">${h}${n}</button>`;
  modal(`<div class="flex items-center justify-between mb-2"><h3 class="font-bold text-lg">Reações</h3><button class="circ" onclick="closeM()" aria-label="Fechar">${ic('x', false, 18)}</button></div>
  <div class="flex overflow-x-auto border-b border-line mb-2">${tab('all', 'Todas ', rows.length)}${types.map(k => tab(k, rx(k, 18), rows.filter(r => r.reaction === k).length)).join('')}</div>
  <div class="max-h-80 overflow-y-auto">${list.map(r => `<button class="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-soft text-left" onclick="goProfile('${r.u.id}')"><div class="relative shrink-0">${av(r.u, 42)}<span class="absolute -bottom-1 -right-1">${rx(r.reaction, 18)}</span></div><div class="min-w-0"><div class="text-sm font-semibold truncate">${E(r.u.name)}</div><div class="text-xs text-mut">@${E(r.u.handle)}</div></div></button>`).join('') || '<p class="text-sm text-mut text-center py-6">Ninguém reagiu ainda.</p>'}</div>`);
}

/* ---------- início: comentários em tempo real e "visto por último" ---------- */
function socialStart() {
  if (socialStart.on) return; socialStart.on = true;
  sb.channel('cmts').on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => { if (SH.open) loadComments() })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'comment_likes' }, () => { if (SH.open) { clearTimeout(socialStart.t); socialStart.t = setTimeout(loadComments, 500) } }).subscribe();
  const seen = () => { if (document.visibilityState === 'visible') sb.rpc('touch_seen') };
  seen(); setInterval(seen, 60000); document.addEventListener('visibilitychange', seen);
}
