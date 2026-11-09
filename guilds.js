/* OtaWeb · Guildas: comunidades com identidade própria, mural separado do feed, salão de conversa e patentes por atividade */
const GCATS = { shonen: 'Shonen', seinen: 'Seinen', shojo: 'Shojo', isekai: 'Isekai', slice: 'Slice of Life', mecha: 'Mecha', romance: 'Romance', terror: 'Terror e suspense', esportes: 'Esportes', cosplay: 'Cosplay', manga: 'Mangá', games: 'Games', musica: 'Música e AMV', geral: 'Geral' };
const GCOL = { wine: '#7a1633', violet: '#6d28d9', blue: '#1d4ed8', teal: '#0f766e', green: '#15803d', amber: '#b45309', orange: '#c2410c', pink: '#be185d' };
const TIERS = [[400, 'Lenda'], [150, 'Elite'], [50, 'Veterano'], [10, 'Aventureiro'], [0, 'Recruta']];
const tierOf = xp => TIERS.find(t => xp >= t[0]), nextTier = xp => [...TIERS].reverse().find(t => t[0] > xp);
const GD = { tab: 'minhas', cat: '', q: '', g: null, gtab: 'mural', rk: [], t: null };
let GF = {};
const gcol = g => GCOL[g.color] || GCOL.wine, isOff = g => ['owner', 'officer'].includes(g.my_role), gLink = g => location.href.split('#')[0] + '#g-' + g.slug;
const gBanner = g => g.banner_url ? `background:url('${E(g.banner_url)}') center/cover` : `background:linear-gradient(135deg,${gcol(g)},${gcol(g)}88)`;
const gEmblem = (g, s) => g.emblem_url ? `<img src="${E(g.emblem_url)}" style="width:${s}px;height:${s}px" class="rounded-xl object-cover shrink-0 ring-2 ring-card" alt="">` : `<span style="width:${s}px;height:${s}px;background:${gcol(g)};font-size:${Math.round(s * .42)}px" class="rounded-xl grid place-items-center text-white font-bold shrink-0 ring-2 ring-card">${E((g.name || '?')[0].toUpperCase())}</span>`;
const gMissing = e => /does not exist|schema cache|Could not find/.test(e.message || '');

/* ---------- aba Guildas: minhas e descobrir ---------- */
async function openGuilds() {
  const el = $('#v-groups'), d = GD.tab === 'descobrir';
  el.innerHTML = `<div class="max-w-xl mx-auto p-3 md:py-5 space-y-3">
   <div class="flex items-center justify-between px-1"><h2 class="font-bold text-xl">Guildas</h2><button class="btn !py-2" onclick="guildForm()">${ic('plus', false, 16)}Criar guilda</button></div>
   <div class="grid grid-cols-2 gap-1 p-1 rounded-xl bg-soft"><button class="btn2 !border-0 ${d ? '' : 'sel'}" onclick="GD.tab='minhas';openGuilds()">Minhas</button><button class="btn2 !border-0 ${d ? 'sel' : ''}" onclick="GD.tab='descobrir';openGuilds()">Descobrir</button></div>
   ${d ? `<input id="gq" class="inp" placeholder="Buscar guilda ou obra" value="${E(GD.q)}" oninput="clearTimeout(GD.t);GD.t=setTimeout(()=>{GD.q=this.value.trim();loadGuildList()},300)" autocomplete="off">
   <div class="flex gap-1.5 overflow-x-auto pb-1"><button class="btn2 !py-1 !px-3 text-xs whitespace-nowrap ${GD.cat ? '' : 'sel'}" onclick="GD.cat='';openGuilds()">Todas</button>${Object.entries(GCATS).map(([k, l]) => `<button class="btn2 !py-1 !px-3 text-xs whitespace-nowrap ${GD.cat === k ? 'sel' : ''}" onclick="GD.cat='${k}';openGuilds()">${l}</button>`).join('')}</div>` : ''}
   <div id="gl" class="space-y-3"><div class="sk h-28"></div><div class="sk h-28"></div></div></div>`;
  loadGuildList();
}
async function loadGuildList() {
  if (!$('#gl')) return;
  const { data, error } = await sb.rpc('guild_directory', { p_q: GD.q || null, p_cat: GD.cat || null, p_mine: GD.tab !== 'descobrir', p_limit: 40 }), el = $('#gl'); if (!el) return;
  if (error) { el.innerHTML = errH(gMissing(error) ? 'Falta rodar a migração 12 no Supabase.' : error); return }
  el.innerHTML = (data || []).map(guildCard).join('') || (GD.tab === 'descobrir' ? '<p class="text-center text-sm text-mut py-10">Nenhuma guilda encontrada.</p>' : `<div class="text-center py-10 space-y-3"><p class="text-sm text-mut">Você ainda não participa de nenhuma guilda.</p><button class="btn2" onclick="GD.tab='descobrir';openGuilds()">Descobrir guildas</button></div>`);
}
const joinBtn = g => g.my_status === 'active' ? '<span class="text-[11px] font-semibold text-mut bg-soft rounded-full px-2.5 py-1">Membro</span>' : g.my_status === 'pending' ? '<span class="text-[11px] font-semibold text-mut bg-soft rounded-full px-2.5 py-1">Pendente</span>' : g.my_status === 'banned' ? '' :
  `<button class="btn !py-1.5 !px-3 text-xs" onclick="guildJoin('${g.id}',event)">${g.is_private ? 'Pedir para entrar' : 'Entrar na guilda'}</button>`;
