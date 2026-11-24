/* OtaWeb · notificações no celular (só no app Android; no navegador o cartão das Definições explica como instalar o app) */
const PUSH = { ready: false, token: null, pending: null, err: '', events: [] };
const pushApp = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const pushPlugin = () => window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.PushNotifications;
const pushNote = t => { PUSH.events.push(new Date().toTimeString().slice(0, 8) + ' ' + t); if (PUSH.events.length > 8) PUSH.events.shift() };

// chamado depois do login
async function pushStart() {
  if (!pushApp()) return; if (!pushPlugin()) { PUSH.err = 'plugin de notificações não está dentro deste app (gere o APK de novo)'; return }
  if (PUSH.ready) return; PUSH.ready = true; const pn = pushPlugin();
  pn.addListener('registration', async t => {
    PUSH.token = t.value; pushNote('aparelho registrado no Google');
    const r = await sb.rpc('push_register', { p_token: t.value, p_lang: typeof LANG !== 'undefined' ? LANG : 'pt' });
    if (r.error) { PUSH.err = 'servidor recusou o registro: ' + r.error.message; pushNote(PUSH.err) } else { PUSH.err = ''; pushNote('registrado no servidor') }
  });
  pn.addListener('registrationError', e => { PUSH.err = 'Google recusou o registro: ' + JSON.stringify(e); pushNote(PUSH.err) });
  pn.addListener('pushNotificationReceived', () => { pushNote('notificação recebida com o app aberto'); if (typeof loadBadge === 'function') loadBadge(); if (typeof loadUnread === 'function') loadUnread() });
  pn.addListener('pushNotificationActionPerformed', a => pushOpen(((a || {}).notification || {}).data || {}));
  try { await pn.createChannel({ id: 'default', name: 'OtaWeb', description: 'Mensagens, reações e novidades', importance: 5, visibility: 1, vibration: true }) } catch (e) { pushNote('canal: ' + e) }
  let st = 'denied'; try { st = (await pn.checkPermissions()).receive } catch (e) { PUSH.err = 'permissão: ' + e }
  pushNote('permissão = ' + st);
  if (st === 'granted') { try { await pn.register() } catch (e) { PUSH.err = 'register: ' + e } }
  else if (st === 'prompt' || st === 'prompt-with-rationale') { let t = 0; try { t = +localStorage.getItem('ow-push-asked') || 0 } catch (e) {} if (Date.now() - t > 3 * 864e5) setTimeout(pushAsk, 2500) }
  if (PUSH.pending) { const d = PUSH.pending; PUSH.pending = null; pushOpen(d) }
}
function pushAsk() {
  modal(`<div class="text-center space-y-3"><div class="w-14 h-14 mx-auto rounded-full bg-soft text-brand grid place-items-center">${ic('bell', false, 28)}</div><h3 class="font-bold text-lg">Receber notificações?</h3>
  <p class="text-sm text-mut">Avisamos de novas mensagens, reações e novidades, mesmo com o app fechado.</p>
  <div class="grid grid-cols-2 gap-2"><button class="btn2" onclick="try{localStorage.setItem('ow-push-asked',Date.now())}catch(e){};closeM()">Agora não</button><button class="btn" onclick="closeM();pushEnable()">Ativar</button></div></div>`);
}
async function pushEnable() {
  const pn = pushPlugin(); if (!pn) return T('Este app não tem o plugin de notificações. Gere o APK de novo.');
  let r = 'denied'; try { r = (await pn.requestPermissions()).receive } catch (e) { PUSH.err = 'pedido de permissão: ' + e }
  pushNote('pedido de permissão = ' + r);
  if (r === 'granted') { try { await pn.register() } catch (e) { PUSH.err = 'register: ' + e } T('Notificações ativadas!') } else T('As notificações ficaram desativadas. Dá para ativar nas configurações do Android.');
  setTimeout(pushPaintCard, 1500);
}
async function pushDisable() {
  const pn = pushPlugin(); if (PUSH.token) await sb.rpc('push_unregister', { p_token: PUSH.token });
  if (pn) try { await pn.unregister() } catch (e) {}
  PUSH.token = null; T('Notificações desativadas neste aparelho.'); pushPaintCard();
}
async function pushStop() { if (PUSH.token) { try { await sb.rpc('push_unregister', { p_token: PUSH.token }) } catch (e) {} } }
async function pushTest() {
  const { error } = await sb.rpc('push_test'); if (error) return T(/push_test|does not exist/.test(error.message) ? 'Falta rodar a migração 15 no Supabase.' : 'Erro: ' + error.message);
  T('Teste enviado. Saia do app (botão início do celular) e espere alguns segundos.');
}

