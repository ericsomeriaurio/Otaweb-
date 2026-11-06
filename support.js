/* OtaWeb · ajuda e suporte */
const FAQ = {
  pt: [
    ['Esqueci minha senha. E agora?', 'Na tela de entrada, toque em "Esqueci minha senha", digite seu e-mail e abra o link que enviamos para criar uma nova senha. Veja também a caixa de spam.'],
    ['Como funcionam os stories?', 'Toque no + da barra de stories (ou no botão + do meio) e escolha foto, vídeo ou texto. Você decide quanto tempo ele fica visível, de 2 a 48 horas, e pode reduzir esse tempo ou apagar o story quando quiser.'],
    ['Como denuncio algo?', 'Em posts e stories, use o menu de três pontos. Em conversas, toque na barra de cima e escolha Denunciar: as 4 últimas mensagens são enviadas à administração para análise. Ninguém mais as vê.'],
    ['Como bloqueio alguém?', 'Abra a conversa, toque na barra de cima e escolha Bloquear. Vocês deixam de poder trocar mensagens, e você pode desbloquear quando quiser.'],
    ['O que significa @seguidores?', 'Ao escrever @seguidores num post ou comentário, todos os seus seguidores recebem um aviso. Dá para usar até 3 vezes a cada 24 horas.'],
    ['Minha conta foi suspensa. O que faço?', 'Ao entrar, você vê o motivo e até quando vai a suspensão. Lá mesmo dá para enviar um pedido de revisão explicando o seu lado. Já o bloqueio definitivo encerra a conta para sempre.'],
    ['Como excluo minha conta?', 'Em Menu > Definições > Excluir conta. Isso apaga seu perfil, posts, comentários e mensagens, e não dá para desfazer.'],
    ['Posso mudar o idioma?', 'Sim. Em Menu > Idioma, escolha Português, English ou Español. Seus posts e mensagens não são traduzidos.']
  ],
  en: [
    ['I forgot my password. Now what?', 'On the sign-in screen, tap "Forgot my password", enter your email and open the link we send you to create a new password. Check your spam folder too.'],
    ['How do stories work?', 'Tap the + on the stories bar (or the + button in the middle) and choose photo, video or text. You decide how long it stays visible, from 2 to 48 hours, and you can shorten that time or delete the story whenever you want.'],
    ['How do I report something?', 'On posts and stories, use the three-dot menu. In chats, tap the top bar and choose Report: the last 4 messages are sent to the administration for review. No one else sees them.'],
    ['How do I block someone?', 'Open the chat, tap the top bar and choose Block. You will no longer be able to exchange messages, and you can unblock at any time.'],
    ['What does @seguidores mean?', 'When you write @seguidores in a post or comment, all your followers get a notification. You can use it up to 3 times every 24 hours.'],
    ['My account was suspended. What do I do?', 'When you sign in, you see the reason and when the suspension ends. Right there you can send a review request explaining your side. A permanent block, on the other hand, closes the account for good.'],
    ['How do I delete my account?', 'Go to Menu > Settings > Delete account. This deletes your profile, posts, comments and messages, and it cannot be undone.'],
    ['Can I change the language?', 'Yes. Go to Menu > Language and choose Português, English or Español. Your posts and messages are not translated.']
  ],
  es: [
    ['Olvidé mi contraseña. ¿Y ahora?', 'En la pantalla de entrada, toca "Olvidé mi contraseña", escribe tu correo y abre el enlace que te enviamos para crear una nueva contraseña. Revisa también el spam.'],
    ['¿Cómo funcionan las historias?', 'Toca el + de la barra de historias (o el botón + del medio) y elige foto, vídeo o texto. Tú decides cuánto tiempo es visible, de 2 a 48 horas, y puedes reducir ese tiempo o borrar la historia cuando quieras.'],
    ['¿Cómo denuncio algo?', 'En publicaciones e historias, usa el menú de tres puntos. En las conversaciones, toca la barra superior y elige Denunciar: los últimos 4 mensajes se envían a la administración para su revisión. Nadie más los ve.'],
    ['¿Cómo bloqueo a alguien?', 'Abre la conversación, toca la barra superior y elige Bloquear. Dejarán de poder intercambiar mensajes y puedes desbloquear cuando quieras.'],
    ['¿Qué significa @seguidores?', 'Al escribir @seguidores en una publicación o comentario, todos tus seguidores reciben un aviso. Se puede usar hasta 3 veces cada 24 horas.'],
    ['Mi cuenta fue suspendida. ¿Qué hago?', 'Al entrar, ves el motivo y hasta cuándo dura la suspensión. Ahí mismo puedes enviar una solicitud de revisión explicando tu versión. El bloqueo definitivo, en cambio, cierra la cuenta para siempre.'],
    ['¿Cómo elimino mi cuenta?', 'En Menú > Ajustes > Eliminar cuenta. Esto borra tu perfil, publicaciones, comentarios y mensajes, y no se puede deshacer.'],
    ['¿Puedo cambiar el idioma?', 'Sí. En Menú > Idioma, elige Português, English o Español. Tus publicaciones y mensajes no se traducen.']
  ]
};
const SUP_CAT = [['question', 'Dúvida'], ['bug', 'Problema técnico'], ['account', 'Conta e acesso'], ['suggestion', 'Sugestão'], ['other', 'Outro assunto']];

