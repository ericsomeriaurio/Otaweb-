/* OtaWeb · chat avançado: responder/reagir, painel de contato, bloquear, grupos com cargos */
CH.mr = {}; CH.reply = null;
let BLK = new Set();

const msgText = m => m.deleted_for_all ? 'Mensagem apagada' : m.body === '__heart__' ? 'Coração' : m.poll_question ? 'Enquete: ' + m.poll_question : m.lat != null ? 'Localização' : m.media_type === 'image' ? 'Foto' : m.media_type === 'video' ? 'Vídeo' : m.media_type === 'audio' ? 'Áudio' : (m.body || '');
const nameOf = id => id === P.id ? 'Você' : ((CH.open && CH.open.members.find(u => u.id === id)) || {}).name || 'Alguém';

function chat2Start() {
  loadBlocks();
  const refresh = () => { clearTimeout(CH.t4); CH.t4 = setTimeout(() => { loadChats(); if ($('#modal') && !$('#modal').classList.contains('hidden') && CH.infoOpen) setTimeout(openInfo, 400) }, 300) };
  sb.channel('chat2')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, () => { if (CH.open && !$('#v-msgs').classList.contains('hidden')) loadMsgs() })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_members' }, refresh)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_members' }, e => { const n = e.new || {}, c = CH.list.find(x => x.id === n.chat_id); if (c && c.roles && c.roles[n.user_id] !== n.role) refresh() })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chats' }, e => { const n = e.new || {}, c = CH.list.find(x => x.id === n.id); if (c && (c.name !== n.name || c.avatar_url !== n.avatar_url)) refresh() })
    .subscribe();
}
async function loadBlocks() { const { data } = await sb.from('blocks').select('blocked').eq('blocker', P.id); BLK = new Set((data || []).map(x => x.blocked)) }

