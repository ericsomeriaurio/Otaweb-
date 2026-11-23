/* OtaWeb · notificações no celular (só no app Android; no navegador o card das Definições explica como instalar o app) */
const PUSH = { ready: false, token: null, pending: null };
const pushApp = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const pushPlugin = () => window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.PushNotifications;

// chamado depois do login
async function pushStart() {
  if (!pushApp() || !pushPlugin() || PUSH.ready) return; PUSH.ready = true; const pn = pushPlugin();
  pn.addListener('registration', t => { PUSH.token = t.value; sb.rpc('push_register', { p_token: t.value, p_lang: typeof LANG !== 'undefined' ? LANG : 'pt' }).then(() => {}) });
  pn.addListener('registrationError', e => { PUSH.err = JSON.stringify(e) });
  pn.addListener('pushNotificationReceived', () => { if (typeof loadBadge === 'function') loadBadge(); if (typeof loadUnread === 'function') loadUnread() });
  pn.addListener('pushNotificationActionPerformed', a => pushOpen(((a || {}).notification || {}).data || {}));
  try { await pn.createChannel({ id: 'default', name: 'OtaWeb', description: 'Mensagens, reações e novidades', importance: 5, visibility: 1, vibration: true }) } catch (e) {}
  let st = 'denied'; try { st = (await pn.checkPermissions()).receive } catch (e) {}
  if (st === 'granted') pn.register();
  else if (st === 'prompt' || st === 'prompt-with-rationale') { let asked = false; try { asked = !!localStorage.getItem('ow-push-asked') } catch (e) {} if (!asked) setTimeout(pushAsk, 2500) }
}
function pushAsk() {
  try { localStorage.setItem('ow-push-asked', '1') } catch (e) {}
  modal(`<div class="text-center space-y-3"><div class="w-14 h-14 mx-auto rounded-full bg-soft text-brand grid place-items-center">${ic('bell', false, 28)}</div><h3 class="font-bold text-lg">Receber notificações?</h3>
  <p class="text-sm text-mut">Avisamos de novas mensagens, reações e novidades, mesmo com o app fechado.</p>
  <div class="grid grid-cols-2 gap-2"><button class="btn2" onclick="closeM()">Agora não</button><button class="btn" onclick="closeM();pushEnable()">Ativar</button></div></div>`);
}
async function pushEnable() {
  const pn = pushPlugin(); if (!pn) return;
  let r = 'denied'; try { r = (await pn.requestPermissions()).receive } catch (e) {}
  if (r === 'granted') { pn.register(); T('Notificações ativadas!') } else T('As notificações ficaram desativadas. Dá para ativar nas configurações do Android.');
  pushPaintCard();
}
async function pushDisable() {
  const pn = pushPlugin(); if (PUSH.token) await sb.rpc('push_unregister', { p_token: PUSH.token });
  if (pn) try { await pn.unregister() } catch (e) {}
  PUSH.token = null; T('Notificações desativadas neste aparelho.'); pushPaintCard();
}
async function pushStop() { if (PUSH.token) { try { await sb.rpc('push_unregister', { p_token: PUSH.token }) } catch (e) {} } }

// toque em uma notificação: abre o lugar certo
async function pushOpen(d) {
  if (!P) { PUSH.pending = d; return }
  if (d.type === 'message' && d.chat) {
    await loadChats(); if (CH.list.find(c => c.id === d.chat)) { openChat(d.chat); go('msgs'); return }
  }
  if (!d.type || ['welcome', 'penalty', 'penalty_lifted', 'appeal_result', 'announcement'].includes(d.type)) return go('notif');
  openNotif(d.type, d.ref || '', d.actor || '');
}

// cartão das Definições
async function pushPaintCard() {
  const el = document.getElementById('push-card'); if (!el) return;
  if (!pushApp() || !pushPlugin()) { el.innerHTML = `<div class="text-sm font-semibold">Notificações no celular</div><p class="text-xs text-mut">Instale o app do OtaWeb para receber notificações no celular.</p>`; return }
  let st = 'denied'; try { st = (await pushPlugin().checkPermissions()).receive } catch (e) {}
  const on = st === 'granted' && !!PUSH.token;
  el.innerHTML = `<div class="flex items-center gap-3"><div class="flex-1"><div class="text-sm font-semibold">Notificações no celular</div><div class="text-xs text-mut">Receba avisos de mensagens, reações e novidades mesmo com o app fechado.</div></div>
   <button class="btn2 ${on ? 'sel' : ''}" onclick="${on ? 'pushDisable()' : 'pushEnable()'}">${on ? 'Desativar' : 'Ativar notificações'}</button></div>`;
}