async function openSupport(openId) {
  go('other'); window.lastProfile = null; window.reloadOther = () => {}; $('#q').value = '';
  const fq = FAQ[typeof LANG !== 'undefined' && FAQ[LANG] ? LANG : 'pt'];
  $('#v-other').innerHTML = backBtn('menu') + `<h2 class="font-bold text-xl px-1">Ajuda e suporte</h2>
  <div class="card divide-y divide-line overflow-hidden"><div class="px-4 py-2 text-xs font-semibold text-mut">Perguntas frequentes</div>${fq.map(([q, a]) => `<details class="p-4"><summary class="cursor-pointer text-sm font-semibold list-none flex items-center justify-between gap-3">${E(q)}<span class="text-mut shrink-0">${ic('plus', false, 16)}</span></summary><p class="text-sm text-mut mt-2 whitespace-pre-wrap">${E(a)}</p></details>`).join('')}</div>
  <button class="btn w-full" onclick="supportForm()">Falar com o suporte</button>
  <h3 class="font-bold px-1 pt-2">Seus pedidos</h3><div id="sp-list" class="space-y-2"><div class="sk h-16"></div></div>`;
  loadTickets(openId);
}
async function loadTickets(openId) {
  const { data, error } = await sb.from('support_tickets').select('id,category,subject,message,status,reply,replied_at,created_at').eq('user_id', P.id).order('created_at', { ascending: false }).limit(30);
  const el = $('#sp-list'); if (!el) return;
  if (error) { el.innerHTML = errH(/does not exist|schema cache|Could not find/.test(error.message) ? 'Falta rodar a migração 11 no Supabase.' : error); return }
  const st = { open: 'Aberto', answered: 'Respondido', closed: 'Fechado' }, cat = Object.fromEntries(SUP_CAT);
  el.innerHTML = (data || []).map(t => `<details class="card p-3" ${t.id === openId ? 'open' : ''}><summary class="cursor-pointer list-none flex items-start justify-between gap-2"><span class="min-w-0"><span class="block text-sm font-semibold truncate">${E(t.subject)}</span><span class="block text-[11px] text-mut">${cat[t.category] ? '<span>' + cat[t.category] + '</span>' : ''} · ${ago(t.created_at)}</span></span><span class="text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0 ${t.status === 'answered' ? 'bg-brand text-white' : 'bg-soft text-mut'}">${st[t.status]}</span></summary>
   <p class="text-sm mt-2 whitespace-pre-wrap break-words">${E(t.message)}</p>${t.reply ? `<div class="mt-2 rounded-lg bg-soft p-3"><div class="text-[11px] font-semibold text-brand mb-1">Resposta da equipe</div><p class="text-sm whitespace-pre-wrap break-words">${E(t.reply)}</p></div>` : ''}</details>`).join('') || '<p class="text-center text-sm text-mut py-6">Você ainda não enviou nenhum pedido.</p>';
}
function supportForm() {
  modal(`<div class="flex items-center justify-between mb-3"><h3 class="font-bold text-lg">Novo pedido de suporte</h3><button class="circ" onclick="closeM()" aria-label="Fechar">${ic('x', false, 18)}</button></div>
  <label class="text-xs font-semibold">Categoria</label><select id="su-c" class="inp mb-3">${SUP_CAT.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select>
  <input id="su-s" class="inp mb-3" maxlength="120" placeholder="Assunto"><textarea id="su-m" rows="5" class="inp mb-3" maxlength="2000" placeholder="Descreva o que precisa (mínimo 10 caracteres)"></textarea>
  <button id="su-go" class="btn w-full !py-3" onclick="supportSend()">Enviar pedido</button>`);
}
async function supportSend() {
  const c = $('#su-c').value, s = $('#su-s').value.trim(), m = $('#su-m').value.trim();
  if (s.length < 3 || m.length < 10) return T('Preencha o assunto e a mensagem.');
  $('#su-go').disabled = true; const { error } = await sb.rpc('support_create', { p_category: c, p_subject: s, p_message: m });
  if (error) { $('#su-go').disabled = false; return T(/5 pedidos/.test(error.message) ? 'Você já enviou 5 pedidos nas últimas 24 horas.' : /support_create|does not exist/.test(error.message) ? 'Falta rodar a migração 11 no Supabase.' : 'Erro: ' + error.message) }
  closeM(); T('Pedido enviado! Responderemos por aqui.'); openSupport();
}
