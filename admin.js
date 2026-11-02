/* OtaWeb · painel de administração (a segurança fica no banco: as funções admin_* só respondem a admins) */
const AD = { tab: 'resumo', rs: 'open', t: null };

// conta uma visita por sessão do navegador (sem cookies e sem dados pessoais)
try { if (!sessionStorage.getItem('ow-v')) { sessionStorage.setItem('ow-v', '1'); sb.rpc('track_visit').then(() => {}) } } catch (e) {}

function showBanned() {
  $('#auth').classList.remove('hidden');
  modal(`<h3 class="font-bold text-lg mb-2 text-brand">Conta suspensa</h3><p class="text-sm text-mut mb-4">Sua conta foi suspensa por violar as regras da rede. Se acha que foi um engano, fale com a administração.</p><button class="btn w-full" onclick="sb.auth.signOut().then(() => location.reload())">Sair</button>`);
}

function openAdmin(tab) {
  if (!P || !P.is_admin) return T('Acesso restrito aos administradores.');
  AD.tab = tab || AD.tab; go('other'); window.lastProfile = null; window.reloadOther = () => {}; $('#q').value = '';
  const tabs = [['resumo', 'Resumo'], ['denuncias', 'Denúncias'], ['usuarios', 'Usuários'], ['registro', 'Registro']];
  $('#v-other').innerHTML = backBtn('menu') + `<h2 class="font-bold text-xl px-1">Administração</h2>
  <div class="flex gap-2 overflow-x-auto pb-1">${tabs.map(([k, l]) => `<button class="btn2 !py-1.5 !px-3 whitespace-nowrap ${AD.tab === k ? 'sel' : ''}" onclick="openAdmin('${k}')">${l}</button>`).join('')}</div>
  <div id="ad-body" class="space-y-3"><div class="sk h-24"></div><div class="sk h-40"></div></div>`;
  ({ resumo: adResumo, denuncias: adDenuncias, usuarios: adUsuarios, registro: adRegistro })[AD.tab]();
}
const adErr = e => errH(/admin_|migra/i.test(e.message || '') && /does not exist|Could not find|schema cache/i.test(e.message || '') ? 'Falta rodar a migração 7 no Supabase.' : e);
const fmtB = b => b >= 1e9 ? (b / 1e9).toFixed(2) + ' GB' : (b / 1e6).toFixed(1) + ' MB';
const stat = (l, v, s) => `<div class="card p-3"><div class="text-xs text-mut">${l}</div><div class="text-2xl font-bold">${v}</div>${s ? `<div class="text-[11px] text-mut">${s}</div>` : ''}</div>`;
function bars(ser, key, title) {
  const max = Math.max(1, ...ser.map(d => d[key]));
  return `<div class="card p-3"><div class="text-xs font-semibold mb-2">${title}</div><div class="flex items-end gap-1 h-20">${ser.map(d => `<div class="flex-1 flex flex-col justify-end h-full" title="${d.day}: ${d[key]}"><div class="bg-brand rounded-t" style="height:${Math.max(3, Math.round(d[key] / max * 100))}%;opacity:${d[key] ? 1 : .25}"></div></div>`).join('')}</div>
  <div class="flex justify-between text-[10px] text-mut mt-1"><span>${(ser[0] || {}).day ? ser[0].day.slice(5) : ''}</span><span>hoje</span></div></div>`;
}

async function adResumo() {
  const [a, b] = await Promise.all([sb.rpc('admin_stats'), sb.rpc('admin_series')]), el = $('#ad-body'); if (!el) return;
  if (a.error) { el.innerHTML = adErr(a.error); return }
  const s = a.data, ser = b.data || [];
  el.innerHTML = `<div class="grid grid-cols-2 gap-3">
   ${stat('Usuários', s.users, '+' + s.users_24h + ' hoje · +' + s.users_7d + ' em 7 dias')}${stat('Online agora', s.online_now, s.active_24h + ' ativos em 24 h · ' + s.active_7d + ' em 7 dias')}
   ${stat('Visitas hoje', s.visits_today, s.visits_7d + ' nos últimos 7 dias')}${stat('Denúncias abertas', s.reports_open, s.banned + ' conta(s) suspensa(s)')}
   ${stat('Publicações', s.posts, '+' + s.posts_24h + ' em 24 h')}${stat('Comentários', s.comments)}${stat('Mensagens', s.messages, s.chats + ' conversas · ' + s.groups + ' grupos')}${stat('Último mês', '+' + s.users_30d, 'novos usuários em 30 dias')}</div>
   ${bars(ser, 'users', 'Novos usuários · 14 dias')}${bars(ser, 'posts', 'Publicações · 14 dias')}${bars(ser, 'visits', 'Visitas · 14 dias')}
   <div class="card p-3 space-y-1"><div class="text-xs font-semibold">Espaço usado</div><div class="text-sm">Banco de dados: <b>${fmtB(s.db_bytes)}</b></div><div class="text-sm">Fotos, vídeos e áudios: <b>${fmtB(s.storage_bytes)}</b></div>
   <div class="text-[11px] text-mut">Compare com os limites do seu plano no Supabase para saber quando precisar crescer.</div></div>`;
}

