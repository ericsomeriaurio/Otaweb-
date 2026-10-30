/* OtaWeb · módulo de Mensagens (conversas privadas e grupos, tempo real) */
const CH = { list: [], open: null, msgs: [], votes: {}, pin: null, sel: [], users: {}, add: null, loaded: false, ch: null };
const hhmm = t => new Date(t).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
const cAv = (c, s = 46) => c.is_group ? `<div style="width:${s}px;height:${s}px" class="rounded-full bg-soft text-brand grid place-items-center shrink-0">${ic('users', false, Math.round(s * .45))}</div>` : av(c.other, s);
const cName = c => c.is_group ? (c.name || 'Grupo') : (c.other ? c.other.name : 'Conversa');
function cPrev(m, c) {
  if (!m) return 'Nenhuma mensagem ainda';
  const me = m.sender === P.id ? 'Você: ' : (c && c.is_group ? ((c.members.find(u => u.id === m.sender) || {}).name || 'Alguém') + ': ' : '');
  const t = m.deleted_for_all ? 'Mensagem apagada' : m.body === '__heart__' ? 'Coração' : m.poll_question ? 'Enquete: ' + m.poll_question : m.lat != null ? 'Localização' : m.media_type === 'image' ? 'Foto' : m.media_type === 'video' ? 'Vídeo' : m.media_type === 'audio' ? 'Áudio' : (m.body || '');
  return me + t;
}

/* ---------- tempo real ---------- */
function chatLive() {
  if (CH.ch) return;
  CH.ch = sb.channel('chat')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, onMsg)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'message_votes' }, () => { if (CH.open) loadMsgs() })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_members' }, () => { clearTimeout(CH.t2); CH.t2 = setTimeout(loadChats, 300) })
    .subscribe();
}
function onMsg(e) {
  const m = e.new || {}, viewing = !$('#v-msgs').classList.contains('hidden');
  if (CH.open && CH.open.id === m.chat_id && viewing) loadMsgs();
  else if (e.eventType === 'INSERT' && m.sender !== P.id) $('#msg-dot').classList.remove('hidden');
  clearTimeout(CH.t); CH.t = setTimeout(() => { if (viewing && !CH.open) loadChats() }, 300);
}

/* ---------- lista de conversas ---------- */
async function openMsgs() {
  $('#msg-dot').classList.add('hidden');
  if (CH.open) { renderConv(); loadMsgs(); return }
  if (!CH.loaded) $('#v-msgs').innerHTML = '<div class="max-w-xl mx-auto p-3 space-y-3"><div class="sk h-16"></div><div class="sk h-16"></div><div class="sk h-16"></div></div>'; else renderChatList();
  await loadChats();
}
async function loadChats() {
  const { data: mem, error } = await sb.from('chat_members').select('chat_id, chats!chat_id(id,is_group,name,avatar_url,created_by,pinned_message,created_at)').eq('user_id', P.id);
  if (error) { if (!CH.open) $('#v-msgs').innerHTML = errH(error); return }
  const chats = (mem || []).map(m => m.chats).filter(Boolean), ids = chats.map(c => c.id); let mm = [], last = {};
  if (ids.length) {
    const [a, b] = await Promise.all([
      sb.from('chat_members').select('chat_id,user_id,profiles!user_id(id,name,handle,avatar_url)').in('chat_id', ids),
      sb.from('messages').select('chat_id,sender,body,media_type,deleted_for_all,created_at,lat,poll_question').in('chat_id', ids).order('created_at', { ascending: false }).limit(300)]);
    mm = a.data || []; (b.data || []).forEach(m => { if (!last[m.chat_id]) last[m.chat_id] = m });
  }
  chats.forEach(c => { c.members = mm.filter(x => x.chat_id === c.id).map(x => x.profiles).filter(Boolean); c.last = last[c.id] || null; c.other = c.is_group ? null : (c.members.find(u => u.id !== P.id) || c.members[0]) });
  chats.sort((a, b) => new Date((b.last || b).created_at) - new Date((a.last || a).created_at));
  CH.list = chats; CH.loaded = true;
  if (CH.open) { const f = chats.find(c => c.id === CH.open.id); if (f) CH.open = f } else renderChatList();
}
function renderChatList() {
  $('#v-msgs').innerHTML = `<div class="max-w-xl mx-auto p-3 md:py-5 space-y-3"><div class="flex items-center justify-between px-1"><h2 class="font-bold text-xl">Mensagens</h2>
  <div class="flex gap-2"><button class="btn2 !px-3" onclick="pickUsers(false)">${ic('plus', false, 16)}Conversa</button><button class="btn2 !px-3" onclick="pickUsers(true)">${ic('users', false, 16)}Grupo</button></div></div>
  <div class="card overflow-hidden divide-y divide-line">` + (CH.list.map(c => `<button class="w-full flex items-center gap-3 p-3 text-left hover:bg-soft transition" onclick="openChat('${c.id}')">${cAv(c)}<div class="min-w-0 flex-1"><div class="flex justify-between gap-2"><span class="font-semibold text-sm truncate">${E(cName(c))}</span><span class="text-[11px] text-mut shrink-0">${c.last ? ago(c.last.created_at) : ''}</span></div><div class="text-xs text-mut truncate">${E(cPrev(c.last, c))}</div></div></button>`).join('') ||
    '<p class="p-10 text-center text-sm text-mut">Nenhuma conversa ainda.<br>Toque em <b>Conversa</b> para falar com alguém.</p>') + '</div></div>';
}