function guildCard(g) {
  return `<article class="card overflow-hidden cursor-pointer slide" onclick="openGuild('${g.id}')"><div class="h-16" style="${gBanner(g)}"></div>
   <div class="px-3 pb-3 -mt-6 flex gap-3 items-end">${gEmblem(g, 56)}<div class="min-w-0 flex-1 pb-0.5"><div class="font-bold truncate">${E(g.name)}</div><div class="text-[11px] text-mut truncate"><span>${GCATS[g.category]}</span> · <span>${g.members} membros</span>${g.posts7 ? ' · <span>' + g.posts7 + ' posts na semana</span>' : ''}</div></div><div class="pb-1 shrink-0">${joinBtn(g)}</div></div>
   ${g.description ? `<p class="px-3 pb-3 text-sm text-mut line-clamp-2">${E(g.description)}</p>` : ''}</article>`;
}

/* ---------- página da guilda ---------- */
async function openGuild(key) {
  go('other'); window.lastProfile = null; $('#q').value = ''; if (!GD.g || (GD.g.id !== key && GD.g.slug !== key)) GD.gtab = 'mural';
  $('#v-other').innerHTML = backBtn('groups') + '<div class="sk h-44"></div><div class="sk h-24"></div>';
  const { data, error } = await sb.rpc('guild_get', { p_key: String(key) });
  if (error || !data) { go('groups'); return T(error ? (gMissing(error) ? 'Falta rodar a migração 12 no Supabase.' : error.message) : 'Guilda não encontrada.') }
  GD.g = data; window.reloadOther = () => openGuild(data.id); drawGuild();
}
function gActions(g) {
  const st = g.my_status;
  if (st === 'active') return `<button class="btn" onclick="guildHall()">${ic('msgc', false, 16)}Salão da guilda</button><button class="btn2" onclick="guildLeave()">Sair da guilda</button>`;
  if (st === 'pending') return '<span class="text-xs font-semibold bg-soft rounded-full px-3 py-2">Pedido enviado</span><button class="btn2" onclick="guildLeave()">Cancelar pedido</button>';
  if (st === 'banned') return '<span class="text-xs text-mut">Você não pode entrar nesta guilda</span>';
  return `<button class="btn" onclick="guildJoin('${g.id}')">${g.is_private ? 'Pedir para entrar' : 'Entrar na guilda'}</button>`;
}
function drawGuild() {
  const g = GD.g, c = gcol(g), tabs = [['mural', 'Mural'], ['membros', 'Membros'], ['destaques', 'Destaques'], ['sobre', 'Sobre']];
  $('#v-other').innerHTML = backBtn('groups') + `<div class="card overflow-hidden"><div class="h-28" style="${gBanner(g)}"></div>
  <div class="px-4 pb-4 -mt-9"><div class="flex items-end gap-3">${gEmblem(g, 76)}<div class="min-w-0 flex-1 pb-1"><h2 class="font-bold text-xl leading-tight break-words">${E(g.name)}</h2>
   <div class="flex flex-wrap gap-1.5 mt-1 text-[11px] font-semibold"><span class="rounded-full px-2 py-0.5 text-white" style="background:${c}">${GCATS[g.category]}</span><span class="rounded-full px-2 py-0.5 bg-soft text-mut">${ic(g.is_private ? 'lock' : 'globe', false, 11)} ${g.is_private ? 'Privada' : 'Pública'}</span><span class="rounded-full px-2 py-0.5 bg-soft text-mut">${g.members} membros</span></div></div>
   <button class="circ shrink-0" onclick="gMenu()" aria-label="Mais opções">${ic('more', false, 20)}</button></div>
  ${g.focus ? `<div class="text-sm mt-3"><span class="text-mut">Obra em foco:</span> <b>${E(g.focus)}</b></div>` : ''}<div class="flex flex-wrap items-center gap-2 mt-3">${gActions(g)}</div></div></div>
  <div class="flex gap-2 overflow-x-auto">${tabs.map(([k, l]) => `<button class="btn2 !py-1.5 !px-3 whitespace-nowrap ${GD.gtab === k ? 'sel' : ''}" onclick="GD.gtab='${k}';drawGuild()">${l}</button>`).join('')}</div><div id="gb" class="space-y-3"></div>`;
  ({ mural: gMural, membros: gMembros, destaques: gDestaques, sobre: gSobre })[GD.gtab]();
}
const gLocked = () => `<div class="card p-8 text-center space-y-2"><div class="w-14 h-14 mx-auto rounded-full bg-soft text-brand grid place-items-center">${ic('lock', false, 26)}</div><div class="font-bold">Esta guilda é privada</div><p class="text-sm text-mut">Entre para ver as publicações, os membros e o salão.</p></div>`;
function gMenu() {
  const g = GD.g, it = [[ic('link') + ' Copiar link da guilda', () => copy(gLink(g))]];
  if (isOff(g)) it.push([ic('edit') + ' Editar guilda', () => guildForm(g)]);
  if (g.my_role !== 'owner') it.push([ic('flag') + ' Denunciar guilda', () => reportModal({ guild: g.id })]);
  if (g.my_role === 'owner') it.push([ic('trash') + ' Excluir guilda', () => confirmBox('Excluir guilda?', 'A guilda, o mural e o salão somem para todos. Não dá para desfazer.', 'Excluir', guildDelete)]);
  menu(g.name, it);
}

