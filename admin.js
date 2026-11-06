/* OtaWeb · painel de administração (a segurança fica no banco: as funções admin_* só respondem a admins) */
const AD = { tab: 'resumo', rs: 'open', as: 'open', t: null };

// conta uma visita por sessão do navegador (sem cookies e sem dados pessoais)
try { if (!sessionStorage.getItem('ow-v')) { sessionStorage.setItem('ow-v', '1'); sb.rpc('track_visit').then(() => {}) } } catch (e) {}

function openAdmin(tab) {
  if (!P || !P.is_admin) return T('Acesso restrito aos administradores.');
  AD.tab = tab || AD.tab; go('other'); window.lastProfile = null; window.reloadOther = () => {}; $('#q').value = '';
  const tabs = [['resumo', 'Resumo'], ['denuncias', 'Denúncias'], ['pedidos', 'Revisões'], ['suporte', 'Suporte'], ['usuarios', 'Usuários'], ['registro', 'Registro']];
  $('#v-other').innerHTML = backBtn('menu') + `<h2 class="font-bold text-xl px-1">Administração</h2>
  <div class="flex gap-2 overflow-x-auto pb-1">${tabs.map(([k, l]) => `<button class="btn2 !py-1.5 !px-3 whitespace-nowrap ${AD.tab === k ? 'sel' : ''}" onclick="openAdmin('${k}')">${l}</button>`).join('')}</div>
  <div id="ad-body" class="space-y-3"><div class="sk h-24"></div><div class="sk h-40"></div></div>`;
  ({ resumo: adResumo, denuncias: adDenuncias, pedidos: adPedidos, suporte: adSuporte, usuarios: adUsuarios, registro: adRegistro })[AD.tab]();
}
const adErr = e => errH(/does not exist|Could not find|schema cache/i.test(e.message || '') ? 'Falta rodar a migração 8 (ou a 7) no Supabase.' : e);
const fmtB = b => b >= 1e9 ? (b / 1e9).toFixed(2) + ' GB' : (b / 1e6).toFixed(1) + ' MB';
const stat = (l, v, s) => `<div class="card p-3"><div class="text-xs text-mut">${l}</div><div class="text-2xl font-bold">${v}</div>${s ? `<div class="text-[11px] text-mut">${s}</div>` : ''}</div>`;
function bars(ser, key, title) {
  const max = Math.max(1, ...ser.map(d => d[key]));
  return `<div class="card p-3"><div class="text-xs font-semibold mb-2">${title}</div><div class="flex items-end gap-1 h-20">${ser.map(d => `<div class="flex-1 flex flex-col justify-end h-full" title="${d.day}: ${d[key]}"><div class="bg-brand rounded-t" style="height:${Math.max(3, Math.round(d[key] / max * 100))}%;opacity:${d[key] ? 1 : .25}"></div></div>`).join('')}</div>
  <div class="flex justify-between text-[10px] text-mut mt-1"><span>${(ser[0] || {}).day ? ser[0].day.slice(5) : ''}</span><span>hoje</span></div></div>`;
}