const adCall = async (fn, args, ok) => { const { error } = await sb.rpc(fn, args); if (error) return T('Erro: ' + error.message); T(ok); openAdmin(AD.tab) };
const adSetRep = (id, st) => adCall('admin_set_report', { p_id: id, p_status: st }, st === 'dismissed' ? 'Denúncia descartada.' : st === 'open' ? 'Denúncia reaberta.' : 'Marcada como resolvida.');
const adDelPost = (pid, rid) => confirmBox('Apagar publicação?', 'Ela some para todos e não dá para desfazer.', 'Apagar', () => adCall('admin_delete_post', { p_id: pid, p_report: rid || null }, 'Publicação apagada.'));
const adBan = (uid, rid) => confirmBox('Suspender conta?', 'A pessoa não consegue mais entrar nem publicar.', 'Suspender', () => adCall('admin_ban_user', { p_user: uid, p_report: rid || null }, 'Conta suspensa.'));
const adUnban = uid => adCall('admin_unban_user', { p_user: uid }, 'Conta reativada.');
const adToggleAdmin = (uid, v) => confirmBox(v ? 'Tornar administrador?' : 'Remover administrador?', v ? 'Essa pessoa poderá apagar conteúdo e suspender contas.' : 'Ela perde o acesso ao painel.', 'Confirmar', () => adCall('admin_set_admin', { p_user: uid, p_val: v }, 'Cargo atualizado.'));

async function adDenuncias() {
  const el = $('#ad-body'); if (!el) return;
  const chips = [['open', 'Abertas'], ['resolved', 'Resolvidas'], ['dismissed', 'Descartadas'], ['all', 'Todas']].map(([k, l]) => `<button class="btn2 !py-1 !px-3 text-xs ${AD.rs === k ? 'sel' : ''}" onclick="AD.rs='${k}';adDenuncias()">${l}</button>`).join('');
  const { data, error } = await sb.rpc('admin_reports', { p_status: AD.rs }); if (!$('#ad-body')) return;
  if (error) { el.innerHTML = adErr(error); return }
  el.innerHTML = `<div class="flex gap-2 overflow-x-auto">${chips}</div>` + ((data || []).map(adRep).join('') || '<p class="text-center text-sm text-mut py-10">Nenhuma denúncia aqui.</p>');
}
function adRep(r) {
  const kind = r.post ? 'Publicação' : r.chat ? (r.chat.is_group ? 'Grupo' : 'Conversa') : 'Usuário', open = r.status === 'open', who = r.reporter || {};
  const st = { open: 'Aberta', resolved: 'Resolvida', dismissed: 'Descartada' }[r.status];
  let body = '', acts = '';
  if (r.post) {
    body = `<div class="text-xs text-mut mb-1">Autor: <button class="font-semibold text-brand" onclick="showProfile('${r.post.author_id}')">${E(r.post.author_name)} (@${E(r.post.author_handle)})</button>${r.post.author_banned ? ' · suspenso' : ''}</div>
      ${r.post.body ? `<p class="text-sm whitespace-pre-wrap break-words mb-2">${E(r.post.body)}</p>` : ''}${mediaH(r.post.media_url, r.post.media_type, 'rounded-lg max-h-48')}`;
    acts = `<button class="btn2 !py-1.5 !px-3 text-xs" onclick="showPost('${r.post.id}')">Ver publicação</button><button class="btn !py-1.5 !px-3 text-xs" onclick="adDelPost('${r.post.id}','${r.id}')">Apagar post</button>${r.post.author_banned ? '' : `<button class="btn2 !py-1.5 !px-3 text-xs !text-brand" onclick="adBan('${r.post.author_id}','${r.id}')">Suspender autor</button>`}`;
  } else if (r.user) {
    body = `<div class="text-sm">Pessoa denunciada: <button class="font-semibold text-brand" onclick="showProfile('${r.user.id}')">${E(r.user.name)} (@${E(r.user.handle)})</button>${r.user.banned ? ' · suspenso' : ''}</div>${r.chat ? '<div class="text-xs text-mut mt-1">Denúncia feita numa conversa. Por privacidade, mensagens privadas não ficam visíveis aqui.</div>' : ''}`;
    acts = `<button class="btn2 !py-1.5 !px-3 text-xs" onclick="showProfile('${r.user.id}')">Ver perfil</button>${r.user.banned ? '' : `<button class="btn !py-1.5 !px-3 text-xs" onclick="adBan('${r.user.id}','${r.id}')">Suspender conta</button>`}`;
  } else if (r.chat) body = `<div class="text-sm">${E(r.chat.is_group ? 'Grupo' : 'Conversa')}: <b>${E(r.chat.name || 'sem nome')}</b></div><div class="text-xs text-mut mt-1">Por privacidade, mensagens privadas não ficam visíveis aqui.</div>`;
  return `<div class="card p-3 space-y-2"><div class="flex items-center justify-between gap-2"><span class="text-xs font-bold text-brand">${kind} · ${E(r.reason || 'sem motivo')}</span><span class="text-[11px] text-mut">${st} · ${ago(r.created_at)}</span></div>${body}
  <div class="text-[11px] text-mut">Denunciado por ${E(who.name || '?')} (@${E(who.handle || '?')})${r.note ? ' · ' + E(r.note) : ''}</div>
  <div class="flex flex-wrap gap-2 pt-1">${open ? acts + `<button class="btn2 !py-1.5 !px-3 text-xs" onclick="adSetRep('${r.id}','dismissed')">Descartar</button><button class="btn2 !py-1.5 !px-3 text-xs" onclick="adSetRep('${r.id}','resolved')">Resolvida</button>` : `<button class="btn2 !py-1.5 !px-3 text-xs" onclick="adSetRep('${r.id}','open')">Reabrir</button>`}</div></div>`;
}