/* ---------- resposta e reação dentro da conversa ---------- */
function quoteH(m) {
  if (!m.reply_to) return '';
  const o = CH.msgs.find(x => x.id === m.reply_to);
  return `<button class="block w-full text-left text-xs rounded-md px-2 py-1 bg-black/10 opacity-90" style="border-left:3px solid currentColor" onclick="event.stopPropagation();scrollToMsg('${m.reply_to}')"><b>${E(o ? nameOf(o.sender) : 'Mensagem')}</b><div class="truncate">${E(o ? msgText(o) : 'Mensagem original indisponível')}</div></button>`;
}
function rxPillH(m) {
  const rs = CH.mr[m.id] || []; if (!rs.length || m.deleted_for_all) return '';
  const types = [...new Set(rs.map(r => r.reaction))].slice(0, 3);
  return `<button onclick="event.stopPropagation();msgReactors('${m.id}')" class="-mt-1.5 mx-2 relative z-10 flex items-center gap-1 bg-card border border-line rounded-full px-1.5 py-0.5 text-[11px] shadow-sm w-fit ${m.sender === P.id ? 'ml-auto' : ''}"><span class="flex -space-x-1">${types.map(t => rx(t, 14)).join('')}</span>${rs.length}</button>`;
}
async function loadMR() {
  const ids = CH.msgs.map(m => m.id); CH.mr = {}; if (!ids.length) return;
  const { data } = await sb.from('message_reactions').select('message_id,user_id,reaction').in('message_id', ids); (data || []).forEach(r => (CH.mr[r.message_id] = CH.mr[r.message_id] || []).push(r));
}
async function reactMsg(id, type) {
  const all = CH.mr[id] || [], mine = all.find(r => r.user_id === P.id), rm = !type || (mine && mine.reaction === type), rest = all.filter(r => r.user_id !== P.id);
  CH.mr[id] = rm ? rest : [...rest, { message_id: id, user_id: P.id, reaction: type }]; drawMsgs();
  const { error } = rm ? await sb.from('message_reactions').delete().match({ message_id: id, user_id: P.id }) : await sb.from('message_reactions').upsert({ message_id: id, user_id: P.id, reaction: type }, { onConflict: 'message_id,user_id' });
  if (error) { T(/message_reactions/.test(error.message) ? 'Falta rodar a migração 5 no Supabase.' : 'Não reagiu: ' + error.message); loadMsgs() }
}
function msgReactors(id) {
  const rs = CH.mr[id] || [];
  modal(`<div class="flex items-center justify-between mb-3"><h3 class="font-bold text-lg">Reações</h3><button class="circ" onclick="closeM()" aria-label="Fechar">${ic('x', false, 18)}</button></div>` + rs.map(r => { const u = (CH.open.members.find(x => x.id === r.user_id)) || {}, me = r.user_id === P.id;
    return `<button class="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-soft text-left" onclick="${me ? `closeM();reactMsg('${id}',null)` : `goProfile('${u.id}')`}">${av(u, 40)}<span class="min-w-0 flex-1"><span class="block text-sm font-semibold truncate">${E(me ? 'Você' : u.name || 'Alguém')}</span>${me ? '<span class="block text-xs text-mut">Toque para remover</span>' : ''}</span>${rx(r.reaction, 22)}</button>` }).join('') || '<p class="text-sm text-mut text-center py-4">Sem reações.</p>');
}
function msgReplyTo(id) {
  const m = CH.msgs.find(x => x.id === id); if (!m) return; CH.reply = { id }; const b = $('#crep'); if (!b) return;
  b.classList.remove('hidden'); b.innerHTML = `<span class="text-brand">${ic('reply', false, 16)}</span><div class="min-w-0 flex-1"><div class="font-semibold">Respondendo a ${E(nameOf(m.sender))}</div><div class="truncate text-mut">${E(msgText(m))}</div></div><button onclick="replyOff()" aria-label="Cancelar resposta">${ic('x', false, 16)}</button>`;
  const i = $('#cin'); if (i) i.focus();
}
function replyOff() { CH.reply = null; const b = $('#crep'); if (b) { b.classList.add('hidden'); b.innerHTML = '' } }
function scrollToMsg(id) {
  const el = document.querySelector('#cmsgs [data-id="' + id + '"]'); if (!el) return T('Mensagem fora do histórico carregado.');
  el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1300);
}
function msgMenu(id) {
  const m = CH.msgs.find(x => x.id === id); if (!m) return; const pinned = CH.open.pinned_message === id, own = m.sender === P.id, it = [];
  if (!m.deleted_for_all) {
    it.push(['reply', 'Responder', () => msgReplyTo(id)]);
    if (m.body && m.body !== '__heart__') it.push(['link', 'Copiar texto', () => copy(m.body)]);
    if (m.media_url) it.push(['download', 'Baixar', () => dlm(m.media_url)]);
    it.push(['bookmark', pinned ? 'Desafixar' : 'Afixar no topo', () => pinMsg(pinned ? null : id)]);
    if (own && m.body && m.body !== '__heart__' && !m.media_url && !m.poll_question && m.lat == null) it.push(['edit', 'Editar', async () => { const v = await askText('Editar mensagem', m.body); if (!v) return; const { error } = await sb.from('messages').update({ body: v, edited_at: new Date().toISOString() }).eq('id', id); if (error) return T('Não editou: ' + error.message); loadMsgs() }]);
  }
  it.push(['trash', 'Apagar para mim', async () => { const { error } = await sb.from('message_hidden').insert({ message_id: id, user_id: P.id }); if (error) return T('Não apagou: ' + error.message); CH.msgs = CH.msgs.filter(x => x.id !== id); drawMsgs() }]);
  if (own && !m.deleted_for_all) it.push(['trash', 'Apagar para todos', async () => { const { error } = await sb.from('messages').update({ deleted_for_all: true, body: null, media_url: null, media_type: null, lat: null, lng: null, poll_question: null, poll_options: null }).eq('id', id); if (error) return T('Não apagou: ' + error.message); loadMsgs() }]);
  window._mmi = it;
  modal((m.deleted_for_all ? '' : `<div class="flex justify-between gap-1 mb-3 pb-3 border-b border-line">${Object.keys(RX).map(k => `<button onclick="closeM();reactMsg('${id}','${k}')" title="${RX[k][0]}" class="transition hover:scale-125">${rx(k, 34)}</button>`).join('')}</div>`) +
    it.map((x, i) => `<button class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-soft text-left text-sm" onclick="closeM();_mmi[${i}][2]()">${ic(x[0], false, 18)}${x[1]}</button>`).join(''));
}

