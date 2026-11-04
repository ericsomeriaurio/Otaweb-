/* OtaWeb · módulo de Mensagens (conversas privadas e grupos, tempo real) */
let PRES = new Set();
const CH = { list: [], open: null, msgs: [], votes: {}, pin: null, sel: [], users: {}, add: null, loaded: false, ch: null };
const hhmm = t => new Date(t).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
const cAv = (c, s = 46) => c.is_group ? (c.avatar_url ? `<img src="${E(c.avatar_url)}" style="width:${s}px;height:${s}px" class="rounded-full object-cover shrink-0">` : `<div style="width:${s}px;height:${s}px" class="rounded-full bg-soft text-brand grid place-items-center shrink-0">${ic('users', false, Math.round(s * .45))}</div>`) : `<div class="relative shrink-0">${av(c.other, s)}${c.other && PRES.has(c.other.id) && !(typeof BLK !== 'undefined' && (BLK.has(c.other.id) || BLK_ME.has(c.other.id))) ? '<span class="absolute bottom-0 right-0 w-3 h-3 rounded-full" style="background:#22c55e;border:2px solid rgb(var(--card))"></span>' : ''}</div>`;
const cName = c => c.is_group ? (c.name || 'Grupo') : (c.other ? c.other.name : 'Conversa');
function cPrev(m, c) {
  if (!m) return 'Nenhuma mensagem ainda';
  if (m.sys) return sysText(m);
  const me = m.sender === P.id ? 'Você: ' : (c && c.is_group ? ((c.members.find(u => u.id === m.sender) || {}).name || 'Alguém') + ': ' : '');
  const t = m.deleted_for_all ? 'Mensagem apagada' : m.body === '__heart__' ? 'Coração' : m.poll_question ? 'Enquete: ' + m.poll_question : m.lat != null ? 'Localização' : m.media_type === 'image' ? 'Foto' : m.media_type === 'video' ? 'Vídeo' : m.media_type === 'audio' ? 'Áudio' : (m.body || '');
  return me + t;
}

/* ---------- tempo real ---------- */
function chatLive() {
  if (CH.ch) return; loadUnread(); if (typeof chat2Start === 'function') chat2Start();
  CH.ch = sb.channel('chat')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, onMsg)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'message_votes' }, () => { if (CH.open) loadMsgs() })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_members' }, () => { clearTimeout(CH.t2); CH.t2 = setTimeout(loadChats, 300) })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_members' }, () => { clearTimeout(CH.t3); CH.t3 = setTimeout(refreshMarks, 250) })
    .subscribe();
  CH.pr = sb.channel('online', { config: { presence: { key: P.id } } }).on('presence', { event: 'sync' }, () => {
    const prev = PRES; PRES = new Set(Object.keys(CH.pr.presenceState()));
    prev.forEach(id => { if (!PRES.has(id)) CH.list.forEach(x => x.members.forEach(u => { if (u.id === id) u.last_seen = new Date().toISOString() })) });
    onlineUI();
  }).subscribe(async st => { if (st === 'SUBSCRIBED' && P.show_status !== false) await CH.pr.track({ t: Date.now() }) });
  document.addEventListener('visibilitychange', markRead);
}
function onMsg(e) {
  const m = e.new || {}, viewing = !$('#v-msgs').classList.contains('hidden');
  if (e.eventType === 'INSERT' && m.sender !== P.id) markDelivered();
  if (CH.open && CH.open.id === m.chat_id && viewing) loadMsgs();
  else if (e.eventType === 'INSERT' && m.sender !== P.id && !m.sys) bumpUnread(m.chat_id);
  clearTimeout(CH.t); CH.t = setTimeout(() => { if (viewing && !CH.open) loadChats() }, 300);
}