async function _adResumo() {
  const [a, b] = await Promise.all([sb.rpc('admin_stats'), sb.rpc('admin_series')]), el = $('#ad-body'); if (!el) return;
  if (a.error) { el.innerHTML = adErr(a.error); return }
  const s = a.data, ser = b.data || [];
  el.innerHTML = `<div class="grid grid-cols-2 gap-3">
   ${stat('Usuários', s.users, '+' + s.users_24h + ' hoje · +' + s.users_7d + ' em 7 dias')}${stat('Online agora', s.online_now, s.active_24h + ' ativos em 24 h · ' + s.active_7d + ' em 7 dias')}
   ${stat('Visitas hoje', s.visits_today, s.visits_7d + ' nos últimos 7 dias')}${stat('Denúncias abertas', s.reports_open)}
   ${stat('Revisões pendentes', s.appeals_open ?? 0)}${stat('Penalidades', (s.banned || 0) + (s.restricted || 0), (s.banned || 0) + ' bloqueada(s) · ' + (s.restricted || 0) + ' com restrição')}
   ${stat('Publicações', s.posts, '+' + s.posts_24h + ' em 24 h')}${stat('Comentários', s.comments)}${stat('Mensagens', s.messages, s.chats + ' conversas · ' + s.groups + ' grupos')}${stat('Último mês', '+' + s.users_30d, 'novos usuários em 30 dias')}</div>
   ${bars(ser, 'users', 'Novos usuários · 14 dias')}${bars(ser, 'posts', 'Publicações · 14 dias')}${bars(ser, 'visits', 'Visitas · 14 dias')}
   <div class="card p-3 space-y-1"><div class="text-xs font-semibold">Espaço usado</div><div class="text-sm">Banco de dados: <b>${fmtB(s.db_bytes)}</b></div><div class="text-sm">Fotos, vídeos e áudios: <b>${fmtB(s.storage_bytes)}</b></div>
   <div class="text-[11px] text-mut">Compare com os limites do seu plano no Supabase para saber quando precisar crescer.</div></div>`;
}

/* ---------- ações ---------- */
const adCall = async (fn, args, ok) => { const { error } = await sb.rpc(fn, args); if (error) return T('Erro: ' + error.message); T(ok); openAdmin(AD.tab) };
const adSetRep = (id, st) => adCall('admin_set_report', { p_id: id, p_status: st }, st === 'dismissed' ? 'Denúncia descartada.' : st === 'open' ? 'Denúncia reaberta.' : 'Marcada como resolvida.');
const adDelPost = (pid, rid) => confirmBox('Apagar publicação?', 'Ela some para todos e não dá para desfazer.', 'Apagar', () => adCall('admin_delete_post', { p_id: pid, p_report: rid || null }, 'Publicação apagada.'));
const adLift = uid => confirmBox('Levantar penalidades?', 'A pessoa volta a poder usar a conta normalmente.', 'Levantar', () => adCall('admin_lift', { p_user: uid }, 'Penalidades levantadas.'));
const adToggleAdmin = (uid, v) => confirmBox(v ? 'Tornar administrador?' : 'Remover administrador?', v ? 'Essa pessoa poderá apagar conteúdo e aplicar penalidades.' : 'Ela perde o acesso ao painel.', 'Confirmar', () => adCall('admin_set_admin', { p_user: uid, p_val: v }, 'Cargo atualizado.'));

function adPenalty(uid, rid) {
  window._pen = { uid, rid: rid || null };
  modal(`<h3 class="font-bold text-lg mb-3">Aplicar penalidade</h3>
  <label class="text-xs font-semibold">Tipo</label>
  <select id="pn-t" class="inp mb-3" onchange="$('#pn-d').classList.toggle('hidden', this.value === 'ban')">
   <option value="messages">Impedir de enviar mensagens</option><option value="posts">Impedir de publicar</option><option value="comments">Impedir de comentar</option>
   <option value="account">Suspender a conta (sem acesso por um tempo)</option><option value="ban">Bloquear a conta para sempre</option></select>
  <div id="pn-d"><label class="text-xs font-semibold">Duração</label>
   <select id="pn-h" class="inp mb-3"><option value="24">1 dia</option><option value="72">3 dias</option><option value="168" selected>7 dias</option><option value="720">30 dias</option><option value="0">Até um administrador levantar</option></select></div>
  <label class="text-xs font-semibold">Motivo (a pessoa vai ver)</label>
  <select id="pn-r" class="inp mb-4"><option>Spam ou golpe</option><option>Assédio ou ameaça</option><option>Conteúdo impróprio</option><option>Violação dos termos da rede</option></select>
  <div class="flex gap-2 justify-end"><button class="btn2" onclick="closeM()">Cancelar</button><button class="btn" onclick="penApply()">Aplicar</button></div>`);
}
async function penApply() {
  const t = $('#pn-t').value, h = +$('#pn-h').value, r = $('#pn-r').value, p = window._pen; closeM();
  await adCall('admin_apply', { p_user: p.uid, p_scope: t, p_hours: t === 'ban' ? null : (h || null), p_reason: r, p_report: p.rid }, 'Penalidade aplicada.');
}
const penChips = u => (u.banned ? '<span class="text-[10px] font-bold bg-brand text-white rounded-full px-2 py-0.5">Bloqueada</span> ' : '') + (u.restrictions || []).map(r => `<span class="text-[10px] font-bold bg-soft text-brand rounded-full px-2 py-0.5">${SCOPE_LBL[r.scope]}${r.until ? ' até ' + fmtDT(r.until) : ''}</span>`).join(' ');

