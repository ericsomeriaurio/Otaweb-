/* OtaWeb · extras: conta, menções, notificações, salvos e definições */
const backBtn = to => `<button class="btn2 mb-1" onclick="go('${to}')">${ic('back', false, 16)} Voltar</button>`;
const SV = { cat: 'Todos', rows: [] };

/* ---------- sair e recuperar conta ---------- */
async function doLogout() { await sb.auth.signOut(); location.reload() }
function forgot() {
  modal(`<h3 class="font-bold text-lg mb-1">Recuperar conta</h3><p class="text-sm text-mut mb-3">Enviamos um link para você criar uma nova senha.</p>
  <input id="fg-e" type="email" class="inp mb-3" placeholder="Seu e-mail" value="${E($('#a-email').value.trim())}"><div class="flex gap-2 justify-end"><button class="btn2" onclick="closeM()">Cancelar</button><button class="btn" onclick="sendReset()">Enviar link</button></div>`);
}
async function sendReset() {
  const e = $('#fg-e').value.trim(); if (!e) return T('Digite seu e-mail.');
  const { error } = await sb.auth.resetPasswordForEmail(e, { redirectTo: location.origin + location.pathname });
  if (error) return T('Não enviou: ' + error.message);
  closeM(); T('Se esse e-mail tiver conta, o link foi enviado. Veja também o spam.');
}
function recoveryForm() {
  $('#auth').classList.add('hidden');
  modal(`<h3 class="font-bold text-lg mb-3">Criar nova senha</h3><input id="rp1" type="password" class="inp mb-2" placeholder="Nova senha (mín. 6)" autocomplete="new-password"><input id="rp2" type="password" class="inp mb-3" placeholder="Repita a nova senha" autocomplete="new-password"><button class="btn w-full" onclick="saveNewPass()">Salvar nova senha</button>`);
}
async function saveNewPass() {
  const a = $('#rp1').value, b = $('#rp2').value; if (a.length < 6) return T('A senha precisa ter pelo menos 6 caracteres.'); if (a !== b) return T('As senhas não são iguais.');
  const { error } = await sb.auth.updateUser({ password: a }); if (error) return T('Não salvou: ' + error.message);
  closeM(); history.replaceState(null, '', location.pathname); T('Senha alterada! Você já está dentro.');
}

/* ---------- menções (@usuario) ---------- */
const linkify = t => E(t).replace(/(^|[^\w])@([A-Za-z0-9_]{3,20})\b/g, (m, a, h) => `${a}<button class="text-brand font-semibold hover:underline" onclick="event.stopPropagation();openHandle('${h.toLowerCase()}')">@${h}</button>`);
let _mn;
document.addEventListener('input', e => {
  const el = e.target; if (!el.matches || !el.matches('textarea, input.inp') || el.type === 'password' || ['q', 'uq', 'cin', 'a-email', 'fg-e'].includes(el.id)) return;
  const pos = el.selectionStart, m = /(^|\s)@([A-Za-z0-9_]{1,20})$/.exec(el.value.slice(0, pos)); clearTimeout(_mn);
  if (!m) return mnHide(); _mn = setTimeout(() => mnShow(el, m[2], pos), 200);
});
document.addEventListener('click', e => { if (!e.target.closest('#mn')) mnHide() });
function mnHide() { const b = document.getElementById('mn'); if (b) b.remove() }
async function mnShow(el, q, pos) {
  const { data } = await sb.from('profiles').select('id,name,handle,avatar_url').ilike('handle', q + '%').limit(5); if (!data || !data.length) return mnHide();
  let b = document.getElementById('mn'); if (!b) { b = document.createElement('div'); b.id = 'mn'; b.className = 'fixed z-[80] card p-1 w-64 max-w-[90vw] shadow-lg'; document.body.appendChild(b) }
  const r = el.getBoundingClientRect(), h = data.length * 46 + 8; b.style.left = Math.max(8, Math.min(r.left, innerWidth - 270)) + 'px'; b.style.top = (r.top - h - 6 > 8 ? r.top - h - 6 : r.bottom + 6) + 'px';
  b._el = el; b._pos = pos; b._q = q;
  b.innerHTML = data.map(u => `<button class="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-soft text-left" onmousedown="event.preventDefault()" onclick="mnPick('${u.handle}')">${av(u, 30)}<span class="text-sm truncate"><b>${E(u.name)}</b> <span class="text-mut">@${E(u.handle)}</span></span></button>`).join('');
}
function mnPick(h) {
  const b = document.getElementById('mn'); if (!b) return; const el = b._el, v = el.value, start = b._pos - b._q.length - 1;
  el.value = v.slice(0, start) + '@' + h + ' ' + v.slice(b._pos); const p = start + h.length + 2; el.focus(); el.setSelectionRange(p, p); mnHide();
}