// toque em uma notificação: abre o lugar certo
async function pushOpen(d) {
  if (typeof P === 'undefined' || !P) { PUSH.pending = d; return }
  if (d.type === 'message' && d.chat) {
    await loadChats(); if (CH.list.find(c => c.id === d.chat)) { openChat(d.chat); go('msgs'); return }
  }
  if (!d.type || ['welcome', 'penalty', 'penalty_lifted', 'appeal_result', 'announcement'].includes(d.type)) return go('notif');
  openNotif(d.type, d.ref || '', d.actor || '');
}

// diagnóstico (aparece nas Definições): mostra em que etapa as notificações param
async function pushDiag() {
  const L = [], pn = pushPlugin(), nat = pushApp();
  const v = (document.querySelector('script[src*="push.js"]') || {}).src; L.push('Versão do site no app: ' + ((v || '').match(/v=(\d+)/) || [0, '?'])[1]);
  L.push('Roda dentro do app Android: ' + (nat ? 'sim' : 'não (navegador)'));
  L.push('Plugin de notificações no app: ' + (pn ? 'sim' : 'NÃO'));
  L.push('Plugin do botão voltar no app: ' + (nat ? (typeof navApp === 'function' && navApp() ? 'sim' : 'NÃO') : '-') + ' | voltar: ' + (typeof NV !== 'undefined' && NV.native ? 'nativo' : 'histórico'));
  let perm = '-'; if (pn) { try { perm = (await pn.checkPermissions()).receive } catch (e) { perm = 'erro: ' + e } }
  L.push('Permissão do Android: ' + perm);
  L.push('Aparelho registrado no Google: ' + (PUSH.token ? 'sim' : 'NÃO'));
  try { const { count, error } = await sb.from('push_tokens').select('token', { count: 'exact', head: true }); L.push('Aparelhos registrados no servidor (sua conta): ' + (error ? 'erro ' + error.message : count)) } catch (e) { L.push('Servidor: erro') }
  if (PUSH.err) L.push('ERRO: ' + PUSH.err);
  if (PUSH.events.length) L.push('Eventos:', ...PUSH.events.map(x => '  ' + x));
  return L.join('\n');
}
async function pushPaintDiag() { const el = document.getElementById('push-diag'); if (!el) return; el.textContent = 'Verificando...'; el.textContent = await pushDiag() }
async function pushCopyDiag() { const t = (document.getElementById('push-diag') || {}).textContent || await pushDiag(); try { await navigator.clipboard.writeText(t); T('Diagnóstico copiado.') } catch (e) { T('Não deu para copiar. Tire um print da tela.') } }

// cartão das Definições
async function pushPaintCard() {
  const el = document.getElementById('push-card'); if (!el) return;
  if (!pushApp()) { el.innerHTML = `<div class="text-sm font-semibold">Notificações no celular</div><p class="text-xs text-mut">Instale o app do OtaWeb para receber notificações no celular.</p>`; return }
  let st = 'denied'; if (pushPlugin()) { try { st = (await pushPlugin().checkPermissions()).receive } catch (e) {} }
  const on = st === 'granted' && !!PUSH.token;
  el.innerHTML = `<div class="flex items-center gap-3"><div class="flex-1"><div class="text-sm font-semibold">Notificações no celular</div><div class="text-xs text-mut">Receba avisos de mensagens, reações e novidades mesmo com o app fechado.</div></div>
   <button class="btn2 ${on ? 'sel' : ''}" onclick="${on ? 'pushDisable()' : 'pushEnable()'}">${on ? 'Desativar' : 'Ativar notificações'}</button></div>
   <div class="flex gap-2 mt-3 flex-wrap"><button class="btn2" onclick="pushTest()">Enviar notificação de teste</button><button class="btn2" onclick="pushPaintDiag()">Diagnóstico</button><button class="btn2" onclick="pushCopyDiag()">Copiar</button></div>
   <pre id="push-diag" class="text-xs text-mut mt-2 whitespace-pre-wrap break-words"></pre>`;
}