/* ---------- denúncias ---------- */
async function adDenuncias() {
  const el = $('#ad-body'); if (!el) return;
  const chips = [['open', 'Abertas'], ['resolved', 'Resolvidas'], ['dismissed', 'Descartadas'], ['all', 'Todas']].map(([k, l]) => `<button class="btn2 !py-1 !px-3 text-xs ${AD.rs === k ? 'sel' : ''}" onclick="AD.rs='${k}';adDenuncias()">${l}</button>`).join('');
  const { data, error } = await sb.rpc('admin_reports', { p_status: AD.rs }); if (!$('#ad-body')) return;
  if (error) { el.innerHTML = adErr(error); return }
  el.innerHTML = `<div class="flex gap-2 overflow-x-auto">${chips}</div>` + ((data || []).map(adRep).join('') || '<p class="text-center text-sm text-mut py-10">Nenhuma denúncia aqui.</p>');
}
function evidenceH(r) {
  const ev = r.evidence || []; if (!ev.length) return '';
  return `<div class="rounded-xl bg-soft p-2 space-y-1.5 max-h-72 overflow-y-auto"><div class="text-[11px] font-semibold text-mut px-1">Mensagens enviadas pelo denunciante (${ev.length})</div>` +
    ev.map(m => { const hit = m.id === r.message_id; return `<div class="rounded-lg px-2.5 py-1.5 text-sm ${hit ? 'bg-brand/15 ring-1 ring-brand' : 'bg-card'}"><div class="text-[11px] text-mut"><b>${E(m.sender_name || '?')}</b> · ${fmtDT(m.at)}${hit ? ' · <span class="text-brand font-bold">denunciada</span>' : ''}</div>
      ${m.deleted ? '<i class="text-mut">apagada pelo autor</i>' : `${m.body && m.body !== '__heart__' ? `<div class="whitespace-pre-wrap break-words">${E(m.body)}</div>` : ''}${m.poll ? `<div>Enquete: ${E(m.poll)}</div>` : ''}${m.lat != null ? '<div class="text-mut">Localização compartilhada</div>' : ''}${m.media_url ? mediaH(m.media_url, m.media_type, 'rounded-lg max-h-40 mt-1') : ''}`}</div>` }).join('') + '</div>';
}
function adRep(r) {
  if (r.story) return adRepStory(r);
  const kind = r.message_id ? 'Mensagem' : r.post ? 'Publicação' : r.chat ? (r.chat.is_group ? 'Grupo' : 'Conversa') : 'Usuário', open = r.status === 'open', who = r.reporter || {};
  const st = { open: 'Aberta', resolved: 'Resolvida', dismissed: 'Descartada' }[r.status]; let body = '', acts = '';
  if (r.post) {
    body = `<div class="text-xs text-mut">Autor: <button class="font-semibold text-brand" onclick="showProfile('${r.post.author_id}')">${E(r.post.author_name)} (@${E(r.post.author_handle)})</button></div>
      ${r.post.body ? `<p class="text-sm whitespace-pre-wrap break-words">${E(r.post.body)}</p>` : ''}${mediaH(r.post.media_url, r.post.media_type, 'rounded-lg max-h-48')}`;
    acts = `<button class="btn2 !py-1.5 !px-3 text-xs" onclick="showPost('${r.post.id}')">Ver publicação</button><button class="btn !py-1.5 !px-3 text-xs" onclick="adDelPost('${r.post.id}','${r.id}')">Apagar post</button><button class="btn2 !py-1.5 !px-3 text-xs !text-brand" onclick="adPenalty('${r.post.author_id}','${r.id}')">Penalizar autor</button>`;
  } else {
    if (r.user) { body += `<div class="text-sm">Pessoa denunciada: <button class="font-semibold text-brand" onclick="showProfile('${r.user.id}')">${E(r.user.name)} (@${E(r.user.handle)})</button>${r.user.banned ? ' · bloqueada' : ''}</div>`; acts = `<button class="btn2 !py-1.5 !px-3 text-xs" onclick="showProfile('${r.user.id}')">Ver perfil</button><button class="btn !py-1.5 !px-3 text-xs" onclick="adPenalty('${r.user.id}','${r.id}')">Penalizar</button>` }
    if (r.chat && !r.user) body += `<div class="text-sm">${r.chat.is_group ? 'Grupo' : 'Conversa'}: <b>${E(r.chat.name || 'sem nome')}</b></div>`;
    body += evidenceH(r) || (r.chat ? '<div class="text-xs text-mut">Denúncia antiga, feita antes de a administração receber as mensagens.</div>' : '');
  }
  return `<div class="card p-3 space-y-2"><div class="flex items-center justify-between gap-2"><span class="text-xs font-bold text-brand">${kind} · ${E(r.reason || 'sem motivo')}</span><span class="text-[11px] text-mut">${st} · ${ago(r.created_at)}</span></div>${body}
  <div class="text-[11px] text-mut">Denunciado por ${E(who.name || '?')} (@${E(who.handle || '?')})${r.note ? ' · ' + E(r.note) : ''}</div>
  <div class="flex flex-wrap gap-2 pt-1">${open ? acts + `<button class="btn2 !py-1.5 !px-3 text-xs" onclick="adSetRep('${r.id}','dismissed')">Descartar</button><button class="btn2 !py-1.5 !px-3 text-xs" onclick="adSetRep('${r.id}','resolved')">Resolvida</button>` : `<button class="btn2 !py-1.5 !px-3 text-xs" onclick="adSetRep('${r.id}','open')">Reabrir</button>`}</div></div>`;
}