/* ---------- notificações que abrem o post ---------- */
async function loadNotifs() {
  const { data, error } = await sb.from('notifications').select('id,type,read,ref_id,created_at,actor:profiles!actor(id,name,handle,avatar_url)').eq('user_id', P.id).order('created_at', { ascending: false }).limit(50);
  if (error) { $('#v-notif').innerHTML = errH(error); return }
  const tx = { like: 'reagiu à sua publicação', comment: 'comentou na sua publicação', reply: 'respondeu ao seu comentário', follow: 'começou a seguir você', mention: 'mencionou você' }, ico = { like: 'heart', comment: 'msgc', reply: 'msgc', follow: 'user', mention: 'at' };
  $('#v-notif').innerHTML = `<div class="max-w-xl mx-auto p-3 md:py-5"><h2 class="font-bold text-xl mb-3 px-1">Notificações</h2><div class="card divide-y divide-line overflow-hidden">` +
    ((data || []).filter(n => n.actor).map(n => `<button class="w-full flex items-center gap-3 p-3 text-left hover:bg-soft transition ${n.read ? '' : 'bg-brand/10'}" onclick="openNotif('${n.type}','${n.ref_id || ''}','${n.actor.id}')"><span class="relative shrink-0">${av(n.actor, 46)}<span class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-brand text-white grid place-items-center ring-2 ring-card">${ic(ico[n.type] || 'bell', n.type === 'like', 11)}</span></span><div class="text-sm flex-1 min-w-0"><b>${E(n.actor.name)}</b> ${tx[n.type] || 'interagiu com você'}<div class="text-xs text-mut mt-0.5">${ago(n.created_at)}</div></div></button>`).join('') || '<p class="p-10 text-center text-sm text-mut">Nenhuma notificação por enquanto.</p>') + '</div></div>';
  if ((data || []).some(n => !n.read)) { await sb.from('notifications').update({ read: true }).eq('user_id', P.id).eq('read', false); loadBadge() }
}
function openNotif(type, ref, actor) { if (type === 'follow' || !ref) return showProfile(actor); showPost(ref, type === 'comment' || type === 'reply') }
async function showPost(id, withC) {
  go('other'); window.lastProfile = null; window.reloadOther = () => showPost(id); $('#q').value = '';
  const el = $('#v-other'); el.innerHTML = backBtn('notif') + '<div class="sk h-48"></div>';
  const { data, error } = await sb.from('posts').select(SEL).eq('id', id).maybeSingle();
  if (error) { el.innerHTML = backBtn('notif') + errH(error); return }
  if (!data) { el.innerHTML = backBtn('notif') + '<p class="text-center text-sm text-mut py-12">Esta publicação não existe mais.</p>'; return }
  posts = await prep([data]); el.innerHTML = backBtn('notif') + safe(posts); if (withC) openComments(id);
}