/* ---------- painel de contato / grupo ---------- */
const badge = r => r === 'owner' ? '<span class="text-[10px] font-bold bg-brand text-white rounded-full px-2 py-0.5">Dono</span>' : r === 'admin' ? '<span class="text-[10px] font-bold bg-soft text-brand rounded-full px-2 py-0.5">Admin</span>' : '';
const irow = (i, l, f, danger) => `<button class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-soft text-left text-sm font-medium ${danger ? 'text-brand' : ''}" onclick="${f}"><span class="w-9 h-9 rounded-full bg-soft grid place-items-center shrink-0 ${danger ? '' : 'text-brand'}">${ic(i, false, 18)}</span>${l}</button>`;
function confirmBox(t, d, label, fn) {
  window._cf = fn; modal(`<h3 class="font-bold text-lg mb-1">${t}</h3><p class="text-sm text-mut mb-4">${d}</p><div class="flex gap-2 justify-end"><button class="btn2" onclick="closeM()">Cancelar</button><button class="btn" onclick="closeM();_cf()">${label}</button></div>`);
}
function chatMenu() { openInfo() }
function openInfo() {
  const c = CH.open; if (!c) return; CH.infoOpen = true; const roles = c.roles || {}, me = roles[P.id], adm = me === 'owner' || me === 'admin', o = c.other;
  let h = `<div class="flex justify-end -mt-2 -mr-2"><button class="circ" onclick="CH.infoOpen=false;closeM()" aria-label="Fechar">${ic('x', false, 18)}</button></div><div class="max-h-[78dvh] overflow-y-auto -mt-4">`;
  if (c.is_group) {
    h += `<div class="relative mx-auto w-24 h-24">${cAv(c, 96)}${adm ? `<label class="absolute -bottom-1 -right-1 circ !w-9 !h-9 !bg-brand !text-white cursor-pointer" aria-label="Trocar foto do grupo">${ic('camera', false, 16)}<input type="file" accept="image/*" class="hidden" onchange="setGroupPhoto(this.files[0])"></label>` : ''}</div>
    <div class="text-center mt-3 mb-3"><div class="font-bold text-lg">${E(c.name || 'Grupo')}</div><div class="text-xs text-mut">${c.members.length} membro${c.members.length > 1 ? 's' : ''}</div>${adm ? '<button class="text-xs text-brand font-semibold mt-1" onclick="renameGroup()">Mudar nome</button>' : ''}</div>`;
    if (adm) h += irow('plus', 'Adicionar pessoas', 'addMemberModal()');
    h += '<div class="text-xs font-semibold text-mut px-3 pt-3 pb-1">MEMBROS</div>' + c.members.map(u => `<button class="w-full flex items-center gap-3 p-2 px-3 rounded-lg hover:bg-soft text-left" onclick="memberMenu('${u.id}')">${av(u, 40)}<span class="min-w-0 flex-1"><span class="block text-sm font-semibold truncate">${E(u.name)}${u.id === P.id ? ' (você)' : ''}</span><span class="block text-xs text-mut">@${E(u.handle)}</span></span>${badge(roles[u.id])}</button>`).join('');
    h += '<div class="h-2"></div>' + irow('logout', 'Sair do grupo', 'leaveChat()', true) + irow('flag', 'Denunciar grupo', 'reportChat()', true) + (me === 'owner' ? irow('trash', 'Excluir grupo', 'deleteGroup()', true) : '');
  } else if (o) {
    const bl = BLK.has(o.id);
    h += `<div class="mx-auto w-fit">${cAv(c, 96)}</div><div class="text-center mt-3 mb-3"><div class="font-bold text-lg">${E(cName(c))}</div><div class="text-xs text-mut">@${E(o.handle)}</div><div class="text-xs mt-1">${subHTML()}</div></div>` +
      irow('user', 'Ver perfil', `goProfile('${o.id}')`) + (bl ? irow('ban', 'Desbloquear', `unblock('${o.id}')`) : irow('ban', 'Bloquear', `askBlock('${o.id}')`, true)) + irow('flag', 'Denunciar', `reportUser('${o.id}')`, true) + irow('trash', 'Apagar conversa', 'leaveChat()', true);
  }
  modal(h + '</div>');
}
function memberMenu(id) {
  const c = CH.open, u = c.members.find(x => x.id === id); if (!u) return; const me = c.roles[P.id], tr = c.roles[id], it = [[ic('user') + ' Ver perfil', () => goProfile(id)]];
  if (id !== P.id) it.push([ic('msgc') + ' Enviar mensagem', () => startDM(id)]);
  if (me === 'owner' && id !== P.id) { it.push([ic('star') + (tr === 'admin' ? ' Remover cargo de admin' : ' Tornar admin'), () => setRole(id, tr === 'admin' ? 'member' : 'admin')]); it.push([ic('star', true) + ' Transferir liderança', () => transferOwner(id)]) }
  if (id !== P.id && tr !== 'owner' && (me === 'owner' || (me === 'admin' && tr === 'member'))) it.push([ic('trash') + ' Remover do grupo', () => kick(id)]);
  menu(u.name, it);
}
async function setRole(id, role) { const { error } = await sb.from('chat_members').update({ role }).match({ chat_id: CH.open.id, user_id: id }); if (error) return T('Não mudou o cargo: ' + error.message); await loadChats(); openInfo() }
function transferOwner(id) {
  confirmBox('Transferir liderança?', 'Você passa a ser admin e a outra pessoa vira a dona do grupo.', 'Transferir', async () => { const { error } = await sb.rpc('transfer_chat_owner', { c: CH.open.id, newo: id }); if (error) return T(/transfer_chat_owner/.test(error.message) ? 'Falta rodar a migração 5 no Supabase.' : 'Não transferiu: ' + error.message); await loadChats(); openInfo() });
}
function kick(id) {
  const u = CH.open.members.find(x => x.id === id) || {};
  confirmBox('Remover do grupo?', E(u.name || 'Essa pessoa') + ' deixa de ver as mensagens do grupo.', 'Remover', async () => { const { error } = await sb.from('chat_members').delete().match({ chat_id: CH.open.id, user_id: id }); if (error) return T('Não removeu: ' + error.message); await loadChats(); openInfo() });
}
async function leaveChat() {
  const c = CH.open; if (!c) return;
  if (c.is_group && (c.roles || {})[P.id] === 'owner' && c.members.length > 1) return T('Você é o dono: passe a liderança para outra pessoa antes de sair.');
  confirmBox(c.is_group ? 'Sair do grupo?' : 'Apagar conversa?', c.is_group ? 'Você deixa de receber as mensagens deste grupo.' : 'A conversa some só para você.', 'Confirmar', async () => {
    const { error } = await sb.from('chat_members').delete().match({ chat_id: c.id, user_id: P.id }); if (error) return T('Não saiu: ' + error.message);
    CH.infoOpen = false; typeChannel(false); CH.open = null; await loadChats(); renderChatList();
  });
}
function deleteGroup() {
  confirmBox('Excluir grupo?', 'O grupo e todas as mensagens somem para todos. Não dá para desfazer.', 'Excluir', async () => {
    const id = CH.open.id, { error } = await sb.from('chats').delete().eq('id', id); if (error) return T('Não excluiu: ' + error.message);
    CH.infoOpen = false; typeChannel(false); CH.open = null; await loadChats(); renderChatList(); T('Grupo excluído.');
  });
}
async function setGroupPhoto(f) {
  if (!f) return; T('Enviando foto...'); const m = await upload(f); if (!m) return;
  const { error } = await sb.from('chats').update({ avatar_url: m.url }).eq('id', CH.open.id); if (error) return T('Não trocou a foto: ' + error.message);
  await loadChats(); const a = $('#chav'); if (a) a.innerHTML = cAv(CH.open, 38); openInfo(); T('Foto do grupo atualizada.');
}
async function renameGroup() {
  const v = await askText('Nome do grupo', CH.open.name || ''); if (!v) return;
  const { error } = await sb.from('chats').update({ name: v.slice(0, 40) }).eq('id', CH.open.id); if (error) return T('Não mudou o nome: ' + error.message);
  await loadChats(); renderConv(); loadMsgs(); openInfo();
}
function addMemberModal() {
  modal(`<div class="flex items-center justify-between mb-3"><h3 class="font-bold text-lg">Adicionar ao grupo</h3><button class="circ" onclick="openInfo()" aria-label="Voltar">${ic('back', false, 18)}</button></div><input id="am-q" class="inp mb-2" placeholder="Buscar por nome ou @usuário" oninput="amSearch()" autocomplete="off"><div id="am-res" class="space-y-1 max-h-72 overflow-y-auto"></div>`); amSearch();
}
async function amSearch() {
  const c = CH.open, q = ($('#am-q').value || '').trim().replace(/[%,()]/g, ' ');
  let r = sb.from('profiles').select('id,name,handle,avatar_url').limit(15); r = q ? r.or(`name.ilike.%${q}%,handle.ilike.%${q}%`) : r.order('created_at', { ascending: false });
  const { data } = await r;
  $('#am-res').innerHTML = (data || []).map(u => `<div class="flex items-center gap-3 p-2">${av(u, 40)}<div class="flex-1 min-w-0"><div class="text-sm font-semibold truncate">${E(u.name)}</div><div class="text-xs text-mut">@${E(u.handle)}</div></div>${c.members.some(m => m.id === u.id) ? '<span class="text-xs text-mut">No grupo</span>' : `<button class="btn !py-1.5 !px-3" onclick="addOne('${u.id}',this)">Adicionar</button>`}</div>`).join('') || '<p class="text-xs text-mut text-center py-4">Ninguém encontrado.</p>';
}
async function addOne(id, b) {
  b.disabled = true; const { error } = await sb.from('chat_members').insert({ chat_id: CH.open.id, user_id: id, role: 'member' });
  if (error) { b.disabled = false; return T('Não adicionou: ' + error.message) } b.outerHTML = '<span class="text-xs text-mut">Adicionado</span>'; await loadChats();
}