/* ---------- pedidos de revisão ---------- */
async function adPedidos() {
  const el = $('#ad-body'); if (!el) return;
  const chips = [['open', 'Pendentes'], ['accepted', 'Aceitos'], ['denied', 'Negados'], ['all', 'Todos']].map(([k, l]) => `<button class="btn2 !py-1 !px-3 text-xs ${AD.as === k ? 'sel' : ''}" onclick="AD.as='${k}';adPedidos()">${l}</button>`).join('');
  const { data, error } = await sb.rpc('admin_appeals', { p_status: AD.as }); if (!$('#ad-body')) return;
  if (error) { el.innerHTML = adErr(error); return }
  const kn = Object.fromEntries(KINDS), stt = { open: 'Pendente', accepted: 'Aceito', denied: 'Negado' };
  el.innerHTML = `<div class="flex gap-2 overflow-x-auto">${chips}</div>` + ((data || []).map(a => `<div class="card p-3 space-y-2"><div class="flex items-center justify-between gap-2"><button class="text-sm font-semibold text-brand truncate" onclick="showProfile('${a.user.id}')">${E(a.user.name)} (@${E(a.user.handle)})</button><span class="text-[11px] text-mut shrink-0">${stt[a.status]} · ${ago(a.created_at)}</span></div>
   <div class="text-xs text-mut">${a.restriction ? 'Penalidade: ' + SCOPE_LBL[a.restriction.scope] + (a.restriction.until ? ' até ' + fmtDT(a.restriction.until) : ' (sem prazo)') + (a.restriction.reason ? ' · ' + E(a.restriction.reason) : '') + (a.restriction.active ? '' : ' · já encerrada') : 'Penalidade removida'}</div>
   <div class="text-xs"><b>${E(kn[a.kind] || a.kind)}</b></div><p class="text-sm whitespace-pre-wrap break-words bg-soft rounded-lg p-2">${E(a.message)}</p>
   ${a.response ? `<div class="text-xs text-mut">Resposta: ${E(a.response)}</div>` : ''}
   ${a.status === 'open' ? `<div class="flex gap-2"><button class="btn !py-1.5 !px-3 text-xs" onclick="adAnswer('${a.id}',true)">Aceitar e levantar</button><button class="btn2 !py-1.5 !px-3 text-xs" onclick="adAnswer('${a.id}',false)">Negar</button></div>` : ''}</div>`).join('') || '<p class="text-center text-sm text-mut py-10">Nenhum pedido aqui.</p>');
}
async function adAnswer(id, ok) {
  const v = await askText(ok ? 'Aceitar pedido (mensagem opcional)' : 'Negar pedido (explique o motivo)', ''); if (v === null) return;
  await adCall('admin_answer_appeal', { p_id: id, p_accept: ok, p_response: v }, ok ? 'Pedido aceito. A penalidade foi levantada.' : 'Pedido negado.');
}