/* ---------- lista de conversas ---------- */
async function openMsgs() {
  if (CH.open) { renderConv(); loadMsgs(); return }
  if (!CH.loaded) $('#v-msgs').innerHTML = '<div class="max-w-xl mx-auto p-3 space-y-3"><div class="sk h-16"></div><div class="sk h-16"></div><div class="sk h-16"></div></div>'; else renderChatList();
  await loadChats();
}
async function loadChats() {
  const { data: mem, error } = await sb.from('chat_members').select('chat_id, chats!chat_id(id,is_group,name,avatar_url,created_by,pinned_message,created_at)').eq('user_id', P.id);
  if (error) { if (!CH.open) $('#v-msgs').innerHTML = errH(error); return }
  markDelivered(); const chats = (mem || []).map(m => m.chats).filter(Boolean), ids = chats.map(c => c.id); let mm = [], last = {};
  if (ids.length) {
    const [a, b] = await Promise.all([
      sb.from('chat_members').select('chat_id,user_id,last_read_at,last_delivered_at,role,profiles!user_id(id,name,handle,avatar_url,last_seen,show_status)').in('chat_id', ids),
      sb.from('messages').select('chat_id,sender,body,media_type,deleted_for_all,created_at,lat,poll_question,sys').in('chat_id', ids).order('created_at', { ascending: false }).limit(300)]);
    mm = a.data || []; (b.data || []).forEach(m => { if (!last[m.chat_id]) last[m.chat_id] = m });
  }
  chats.forEach(c => { c.myRead = ((mm.find(x => x.chat_id === c.id && x.user_id === P.id)) || {}).last_read_at || null; c.roles = {}; mm.filter(x => x.chat_id === c.id).forEach(x => { c.roles[x.user_id] = x.role }); c.members = mm.filter(x => x.chat_id === c.id).map(x => x.profiles).filter(Boolean); c.last = last[c.id] || null; c.marks = {}; mm.filter(x => x.chat_id === c.id).forEach(x => c.marks[x.user_id] = { r: x.last_read_at, d: x.last_delivered_at }); c.other = c.is_group ? null : (c.members.find(u => u.id !== P.id) || c.members[0]) });
  chats.sort((a, b) => new Date((b.last || b).created_at) - new Date((a.last || a).created_at));
  CH.list = chats; CH.loaded = true; await loadUnread();
  if (CH.open) { const f = chats.find(c => c.id === CH.open.id); if (f) CH.open = f; else { CH.open = null; CH.infoOpen = false; closeM(); typeChannel(false); renderChatList(); T('Você não está mais nesta conversa.') } } else renderChatList();
}
function renderChatList() {
  const un = CH.unread || {};
  $('#v-msgs').innerHTML = `<div class="max-w-xl mx-auto p-3 md:py-5 space-y-3"><div class="flex items-center justify-between px-1"><h2 class="font-bold text-xl">Mensagens</h2>
  <div class="flex gap-2"><button class="btn2 !px-3" onclick="pickUsers(false)">${ic('plus', false, 16)}Conversa</button><button class="btn2 !px-3" onclick="pickUsers(true)">${ic('users', false, 16)}Grupo</button></div></div>
  <div class="card overflow-hidden divide-y divide-line">` + (CH.list.map(c => {
    const n = un[c.id] || 0;
    return `<button class="w-full flex items-center gap-3 p-3 text-left hover:bg-soft transition ${n ? 'bg-brand/5' : ''}" onclick="openChat('${c.id}')">${cAv(c)}<div class="min-w-0 flex-1"><div class="flex justify-between gap-2"><span class="${n ? 'font-bold' : 'font-semibold'} text-sm truncate">${E(cName(c))}</span><span class="text-[11px] shrink-0 ${n ? 'text-brand font-semibold' : 'text-mut'}">${c.last ? ago(c.last.created_at) : ''}</span></div>
    <div class="flex items-center gap-2"><span class="text-xs truncate flex-1 ${n ? 'font-semibold text-ink' : 'text-mut'}">${E(cPrev(c.last, c))}</span>${n && c.is_group && (CH.unreadM || {})[c.id] ? `<span class="shrink-0 w-5 h-5 rounded-full bg-brand text-white grid place-items-center" title="Alguém respondeu ou mencionou você">${ic('at', false, 12)}</span>` : ''}${n ? `<span class="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-brand text-white text-[11px] font-bold grid place-items-center">${n > 99 ? '99+' : n}</span>` : ''}</div></div></button>`;
  }).join('') || '<p class="p-10 text-center text-sm text-mut">Nenhuma conversa ainda.<br>Toque em <b>Conversa</b> para falar com alguém.</p>') + '</div></div>';
}