async function adUsuarios() {
  const el = $('#ad-body'); if (!el) return;
  el.innerHTML = `<input id="ad-q" class="inp" placeholder="Buscar por nome ou @usuário" oninput="clearTimeout(AD.t);AD.t=setTimeout(adListUsers,300)" autocomplete="off"><div id="ad-users" class="space-y-2"><div class="sk h-16"></div></div>`; adListUsers();
}
async function adListUsers() {
  const q = $('#ad-q') ? $('#ad-q').value.trim() : '', box = $('#ad-users'); if (!box) return;
  const { data, error } = await sb.rpc('admin_users', { p_q: q, p_limit: 40 }); if (!$('#ad-users')) return;
  if (error) { box.innerHTML = adErr(error); return }
  box.innerHTML = (data || []).map(u => `<div class="card p-3 flex items-center gap-3"><button class="shrink-0" onclick="showProfile('${u.id}')">${av(u, 44)}</button>
   <div class="min-w-0 flex-1"><div class="text-sm font-semibold truncate">${E(u.name)} ${u.is_admin ? '<span class="text-[10px] font-bold bg-brand text-white rounded-full px-2 py-0.5">Admin</span>' : ''}${u.banned ? ' <span class="text-[10px] font-bold bg-soft text-brand rounded-full px-2 py-0.5">Suspenso</span>' : ''}</div>
   <div class="text-xs text-mut truncate">@${E(u.handle)} · ${u.posts} posts · ${u.reports} denúncia(s)</div><div class="text-[11px] text-mut">Entrou ${ago(u.created_at)} · visto ${u.last_seen ? ago(u.last_seen) : 'nunca'}</div></div>
   <button class="circ" onclick="adUserMenu('${u.id}',${u.banned},${u.is_admin})" aria-label="Ações">${ic('more', false, 20)}</button></div>`).join('') || '<p class="text-center text-sm text-mut py-10">Ninguém encontrado.</p>';
}
function adUserMenu(id, banned, isAdm) {
  menu('Ações', [[ic('user') + ' Ver perfil', () => showProfile(id)], banned ? [ic('check') + ' Reativar conta', () => adUnban(id)] : [ic('ban') + ' Suspender conta', () => adBan(id)],
    isAdm ? [ic('shield') + ' Remover administrador', () => adToggleAdmin(id, false)] : [ic('shield') + ' Tornar administrador', () => adToggleAdmin(id, true)]]);
}

async function adRegistro() {
  const el = $('#ad-body'); if (!el) return; const { data, error } = await sb.rpc('admin_log_list'); if (!$('#ad-body')) return;
  if (error) { el.innerHTML = adErr(error); return }
  const nm = { delete_post: 'apagou uma publicação', ban: 'suspendeu uma conta', unban: 'reativou uma conta', make_admin: 'tornou alguém administrador', remove_admin: 'removeu um administrador', report_dismissed: 'descartou uma denúncia', report_resolved: 'resolveu uma denúncia', report_open: 'reabriu uma denúncia' };
  el.innerHTML = `<div class="card divide-y divide-line overflow-hidden">${(data || []).map(l => `<div class="p-3"><div class="text-sm"><b>${E(l.admin)}</b> ${nm[l.action] || E(l.action)}</div>${l.details && l.details.body ? `<div class="text-xs text-mut truncate">“${E(l.details.body)}”</div>` : ''}<div class="text-[11px] text-mut">${ago(l.created_at)}</div></div>`).join('') || '<p class="p-8 text-center text-sm text-mut">Nenhuma ação registrada ainda.</p>'}</div>`;
}