/* ---------- usuários ---------- */
async function adUsuarios() {
  const el = $('#ad-body'); if (!el) return;
  el.innerHTML = `<input id="ad-q" class="inp" placeholder="Buscar por nome ou @usuário" oninput="clearTimeout(AD.t);AD.t=setTimeout(adListUsers,300)" autocomplete="off"><div id="ad-users" class="space-y-2"><div class="sk h-16"></div></div>`; adListUsers();
}
async function adListUsers() {
  const q = $('#ad-q') ? $('#ad-q').value.trim() : '', box = $('#ad-users'); if (!box) return;
  const { data, error } = await sb.rpc('admin_users', { p_q: q, p_limit: 40 }); if (!$('#ad-users')) return;
  if (error) { box.innerHTML = adErr(error); return }
  box.innerHTML = (data || []).map(u => { const pen = u.banned || (u.restrictions || []).length;
    return `<div class="card p-3 flex items-center gap-3"><button class="shrink-0" onclick="showProfile('${u.id}')">${av(u, 44)}</button>
   <div class="min-w-0 flex-1"><div class="text-sm font-semibold truncate">${E(u.name)} ${u.is_admin ? '<span class="text-[10px] font-bold bg-brand text-white rounded-full px-2 py-0.5">Admin</span>' : ''}</div>
   <div class="text-xs text-mut truncate">@${E(u.handle)} · ${u.posts} posts · ${u.reports} denúncia(s)</div><div class="text-[11px] text-mut">Entrou ${ago(u.created_at)} · visto ${u.last_seen ? ago(u.last_seen) : 'nunca'}</div>${pen ? `<div class="flex flex-wrap gap-1 mt-1">${penChips(u)}</div>` : ''}</div>
   <button class="circ" onclick="adUserMenu('${u.id}',${!!pen},${u.is_admin})" aria-label="Ações">${ic('more', false, 20)}</button></div>` }).join('') || '<p class="text-center text-sm text-mut py-10">Ninguém encontrado.</p>';
}
function adUserMenu(id, pen, isAdm) {
  const it = [[ic('user') + ' Ver perfil', () => showProfile(id)]];
  if (!isAdm) it.push([ic('ban') + ' Aplicar penalidade', () => adPenalty(id)]);
  if (pen) it.push([ic('check') + ' Levantar penalidades', () => adLift(id)]);
  it.push(isAdm ? [ic('shield') + ' Remover administrador', () => adToggleAdmin(id, false)] : [ic('shield') + ' Tornar administrador', () => adToggleAdmin(id, true)]);
  menu('Ações', it);
}

