/* OtaWeb · botão voltar (do celular e do navegador): volta tela por tela até o feed e só então sai.
   Janelas abertas (menus, comentários, stories) fecham primeiro. */
const NV = { map: {}, n: 0, cur: 0, count: 0, depth: 0, restoring: false, layers: [], ops: [], busy: false, expect: 0, expRestore: false, timer: null, last: { fn: 'go', args: ['feed'] }, chatPushed: false };
try { history.replaceState({ nav: 0 }, '') } catch (e) {}
NV.map[0] = NV.last;

// as operações no histórico acontecem uma de cada vez (history.back() é assíncrono)
function navOp(op) { NV.ops.push(op); navRun() }
function navRun() {
  if (NV.busy) return; const op = NV.ops.shift(); if (!op) return;
  if (op.t === 'push') { try { history.pushState(op.state, '') } catch (e) {} navRun() }
  else if (op.t === 'back') {
    NV.busy = true; NV.expect = 1; NV.expRestore = !!op.restore; clearTimeout(NV.timer);
    NV.timer = setTimeout(() => { NV.expect = 0; NV.busy = false; navRun() }, 600);   // se não houver para onde voltar
    history.back();
  }
}
function navPush(fn, args) {
  if (NV.last.fn === fn && JSON.stringify(NV.last.args) === JSON.stringify(args)) return;   // mesma tela
  NV.n++; NV.map[NV.n] = NV.last = { fn, args }; NV.cur = NV.n; NV.count++;
  navOp({ t: 'push', state: { nav: NV.n } });
}
function navBack(fallback) { if (NV.count > 0) navOp({ t: 'back', restore: true }); else go(fallback || 'feed') }

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
['go', 'showProfile', 'openGuild', 'openSaved', 'openSettings', 'openSupport', 'openAccountState', 'openAdmin', 'showPost'].forEach(name => {
  const orig = window[name]; if (typeof orig !== 'function') return;
  window[name] = function () {
    const a = Array.prototype.slice.call(arguments), top = NV.depth === 0 && !NV.restoring; let r;
    NV.depth++; try { r = orig.apply(this, a) } finally { NV.depth-- }
    if (top && !(name === 'go' && (a[0] === 'create' || a[0] === 'other'))) navPush(name, a);
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
  if (NV.chatPushed && NV.count > 0) { NV.chatPushed = false; navOp({ t: 'back', restore: true }) } else { NV.chatPushed = false; _closeChat() }
};

function navRestore(s) {
  if (typeof CH !== 'undefined' && CH.open && s.fn === 'go' && s.args[0] === 'msgs') { NV.chatPushed = false; _closeChat() }   // voltar da conversa = lista de conversas
  if (s.fn === 'openChat') { window.openChat(s.args[0]); window.go('msgs'); NV.chatPushed = true; return }
  window[s.fn].apply(null, s.args);
}
addEventListener('popstate', e => {
  if (NV.expect) {                                  // volta que nós mesmos pedimos
    NV.expect = 0; NV.busy = false; clearTimeout(NV.timer); const rs = NV.expRestore; NV.expRestore = false;
    if (!rs) { navRun(); return }
  } else if (NV.layers.length) {                    // botão voltar com uma janela aberta: só fecha a janela
    const L = NV.layers.pop(); try { L.closer() } catch (x) {} return;
  }
  const st = e.state, s = st && st.nav !== undefined && NV.map[st.nav]; if (!s) { navRun(); return }
  if (st.nav < NV.cur) NV.count = Math.max(0, NV.count - 1);
  NV.cur = st.nav; NV.last = s; NV.restoring = true;
  try { navRestore(s) } catch (x) { console.warn(x) }
  setTimeout(() => { NV.restoring = false }, 60); navRun();
});