/* ---------- salvos por categoria ---------- */
async function save(id, on) {
  if (on) return menu('Publicação salva', [[ic('bookmark') + ' Mudar de categoria', () => saveTo(id)], [ic('trash') + ' Remover dos salvos', async () => { await sb.from('saves').delete().match({ post_id: id, user_id: P.id }); T('Removido dos salvos'); refresh() }]]);
  saveTo(id);
}
async function saveTo(id) {
  const { data } = await sb.from('saves').select('category').eq('user_id', P.id), cats = [...new Set((data || []).map(x => x.category).concat('Geral'))];
  modal(`<h3 class="font-bold text-lg mb-3">Salvar em...</h3>` + cats.map(c => `<button class="btn2 w-full mb-2 !justify-start" data-c="${E(c)}" onclick="doSave('${id}',this.dataset.c)">${ic('bookmark', false, 16)}${E(c)}</button>`).join('') +
    `<div class="flex gap-2 mt-2"><input id="nc" class="inp" placeholder="Nova categoria" maxlength="30"><button class="btn" onclick="doSave('${id}',$('#nc').value.trim())">Criar</button></div>`);
}
async function doSave(id, cat) {
  if (!cat) return T('Escolha ou crie uma categoria.'); closeM();
  const { error } = await sb.from('saves').upsert({ post_id: id, user_id: P.id, category: cat }, { onConflict: 'post_id,user_id' });
  if (error) return T(/category/.test(error.message) ? 'Falta rodar a migração 4 no Supabase.' : 'Não salvou: ' + error.message);
  T('Salvo em ' + cat); refresh();
}
async function openSaved(cat) {
  SV.cat = cat || 'Todos'; go('other'); window.lastProfile = null; window.reloadOther = () => openSaved(SV.cat); $('#q').value = '';
  const el = $('#v-other'); el.innerHTML = backBtn('menu') + '<div class="sk h-24"></div><div class="sk h-40"></div>';
  const { data, error } = await sb.from('saves').select('category,saved_at,post:posts!post_id(' + SEL + ')').eq('user_id', P.id).order('saved_at', { ascending: false });
  if (error) { el.innerHTML = backBtn('menu') + errH(/category|saved_at/.test(error.message) ? 'Falta rodar a migração 4 no Supabase.' : error); return }
  SV.rows = (data || []).filter(r => r.post); drawSaved();
}
async function drawSaved() {
  const cats = {}; SV.rows.forEach(r => cats[r.category] = (cats[r.category] || 0) + 1);
  const list = SV.rows.filter(r => SV.cat === 'Todos' || r.category === SV.cat); posts = await prep(list.map(r => r.post));
  const chips = ['Todos', ...Object.keys(cats)].map(c => `<button class="btn2 !py-1.5 !px-3 whitespace-nowrap ${SV.cat === c ? 'sel' : ''}" data-c="${E(c)}" onclick="SV.cat=this.dataset.c;drawSaved()">${E(c)} <span class="text-mut">${c === 'Todos' ? SV.rows.length : cats[c]}</span></button>`).join('');
  $('#v-other').innerHTML = backBtn('menu') + `<h2 class="font-bold text-xl px-1">Salvos</h2><div class="flex gap-2 overflow-x-auto pb-1">${chips}</div>` + (safe(posts) || `<p class="text-center text-sm text-mut py-12">Nada salvo${SV.cat === 'Todos' ? ' ainda' : ' nesta categoria'}.<br>Use o menu de três pontos de um post para salvar.</p>`);
}

