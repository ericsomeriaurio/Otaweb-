/* OtaWeb · idiomas. O português é o idioma original do código; aqui os textos da tela são trocados
   por inglês ou espanhol. Para acrescentar um idioma: adicione-o em LANGS e uma coluna em TR/PRE/PAT. */
const LANGS = { pt: ['Português', 'pt-PT'], en: ['English', 'en-GB'], es: ['Español', 'es-ES'] };
const LIDX = { en: 1, es: 2 };
let LANG = 'pt';
window.LOCALE = 'pt-PT';

/* [português, inglês, espanhol] */
const TR = [
  // navegação e telas principais
  ["Início", "Home", "Inicio"], ["Reels", "Reels", "Reels"], ["Guildas", "Guilds", "Gremios"], ["Criar", "Create", "Crear"], ["Avisos", "Alerts", "Avisos"], ["Menu", "Menu", "Menú"],
  ["Mensagens", "Messages", "Mensajes"], ["Notificações", "Notifications", "Notificaciones"], ["Perfil", "Profile", "Perfil"], ["Voltar", "Back", "Volver"],
  ["Buscar pessoas e publicações", "Search people and posts", "Buscar personas y publicaciones"], ["Buscar", "Search", "Buscar"], ["Buscar por nome ou @usuário", "Search by name or @username", "Buscar por nombre o @usuario"],
  ["No que você está pensando?", "What's on your mind?", "¿En qué estás pensando?"], ["Foto", "Photo", "Foto"], ["Vídeo", "Video", "Vídeo"], ["Áudio", "Audio", "Audio"], ["Enquete", "Poll", "Encuesta"], ["Texto", "Text", "Texto"],
  // entrar e criar conta
  ["Conecte-se com outros otakus: poste, converse e compartilhe o que você ama.", "Connect with other otakus: post, chat and share what you love.", "Conéctate con otros otakus: publica, conversa y comparte lo que amas."],
  ["Entrar", "Sign in", "Entrar"], ["Criar conta", "Create account", "Crear cuenta"], ["Criar minha conta", "Create my account", "Crear mi cuenta"], ["Nome de exibição", "Display name", "Nombre visible"],
  ["@usuario (a-z, 0-9, _)", "@username (a-z, 0-9, _)", "@usuario (a-z, 0-9, _)"], ["E-mail", "Email", "Correo"], ["Senha (mín. 6 caracteres)", "Password (min. 6 characters)", "Contraseña (mín. 6 caracteres)"],
  ["Esqueci minha senha", "Forgot my password", "Olvidé mi contraseña"], ["Recuperar conta", "Recover account", "Recuperar cuenta"], ["Enviamos um link para você criar uma nova senha.", "We'll send you a link to create a new password.", "Te enviaremos un enlace para crear una nueva contraseña."],
  ["Seu e-mail", "Your email", "Tu correo"], ["Enviar link", "Send link", "Enviar enlace"], ["Criar nova senha", "Create new password", "Crear nueva contraseña"], ["Nova senha (mín. 6)", "New password (min. 6)", "Nueva contraseña (mín. 6)"],
  ["Repita a nova senha", "Repeat the new password", "Repite la nueva contraseña"], ["Salvar nova senha", "Save new password", "Guardar nueva contraseña"],
  ["Conta criada! Confirme o e-mail e depois entre.", "Account created! Confirm your email and then sign in.", "¡Cuenta creada! Confirma tu correo y luego entra."],
  ["E-mail ou senha incorretos.", "Incorrect email or password.", "Correo o contraseña incorrectos."], ["Esse @usuario ou e-mail já existe.", "That @username or email already exists.", "Ese @usuario o correo ya existe."],
  ["Usuário: 3-20 letras minúsculas, números ou _", "Username: 3-20 lowercase letters, numbers or _", "Usuario: 3-20 letras minúsculas, números o _"], ["Escolha um nome.", "Choose a name.", "Elige un nombre."],
  ["Digite seu e-mail.", "Enter your email.", "Escribe tu correo."], ["Se esse e-mail tiver conta, o link foi enviado. Veja também o spam.", "If that email has an account, the link was sent. Check your spam folder too.", "Si ese correo tiene cuenta, el enlace fue enviado. Revisa también el spam."],
  ["A senha precisa ter pelo menos 6 caracteres.", "The password must be at least 6 characters long.", "La contraseña debe tener al menos 6 caracteres."], ["As senhas não são iguais.", "The passwords don't match.", "Las contraseñas no coinciden."],
  // posts
  ["Curtir", "Like", "Me gusta"], ["Amei", "Love", "Me encanta"], ["Haha", "Haha", "Jaja"], ["Uau", "Wow", "Guau"], ["Triste", "Sad", "Triste"], ["Grr", "Angry", "Enfado"],
  ["Comentar", "Comment", "Comentar"], ["Compartilhar", "Share", "Compartir"], ["Comentário", "Comment", "Comentario"], ["Comentários", "Comments", "Comentarios"], ["Comentário (opcional)", "Comment (optional)", "Comentario (opcional)"],
  ["Escreva um comentário", "Write a comment", "Escribe un comentario"], ["Seja o primeiro a comentar.", "Be the first to comment.", "Sé el primero en comentar."], ["Nenhum comentário ainda.", "No comments yet.", "Aún no hay comentarios."],
  ["Responder", "Reply", "Responder"], ["Respondendo a", "Replying to", "Respondiendo a"], ["Cancelar resposta", "Cancel reply", "Cancelar respuesta"], ["Reagir", "React", "Reaccionar"], ["Reações", "Reactions", "Reacciones"],
  ["Sem reações.", "No reactions.", "Sin reacciones."], ["Ninguém reagiu ainda.", "No one has reacted yet.", "Nadie ha reaccionado aún."], ["Reação enviada.", "Reaction sent.", "Reacción enviada."], ["Todas", "All", "Todas"], ["Todos", "All", "Todos"],
  ["Nenhum post ainda. Seja o primeiro a postar!", "No posts yet. Be the first to post!", "Aún no hay publicaciones. ¡Sé el primero en publicar!"], ["Sem posts ainda.", "No posts yet.", "Aún no hay publicaciones."],
  ["Nenhum reel ainda.", "No reels yet.", "Aún no hay reels."], ["Publique um vídeo e ele aparece aqui.", "Post a video and it will show up here.", "Publica un vídeo y aparecerá aquí."],
  ["Nova publicação", "New post", "Nueva publicación"], ["Publicar", "Post", "Publicar"], ["Publicado!", "Posted!", "¡Publicado!"], ["Publicações", "Posts", "Publicaciones"], ["posts", "posts", "publicaciones"], ["seguidores", "followers", "seguidores"], ["seguindo", "following", "siguiendo"],
  ["Publicação de texto", "Text post", "Publicación de texto"], ["Compartilhe uma ideia", "Share an idea", "Comparte una idea"], ["Envie uma imagem", "Upload an image", "Sube una imagen"], ["Também aparece em Reels", "Also appears in Reels", "También aparece en Reels"],
  ["Pergunte à comunidade", "Ask the community", "Pregunta a la comunidad"], ["Escreva algo...", "Write something...", "Escribe algo..."], ["Escreva algo, anexe uma mídia ou crie uma enquete.", "Write something, attach media or create a poll.", "Escribe algo, adjunta un archivo o crea una encuesta."],
  ["Nova enquete", "New poll", "Nueva encuesta"], ["Pergunta", "Question", "Pregunta"], ["Pergunta da enquete", "Poll question", "Pregunta de la encuesta"], ["Opção 1", "Option 1", "Opción 1"], ["Opção 2", "Option 2", "Opción 2"], ["Opção 3 (opcional)", "Option 3 (optional)", "Opción 3 (opcional)"], ["Opção 4 (opcional)", "Option 4 (optional)", "Opción 4 (opcional)"],
  ["Adicionar", "Add", "Añadir"], ["Opções", "Options", "Opciones"], ["Opções da publicação", "Post options", "Opciones de la publicación"], ["Editar publicação", "Edit post", "Editar publicación"], ["Apagar publicação", "Delete post", "Borrar publicación"],
  ["Publicação apagada.", "Post deleted.", "Publicación eliminada."], ["Publicação editada.", "Post edited.", "Publicación editada."], ["Esta publicação não existe mais.", "This post no longer exists.", "Esta publicación ya no existe."],
  ["Repostar na rede", "Repost on the network", "Republicar en la red"], ["Repostado!", "Reposted!", "¡Republicado!"], ["Compartilhar fora da rede", "Share outside the network", "Compartir fuera de la red"], ["Copiar link", "Copy link", "Copiar enlace"], ["Copiado!", "Copied!", "¡Copiado!"],
  ["Baixar mídia", "Download media", "Descargar archivo"], ["Baixar", "Download", "Descargar"], ["Denunciar", "Report", "Denunciar"], ["Denúncia enviada. Obrigado!", "Report sent. Thank you!", "Denuncia enviada. ¡Gracias!"],
  ["Enviando mídia...", "Uploading media...", "Subiendo archivo..."], ["Enviando foto...", "Uploading photo...", "Subiendo foto..."], ["Enviando...", "Sending...", "Enviando..."], ["Arquivo acima de 50 MB.", "File larger than 50 MB.", "Archivo de más de 50 MB."],
  ["Não foi possível baixar.", "Couldn't download.", "No se pudo descargar."], ["Não foi possível copiar.", "Couldn't copy.", "No se pudo copiar."], ["Erro ao votar.", "Error voting.", "Error al votar."],
  ["Buscar pessoas", "Search people", "Buscar personas"], ["Pessoas", "People", "Personas"], ["Nada encontrado.", "Nothing found.", "No se encontró nada."], ["Ninguém encontrado.", "No one found.", "No se encontró a nadie."],
  ["Salvar publicação", "Save post", "Guardar publicación"], ["Remover dos salvos", "Remove from saved", "Quitar de guardados"], ["Removido dos salvos", "Removed from saved", "Quitado de guardados"], ["Publicação salva", "Saved post", "Publicación guardada"],
  ["Mudar de categoria", "Change category", "Cambiar de categoría"], ["Salvar em...", "Save to...", "Guardar en..."], ["Nova categoria", "New category", "Nueva categoría"], ["Escolha ou crie uma categoria.", "Choose or create a category.", "Elige o crea una categoría."], ["Geral", "General", "General"],
  ["Nada salvo ainda.", "Nothing saved yet.", "Aún no hay nada guardado."], ["Nada salvo nesta categoria.", "Nothing saved in this category.", "No hay nada guardado en esta categoría."], ["Use o menu de três pontos de um post para salvar.", "Use a post's three-dot menu to save it.", "Usa el menú de tres puntos de una publicación para guardarla."],
  // perfil
  ["Seguir", "Follow", "Seguir"], ["Seguindo", "Following", "Siguiendo"], ["Mensagem", "Message", "Mensaje"], ["Editar perfil", "Edit profile", "Editar perfil"], ["Perfil não encontrado.", "Profile not found.", "Perfil no encontrado."], ["Perfil salvo.", "Profile saved.", "Perfil guardado."],
  ["Nome", "Name", "Nombre"], ["Bio", "Bio", "Bio"], ["Anime favorito", "Favorite anime", "Anime favorito"], ["Foto atualizada!", "Photo updated!", "¡Foto actualizada!"], ["Convide amigos para o OtaWeb!", "Invite friends to OtaWeb!", "¡Invita a tus amigos a OtaWeb!"],
  // menu e definições
  ["Salvos", "Saved", "Guardados"], ["Publicações guardadas por categoria", "Saved posts by category", "Publicaciones guardadas por categoría"], ["Definições", "Settings", "Ajustes"], ["Conta, senha e privacidade", "Account, password and privacy", "Cuenta, contraseña y privacidad"],
  ["Sobre o OtaWeb", "About OtaWeb", "Acerca de OtaWeb"], ["Versão e informações", "Version and information", "Versión e información"], ["A rede social para quem vive anime. Versão 0.4.", "The social network for anime lovers. Version 0.4.", "La red social para quienes viven el anime. Versión 0.4."],
  ["Administração", "Administration", "Administración"], ["Painel da rede", "Network dashboard", "Panel de la red"], ["Aparência", "Appearance", "Apariencia"], ["Claro", "Light", "Claro"], ["Escuro", "Dark", "Oscuro"], ["Sistema", "System", "Sistema"],
  ["Idioma", "Language", "Idioma"], ["Escolha o idioma do site. Seus posts e mensagens não são traduzidos.", "Choose the site language. Your posts and messages aren't translated.", "Elige el idioma del sitio. Tus publicaciones y mensajes no se traducen."],
  ["Ajuda e suporte", "Help and support", "Ayuda y soporte"], ["Perguntas frequentes e contato", "Frequently asked questions and contact", "Preguntas frecuentes y contacto"], ["Sair da conta", "Sign out", "Cerrar sesión"], ["Fechar", "Close", "Cerrar"],
  ["Estado da conta", "Account status", "Estado de la cuenta"], ["Restrições e pedido de revisão", "Restrictions and review request", "Restricciones y solicitud de revisión"], ["Sua conta está em dia, sem restrições.", "Your account is in good standing, with no restrictions.", "Tu cuenta está al día, sin restricciones."],
  ["Há restrições na sua conta.", "There are restrictions on your account.", "Hay restricciones en tu cuenta."], ["Detalhes", "Details", "Detalles"], ["Atual:", "Current:", "Actual:"], ["Salvar perfil", "Save profile", "Guardar perfil"], ["Salvar", "Save", "Guardar"],
  ["Alterar e-mail", "Change email", "Cambiar correo"], ["Novo e-mail", "New email", "Nuevo correo"], ["Digite o novo e-mail.", "Enter the new email.", "Escribe el nuevo correo."], ["Enviamos um link de confirmação para o novo e-mail.", "We sent a confirmation link to the new email.", "Enviamos un enlace de confirmación al nuevo correo."],
  ["Senha", "Password", "Contraseña"], ["Alterar senha", "Change password", "Cambiar contraseña"], ["Mostrar quando estou online", "Show when I'm online", "Mostrar cuando estoy en línea"], ["Ligado", "On", "Activado"], ["Desligado", "Off", "Desactivado"],
  ["Se desligar, os outros não veem quando você está online nem quando saiu.", "If you turn this off, others can't see when you're online or when you were last seen.", "Si lo desactivas, los demás no ven cuándo estás en línea ni cuándo te conectaste por última vez."],
  ["Excluir conta", "Delete account", "Eliminar cuenta"], ["Excluir minha conta", "Delete my account", "Eliminar mi cuenta"], ["Apaga seu perfil, posts, comentários e mensagens. Não dá para desfazer.", "Deletes your profile, posts, comments and messages. This can't be undone.", "Elimina tu perfil, publicaciones, comentarios y mensajes. No se puede deshacer."],
  ["Para confirmar, digite", "To confirm, type", "Para confirmar, escribe"], ["EXCLUIR", "DELETE", "ELIMINAR"], ["Excluir para sempre", "Delete forever", "Eliminar para siempre"], ["Digite EXCLUIR para confirmar.", "Type DELETE to confirm.", "Escribe ELIMINAR para confirmar."],
  // ajuda e suporte
  ["Perguntas frequentes", "Frequently asked questions", "Preguntas frecuentes"], ["Falar com o suporte", "Contact support", "Hablar con soporte"], ["Seus pedidos", "Your requests", "Tus solicitudes"], ["Novo pedido de suporte", "New support request", "Nueva solicitud de soporte"],
  ["Categoria", "Category", "Categoría"], ["Dúvida", "Question", "Duda"], ["Problema técnico", "Technical problem", "Problema técnico"], ["Conta e acesso", "Account and access", "Cuenta y acceso"], ["Sugestão", "Suggestion", "Sugerencia"], ["Outro assunto", "Something else", "Otro asunto"],
  ["Assunto", "Subject", "Asunto"], ["Descreva o que precisa (mínimo 10 caracteres)", "Describe what you need (minimum 10 characters)", "Describe lo que necesitas (mínimo 10 caracteres)"], ["Enviar pedido", "Send request", "Enviar solicitud"],
  ["Pedido enviado! Responderemos por aqui.", "Request sent! We'll reply right here.", "¡Solicitud enviada! Responderemos por aquí."], ["Aberto", "Open", "Abierto"], ["Respondido", "Answered", "Respondido"], ["Fechado", "Closed", "Cerrado"], ["Resposta da equipe", "Team reply", "Respuesta del equipo"],
  ["Você ainda não enviou nenhum pedido.", "You haven't sent any requests yet.", "Aún no has enviado ninguna solicitud."], ["Preencha o assunto e a mensagem.", "Fill in the subject and the message.", "Completa el asunto y el mensaje."], ["Você já enviou 5 pedidos nas últimas 24 horas.", "You've already sent 5 requests in the last 24 hours.", "Ya enviaste 5 solicitudes en las últimas 24 horas."],
  // notificações
  ["Nenhuma notificação por enquanto.", "No notifications for now.", "No hay notificaciones por ahora."], ["reagiu à sua publicação", "reacted to your post", "reaccionó a tu publicación"], ["comentou na sua publicação", "commented on your post", "comentó tu publicación"],
  ["respondeu ao seu comentário", "replied to your comment", "respondió a tu comentario"], ["começou a seguir você", "started following you", "empezó a seguirte"], ["mencionou você", "mentioned you", "te mencionó"], ["mencionou todos os seguidores", "mentioned all followers", "mencionó a todos los seguidores"],
  ["reagiu ao seu story", "reacted to your story", "reaccionó a tu historia"], ["respondeu ao seu pedido de suporte", "replied to your support request", "respondió a tu solicitud de soporte"], ["interagiu com você", "interacted with you", "interactuó contigo"],
  ["Avisa todos os seus seguidores (máx. 3 por dia)", "Notifies all your followers (max. 3 per day)", "Avisa a todos tus seguidores (máx. 3 al día)"],
  // conversas
  ["Nova conversa", "New chat", "Nueva conversación"], ["Conversa", "Chat", "Chat"], ["Grupo", "Group", "Grupo"], ["Novo grupo", "New group", "Nuevo grupo"], ["Nome do grupo", "Group name", "Nombre del grupo"], ["Criar grupo", "Create group", "Crear grupo"], ["Dê um nome ao grupo.", "Give the group a name.", "Ponle un nombre al grupo."],
  ["Escolha pelo menos uma pessoa.", "Choose at least one person.", "Elige al menos una persona."], ["Nenhuma conversa ainda.", "No chats yet.", "Aún no hay conversaciones."], ["Toque em", "Tap", "Toca"], ["para falar com alguém.", "to talk to someone.", "para hablar con alguien."],
  ["Nenhuma mensagem ainda", "No messages yet", "Aún no hay mensajes"], ["Diga olá!", "Say hi!", "¡Di hola!"], ["Mensagem apagada", "Message deleted", "Mensaje eliminado"], ["Mensagem afixada", "Pinned message", "Mensaje fijado"], ["Mensagem original indisponível", "Original message unavailable", "Mensaje original no disponible"],
  ["Mensagem fora do histórico carregado.", "Message is outside the loaded history.", "El mensaje está fuera del historial cargado."], ["Coração", "Heart", "Corazón"], ["Localização", "Location", "Ubicación"], ["Local", "Location", "Ubicación"], ["Ver localização no mapa", "View location on map", "Ver ubicación en el mapa"],
  ["Localização indisponível neste aparelho.", "Location isn't available on this device.", "La ubicación no está disponible en este dispositivo."], ["Permita o acesso à localização no navegador.", "Allow location access in your browser.", "Permite el acceso a la ubicación en el navegador."],
  ["Anexar", "Attach", "Adjuntar"], ["Enviar", "Send", "Enviar"], ["Enviar mensagem", "Send message", "Enviar mensaje"], ["Enviado", "Sent", "Enviado"], ["Recebido", "Delivered", "Recibido"], ["Visto", "Seen", "Visto"], ["Online", "Online", "En línea"], ["digitando...", "typing...", "escribiendo..."],
  ["Apagar para mim", "Delete for me", "Borrar para mí"], ["Apagar para todos", "Delete for everyone", "Borrar para todos"], ["Copiar texto", "Copy text", "Copiar texto"], ["Editar", "Edit", "Editar"], ["Editar mensagem", "Edit message", "Editar mensaje"], ["Editar comentário", "Edit comment", "Editar comentario"],
  ["Afixar no topo", "Pin to top", "Fijar arriba"], ["Desafixar", "Unpin", "Desfijar"], ["Não foi possível enviar esta mensagem.", "This message couldn't be sent.", "No se pudo enviar este mensaje."], ["Alguém respondeu ou mencionou você", "Someone replied to or mentioned you", "Alguien te respondió o te mencionó"],
  ["Ir para a mensagem que mencionou ou respondeu você", "Go to the message that mentioned or replied to you", "Ir al mensaje que te mencionó o respondió"], ["Mais opções", "More options", "Más opciones"], ["Alguém", "Someone", "Alguien"], ["(você)", "(you)", "(tú)"], ["Você", "You", "Tú"],
  ["Ver perfil", "View profile", "Ver perfil"], ["Bloquear", "Block", "Bloquear"], ["Desbloquear", "Unblock", "Desbloquear"], ["Bloquear este contato?", "Block this contact?", "¿Bloquear este contacto?"], ["Vocês deixam de poder trocar mensagens. Dá para desbloquear quando quiser.", "You'll no longer be able to exchange messages. You can unblock anytime.", "Dejarán de poder intercambiar mensajes. Puedes desbloquear cuando quieras."],
  ["Contato bloqueado", "Contact blocked", "Contacto bloqueado"], ["Contato bloqueado.", "Contact blocked.", "Contacto bloqueado."], ["Contato desbloqueado.", "Contact unblocked.", "Contacto desbloqueado."], ["Você bloqueou este contato.", "You blocked this contact.", "Bloqueaste a este contacto."],
  ["Usuário indisponível", "User unavailable", "Usuario no disponible"], ["Usuário indisponível. Não é possível enviar mensagens.", "User unavailable. Messages can't be sent.", "Usuario no disponible. No se pueden enviar mensajes."],
  ["Denunciar grupo", "Report group", "Denunciar grupo"], ["Apagar conversa?", "Delete chat?", "¿Borrar conversación?"], ["Apagar conversa", "Delete chat", "Borrar conversación"], ["A conversa some só para você.", "The chat disappears only for you.", "La conversación desaparece solo para ti."], ["Confirmar", "Confirm", "Confirmar"], ["Cancelar", "Cancel", "Cancelar"],
  ["Ao denunciar, as 4 últimas mensagens desta conversa são enviadas à administração para análise. Ninguém mais vê.", "When you report, the last 4 messages of this chat are sent to the administration for review. No one else sees them.", "Al denunciar, los últimos 4 mensajes de esta conversación se envían a la administración para su revisión. Nadie más los ve."],
  ["Spam ou golpe", "Spam or scam", "Spam o estafa"], ["Assédio ou ameaça", "Harassment or threats", "Acoso o amenazas"], ["Conteúdo impróprio", "Inappropriate content", "Contenido inapropiado"], ["Outro motivo", "Another reason", "Otro motivo"],
  ["Spam ou golpe.", "Spam or scam.", "Spam o estafa."], ["Assédio ou ameaça.", "Harassment or threats.", "Acoso o amenazas."], ["Conteúdo impróprio.", "Inappropriate content.", "Contenido inapropiado."], ["Violação dos termos da rede.", "Violation of the network's terms.", "Violación de los términos de la red."], ["Motivo:", "Reason:", "Motivo:"],
  // grupos
  ["MEMBROS", "MEMBERS", "MIEMBROS"], ["Dono", "Owner", "Dueño"], ["Adicionar pessoas", "Add people", "Añadir personas"], ["Adicionar ao grupo", "Add to group", "Añadir al grupo"], ["Adicionado", "Added", "Añadido"], ["No grupo", "In the group", "En el grupo"], ["Escolha alguém que ainda não está no grupo.", "Choose someone who isn't in the group yet.", "Elige a alguien que aún no esté en el grupo."],
  ["Mudar nome", "Change name", "Cambiar nombre"], ["Remover foto", "Remove photo", "Quitar foto"], ["Trocar foto do grupo", "Change group photo", "Cambiar foto del grupo"], ["Foto do grupo atualizada.", "Group photo updated.", "Foto del grupo actualizada."], ["Foto do grupo removida.", "Group photo removed.", "Foto del grupo eliminada."],
  ["Sair do grupo", "Leave group", "Salir del grupo"], ["Sair do grupo?", "Leave group?", "¿Salir del grupo?"], ["Você deixa de receber as mensagens deste grupo.", "You will stop receiving this group's messages.", "Dejarás de recibir los mensajes de este grupo."], ["Você não está mais nesta conversa.", "You're no longer in this chat.", "Ya no estás en esta conversación."],
  ["Excluir grupo", "Delete group", "Eliminar grupo"], ["Excluir grupo?", "Delete group?", "¿Eliminar grupo?"], ["Grupo excluído.", "Group deleted.", "Grupo eliminado."], ["O grupo e todas as mensagens somem para todos. Não dá para desfazer.", "The group and all its messages disappear for everyone. This can't be undone.", "El grupo y todos sus mensajes desaparecen para todos. No se puede deshacer."],
  ["Tornar admin", "Make admin", "Hacer admin"], ["Remover cargo de admin", "Remove admin role", "Quitar cargo de admin"], ["Transferir liderança", "Transfer leadership", "Transferir liderazgo"], ["Transferir liderança?", "Transfer leadership?", "¿Transferir liderazgo?"], ["Transferir", "Transfer", "Transferir"],
  ["Você passa a ser admin e a outra pessoa vira a dona do grupo.", "You become an admin and the other person becomes the group owner.", "Pasas a ser admin y la otra persona se convierte en la dueña del grupo."], ["Você é o dono: passe a liderança para outra pessoa antes de sair.", "You're the owner: pass leadership to someone else before leaving.", "Eres el dueño: pasa el liderazgo a otra persona antes de salir."],
  ["Remover do grupo", "Remove from group", "Quitar del grupo"], ["Remover do grupo?", "Remove from group?", "¿Quitar del grupo?"], ["Remover", "Remove", "Quitar"], ["Essa pessoa", "This person", "Esta persona"], ["Excluir", "Delete", "Eliminar"], ["Apagar", "Delete", "Borrar"],
  // stories
  ["Seu story", "Your story", "Tu historia"], ["Novo story", "New story", "Nueva historia"], ["Story de texto", "Text story", "Historia de texto"], ["Story", "Story", "Historia"], ["Publicar story", "Post story", "Publicar historia"], ["Vídeo (até 60 segundos)", "Video (up to 60 seconds)", "Vídeo (hasta 60 segundos)"],
  ["Você escolhe por quanto tempo ele fica visível. Depois some sozinho.", "You choose how long it stays visible. Then it disappears on its own.", "Tú eliges cuánto tiempo es visible. Luego desaparece solo."], ["Some sozinho no tempo que você escolher", "Disappears on its own after the time you choose", "Desaparece solo tras el tiempo que elijas"],
  ["Duração do story", "Story duration", "Duración de la historia"], ["Duração", "Duration", "Duración"], ["Reduzir a duração", "Shorten duration", "Reducir la duración"], ["Legenda (opcional)", "Caption (optional)", "Pie de foto (opcional)"], ["Escolha um arquivo", "Choose a file", "Elige un archivo"], ["Escolher", "Choose", "Elegir"], ["Escolher fundo", "Choose background", "Elegir fondo"],
  ["Escreva algo para o story.", "Write something for the story.", "Escribe algo para la historia."], ["O vídeo do story pode ter no máximo 60 segundos.", "Story videos can be 60 seconds at most.", "El vídeo de la historia puede durar 60 segundos como máximo."], ["Apagar story", "Delete story", "Borrar historia"], ["Apagar este story?", "Delete this story?", "¿Borrar esta historia?"],
  ["Ele some para todos e não dá para desfazer.", "It disappears for everyone and can't be undone.", "Desaparece para todos y no se puede deshacer."], ["Story apagado.", "Story deleted.", "Historia eliminada."], ["Apagar agora", "Delete now", "Borrar ahora"], ["Este story já termina em breve.", "This story ends soon.", "Esta historia termina pronto."],
  ["Esse story já expirou.", "That story has expired.", "Esa historia ya expiró."], ["Ver quem viu", "See who viewed", "Ver quién lo vio"], ["Visto por", "Seen by", "Visto por"], ["Ninguém viu ainda", "No one has seen it yet", "Nadie lo ha visto aún"], ["Ninguém viu ainda.", "No one has seen it yet.", "Nadie lo ha visto aún."], ["Som", "Sound", "Sonido"],
  ["Comunidades por anime, jogo ou tema, com nome único em toda a rede. Este módulo está em desenvolvimento.", "Communities by anime, game or topic, with a unique name across the network. This module is under development.", "Comunidades por anime, juego o tema, con un nombre único en toda la red. Este módulo está en desarrollo."],
  // penalidades e revisão
  ["Conta bloqueada", "Account blocked", "Cuenta bloqueada"], ["Conta suspensa", "Account suspended", "Cuenta suspendida"], ["Esta conta não pode mais ser usada porque foi bloqueada por violar os termos da rede.", "This account can no longer be used because it was blocked for violating the network's terms.", "Esta cuenta ya no se puede usar porque fue bloqueada por violar los términos de la red."],
  ["Sua conta está suspensa por violar os termos da rede.", "Your account is suspended for violating the network's terms.", "Tu cuenta está suspendida por violar los términos de la red."], ["A suspensão termina em", "The suspension ends on", "La suspensión termina el"], [". Depois disso é só entrar de novo.", ". After that, just sign in again.", ". Después solo tienes que entrar de nuevo."],
  ["Esta suspensão não tem data para acabar: ela dura até a administração rever o caso.", "This suspension has no end date: it lasts until the administration reviews the case.", "Esta suspensión no tiene fecha de fin: dura hasta que la administración revise el caso."],
  ["Pedir revisão", "Request review", "Solicitar revisión"], ["Enviar pedido de revisão", "Submit review request", "Enviar solicitud de revisión"], ["Foi um engano", "It was a mistake", "Fue un error"], ["Não violei os termos", "I didn't break the terms", "No incumplí los términos"], ["Entendi e não vou repetir", "I understand and won't repeat it", "Lo entiendo y no lo repetiré"],
  ["Explique por que acha que a penalidade deve ser revista (mínimo 10 caracteres)", "Explain why you think the penalty should be reviewed (minimum 10 characters)", "Explica por qué crees que la sanción debe revisarse (mínimo 10 caracteres)"], ["Escreva pelo menos 10 caracteres.", "Write at least 10 characters.", "Escribe al menos 10 caracteres."],
  ["Seu pedido de revisão foi enviado e está em análise.", "Your review request was sent and is being reviewed.", "Tu solicitud de revisión fue enviada y está en análisis."], ["Seu pedido foi analisado e negado.", "Your request was reviewed and denied.", "Tu solicitud fue revisada y rechazada."],
  ["Pedido enviado. Aguarde a resposta da administração.", "Request sent. Please wait for the administration's reply.", "Solicitud enviada. Espera la respuesta de la administración."], ["Você já tem um pedido em análise.", "You already have a request under review.", "Ya tienes una solicitud en análisis."], ["Esta conta foi bloqueada definitivamente.", "This account has been permanently blocked.", "Esta cuenta fue bloqueada definitivamente."],
  ["Envio de mensagens", "Sending messages", "Envío de mensajes"],
  // genéricos
  ["Ok", "OK", "OK"], ["Sim", "Yes", "Sí"], ["Não", "No", "No"], ["Carregando...", "Loading...", "Cargando..."]
];