/* ---------- bloquear e denunciar ---------- */
function askBlock(id) { confirmBox('Bloquear este contato?', 'Vocês deixam de poder trocar mensagens. Dá para desbloquear quando quiser.', 'Bloquear', () => blockUser(id)) }
async function blockUser(id) { const { error } = await sb.from('blocks').insert({ blocker: P.id, blocked: id }); if (error) return T(/blocks/.test(error.message) ? 'Falta rodar a migração 5 no Supabase.' : 'Não bloqueou: ' + error.message); BLK.add(id); CH.infoOpen = false; T('Contato bloqueado.'); renderConv(); loadMsgs() }
async function unblock(id) { const { error } = await sb.from('blocks').delete().match({ blocker: P.id, blocked: id }); if (error) return T('Não desbloqueou: ' + error.message); BLK.delete(id); CH.infoOpen = false; closeM(); T('Contato desbloqueado.'); renderConv(); loadMsgs() }
function reportUser(id) { reportModal({ user: id, chat: CH.open.id }) }
function reportChat() { reportModal({ chat: CH.open.id }) }
function reportModal(t) { window._rt = t; modal('<h3 class="font-bold text-lg mb-3">Denunciar</h3>' + ['Spam ou golpe', 'Assédio ou ameaça', 'Conteúdo impróprio', 'Outro motivo'].map(r => `<button class="btn2 w-full mb-2 !justify-start" data-r="${r}" onclick="sendReport(this.dataset.r)">${r}</button>`).join('')) }
async function sendReport(reason) {
  const t = window._rt || {}; closeM(); const { error } = await sb.from('reports').insert({ reporter: P.id, reason, reported_user: t.user || null, chat_id: t.chat || null });
  if (error) return T(/reported_user|chat_id/.test(error.message) ? 'Falta rodar a migração 5 no Supabase.' : 'Não enviou: ' + error.message); T('Denúncia enviada. Obrigado!');
}
function composerState() {
  const c = CH.open; if (!c || c.is_group || !c.other || !BLK.has(c.other.id)) return; const i = $('#cin'); if (!i) return;
  i.closest('.shrink-0').innerHTML = `<div class="flex-1 text-center text-sm text-mut py-2">Você bloqueou este contato. <button class="text-brand font-semibold" onclick="unblock('${c.other.id}')">Desbloquear</button></div>`;
}