/* ---------- conversa aberta ---------- */
function openChat(id) { CH.reply = null; CH.mntFor = null; CH.mntIds = []; CH.openRead = ((CH.list.find(c => c.id === id)) || {}).myRead || null; CH.open = CH.list.find(c => c.id === id); CH.msgs = []; CH.pin = null; CH.typing = null; renderConv(); typeChannel(true); loadMsgs(); if (typeof refreshBlocks === 'function') refreshBlocks() }
function closeChat() { typeChannel(false); CH.open = null; renderChatList(); loadChats() }
function renderConv() {
  const c = CH.open;
  $('#v-msgs').innerHTML = `<div class="h-full flex flex-col max-w-xl mx-auto bg-card md:border-x md:border-line">
   <div class="shrink-0 flex items-center gap-2 p-2 border-b border-line"><button class="circ !bg-transparent" onclick="closeChat()" aria-label="Voltar">${ic('back', false, 20)}</button><button class="flex items-center gap-2 min-w-0 flex-1 text-left" onclick="openInfo()"><span id="chav">${cAv(c, 38)}</span><div class="min-w-0"><div class="font-semibold text-sm truncate">${E(cName(c))}</div><div id="csub" class="text-xs text-mut">${subHTML()}</div></div></button>
    <button class="circ !bg-transparent" onclick="chatMenu()" aria-label="Mais opções">${ic('more', false, 20)}</button></div>
   <button id="pinbar" onclick="pinMenu()" class="hidden shrink-0 flex items-center gap-2 px-3 py-2 text-xs bg-soft text-left border-b border-line"></button>
   <div id="cmsgs" class="flex-1 overflow-y-auto p-3 space-y-1.5"></div>
   <div id="cattach" class="hidden shrink-0 grid grid-cols-5 gap-2 p-3 border-t border-line text-[11px] font-semibold text-center">
    <label class="btn2 !flex-col !gap-1 !px-1 cursor-pointer">${ic('image', false, 22)}Foto<input type="file" accept="image/*" class="hidden" onchange="sendFile(this.files[0]);this.value=''"></label>
    <label class="btn2 !flex-col !gap-1 !px-1 cursor-pointer">${ic('video', false, 22)}Vídeo<input type="file" accept="video/*" class="hidden" onchange="sendFile(this.files[0]);this.value=''"></label>
    <label class="btn2 !flex-col !gap-1 !px-1 cursor-pointer">${ic('mic', false, 22)}Áudio<input type="file" accept="audio/*" class="hidden" onchange="sendFile(this.files[0]);this.value=''"></label>
    <button class="btn2 !flex-col !gap-1 !px-1" onclick="sendLoc()">${ic('pin', false, 22)}Local</button>
    <button class="btn2 !flex-col !gap-1 !px-1" onclick="chatPoll()">${ic('chart', false, 22)}Enquete</button></div>
   <div id="crep" class="hidden shrink-0 px-3 py-2 text-xs bg-soft border-t border-line flex items-center gap-2"></div>
   <div class="shrink-0 flex items-center gap-2 p-2 border-t border-line"><button class="circ" onclick="$('#cattach').classList.toggle('hidden')" aria-label="Anexar">${ic('plus', false, 20)}</button>
    <input id="cin" class="inp !rounded-full" placeholder="Mensagem" oninput="cdyn()" onkeydown="if(event.key==='Enter')csend()" autocomplete="off">
    <button id="csb" class="circ !bg-brand !text-white" onclick="csend()" aria-label="Enviar">${ic('heart', true, 20)}</button></div></div>`;
  composerState();
}
function cdyn() { const t = $('#cin').value.trim(); $('#csb').innerHTML = t ? ic('send', false, 20) : ic('heart', true, 20); if (t) sendTyping() }
async function loadMsgs() {
  const c = CH.open; if (!c) return;
  const { data, error } = await sb.from('messages').select('*').eq('chat_id', c.id).order('created_at').limit(300);
  if (error) return T('Erro ao carregar mensagens: ' + error.message);
  if (!CH.open || CH.open.id !== c.id) return;
  CH.msgs = data || []; const pids = CH.msgs.filter(m => m.poll_question).map(m => m.id); CH.votes = {};
  if (pids.length) { const { data: v } = await sb.from('message_votes').select('message_id,user_id,option_idx').in('message_id', pids); (v || []).forEach(x => (CH.votes[x.message_id] = CH.votes[x.message_id] || []).push(x)) }
  await loadMR(); CH.pin = c.pinned_message ? CH.msgs.find(m => m.id === c.pinned_message) || null : null;
  drawMsgs(!CH.drawn || CH.drawn !== c.id); CH.drawn = c.id; CH.typing = null; subUI(); markRead(); if (typeof mentionBtn === 'function') mentionBtn();
}
function drawMsgs(bottom) {
  const el = $('#cmsgs'); if (!el) return;
  const near = bottom || el.scrollHeight - el.scrollTop - el.clientHeight < 150, old = new Map([...el.children].map(x => [x.dataset.id, x])), out = [];
  CH.msgs.forEach((m, i) => {
    const h = msgH(m, CH.msgs[i - 1]); let n = old.get(m.id);
    if (!n || n.dataset.h !== h) { const t = document.createElement('div'); t.innerHTML = h.trim(); n = t.firstElementChild; n.dataset.id = m.id; n.dataset.h = h; if (!bottom && old.size) n.classList.add('slide') }
    out.push(n);
  });
  el.replaceChildren(...out); if (!out.length) el.innerHTML = '<p class="text-center text-xs text-mut py-10">Diga olá!</p>';
  const pb = $('#pinbar'); pb.classList.toggle('hidden', !CH.pin); if (CH.pin) pb.innerHTML = `<span class="text-brand">${ic('bookmark', true, 14)}</span><span class="truncate">${E(cPrev(CH.pin, null))}</span>`;
  if (near) el.scrollTop = el.scrollHeight;
}
function msgH(m, prev) {
  if (m.sys) return sysH(m);
  const mine = m.sender === P.id, g = CH.open.is_group, u = CH.open.members.find(x => x.id === m.sender) || {}, name = g && !mine && (!prev || prev.sys || prev.sender !== m.sender), heart = m.body === '__heart__' && !m.deleted_for_all; let body;
  if (m.deleted_for_all) body = '<i class="text-mut">Mensagem apagada</i>';
  else if (heart) body = `<span class="text-brand">${ic('heart', true, 36)}</span>`;
  else body = (m.media_url ? mediaH(m.media_url, m.media_type, 'rounded-lg max-h-64 max-w-full') : '') + (m.lat != null ? `<a class="underline flex items-center gap-2" target="_blank" rel="noopener" href="https://www.google.com/maps?q=${m.lat},${m.lng}">${ic('pin', false, 18)}Ver localização no mapa</a>` : '') + (m.poll_question ? pollM(m) : '') + (m.body ? `<div class="whitespace-pre-wrap break-words">${E(m.body)}</div>` : '');
  return `<div class="flex ${mine ? 'justify-end' : 'justify-start'} gap-2 items-end">${g && !mine ? `<div class="w-7 shrink-0">${name ? `<button onclick="goProfile('${u.id}')">${av(u, 28)}</button>` : ''}</div>` : ''}<div class="max-w-[78%]">${name ? `<button class="text-[11px] text-mut ml-1 mb-0.5 hover:underline" onclick="goProfile('${u.id}')">${E(u.name || 'Otaku')}</button>` : ''}
  <div onclick="msgMenu('${m.id}')" class="${heart ? '' : mine ? 'bg-brand text-white' : 'bg-soft'} rounded-2xl px-3 py-2 text-sm cursor-pointer space-y-1.5 w-fit ${mine ? 'ml-auto' : ''}">${quoteH(m)}${body}</div>${rxPillH(m)}
  <div class="text-[10px] text-mut mt-0.5 px-1 flex items-center gap-1 ${mine ? 'justify-end' : ''}">${hhmm(m.created_at)}${m.edited_at && !m.deleted_for_all ? ' · editada' : ''}${mine && !m.deleted_for_all ? tick(m) : ''}</div></div></div>`;
}
function pollM(m) {
  const v = CH.votes[m.id] || [], tot = v.length;
  return `<div class="space-y-1 w-56 max-w-full"><div class="font-semibold">${E(m.poll_question)}</div>` + (m.poll_options || []).map((o, i) => {
    const n = v.filter(x => x.option_idx === i).length, pc = tot ? Math.round(n * 100 / tot) : 0, me = v.some(x => x.option_idx === i && x.user_id === P.id);
    return `<button onclick="event.stopPropagation();cvote('${m.id}',${i})" class="relative w-full text-left rounded-lg overflow-hidden bg-black/10 px-3 py-2 ${me ? 'ring-1 ring-current' : ''}"><div class="absolute inset-y-0 left-0 bg-black/20" style="width:${pc}%"></div><span class="relative">${E(o)}</span><span class="relative float-right opacity-80">${pc}%</span></button>`;
  }).join('') + `<div class="text-[11px] opacity-70">${tot} voto${tot === 1 ? '' : 's'}</div></div>`;
}

