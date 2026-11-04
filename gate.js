/* OtaWeb · estado da conta: bloqueio definitivo, suspensão com prazo e restrições parciais */
window.RESTR = [];
const fmtDT = t => new Date(t).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });
const SCOPE_TXT = { account: 'usar a conta', messages: 'enviar mensagens', posts: 'publicar', comments: 'comentar' };
const SCOPE_LBL = { account: 'Conta suspensa', messages: 'Envio de mensagens', posts: 'Publicações', comments: 'Comentários' };
const KINDS = [['mistake', 'Foi um engano'], ['not_violated', 'Não violei os termos'], ['understood', 'Entendi e não vou repetir'], ['other', 'Outro motivo']];

// usado antes de publicar, comentar ou enviar mensagem
function restrOk(scope) {
  const r = (window.RESTR || []).find(x => (x.scope === scope || x.scope === 'account') && (!x.until || new Date(x.until) > new Date()));
  if (!r) return true;
  T('Você está impedido de ' + SCOPE_TXT[r.scope] + (r.until ? ' até ' + fmtDT(r.until) : ' por enquanto') + '.'); return false;
}

// devolve true quando a conta não pode entrar no site
async function gateCheck(profile) {
  const { data: st, error } = await sb.rpc('my_status');
  if (error) { if (profile && profile.banned_at) { gateBan(); return true } return false }   // antes da migração 8
  window.RESTR = st.restrictions || [];
  if (st.banned) { gateBan(); return true }
  const susp = RESTR.find(r => r.scope === 'account');
  if (susp) { gateSuspended(susp, st.appeal); return true }
  return false;
}
function gateShell(inner) {
  let g = document.getElementById('gate');
  if (!g) { g = document.createElement('div'); g.id = 'gate'; g.className = 'fixed inset-0 z-[90] bg-bg overflow-auto grid place-items-center p-5'; document.body.appendChild(g) }
  g.innerHTML = `<div class="w-full max-w-md space-y-4 py-6"><div class="text-center text-4xl font-extrabold text-brand tracking-tight">OtaWeb</div>${inner}<button class="btn2 w-full" onclick="sb.auth.signOut().then(() => location.reload())">Sair da conta</button></div>`;
}
function gateBan() {
  gateShell(`<div class="card p-6 text-center space-y-3"><div class="w-14 h-14 mx-auto rounded-full bg-soft text-brand grid place-items-center">${ic('ban', false, 28)}</div>
  <h2 class="font-bold text-xl">Conta bloqueada</h2><p class="text-sm text-mut">Esta conta não pode mais ser usada porque foi bloqueada por violar os termos da rede.</p></div>`);
}

function appealBox(r, ap) {
  const mine = ap && ap.restriction_id === r.id;
  if (mine && ap.status === 'open') return `<div class="rounded-xl bg-soft p-3 text-sm text-center">Seu pedido de revisão foi enviado e está em análise.<div class="text-xs text-mut mt-1">Enviado ${ago(ap.created_at)}</div></div>`;
  const denied = mine && ap.status === 'denied' ? `<div class="rounded-xl bg-soft p-3 text-sm mb-3"><b>Seu pedido foi analisado e negado.</b>${ap.response ? `<div class="mt-1 text-mut">${E(ap.response)}</div>` : ''}</div>` : '';
  return denied + `<div class="space-y-2"><div class="text-sm font-semibold">Pedir revisão</div>
  <select id="ap-k-${r.id}" class="inp">${KINDS.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select>
  <textarea id="ap-m-${r.id}" rows="4" class="inp" maxlength="1000" placeholder="Explique por que acha que a penalidade deve ser revista (mínimo 10 caracteres)"></textarea>
  <button class="btn w-full" onclick="sendAppeal('${r.id}')">Enviar pedido de revisão</button></div>`;
}
async function sendAppeal(rid) {
  const m = $('#ap-m-' + rid).value.trim(), k = $('#ap-k-' + rid).value; if (m.length < 10) return T('Escreva pelo menos 10 caracteres.');
  const { error } = await sb.rpc('submit_appeal', { p_restriction: rid, p_kind: k, p_message: m });
  if (error) return T(/appeals_one_open|duplicate/.test(error.message) ? 'Você já tem um pedido em análise.' : /bloqueada definitivamente/.test(error.message) ? 'Esta conta foi bloqueada definitivamente.' : /submit_appeal/.test(error.message) ? 'Falta rodar a migração 8 no Supabase.' : 'Não enviou: ' + error.message);
  T('Pedido enviado. Aguarde a resposta da administração.');
  const { data: st } = await sb.rpc('my_status'); window.RESTR = (st && st.restrictions) || [];
  if (document.getElementById('gate')) { const s = RESTR.find(x => x.scope === 'account'); if (s) gateSuspended(s, st.appeal) } else openAccountState();
}
function gateSuspended(r, ap) {
  gateShell(`<div class="card p-6 space-y-3"><div class="w-14 h-14 mx-auto rounded-full bg-soft text-brand grid place-items-center">${ic('shield', false, 28)}</div>
  <h2 class="font-bold text-xl text-center">Conta suspensa</h2>
  <p class="text-sm text-mut text-center">Sua conta está suspensa por violar os termos da rede.${r.reason ? ' <b>Motivo:</b> ' + E(r.reason) + '.' : ''}</p>
  <div class="rounded-xl bg-soft p-3 text-sm text-center">${r.until ? 'A suspensão termina em <b>' + fmtDT(r.until) + '</b>. Depois disso é só entrar de novo.' : 'Esta suspensão não tem data para acabar: ela dura até a administração rever o caso.'}</div>${appealBox(r, ap)}</div>`);
}

// restrição parcial: aviso no feed e página "Estado da conta"
function restrBanner() {
  const f = document.getElementById('v-feed'); if (!f) return; const old = document.getElementById('rbn'); if (old) old.remove();
  const rs = (window.RESTR || []).filter(r => r.scope !== 'account'); if (!rs.length) return;
  f.insertAdjacentHTML('afterbegin', `<div id="rbn" class="card p-3 flex items-start gap-3 border-brand/40"><span class="text-brand shrink-0 mt-0.5">${ic('shield', false, 20)}</span><div class="flex-1 text-sm"><b>Há restrições na sua conta.</b><div class="text-xs text-mut">${rs.map(r => 'Você não pode ' + SCOPE_TXT[r.scope] + (r.until ? ' até ' + fmtDT(r.until) : ' por enquanto')).join(' · ')}</div></div><button class="btn2 !py-1.5 !px-3 text-xs" onclick="openAccountState()">Detalhes</button></div>`);
}
async function openAccountState() {
  go('other'); window.lastProfile = null; window.reloadOther = () => {}; $('#q').value = '';
  const { data: st } = await sb.rpc('my_status'); window.RESTR = (st && st.restrictions) || []; const ap = st && st.appeal;
  $('#v-other').innerHTML = backBtn('menu') + '<h2 class="font-bold text-xl px-1">Estado da conta</h2>' + (RESTR.map(r => `<div class="card p-4 space-y-3"><div><div class="text-sm font-bold">${SCOPE_LBL[r.scope]}</div><div class="text-xs text-mut">Você não pode ${SCOPE_TXT[r.scope]}${r.until ? ' até ' + fmtDT(r.until) : ' até a administração levantar a restrição'}.${r.reason ? ' Motivo: ' + E(r.reason) + '.' : ''}</div></div>${appealBox(r, ap)}</div>`).join('') || '<p class="text-center text-sm text-mut py-10">Sua conta está em dia, sem restrições.</p>');
}