/* prefixos de mensagens de erro: "Não salvou: <detalhe do servidor>" */
const PRE = [
  ["Não adicionou:", "Couldn't add:", "No se pudo añadir:"], ["Não afixou:", "Couldn't pin:", "No se pudo fijar:"], ["Não alterou:", "Couldn't change:", "No se pudo cambiar:"], ["Não apagou:", "Couldn't delete:", "No se pudo borrar:"], ["Não bloqueou:", "Couldn't block:", "No se pudo bloquear:"],
  ["Não comentou:", "Couldn't comment:", "No se pudo comentar:"], ["Não consegui carregar seu perfil:", "Couldn't load your profile:", "No se pudo cargar tu perfil:"], ["Não criou a conversa:", "Couldn't create the chat:", "No se pudo crear la conversación:"], ["Não criou o grupo:", "Couldn't create the group:", "No se pudo crear el grupo:"],
  ["Não desbloqueou:", "Couldn't unblock:", "No se pudo desbloquear:"], ["Não editou:", "Couldn't edit:", "No se pudo editar:"], ["Não enviou:", "Couldn't send:", "No se pudo enviar:"], ["Não excluiu:", "Couldn't delete:", "No se pudo eliminar:"], ["Não mudou o cargo:", "Couldn't change the role:", "No se pudo cambiar el cargo:"],
  ["Não mudou o nome:", "Couldn't change the name:", "No se pudo cambiar el nombre:"], ["Não publicou:", "Couldn't post:", "No se pudo publicar:"], ["Não reagiu:", "Couldn't react:", "No se pudo reaccionar:"], ["Não removeu a foto:", "Couldn't remove the photo:", "No se pudo quitar la foto:"], ["Não removeu:", "Couldn't remove:", "No se pudo quitar:"],
  ["Não saiu:", "Couldn't leave:", "No se pudo salir:"], ["Não salvou a foto:", "Couldn't save the photo:", "No se pudo guardar la foto:"], ["Não salvou a reação:", "Couldn't save the reaction:", "No se pudo guardar la reacción:"], ["Não salvou:", "Couldn't save:", "No se pudo guardar:"],
  ["Não transferiu:", "Couldn't transfer:", "No se pudo transferir:"], ["Não trocou a foto:", "Couldn't change the photo:", "No se pudo cambiar la foto:"], ["Erro ao carregar mensagens:", "Error loading messages:", "Error al cargar los mensajes:"], ["Falha no upload:", "Upload failed:", "Error al subir:"], ["Erro:", "Error:", "Error:"]
];