/* ---------- enviar ---------- */
async function csend(extra) {
  if (typeof restrOk === 'function' && !restrOk('messages')) return;
  const i = $('#cin'), t = i.value.trim(); if (!CH.open) return;
  const row = { chat_id: CH.open.id, sender: P.id, ...(extra || { body: t || '__heart__' }), ...(CH.reply ? { reply_to: CH.reply.id } : {}) }; replyOff();
  i.value = ''; cdyn(); $('#cattach').classList.add('hidden');
  const { data, error } = await sb.from('messages').insert(row).select().single();
  if (error) { if (error.code === '42501') { T('Não foi possível enviar esta mensagem.'); if (typeof refreshBlocks === 'function') refreshBlocks(true) } else T('Não enviou: ' + error.message); return }
  CH.msgs.push(data); drawMsgs(true);
}
async function sendFile(f) { if (!f) return; T('Enviando...'); const m = await upload(f); if (m) csend({ media_url: m.url, media_type: m.type }) }
function sendLoc() { navigator.geolocation ? navigator.geolocation.getCurrentPosition(p => csend({ lat: p.coords.latitude, lng: p.coords.longitude }), () => T('Permita o acesso à localização no navegador.')) : T('Localização indisponível neste aparelho.') }
async function chatPoll() {
  const v = await ask('Nova enquete', ['Pergunta', 'Opção 1', 'Opção 2', 'Opção 3 (opcional)']); if (!v || !v[0] || !v[1] || !v[2]) return;
  csend({ poll_question: v[0], poll_options: v.slice(1).filter(Boolean) });
}
async function cvote(id, i) { const { error } = await sb.from('message_votes').upsert({ message_id: id, user_id: P.id, option_idx: i }, { onConflict: 'message_id,user_id' }); if (error) T('Erro ao votar.'); loadMsgs() }