/* ---------- conversa aberta ---------- */
function openChat(id) { CH.open = CH.list.find(c => c.id === id); CH.msgs = []; CH.pin = null; renderConv(); loadMsgs() }
function closeChat() { CH.open = null; renderChatList(); loadChats() }
function renderConv() {
  const c = CH.open;
  $('#v-msgs').innerHTML = `<div class="h-full flex flex-col max-w-xl mx-auto bg-card md:border-x md:border-line">
   <div class="shrink-0 flex items-center gap-2 p-2 border-b border-line"><button class="circ !bg-transparent" onclick="closeChat()" aria-label="Voltar">${ic('back', false, 20)}</button>${cAv(c, 38)}
    <div class="min-w-0 flex-1"><div class="font-semibold text-sm truncate">${E(cName(c))}</div><div class="text-xs text-mut">${c.is_group ? c.members.length + ' membros' : '@' + E((c.other || {}).handle || '')}</div></div>
    <button class="circ !bg-transparent" onclick="chatMenu()" aria-label="Mais opções">${ic('more', false, 20)}</button></div>
   <button id="pinbar" onclick="pinMenu()" class="hidden shrink-0 flex items-center gap-2 px-3 py-2 text-xs bg-soft text-left border-b border-line"></button>
   <div id="cmsgs" class="flex-1 overflow-y-auto p-3 space-y-1.5"></div>
   <div id="cattach" class="hidden shrink-0 grid grid-cols-5 gap-2 p-3 border-t border-line text-[11px] font-semibold text-center">
    <label class="btn2 !flex-col !gap-1 !px-1 cursor-pointer">${ic('image', false, 22)}Foto<input type="file" accept="image/*" class="hidden" onchange="sendFile(this.files[0]);this.value=''"></label>
    <label class="btn2 !flex-col !gap-1 !px-1 cursor-pointer">${ic('video', false, 22)}Vídeo<input type="file" accept="video/*" class="hidden" onchange="sendFile(this.files[0]);this.value=''"></label>
    <label class="btn2 !flex-col !gap-1 !px-1 cursor-pointer">${ic('mic', false, 22)}Áudio<input type="file" accept="audio/*" class="hidden" onchange="sendFile(this.files[0]);this.value=''"></label>
    <button class="btn2 !flex-col !gap-1 !px-1" onclick="sendLoc()">${ic('pin', false, 22)}Local</button>
    <button class="btn2 !flex-col !gap-1 !px-1" onclick="chatPoll()">${ic('chart', false, 22)}Enquete</button></div>
   <div class="shrink-0 flex items-center gap-2 p-2 border-t border-line"><button class="circ" onclick="$('#cattach').classList.toggle('hidden')" aria-label="Anexar">${ic('plus', false, 20)}</button>
    <input id="cin" class="inp !rounded-full" placeholder="Mensagem" oninput="cdyn()" onkeydown="if(event.key==='Enter')csend()" autocomplete="off">
    <button id="csb" class="circ !bg-brand !text-white" onclick="csend()" aria-label="Enviar">${ic('heart', true, 20)}</button></div></div>`;
}
function cdyn() { $('#csb').innerHTML = $('#cin').value.trim() ? ic('send', false, 20) : ic('heart', true, 20) }
async function loadMsgs() {
  const c = CH.open; if (!c) return;
  const { data, error } = await sb.from('messages').select('*').eq('chat_id', c.id).order('created_at').limit(300);
  if (error) return T('Erro ao carregar mensagens: ' + error.message);
  if (!CH.open || CH.open.id !== c.id) return;
  CH.msgs = data || []; const pids = CH.msgs.filter(m => m.poll_question).map(m => m.id); CH.votes = {};
  if (pids.length) { const { data: v } = await sb.from('message_votes').select('message_id,user_id,option_idx').in('message_id', pids); (v || []).forEach(x => (CH.votes[x.message_id] = CH.votes[x.message_id] || []).push(x)) }
  CH.pin = c.pinned_message ? CH.msgs.find(m => m.id === c.pinned_message) || null : null;
  drawMsgs(!CH.drawn || CH.drawn !== c.id); CH.drawn = c.id;
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
  const mine = m.sender === P.id, g = CH.open.is_group, u = CH.open.members.find(x => x.id === m.sender) || {}, name = g && !mine && (!prev || prev.sender !== m.sender), heart = m.body === '__heart__' && !m.deleted_for_all; let body;
  if (m.deleted_for_all) body = '<i class="text-mut">Mensagem apagada</i>';
  else if (heart) body = `<span class="text-brand">${ic('heart', true, 36)}</span>`;
  else body = (m.media_url ? mediaH(m.media_url, m.media_type, 'rounded-lg max-h-64 max-w-full') : '') + (m.lat != null ? `<a class="underline flex items-center gap-2" target="_blank" rel="noopener" href="https://www.google.com/maps?q=${m.lat},${m.lng}">${ic('pin', false, 18)}Ver localização no mapa</a>` : '') + (m.poll_question ? pollM(m) : '') + (m.body ? `<div class="whitespace-pre-wrap break-words">${E(m.body)}</div>` : '');
  return `<div class="flex ${mine ? 'justify-end' : 'justify-start'} gap-2 items-end">${g && !mine ? `<div class="w-7 shrink-0">${name ? av(u, 28) : ''}</div>` : ''}<div class="max-w-[78%]">${name ? `<div class="text-[11px] text-mut ml-1 mb-0.5">${E(u.name || 'Otaku')}</div>` : ''}
  <div onclick="msgMenu('${m.id}')" class="${heart ? '' : mine ? 'bg-brand text-white' : 'bg-soft'} rounded-2xl px-3 py-2 text-sm cursor-pointer space-y-1.5 w-fit ${mine ? 'ml-auto' : ''}">${body}</div>
  <div class="text-[10px] text-mut mt-0.5 px-1 ${mine ? 'text-right' : ''}">${hhmm(m.created_at)}</div></div></div>`;
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
  const i = $('#cin'), t = i.value.trim(); if (!CH.open) return;
  const row = { chat_id: CH.open.id, sender: P.id, ...(extra || { body: t || '__heart__' }) };
  i.value = ''; cdyn(); $('#cattach').classList.add('hidden');
  const { data, error } = await sb.from('messages').insert(row).select().single();
  if (error) return T('Não enviou: ' + error.message);
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
function msgMenu(id) {
  const m = CH.msgs.find(x => x.id === id), pinned = CH.open.pinned_message === id, it = [];
  if (!m.deleted_for_all) {
    if (m.body && m.body !== '__heart__') it.push([ic('link') + ' Copiar texto', () => copy(m.body)]);
    if (m.media_url) it.push([ic('download') + ' Baixar', () => dlm(m.media_url)]);
    it.push([ic('bookmark') + (pinned ? ' Desafixar' : ' Afixar no topo'), () => pinMsg(pinned ? null : id)]);
  }
  it.push([ic('trash') + ' Apagar para mim', async () => { const { error } = await sb.from('message_hidden').insert({ message_id: id, user_id: P.id }); if (error) return T('Não apagou: ' + error.message); CH.msgs = CH.msgs.filter(x => x.id !== id); drawMsgs() }]);
  if (m.sender === P.id && !m.deleted_for_all) it.push([ic('trash') + ' Apagar para todos', async () => { const { error } = await sb.from('messages').update({ deleted_for_all: true, body: null, media_url: null, media_type: null, lat: null, lng: null, poll_question: null, poll_options: null }).eq('id', id); if (error) return T('Não apagou: ' + error.message); loadMsgs() }]);
  menu('Mensagem', it);
}
async function pinMsg(id) { const { error } = await sb.from('chats').update({ pinned_message: id }).eq('id', CH.open.id); if (error) return T('Não afixou: ' + error.message); CH.open.pinned_message = id; loadMsgs() }
function pinMenu() { menu('Mensagem afixada', [[ic('bookmark') + ' Desafixar', () => pinMsg(null)]]) }
function chatMenu() {
  const c = CH.open, it = [[ic('users') + ' Ver membros', showMembers]];
  if (c.is_group && c.created_by === P.id) it.push([ic('plus') + ' Adicionar pessoas', () => pickUsers(true, c)]);
  it.push([ic('logout') + (c.is_group ? ' Sair do grupo' : ' Apagar conversa'), leaveChat]); menu(cName(c), it);
}
function showMembers() {
  modal(`<div class="flex items-center justify-between mb-3"><h3 class="font-bold text-lg">Membros</h3><button class="circ" onclick="closeM()">${ic('x', false, 18)}</button></div>` + CH.open.members.map(u => `<button class="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-soft text-left" onclick="closeM();go('other');showProfile('${u.id}')">${av(u, 40)}<div><div class="text-sm font-semibold">${E(u.name)}</div><div class="text-xs text-mut">@${E(u.handle)}</div></div></button>`).join(''));
}
async function leaveChat() { const { error } = await sb.from('chat_members').delete().match({ chat_id: CH.open.id, user_id: P.id }); if (error) return T('Não saiu: ' + error.message); CH.open = null; await loadChats(); renderChatList() }

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
async function dmWith(id) {
  closeM(); const ex = CH.list.find(c => !c.is_group && c.members.some(m => m.id === id)); if (ex) return openChat(ex.id);
  const { data: c, error } = await sb.from('chats').insert({ is_group: false, created_by: P.id }).select().single(); if (error) return T('Não criou a conversa: ' + error.message);
  const { error: e2 } = await sb.from('chat_members').insert([{ chat_id: c.id, user_id: P.id, role: 'owner' }, { chat_id: c.id, user_id: id }]); if (e2) return T('Não adicionou: ' + e2.message);
  await loadChats(); openChat(c.id);
}
async function mkGroup() {
  if (CH.add) {
    const novos = CH.sel.filter(id => !CH.add.members.some(m => m.id === id)); if (!novos.length) return T('Escolha alguém que ainda não está no grupo.');
    const { error } = await sb.from('chat_members').insert(novos.map(id => ({ chat_id: CH.add.id, user_id: id }))); if (error) return T('Não adicionou: ' + error.message);
    closeM(); await loadChats(); renderConv(); return loadMsgs();
  }
  const name = $('#gname').value.trim(); if (!name) return T('Dê um nome ao grupo.'); if (!CH.sel.length) return T('Escolha pelo menos uma pessoa.');
  const { data: c, error } = await sb.from('chats').insert({ is_group: true, name, created_by: P.id }).select().single(); if (error) return T('Não criou o grupo: ' + error.message);
  const { error: e2 } = await sb.from('chat_members').insert([{ chat_id: c.id, user_id: P.id, role: 'owner' }, ...CH.sel.map(id => ({ chat_id: c.id, user_id: id }))]); if (e2) return T('Não adicionou: ' + e2.message);
  closeM(); await loadChats(); openChat(c.id);
}