const ACT = { "enviar mensagens": ["send messages", "enviar mensajes"], "publicar": ["post", "publicar"], "comentar": ["comment", "comentar"], "usar a conta": ["use the account", "usar la cuenta"] };
const plural = (n, a, b) => Number(n) === 1 ? a : b;
/* padrões para textos com partes variáveis; o valor pode ser texto com $1 ou uma função */
const PAT = [
  [/^Visto por (\d+)$/, { en: "Seen by $1", es: "Visto por $1" }],
  [/^Visto agora há pouco$/, { en: "Seen just now", es: "Visto hace un momento" }], [/^Visto há (\d+) min$/, { en: "Seen $1 min ago", es: "Visto hace $1 min" }],
  [/^Visto hoje às (.+)$/, { en: "Seen today at $1", es: "Visto hoy a las $1" }], [/^Visto em (.+)$/, { en: "Seen on $1", es: "Visto el $1" }],
  [/^(.+) está digitando\.\.\.$/, { en: "$1 is typing...", es: "$1 está escribiendo..." }],
  [/^(\d+) membros?(?: · (\d+) online)?$/, { en: (m, n, o) => n + plural(n, " member", " members") + (o ? " · " + o + " online" : ""), es: (m, n, o) => n + plural(n, " miembro", " miembros") + (o ? " · " + o + " en línea" : "") }],
  [/^(\d+) comentários?$/, { en: (m, n) => n + plural(n, " comment", " comments"), es: (m, n) => n + plural(n, " comentario", " comentarios") }],
  [/^(\d+) votos?$/, { en: (m, n) => n + plural(n, " vote", " votes"), es: (m, n) => n + plural(n, " voto", " votos") }],
  [/^(\d+) h restantes$/, { en: "$1 h left", es: "$1 h restantes" }], [/^(\d+) min restantes$/, { en: "$1 min left", es: "$1 min restantes" }],
  [/^Faltam (\d+ (?:h|min)) restantes\. Dá para encurtar, mas não para aumentar\.$/, { en: "$1 left. You can shorten it, but not extend it.", es: "Faltan $1. Puedes acortarla, pero no alargarla." }],
  [/^Fica (\d+) h$/, { en: "Stays $1 h", es: "Dura $1 h" }], [/^Pronto: o story some em (\d+) h\.$/, { en: "Done: the story disappears in $1 h.", es: "Listo: la historia desaparece en $1 h." }],
  [/^Story publicado por (\d+) h\.$/, { en: "Story posted for $1 h.", es: "Historia publicada por $1 h." }], [/^Salvo em (.+)$/, { en: "Saved to $1", es: "Guardado en $1" }], [/^Respondendo a (.+)$/, { en: "Replying to $1", es: "Respondiendo a $1" }],
  [/^Você: (.+)$/, { en: (m, x) => "You: " + tr(x), es: (m, x) => "Tú: " + tr(x) }], [/^Enquete: (.+)$/, { en: "Poll: $1", es: "Encuesta: $1" }], [/^Enviado (.+)$/, { en: "Sent $1", es: "Enviado $1" }],
  [/^Seu @usuário \(@(.+)\) não pode ser alterado\.$/, { en: "Your @username (@$1) can't be changed.", es: "Tu @usuario (@$1) no se puede cambiar." }], [/^@(.+) · Ver seu perfil$/, { en: "@$1 · View your profile", es: "@$1 · Ver tu perfil" }],
  [/^(.+) deixa de ver as mensagens do grupo\.$/, { en: "$1 will no longer see the group's messages.", es: "$1 dejará de ver los mensajes del grupo." }],
  [/^Você está impedido de (enviar mensagens|publicar|comentar|usar a conta)(?: até (.+)| por enquanto)\.$/, { en: (m, a, d) => "You can't " + ACT[a][0] + (d ? " until " + d : " for now") + ".", es: (m, a, d) => "No puedes " + ACT[a][1] + (d ? " hasta " + d : " por ahora") + "." }],
  [/^Você não pode (enviar mensagens|publicar|comentar|usar a conta)(?: até (.+?)| por enquanto)(?: · .*)?$/, { en: (m) => m.split(" · ").map(s => s.replace(/^Você não pode (.+?)(?: até (.+)| por enquanto)$/, (x, a, d) => "You can't " + ACT[a][0] + (d ? " until " + d : " for now"))).join(" · "), es: (m) => m.split(" · ").map(s => s.replace(/^Você não pode (.+?)(?: até (.+)| por enquanto)$/, (x, a, d) => "No puedes " + ACT[a][1] + (d ? " hasta " + d : " por ahora"))).join(" · ") }]
];
PRE.forEach(([p, en, es]) => PAT.push([new RegExp("^" + p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + " (.*)$"), { en: en + " $1", es: es + " $1" }]));