/* ---------- ações nas mensagens ---------- */
async function pinMsg(id) { const { error } = await sb.from('chats').update({ pinned_message: id }).eq('id', CH.open.id); if (error) return T('Não afixou: ' + error.message); CH.open.pinned_message = id; loadMsgs() }
function pinMenu() { menu('Mensagem afixada', [[ic('bookmark') + ' Desafixar', () => pinMsg(null)]]) }

/* ---------- nova conversa / grupo ---------- */
function pickUsers(group, add) {
  CH.sel = []; CH.add = add || null;
  modal(`<div class="flex items-center justify-between mb-3"><h3 class="font-bold text-lg">${add ? 'Adicionar pessoas' : group ? 'Novo grupo' : 'Nova conversa'}</h3><button class="circ" onclick="closeM()">${ic('x', false, 18)}</button></div>
  ${group && !add ? '<input id="gname" class="inp mb-2" placeholder="Nome do grupo" maxlength="40">' : ''}
  <input id="uq" class="inp mb-2" placeholder="Buscar por nome ou @usuário" oninput="uSearch(${!!group})" autocomplete="off"><div id="usel" class="flex flex-wrap gap-1.5 mb-2"></div>
  <div id="ures" class="space-y-1 max-h-64 overflow-y-auto"></div>${group ? `<button class="btn w-full mt-3" onclick="mkGroup()">${add ? 'Adicionar' : 'Criar grupo'}</button>` : ''}`);
  uSearch(group);
}
async function uSearch(group) {
  const q = ($('#uq').value || '').trim().replace(/[%,()]/g, ' ');
  let r = sb.from('profiles').select('id,name,handle,avatar_url').neq('id', P.id).limit(12); r = q ? r.or(`name.ilike.%${q}%,handle.ilike.%${q}%`) : r.order('created_at', { ascending: false });
  const { data } = await r; (data || []).forEach(u => CH.users[u.id] = u);
  $('#ures').innerHTML = (data || []).map(u => `<button class="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-soft text-left" onclick="${group ? `togUser('${u.id}')` : `dmWith('${u.id}')`}">${av(u, 40)}<div class="flex-1"><div class="text-sm font-semibold">${E(u.name)}</div><div class="text-xs text-mut">@${E(u.handle)}</div></div>${CH.sel.includes(u.id) ? `<span class="text-brand">${ic('check', false, 18)}</span>` : ''}</button>`).join('') || '<p class="text-xs text-mut text-center py-4">Ninguém encontrado.</p>';
  $('#usel').innerHTML = CH.sel.map(id => `<span class="text-xs bg-soft rounded-full px-2.5 py-1">${E(CH.users[id].name)}</span>`).join('');
}
function togUser(id) { CH.sel = CH.sel.includes(id) ? CH.sel.filter(x => x !== id) : [...CH.sel, id]; uSearch(true) }
async function dmWith(id) { closeM(); startDM(id) }
async function mkGroup() {
  if (CH.add) {
    const novos = CH.sel.filter(id => !CH.add.members.some(m => m.id === id)); if (!novos.length) return T('Escolha alguém que ainda não está no grupo.');
    const { error } = await sb.from('chat_members').insert(novos.map(id => ({ chat_id: CH.add.id, user_id: id, role: 'member' }))); if (error) return T('Não adicionou: ' + error.message);
    closeM(); await loadChats(); renderConv(); return loadMsgs();
  }
  const name = $('#gname').value.trim(); if (!name) return T('Dê um nome ao grupo.'); if (!CH.sel.length) return T('Escolha pelo menos uma pessoa.');
  const { data: c, error } = await sb.from('chats').insert({ is_group: true, name, created_by: P.id }).select().single(); if (error) return T('Não criou o grupo: ' + error.message);
  const { error: e2 } = await sb.from('chat_members').insert([{ chat_id: c.id, user_id: P.id, role: 'owner' }, ...CH.sel.map(id => ({ chat_id: c.id, user_id: id, role: 'member' }))]); if (e2) return T('Não adicionou: ' + e2.message);
  closeM(); await loadChats(); openChat(c.id);
}