/* ---------- registro ---------- */
async function adRegistro() {
  const el = $('#ad-body'); if (!el) return; const { data, error } = await sb.rpc('admin_log_list'); if (!$('#ad-body')) return;
  if (error) { el.innerHTML = adErr(error); return }
  const nm = { delete_post: 'apagou uma publicação', delete_story: 'apagou um story', ban: 'suspendeu uma conta', unban: 'reativou uma conta', apply_ban: 'bloqueou uma conta para sempre', support_reply: 'respondeu a um pedido de suporte', support_close: 'fechou um pedido de suporte', apply_account: 'suspendeu uma conta', apply_messages: 'impediu alguém de enviar mensagens', apply_posts: 'impediu alguém de publicar', apply_comments: 'impediu alguém de comentar', lift: 'levantou penalidades', appeal_accepted: 'aceitou um pedido de revisão', appeal_denied: 'negou um pedido de revisão', make_admin: 'tornou alguém administrador', remove_admin: 'removeu um administrador', report_dismissed: 'descartou uma denúncia', report_resolved: 'resolveu uma denúncia', report_open: 'reabriu uma denúncia' };
  el.innerHTML = `<div class="card divide-y divide-line overflow-hidden">${(data || []).map(l => `<div class="p-3"><div class="text-sm"><b>${E(l.admin)}</b> ${nm[l.action] || E(l.action)}</div>${l.details && l.details.body ? `<div class="text-xs text-mut truncate">“${E(l.details.body)}”</div>` : ''}${l.details && l.details.reason ? `<div class="text-xs text-mut">Motivo: ${E(l.details.reason)}${l.details.hours ? ' · ' + l.details.hours + ' h' : ''}</div>` : ''}<div class="text-[11px] text-mut">${ago(l.created_at)}</div></div>`).join('') || '<p class="p-8 text-center text-sm text-mut">Nenhuma ação registrada ainda.</p>'}</div>`;
}

/* ---------- denúncia de story ---------- */
const adDelStory = (sid, rid) => confirmBox('Apagar story?', 'Ele some para todos e não dá para desfazer.', 'Apagar', () => adCall('admin_delete_story', { p_id: sid, p_report: rid || null }, 'Story apagado.'));
function adRepStory(r) {
  const s = r.story, u = r.user || {}, who = r.reporter || {}, open = r.status === 'open', st = { open: 'Aberta', resolved: 'Resolvida', dismissed: 'Descartada' }[r.status];
  const prev = s.media_url ? mediaH(s.media_url, s.media_type, 'rounded-lg max-h-64') : `<div class="rounded-lg p-6 text-center text-white font-bold whitespace-pre-wrap break-words" style="background:${(typeof BGS !== 'undefined' && BGS[s.bg]) || '#7a1633'}">${E(s.caption || '')}</div>`;
  return `<div class="card p-3 space-y-2"><div class="flex items-center justify-between gap-2"><span class="text-xs font-bold text-brand">Story · ${E(r.reason || 'sem motivo')}</span><span class="text-[11px] text-mut">${st} · ${ago(r.created_at)}</span></div>
  ${u.id ? `<div class="text-xs text-mut">Autor: <button class="font-semibold text-brand" onclick="showProfile('${u.id}')">${E(u.name)} (@${E(u.handle)})</button></div>` : ''}${prev}${s.media_url && s.caption ? `<p class="text-sm">${E(s.caption)}</p>` : ''}
  <div class="text-[11px] text-mut">Denunciado por ${E(who.name || '?')} (@${E(who.handle || '?')})${r.note ? ' · ' + E(r.note) : ''}</div>
  <div class="flex flex-wrap gap-2 pt-1">${open ? `<button class="btn !py-1.5 !px-3 text-xs" onclick="adDelStory('${s.id}','${r.id}')">Apagar story</button>${u.id ? `<button class="btn2 !py-1.5 !px-3 text-xs !text-brand" onclick="adPenalty('${u.id}','${r.id}')">Penalizar autor</button>` : ''}<button class="btn2 !py-1.5 !px-3 text-xs" onclick="adSetRep('${r.id}','dismissed')">Descartar</button><button class="btn2 !py-1.5 !px-3 text-xs" onclick="adSetRep('${r.id}','resolved')">Resolvida</button>` : `<button class="btn2 !py-1.5 !px-3 text-xs" onclick="adSetRep('${r.id}','open')">Reabrir</button>`}</div></div>`;
}