const DICT = { en: {}, es: {} };
TR.forEach(([pt, en, es]) => { DICT.en[pt] = en; DICT.es[pt] = es });

/* traduz um texto (mantém os espaços das pontas); o que não estiver no dicionário continua em português */
function tr(s) {
  if (LANG === 'pt' || typeof s !== 'string') return s;
  const m = s.match(/^(\s*)([\s\S]*?)(\s*)$/), core = m[2]; if (!core) return s;
  let out = DICT[LANG][core];
  if (out === undefined) for (const [re, o] of PAT) if (re.test(core)) { out = core.replace(re, o[LANG]); break }
  return out === undefined ? s : m[1] + out + m[3];
}

/* ---------- aplicação na tela ---------- */
const TR_ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
const SKIP = /^(SCRIPT|STYLE|TEXTAREA|CODE|PRE)$/;
function trNode(n, force) {
  if (n.nodeType === 3) {
    const p = n.parentNode; if (!p || SKIP.test(p.nodeName)) return;
    if (!force && n.__tr !== undefined && n.nodeValue === n.__tr) return;   // já é a nossa tradução
    if (force && n.__pt !== undefined) { /* volta ao original antes de traduzir de novo */ } else n.__pt = n.nodeValue;
    const v = tr(n.__pt); n.__tr = v; if (v !== n.nodeValue) n.nodeValue = v;
  } else if (n.nodeType === 1) {
    if (SKIP.test(n.nodeName)) return;
    for (const a of TR_ATTRS) if (n.hasAttribute && n.hasAttribute(a)) {
      const cur = n.getAttribute(a); n.__a = n.__a || {};
      if (!force && n.__a[a] && cur === n.__a[a].tr) continue;
      const orig = (force && n.__a[a]) ? n.__a[a].pt : cur, v = tr(orig); n.__a[a] = { pt: orig, tr: v }; if (v !== cur) n.setAttribute(a, v);
    }
    n.childNodes.forEach(c => trNode(c, force));
  }
}
function applyLang() { trNode(document.body, true); document.documentElement.lang = LANG; window.LOCALE = LANGS[LANG][1] }
function setLang(l) {
  if (!LANGS[l]) return; LANG = l; try { localStorage.setItem('ow-lang', l) } catch (e) {}
  applyLang(); paintLangBtns(); const m = document.getElementById('v-menu'); if (m && !m.classList.contains('hidden') && typeof renderMenu === 'function') renderMenu();
}
function paintLangBtns() {
  const b = document.getElementById('auth-lang'); if (!b) return;
  b.innerHTML = Object.entries(LANGS).map(([k, [n]]) => `<button class="px-2.5 py-1 rounded-full text-[11px] font-semibold ${LANG === k ? 'bg-brand text-white' : 'bg-soft text-mut'}" onclick="setLang('${k}')" aria-label="${n}">${k.toUpperCase()}</button>`).join('');
}
function initLang() {
  let l = null; try { l = localStorage.getItem('ow-lang') } catch (e) {}
  if (!LANGS[l]) { const nv = (navigator.language || 'pt').slice(0, 2).toLowerCase(); l = LANGS[nv] ? nv : 'pt' }
  LANG = l; paintLangBtns(); document.documentElement.lang = LANG; window.LOCALE = LANGS[LANG][1];
  trNode(document.body, false);
  new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type === 'childList') m.addedNodes.forEach(n => trNode(n, false));
      else if (m.type === 'characterData') trNode(m.target, false);
      else if (m.type === 'attributes') trNode(m.target, false);
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: TR_ATTRS });
}
if (typeof document !== 'undefined') initLang();