/* mural */
async function gMural() {
  const g = GD.g, box = $('#gb'); if (g.is_private && g.my_status !== 'active') { box.innerHTML = gLocked(); return }
  const comp = g.my_status === 'active' ? `<div class="card p-3 space-y-3"><div class="flex items-center gap-3">${av(P, 42)}<button class="flex-1 text-left inp !rounded-full text-mut" onclick="guildCompose('text')">Publicar na guilda</button></div>
   <div class="grid grid-cols-3 gap-1 border-t border-line pt-2"><button class="act" onclick="guildCompose('photo')"><span class="text-brand">${ic('image', false, 20)}</span>Foto</button><button class="act" onclick="guildCompose('video')"><span class="text-brand">${ic('video', false, 20)}</span>Vídeo</button><button class="act" onclick="guildCompose('poll')"><span class="text-brand">${ic('chart', false, 20)}</span>Enquete</button></div></div>` : '';
  box.innerHTML = comp + '<div id="gposts" class="space-y-3"><div class="sk h-32"></div></div>';
  const { data, error } = await sb.from('posts').select(SEL).eq('guild_id', g.id).order('guild_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(40), el = $('#gposts'); if (!el) return;
  if (error) { el.innerHTML = errH(error); return }
  posts = await prep(data); el.innerHTML = safe(posts) || '<p class="text-center text-sm text-mut py-10">Nenhuma publicação nesta guilda ainda.</p>';
  posts.filter(p => p.guild_pinned).forEach(p => { const a = document.getElementById('p-' + p.id); if (a) a.insertAdjacentHTML('afterbegin', `<div class="px-4 pt-3 -mb-1 text-xs font-semibold text-brand">${ic('bookmark', true, 13)} Fixada pelos oficiais</div>`) });
}
function guildCompose(kind) { window.GCTX = GD.g.id; openCreate(kind) }
// itens extras no menu de três pontos dos posts (usado pelo app.js)
function postExtra(p) {
  if (!p.guild_id || !GD.g || GD.g.id !== p.guild_id || !isOff(GD.g)) return [];
  return [[ic('bookmark', !!p.guild_pinned) + (p.guild_pinned ? ' Desafixar da guilda' : ' Fixar na guilda'), async () => { const { error } = await sb.rpc('guild_pin', { p_post: p.id, p_pin: !p.guild_pinned }); if (error) return T(error.message); gMural() }]];
}

/* membros */
const memberRow = (u, off) => `<div class="flex items-center gap-3 p-3"><button onclick="showProfile('${u.id}')" aria-label="Ver perfil">${av(u, 42)}</button><span class="min-w-0 flex-1"><span class="flex items-center gap-1.5 flex-wrap"><span class="text-sm font-semibold truncate">${E(u.name)}</span>${u.role !== 'member' ? `<span class="text-[10px] font-bold rounded-full px-2 py-0.5 ${u.role === 'owner' ? 'bg-brand text-white' : 'bg-soft text-brand'}">${u.role === 'owner' ? 'Líder' : 'Oficial'}</span>` : ''}</span>
  <span class="block text-xs text-mut"><span>${tierOf(u.xp)[1]}</span> · <span>${u.xp} XP</span></span></span>${off && u.id !== P.id && u.role !== 'owner' ? `<button class="circ" onclick="gMemberMenu('${u.id}')" aria-label="Ações">${ic('more', false, 18)}</button>` : ''}</div>`;
async function gMembros() {
  const g = GD.g, box = $('#gb'), off = isOff(g); if (g.is_private && g.my_status !== 'active') { box.innerHTML = gLocked(); return }
  box.innerHTML = '<div class="sk h-16"></div><div class="sk h-16"></div>';
  const [rk, pd] = await Promise.all([sb.rpc('guild_ranking', { p_guild: g.id }), off ? sb.rpc('guild_pending', { p_guild: g.id }) : Promise.resolve({ data: [] })]);
  if (!$('#gb')) return; if (rk.error) { box.innerHTML = errH(rk.error); return }
  GD.rk = rk.data || []; const pend = pd.data || [];
  box.innerHTML = (pend.length ? `<div class="card p-3 space-y-3"><div class="text-sm font-semibold">Pedidos para entrar (${pend.length})</div>${pend.map(u => `<div class="flex items-center gap-3"><button onclick="showProfile('${u.id}')" aria-label="Ver perfil">${av(u, 40)}</button><span class="min-w-0 flex-1"><span class="block text-sm font-semibold truncate">${E(u.name)}</span><span class="block text-xs text-mut">@${E(u.handle)}</span></span><button class="btn !py-1.5 !px-3 text-xs" onclick="guildAct('${u.id}','approve')">Aprovar</button><button class="btn2 !py-1.5 !px-3 text-xs" onclick="guildAct('${u.id}','reject')">Recusar</button></div>`).join('')}</div>` : '') +
    `<div class="card divide-y divide-line overflow-hidden">${GD.rk.map(u => memberRow(u, off)).join('')}</div>`;
}
function gMemberMenu(uid) {
  const u = GD.rk.find(x => x.id === uid); if (!u) return; const own = GD.g.my_role === 'owner', it = [[ic('user') + ' Ver perfil', () => showProfile(uid)]];
  if (own) {
    it.push(u.role === 'officer' ? [ic('star') + ' Rebaixar a membro', () => guildAct(uid, 'demote')] : [ic('star') + ' Promover a oficial', () => guildAct(uid, 'promote')]);
    it.push([ic('star', true) + ' Transferir liderança', () => confirmBox('Transferir liderança?', 'Você passa a ser oficial e a outra pessoa vira a líder da guilda.', 'Transferir', () => guildAct(uid, 'transfer'))]);
  }
  if (own || u.role === 'member') { it.push([ic('logout') + ' Expulsar da guilda', () => guildAct(uid, 'kick')]); it.push([ic('ban') + ' Banir da guilda', () => confirmBox('Banir da guilda?', 'A pessoa sai e não consegue entrar de novo.', 'Banir', () => guildAct(uid, 'ban'))]) }
  menu(u.name, it);
}
async function guildAct(uid, action) {
  const { error } = await sb.rpc('guild_manage', { p_guild: GD.g.id, p_user: uid, p_action: action }); if (error) return T(error.message);
  T({ approve: 'Pedido aprovado.', reject: 'Pedido recusado.', kick: 'Pessoa removida da guilda.', ban: 'Pessoa banida da guilda.', promote: 'Cargo atualizado.', demote: 'Cargo atualizado.', transfer: 'Liderança transferida.' }[action] || 'Pronto.'); openGuild(GD.g.id);
}

/* destaques: patentes e ranking do mês */
async function gDestaques() {
  const g = GD.g, box = $('#gb'); if (g.is_private && g.my_status !== 'active') { box.innerHTML = gLocked(); return }
  box.innerHTML = '<div class="sk h-24"></div><div class="sk h-40"></div>';
  const { data, error } = await sb.rpc('guild_ranking', { p_guild: g.id }); if (!$('#gb')) return; if (error) { box.innerHTML = errH(error); return }
  const list = data || [], me = list.find(u => u.id === P.id), top = [...list].sort((a, b) => b.month - a.month).filter(u => u.month > 0).slice(0, 5), c = gcol(g);
  let mine = '';
  if (me) { const t = tierOf(me.xp), n = nextTier(me.xp), pc = n ? Math.round((me.xp - t[0]) / (n[0] - t[0]) * 100) : 100;
    mine = `<div class="card p-4 space-y-2"><div class="text-xs text-mut">Sua patente</div><div class="flex items-end justify-between"><div class="text-2xl font-extrabold" style="color:${c}">${t[1]}</div><div class="text-sm font-semibold">${me.xp} XP</div></div>
    <div class="h-2 rounded-full bg-soft overflow-hidden"><div class="h-full rounded-full" style="width:${pc}%;background:${c}"></div></div><div class="text-xs text-mut">${n ? 'Faltam ' + (n[0] - me.xp) + ' XP para ' + n[1] : 'Você chegou ao topo!'}</div></div>`; }
  box.innerHTML = mine + `<div class="card p-3 space-y-2"><div class="text-sm font-semibold flex items-center gap-2"><span class="text-brand">${ic('trophy', false, 18)}</span>Destaques do mês</div>` +
    (top.map((u, i) => `<div class="flex items-center gap-3"><span class="w-6 text-center font-bold ${i === 0 ? 'text-brand' : 'text-mut'}">${i + 1}</span><button onclick="showProfile('${u.id}')" aria-label="Ver perfil">${av(u, 36)}</button><span class="flex-1 min-w-0 text-sm font-semibold truncate">${E(u.name)}</span><span class="text-xs text-mut">${u.month} XP</span></div>`).join('') || '<p class="text-sm text-mut text-center py-4">Ninguém pontuou este mês ainda. Publique e comente para aparecer aqui!</p>') + '</div>' +
    `<div class="card p-3 space-y-2"><div class="text-sm font-semibold">Como ganhar XP</div><div class="text-xs text-mut space-y-1"><div>Publicar: +5 XP</div><div>Comentar: +2 XP</div><div>Receber uma reação: +1 XP</div></div>
    <div class="flex flex-wrap gap-1.5 pt-1">${[...TIERS].reverse().map(t => `<span class="text-[11px] rounded-full bg-soft px-2.5 py-1"><b>${t[1]}</b> <span class="text-mut">${t[0]} XP</span></span>`).join('')}</div></div>`;
}

/* sobre */
function gSobre() {
  const g = GD.g, o = g.owner || {};
  $('#gb').innerHTML = `<div class="card p-4 space-y-3">${g.description ? `<div><div class="text-xs font-semibold text-mut mb-1">Descrição</div><p class="text-sm whitespace-pre-wrap break-words">${E(g.description)}</p></div>` : ''}
   ${g.rules ? `<div><div class="text-xs font-semibold text-mut mb-1">Regras</div><p class="text-sm whitespace-pre-wrap break-words">${E(g.rules)}</p></div>` : ''}
   <div class="text-sm"><span class="text-mut">Líder:</span> <button class="font-semibold text-brand" onclick="showProfile('${o.id}')">${E(o.name || '')}</button></div>
   <div class="text-sm"><span class="text-mut">Criada em</span> ${new Date(g.created_at).toLocaleDateString(window.LOCALE || 'pt-PT')}</div>
   <button class="btn2 w-full" onclick="copy('${E(gLink(g))}')">${ic('link', false, 16)}Copiar link da guilda</button></div>`;
}

/* ---------- entrar, sair, salão, excluir ---------- */
async function guildJoin(id, ev) {
  if (ev) ev.stopPropagation();
  const { data, error } = await sb.rpc('guild_join', { p_guild: id }); if (error) return T(error.message);
  T(data === 'pending' ? 'Pedido enviado. Um oficial vai analisar.' : 'Você entrou na guilda!');
  if (GD.g && GD.g.id === id && !$('#v-other').classList.contains('hidden')) openGuild(id); else loadGuildList();
}
function guildLeave() {
  const g = GD.g, pend = g.my_status === 'pending';
  confirmBox(pend ? 'Cancelar pedido?' : 'Sair da guilda?', pend ? 'Seu pedido para entrar será retirado.' : 'Você deixa de ver o mural e o salão desta guilda.', 'Confirmar', async () => {
    const { error } = await sb.rpc('guild_leave', { p_guild: g.id }); if (error) return T(error.message); T(pend ? 'Pedido cancelado.' : 'Você saiu da guilda.'); openGuild(g.id);
  });
}
async function guildDelete() { const { error } = await sb.rpc('guild_delete', { p_guild: GD.g.id }); if (error) return T(error.message); GD.g = null; T('Guilda excluída.'); go('groups') }
async function guildHall() {
  const id = GD.g.chat_id; if (!id) return T('O salão desta guilda não está disponível.');
  await loadChats(); if (!CH.list.find(c => c.id === id)) return T('O salão desta guilda não está disponível.');
  openChat(id); go('msgs');
}

/* ---------- criar e editar ---------- */
function guildForm(g) {
  if (typeof restrOk === 'function' && !restrOk('posts')) return;
  GF = { edit: g || null, color: g ? g.color : 'wine', priv: g ? g.is_private : false, emblem: g ? g.emblem_url : null, banner: g ? g.banner_url : null, ef: null, bf: null };
  modal(`<div class="flex items-center justify-between mb-3"><h3 class="font-bold text-lg">${g ? 'Editar guilda' : 'Criar guilda'}</h3><button class="circ" onclick="closeM()" aria-label="Fechar">${ic('x', false, 18)}</button></div>
  <div class="max-h-[70dvh] overflow-y-auto space-y-3 pr-1">${g ? '' : '<input id="gf-n" class="inp" maxlength="30" placeholder="Nome da guilda (único na rede)">'}
   <select id="gf-c" class="inp">${Object.entries(GCATS).map(([k, l]) => `<option value="${k}" ${g && g.category === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
   <input id="gf-f" class="inp" maxlength="60" placeholder="Obra em foco (opcional)" value="${E(g ? g.focus || '' : '')}">
   <textarea id="gf-d" rows="3" class="inp" maxlength="500" placeholder="Descrição">${E(g ? g.description : '')}</textarea>
   <textarea id="gf-r" rows="3" class="inp" maxlength="1000" placeholder="Regras da guilda (opcional)">${E(g ? g.rules : '')}</textarea>
   <div><div class="text-xs font-semibold mb-1.5">Cor da guilda</div><div class="flex gap-2 flex-wrap" id="gf-col">${Object.entries(GCOL).map(([k, v]) => `<button type="button" class="w-8 h-8 rounded-full ring-2 ${k === GF.color ? 'ring-ink' : 'ring-transparent'}" style="background:${v}" data-gc="${k}" onclick="gfColor('${k}')" aria-label="Escolher cor"></button>`).join('')}</div></div>
   <div class="grid grid-cols-2 gap-2"><button type="button" id="gf-pub" class="btn2" onclick="gfPriv(false)">${ic('globe', false, 16)}Pública</button><button type="button" id="gf-prv" class="btn2" onclick="gfPriv(true)">${ic('lock', false, 16)}Privada</button></div><div class="text-[11px] text-mut" id="gf-hint"></div>
   <div class="grid grid-cols-2 gap-2"><label class="btn2 cursor-pointer">${ic('image', false, 16)}Emblema<input type="file" accept="image/*" class="hidden" onchange="GF.ef=this.files[0];this.parentElement.classList.add('sel')"></label><label class="btn2 cursor-pointer">${ic('image', false, 16)}Banner<input type="file" accept="image/*" class="hidden" onchange="GF.bf=this.files[0];this.parentElement.classList.add('sel')"></label></div></div>
  <button id="gf-go" class="btn w-full !py-3 mt-3" onclick="guildSave()">${g ? 'Salvar' : 'Criar guilda'}</button>`);
  gfPriv(GF.priv);
}
function gfColor(k) { GF.color = k; document.querySelectorAll('#gf-col button').forEach(b => { const on = b.dataset.gc === k; b.classList.toggle('ring-ink', on); b.classList.toggle('ring-transparent', !on) }) }
function gfPriv(p) {
  GF.priv = p; $('#gf-pub').classList.toggle('sel', !p); $('#gf-prv').classList.toggle('sel', p);
  $('#gf-hint').textContent = p ? 'Só membros veem o mural, os membros e o salão. Quem quiser entrar precisa de aprovação.' : 'Qualquer pessoa vê o mural e entra na hora.';
}
async function guildSave() {
  const e = GF.edit, go = $('#gf-go'); go.disabled = true; const v = { c: $('#gf-c').value, f: $('#gf-f').value.trim(), d: $('#gf-d').value.trim(), r: $('#gf-r').value.trim() };
  if (!e) { const n = $('#gf-n').value.trim(); if (n.length < 3) { T('O nome da guilda precisa ter de 3 a 30 caracteres'); go.disabled = false; return } v.n = n }
  let emblem = GF.emblem, banner = GF.banner;
  if (GF.ef) { T('Enviando...'); const m = await upload(GF.ef); if (!m) { go.disabled = false; return } emblem = m.url }
  if (GF.bf) { const m = await upload(GF.bf); if (!m) { go.disabled = false; return } banner = m.url }
  const args = { p_category: v.c, p_focus: v.f, p_description: v.d, p_rules: v.r, p_color: GF.color, p_private: GF.priv, p_emblem: emblem, p_banner: banner };
  const { data, error } = e ? await sb.rpc('guild_update', { p_guild: e.id, ...args }) : await sb.rpc('guild_create', { p_name: v.n, ...args });
  if (error) { go.disabled = false; return T(gMissing(error) ? 'Falta rodar a migração 12 no Supabase.' : error.message) }
  closeM(); T(e ? 'Guilda atualizada.' : 'Guilda criada!'); openGuild(e ? e.id : data.id);
}

/* ---------- guildas na busca geral ---------- */
const _srch = _search;
_search = async function (q) {
  await _srch(q);
  const { data } = await sb.rpc('guild_directory', { p_q: q, p_cat: null, p_mine: false, p_limit: 4 }), el = $('#v-other');
  if (data && data.length && el) el.insertAdjacentHTML('afterbegin', '<h3 class="text-sm font-bold text-brand">Guildas</h3>' + data.map(g => `<button class="card w-full flex items-center gap-3 p-3 text-left" onclick="openGuild('${g.id}')">${gEmblem(g, 44)}<span class="min-w-0 flex-1"><span class="block text-sm font-semibold truncate">${E(g.name)}</span><span class="block text-xs text-mut"><span>${GCATS[g.category]}</span> · <span>${g.members} membros</span></span></span></button>`).join(''));
};