/* ---------- menu e definições ---------- */
function renderMenu() {
  const t = localStorage.getItem('ow-theme') || 'auto', row = (i, l, d, f) => `<button class="w-full flex items-center gap-3 p-4 text-left hover:bg-soft transition" onclick="${f}"><span class="w-9 h-9 rounded-full bg-soft text-brand grid place-items-center shrink-0">${ic(i, false, 19)}</span><span class="min-w-0 flex-1"><span class="block text-sm font-semibold">${l}</span><span class="block text-xs text-mut">${d}</span></span></button>`;
  $('#v-menu').innerHTML = `<div class="max-w-xl mx-auto p-3 md:py-5 space-y-3"><h2 class="font-bold text-xl px-1">Menu</h2>
  <button class="card w-full flex items-center gap-3 p-4 text-left" onclick="showProfile('${P.id}')">${av(P, 52)}<div><div class="font-semibold">${E(P.name)}</div><div class="text-xs text-mut">@${E(P.handle)} · Ver seu perfil</div></div></button>
  <div class="card overflow-hidden divide-y divide-line">${row('bookmark', 'Salvos', 'Publicações guardadas por categoria', 'openSaved()')}${row('gear', 'Definições', 'Conta, senha e privacidade', 'openSettings()')}${row('info', 'Sobre o OtaWeb', 'Versão e informações', 'openAbout()')}${(window.RESTR || []).length ? row('shield', 'Estado da conta', 'Restrições e pedido de revisão', 'openAccountState()') : ''}${P.is_admin ? row('shield', 'Administração', 'Painel da rede', 'openAdmin()') : ''}</div>
  <div class="card p-4 space-y-3"><div class="text-sm font-semibold">Aparência</div><div class="grid grid-cols-3 gap-2">${[['light', 'sun', 'Claro'], ['dark', 'moon', 'Escuro'], ['auto', 'monitor', 'Sistema']].map(([k, i, l]) => `<button class="btn2 ${t === k ? 'sel' : ''}" onclick="setTheme('${k}')">${ic(i, false, 16)}${l}</button>`).join('')}</div></div>
  <button class="card w-full flex items-center gap-3 p-4 text-left text-brand font-semibold" onclick="doLogout()">${ic('logout', false, 20)}Sair da conta</button></div>`;
}
function openAbout() { modal(`<h3 class="font-bold text-lg mb-2">OtaWeb</h3><p class="text-sm text-mut mb-4">A rede social para quem vive anime. Versão 0.4.</p><button class="btn w-full" onclick="closeM()">Fechar</button>`) }
async function openSettings() {
  go('other'); window.lastProfile = null; window.reloadOther = () => {}; $('#q').value = '';
  const { data: { user } } = await sb.auth.getUser(), off = P.show_status === false;
  $('#v-other').innerHTML = backBtn('menu') + `<h2 class="font-bold text-xl px-1">Definições</h2>
  <div class="card p-4 space-y-3"><div class="text-sm font-semibold">Perfil</div><input id="s-name" class="inp" value="${E(P.name)}" maxlength="30" placeholder="Nome"><input id="s-bio" class="inp" value="${E(P.bio || '')}" maxlength="120" placeholder="Bio"><input id="s-fav" class="inp" value="${E(P.fav_anime || '')}" maxlength="60" placeholder="Anime favorito">
   <div class="text-xs text-mut">Seu @usuário (@${E(P.handle)}) não pode ser alterado.</div><button class="btn" onclick="setProfile()">Salvar perfil</button></div>
  <div class="card p-4 space-y-3"><div class="text-sm font-semibold">E-mail</div><div class="text-xs text-mut">Atual: ${E(user.email)}</div><input id="s-mail" type="email" class="inp" placeholder="Novo e-mail"><button class="btn2" onclick="setEmail()">Alterar e-mail</button></div>
  <div class="card p-4 space-y-3"><div class="text-sm font-semibold">Senha</div><input id="s-p1" type="password" class="inp" placeholder="Nova senha (mín. 6)" autocomplete="new-password"><input id="s-p2" type="password" class="inp" placeholder="Repita a nova senha" autocomplete="new-password"><button class="btn2" onclick="setPass()">Alterar senha</button></div>
  <div class="card p-4 flex items-center gap-3"><div class="flex-1"><div class="text-sm font-semibold">Mostrar quando estou online</div><div class="text-xs text-mut">Se desligar, os outros não veem quando você está online nem quando saiu.</div></div><button id="s-st" class="btn2 ${off ? '' : 'sel'}" onclick="setStatus()">${off ? 'Desligado' : 'Ligado'}</button></div>
  <div class="card p-4 space-y-3 !border-brand/40"><div class="text-sm font-semibold text-brand">Excluir conta</div><p class="text-xs text-mut">Apaga seu perfil, posts, comentários e mensagens. Não dá para desfazer.</p><button class="btn2 !text-brand" onclick="askDelete()">Excluir minha conta</button></div>`;
}
async function setProfile() {
  const u = { name: $('#s-name').value.trim(), bio: $('#s-bio').value.trim(), fav_anime: $('#s-fav').value.trim() }; if (u.name.length < 2) return T('Escolha um nome.');
  const { error } = await sb.from('profiles').update(u).eq('id', P.id); if (error) return T('Não salvou: ' + error.message); Object.assign(P, u); paintMe(); T('Perfil salvo.');
}
async function setEmail() { const e = $('#s-mail').value.trim(); if (!e) return T('Digite o novo e-mail.'); const { error } = await sb.auth.updateUser({ email: e }); if (error) return T('Não alterou: ' + error.message); T('Enviamos um link de confirmação para o novo e-mail.') }
async function setPass() {
  const a = $('#s-p1').value, b = $('#s-p2').value; if (a.length < 6) return T('A senha precisa ter pelo menos 6 caracteres.'); if (a !== b) return T('As senhas não são iguais.');
  const { error } = await sb.auth.updateUser({ password: a }); if (error) return T('Não alterou: ' + error.message); $('#s-p1').value = $('#s-p2').value = ''; T('Senha alterada.');
}
async function setStatus() {
  const on = P.show_status === false, { error } = await sb.from('profiles').update({ show_status: on }).eq('id', P.id); if (error) return T(/show_status/.test(error.message) ? 'Falta rodar a migração 4 no Supabase.' : 'Não salvou: ' + error.message);
  P.show_status = on; if (typeof CH !== 'undefined' && CH.pr) { on ? CH.pr.track({ t: Date.now() }) : CH.pr.untrack() }
  const b = $('#s-st'); b.textContent = on ? 'Ligado' : 'Desligado'; b.classList.toggle('sel', on);
}
function askDelete() {
  modal(`<h3 class="font-bold text-lg mb-2 text-brand">Excluir conta</h3><p class="text-sm text-mut mb-3">Para confirmar, digite <b>EXCLUIR</b>.</p><input id="dx" class="inp mb-3" placeholder="EXCLUIR" autocomplete="off"><div class="flex gap-2 justify-end"><button class="btn2" onclick="closeM()">Cancelar</button><button class="btn" onclick="doDelete()">Excluir para sempre</button></div>`);
}
async function doDelete() {
  if ($('#dx').value.trim().toUpperCase() !== 'EXCLUIR') return T('Digite EXCLUIR para confirmar.');
  const { error } = await sb.rpc('delete_my_account'); if (error) return T(/delete_my_account/.test(error.message) ? 'Falta rodar a migração 4 no Supabase.' : 'Não excluiu: ' + error.message);
  await sb.auth.signOut(); location.reload();
}
