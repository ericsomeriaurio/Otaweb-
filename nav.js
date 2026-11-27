/* OtaWeb · botão voltar (do celular e do navegador): volta tela por tela até o feed; o feed é a página inicial e voltar a partir dele sai.
   Janelas abertas (menus, comentários, stories) fecham primeiro.
   No app Android usa o botão voltar nativo do Capacitor com uma pilha própria; no navegador usa o histórico. */
const NV = { map: {}, n: 0, cur: 0, pos: 0, count: 0, depth: 0, restoring: false, resetting: false, layers: [], ops: [], busy: false, expect: 0, expRestore: false, timer: null,
  last: { fn: 'go', args: ['feed'] }, stack: [{ fn: 'go', args: ['feed'] }], chatPushed: false, native: false };
const navApp = () => window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
NV.native = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() && navApp() && navApp().addListener);
try { history.replaceState({ nav: 0 }, '') } catch (e) {}
NV.map[0] = NV.last;

// operações no histórico do navegador: uma de cada vez (history.back() é assíncrono). No app nativo não são usadas.
function navOp(op) { if (NV.native) return; NV.ops.push(op); navRun() }
function navRun() {
  if (NV.busy) return; const op = NV.ops.shift(); if (!op) return;
  if (op.t === 'push') { try { history.pushState(op.state, ''); NV.pos++ } catch (e) {} navRun() }
  else if (op.t === 'back' || op.t === 'reset') {
    if (NV.pos <= 0) { navRun(); return }                       // já está na base: nunca sai do site por engano
    NV.busy = true; NV.expect = 1; NV.expRestore = op.t === 'back' && !!op.restore; NV.resetting = op.t === 'reset'; clearTimeout(NV.timer);
    NV.timer = setTimeout(() => { NV.expect = 0; NV.resetting = false; NV.busy = false; navRun() }, 700);
    if (op.t === 'reset') history.go(-NV.pos); else history.back();
  }
}
function navPush(fn, args) {
  if (NV.last.fn === fn && JSON.stringify(NV.last.args) === JSON.stringify(args)) return;   // mesma tela
  NV.n++; NV.map[NV.n] = NV.last = { fn, args }; NV.cur = NV.n; NV.count++; NV.stack.push(NV.last);
  navOp({ t: 'push', state: { nav: NV.n } });
}
// ir para o feed: ele vira a base; tudo o que veio antes é esquecido
function navReset() {
  NV.stack = [{ fn: 'go', args: ['feed'] }]; NV.last = NV.stack[0]; NV.count = 0; NV.chatPushed = false; NV.cur = 0;
  if (!NV.native && NV.pos > 0) navOp({ t: 'reset' });
}
function navGoBack() { if (NV.native) navNativeBack(); else navOp({ t: 'back', restore: true }) }
function navBack(fallback) { if (NV.count > 0) navGoBack(); else go(fallback || 'feed') }

/* janelas por cima da tela (modal, comentários, story) */
function layerOpen(key, closer) {
  const L = NV.layers.find(l => l.key === key); if (L) { L.closer = closer; return }
  NV.layers.push({ key, closer }); navOp({ t: 'push', state: { layer: key } });
}
function layerClosed(key) {        // a janela foi fechada pela tela (não pelo botão voltar)
  const i = NV.layers.findIndex(l => l.key === key); if (i < 0) return;
  const top = i === NV.layers.length - 1; NV.layers.splice(i, 1);
  if (top) navOp({ t: 'back', restore: false });
}

/* telas que entram no histórico */
['go', 'showProfile', 'openGuild', 'openSaved', 'openSettings', 'openSupport', 'openAccountState', 'openAdmin', 'showPost', 'editProfile'].forEach(name => {
  const orig = window[name]; if (typeof orig !== 'function') return;
  window[name] = function () {
    const a = Array.prototype.slice.call(arguments), top = NV.depth === 0 && !NV.restoring; let r;
    NV.depth++; try { r = orig.apply(this, a) } finally { NV.depth-- }
    if (top) {
      if (name === 'go' && a[0] === 'feed') navReset();
      else if (!(name === 'go' && (a[0] === 'create' || a[0] === 'other'))) navPush(name, a);
    }
    return r;
  };
});
// abrir uma conversa a partir da lista conta como uma tela; fechar volta para a lista
const _openChat = window.openChat, _closeChat = window.closeChat;
if (typeof _openChat === 'function') window.openChat = function (id) {
  const v = document.getElementById('v-msgs'), push = NV.depth === 0 && !NV.restoring && v && !v.classList.contains('hidden');
  NV.depth++; try { _openChat.call(this, id) } finally { NV.depth-- }
  if (push) { navPush('openChat', [id]); NV.chatPushed = true }
};
if (typeof _closeChat === 'function') window.closeChat = function () {
  if (NV.chatPushed && NV.count > 0) { NV.chatPushed = false; navGoBack() } else { NV.chatPushed = false; _closeChat() }
};

function navRestore(s) {
  if (typeof CH !== 'undefined' && CH.open && s.fn === 'go' && s.args[0] === 'msgs') { NV.chatPushed = false; _closeChat() }   // voltar da conversa = lista de conversas
  if (s.fn === 'openChat') { window.openChat(s.args[0]); window.go('msgs'); NV.chatPushed = true; return }
  window[s.fn].apply(null, s.args);
}

/* ---- app Android: botão voltar nativo ---- */
function navNativeBack() {
  if (NV.layers.length) { const L = NV.layers.pop(); try { L.closer() } catch (x) {} return }          // fecha a janela aberta
  if (NV.stack.length > 1) {                                                                          // volta uma tela
    NV.stack.pop(); NV.count = NV.stack.length - 1; const s = NV.stack[NV.stack.length - 1]; NV.last = s; NV.restoring = true;
    try { navRestore(s) } catch (x) { console.warn(x) }
    setTimeout(() => { NV.restoring = false }, 60); return;
  }
  const a = navApp(); if (a && a.exitApp) a.exitApp(); else history.back();                          // no feed: sai do app
}
if (NV.native) navApp().addListener('backButton', () => navNativeBack());

/* ---- navegador: botão voltar pelo histórico ---- */
addEventListener('popstate', e => {
  if (NV.native) return;
  if (NV.resetting) { NV.resetting = false; NV.expect = 0; NV.busy = false; clearTimeout(NV.timer); NV.pos = 0; navRun(); return }   // voltamos à base (feed)
  NV.pos = Math.max(0, NV.pos - 1);
  if (NV.expect) {                                  // volta que nós mesmos pedimos
    NV.expect = 0; NV.busy = false; clearTimeout(NV.timer); const rs = NV.expRestore; NV.expRestore = false;
    if (!rs) { navRun(); return }
  } else if (NV.layers.length) {                    // botão voltar com uma janela aberta: só fecha a janela
    const L = NV.layers.pop(); try { L.closer() } catch (x) {} return;
  }
  const st = e.state, s = st && st.nav !== undefined && NV.map[st.nav]; if (!s) { navRun(); return }
  if (st.nav < NV.cur) { NV.count = Math.max(0, NV.count - 1); while (NV.stack.length > 1 && NV.stack[NV.stack.length - 1] !== s) NV.stack.pop() }
  NV.cur = st.nav; NV.last = s; NV.restoring = true;
  try { navRestore(s) } catch (x) { console.warn(x) }
  setTimeout(() => { NV.restoring = false }, 60); navRun();
});