/* ---------- iniciar conversa a partir do perfil ---------- */
async function startDM(id) {
  if (!CH.loaded) await loadChats();
  let c = CH.list.find(x => !x.is_group && x.members.some(m => m.id === id));
  if (!c) {
    const { data, error } = await sb.from('chats').insert({ is_group: false, created_by: P.id }).select().single(); if (error) return T('Não criou a conversa: ' + error.message);
    const { error: e2 } = await sb.from('chat_members').insert([{ chat_id: data.id, user_id: P.id, role: 'owner' }, { chat_id: data.id, user_id: id, role: 'member' }]); if (e2) return T('Não adicionou: ' + e2.message);
    await loadChats(); c = CH.list.find(x => x.id === data.id);
  }
  go('msgs'); if (c) openChat(c.id);
}

/* ---------- visto / recebido ---------- */
function markDelivered() { clearTimeout(CH.dt); CH.dt = setTimeout(() => { sb.rpc('mark_delivered').then(() => {}) }, 400) }
function markRead() {
  const c = CH.open; if (!c || document.visibilityState !== 'visible' || $('#v-msgs').classList.contains('hidden')) return;
  const last = CH.msgs.filter(m => m.sender !== P.id).pop(); CH.rd = CH.rd || {};
  if (!last || CH.rd[c.id] === last.id) return; CH.rd[c.id] = last.id; sb.rpc('mark_read', { p_chat: c.id }).then(() => {}); if (CH.unread) { CH.unread[c.id] = 0; if (CH.unreadM) CH.unreadM[c.id] = 0; paintUnread() }
}
async function refreshMarks() {
  const c = CH.open; if (!c) return;
  const { data } = await sb.from('chat_members').select('user_id,last_read_at,last_delivered_at').eq('chat_id', c.id); c.marks = {};
  (data || []).forEach(x => c.marks[x.user_id] = { r: x.last_read_at, d: x.last_delivered_at }); drawMsgs();
}
function tick(m) {
  const c = CH.open, others = c.members.filter(u => u.id !== P.id); if (!others.length) return '';
  const t = new Date(m.created_at), mk = u => (c.marks || {})[u.id] || {};
  const read = others.every(u => mk(u).r && new Date(mk(u).r) >= t), del = others.every(u => mk(u).d && new Date(mk(u).d) >= t);
  return read ? `<span style="color:#38bdf8" title="Visto">${ic('checks', false, 15)}</span>` : del ? `<span title="Recebida">${ic('checks', false, 15)}</span>` : `<span title="Enviada">${ic('check', false, 15)}</span>`;
}