async function adResumo() {
  await _adResumo(); const el = $('#ad-body'); if (!el || !el.querySelector('.grid')) return;
  sb.rpc('admin_support', { p_status: 'open' }).then(({ data }) => { const g = el.querySelector('.grid'); if (g && data) g.insertAdjacentHTML('beforeend', stat('Pedidos de suporte', data.length, 'abertos')) });
}

/* ---------- suporte ---------- */
AD.ss = 'open';
async function adSuporte() {
  const el = $('#ad-body'); if (!el) return;
  const chips = [['open', 'Abertos'], ['answered', 'Respondidos'], ['closed', 'Fechados'], ['all', 'Todos']].map(([k, l]) => `<button class="btn2 !py-1 !px-3 text-xs ${AD.ss === k ? 'sel' : ''}" onclick="AD.ss='${k}';adSuporte()">${l}</button>`).join('');
  const { data, error } = await sb.rpc('admin_support', { p_status: AD.ss }); if (!$('#ad-body')) return;
  if (error) { el.innerHTML = adErr(error); return }
  const cat = Object.fromEntries(SUP_CAT), st = { open: 'Aberto', answered: 'Respondido', closed: 'Fechado' };
  el.innerHTML = `<div class="flex gap-2 overflow-x-auto">${chips}</div>` + ((data || []).map(t => `<div class="card p-3 space-y-2"><div class="flex items-center justify-between gap-2"><button class="text-sm font-semibold text-brand truncate" onclick="showProfile('${t.user.id}')">${E(t.user.name)} (@${E(t.user.handle)})</button><span class="text-[11px] text-mut shrink-0">${st[t.status]} · ${ago(t.created_at)}</span></div>
   <div class="text-xs text-mut">${cat[t.category] || t.category}</div><div class="text-sm font-semibold">${E(t.subject)}</div><p class="text-sm whitespace-pre-wrap break-words bg-soft rounded-lg p-2">${E(t.message)}</p>
   ${t.reply ? `<div class="text-xs text-mut"><b>Resposta:</b> ${E(t.reply)}</div>` : ''}
   ${t.status !== 'closed' ? `<div class="flex flex-wrap gap-2"><button class="btn !py-1.5 !px-3 text-xs" onclick="adSupReply('${t.id}',false)">Responder</button><button class="btn2 !py-1.5 !px-3 text-xs" onclick="adSupReply('${t.id}',true)">Responder e fechar</button><button class="btn2 !py-1.5 !px-3 text-xs" onclick="adCall('admin_support_close',{p_id:'${t.id}'},'Pedido fechado.')">Fechar</button></div>` : ''}</div>`).join('') || '<p class="text-center text-sm text-mut py-10">Nenhum pedido aqui.</p>');
}
async function adSupReply(id, close) {
  const v = await askText(close ? 'Responder e fechar o pedido' : 'Responder ao pedido', ''); if (!v) return;
  await adCall('admin_support_reply', { p_id: id, p_reply: v, p_close: close }, close ? 'Resposta enviada e pedido fechado.' : 'Resposta enviada.');
}