/* ---------- online, visto por último e "digitando" ---------- */
function subHTML() {
  const c = CH.open; if (!c) return '';
  if (!c.is_group && c.other && typeof BLK !== 'undefined') { if (BLK.has(c.other.id)) return '<span class="text-mut">Contato bloqueado</span>'; if (BLK_ME.has(c.other.id)) return '<span class="text-mut">Usuário indisponível</span>' }
  if (CH.typing && CH.typing.until > Date.now()) return `<span class="text-brand font-medium">${c.is_group ? E(CH.typing.name) + ' está digitando' : 'digitando'}...</span>`;
  if (c.is_group) { const on = c.members.filter(u => u.id !== P.id && PRES.has(u.id)).length; return c.members.length + ' membros' + (on ? ` · <span style="color:#22c55e">${on} online</span>` : '') }
  const o = c.other; if (!o || o.show_status === false) return ''; if (PRES.has(o.id)) return '<span style="color:#22c55e" class="font-medium">online</span>';
  if (!o.last_seen) return 'offline'; const a = ago(o.last_seen); return a === 'agora' ? 'visto agora há pouco' : 'visto há ' + a;
}
function subUI() { const e = $('#csub'); if (e) e.innerHTML = subHTML() }
function onlineUI() {
  if (CH.open) { subUI(); const a = $('#chav'); if (a) a.innerHTML = cAv(CH.open, 38) }
  else if (CH.loaded && !$('#v-msgs').classList.contains('hidden')) renderChatList();
}
function typeChannel(on) {
  if (CH.tc) { sb.removeChannel(CH.tc); CH.tc = null } if (!on || !CH.open) return;
  CH.tc = sb.channel('typing:' + CH.open.id, { config: { broadcast: { self: false } } }).on('broadcast', { event: 'typing' }, ({ payload }) => {
    if (!payload || payload.u === P.id) return; CH.typing = { u: payload.u, name: payload.n, until: Date.now() + 3500 }; subUI(); setTimeout(subUI, 3700);
  }).subscribe();
}
function sendTyping() { if (!CH.tc || Date.now() - (CH.tsent || 0) < 2000) return; CH.tsent = Date.now(); CH.tc.send({ type: 'broadcast', event: 'typing', payload: { u: P.id, n: P.name } }) }

/* ---------- mensagens não lidas (número vermelho) ---------- */
async function loadUnread() {
  const { data } = await sb.rpc('unread_counts'); CH.unread = {}; CH.unreadM = {}; (data || []).forEach(r => { CH.unread[r.chat_id] = Number(r.n); CH.unreadM[r.chat_id] = Number(r.mentions || 0) });
  if (CH.open) CH.unread[CH.open.id] = 0; paintUnread(); if (!CH.open && !$('#v-msgs').classList.contains('hidden')) renderChatList();
}
function paintUnread() {
  const n = Object.values(CH.unread || {}).reduce((a, b) => a + b, 0), b = $('#msg-dot'), t = n > 99 ? '99+' : String(n);
  b.textContent = t; b.classList.toggle('hidden', !n); document.title = (n ? '(' + t + ') ' : '') + 'OtaWeb';
}
function bumpUnread(cid) { CH.unread = CH.unread || {}; CH.unread[cid] = (CH.unread[cid] || 0) + 1; paintUnread(); clearTimeout(CH.ut); CH.ut = setTimeout(loadUnread, 900); if (!CH.open && !$('#v-msgs').classList.contains('hidden')) renderChatList() }
