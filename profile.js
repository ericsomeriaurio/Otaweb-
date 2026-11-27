/* OtaWeb · perfil completo: capa, informações, abas (Publicações, Mídia, Sobre) e edição */
const GENRES = [['shonen', 'Shounen'], ['seinen', 'Seinen'], ['shojo', 'Shoujo'], ['isekai', 'Isekai'], ['romance', 'Romance'], ['acao', 'Ação'], ['fantasia', 'Fantasia'], ['comedia', 'Comédia'], ['terror', 'Terror'], ['slice', 'Slice of life'], ['mecha', 'Mecha'], ['esportes', 'Esportes'], ['misterio', 'Mistério'], ['scifi', 'Ficção científica']];
const GLABEL = GENRES.reduce((o, g) => { o[g[0]] = g[1]; return o }, {});
const PF_TABS = [['posts', 'Publicações'], ['media', 'Mídia'], ['about', 'Sobre']];
const ROLE_L = { owner: 'Líder', officer: 'Oficial', member: 'Membro' };
const PF = { id: null, media: null }, EP = { cover: null, av: null, genres: [], hasBirth: false, show: false };
const pfLoc = () => ({ pt: 'pt-BR', en: 'en-US', es: 'es-ES' })[typeof LANG !== 'undefined' ? LANG : 'pt'] || 'pt-BR';
const pfMonthYear = iso => { try { return new Date(iso).toLocaleDateString(pfLoc(), { month: 'long', year: 'numeric' }) } catch (e) { return '' } };
const pfDayMonth = md => { const m = /^(\d\d)-(\d\d)$/.exec(md || ''); if (!m) return ''; try { return new Date(2000, +m[1] - 1, +m[2]).toLocaleDateString(pfLoc(), { day: 'numeric', month: 'long' }) } catch (e) { return '' } };
const pfChip = h => `<span class="inline-flex items-center gap-1 rounded-full bg-soft px-2.5 py-1 text-xs">${h}</span>`;
const pfUrl = s => /^https:\/\/[^\s<>"']{3,200}$/.test(String(s || '')) ? s : '';

/* ---------- ver o perfil ---------- */
async function _showProfile(id) {
  window.lastProfile = id; window.reloadOther = null; PF.id = id; PF.media = null;
  go('other');
  const [{ data: u }, { count: seg }, { count: sing }, { count: np }, { data: f }, { data: ps }, exr] = await Promise.all([
    sb.from('profiles').select('*').eq('id', id).single(),
    sb.from('follows').select('*', { count: 'exact', head: true }).eq('followee', id),
    sb.from('follows').select('*', { count: 'exact', head: true }).eq('follower', id),
    sb.from('posts').select('id', { count: 'exact', head: true }).is('guild_id', null).eq('author', id),
    sb.from('follows').select('follower').match({ follower: P.id, followee: id }),
    sb.from('posts').select(SEL).is('guild_id', null).eq('author', id).order('created_at', { ascending: false }).limit(30),
    sb.rpc('profile_extra', { p_user: id })]);
  if (!u) { $('#v-other').innerHTML = '<p class="text-center text-sm text-mut py-10">Perfil não encontrado.</p>'; return }
  posts = await prep(ps);
  const ex = (exr && exr.data) || {}, mine = id === P.id, fl = f && f.length, gl = ex.guilds || [], top = gl[0],
    link = (window.SITE_BASE || location.href.split('#')[0]) + '#u-' + u.handle,
    tier = top && top.xp >= 10 && typeof tierOf === 'function' ? tierOf(top.xp)[1] : '';
  const badges = (u.is_admin ? '<span class="text-[10px] font-semibold rounded-full bg-brand text-white px-2 py-0.5">Equipe</span>' : '') + (tier ? `<span class="text-[10px] font-semibold rounded-full bg-soft text-brand px-2 py-0.5">${E(tier)}</span>` : '');
  const links = (Array.isArray(u.links) ? u.links : []).map(l => { const h = pfUrl(l && l.url); return h ? `<a href="${E(h)}" target="_blank" rel="noopener noreferrer nofollow" class="inline-flex items-center gap-1 rounded-full bg-soft px-2.5 py-1 text-xs text-brand font-semibold">🔗 ${E(String(l.label || '').slice(0, 24))}</a>` : '' }).join('');
  const chips = (u.location ? pfChip(`📍 ${E(u.location)}`) : '') + (u.birthday_md ? pfChip(`🎂 ${E(pfDayMonth(u.birthday_md))}`) : '') + pfChip(`📅 <span>Entrou em</span> ${E(pfMonthYear(u.created_at))}`);
  const actions = (mine ? `<button class="btn2" onclick="editProfile()">${ic('edit', false, 15)} Editar perfil</button>`
    : `<button class="btn" onclick="follow('${id}',${!!fl})">${fl ? 'Seguindo' : 'Seguir'}</button><button class="btn2" onclick="startDM('${id}')">${ic('msgc', false, 15)} Mensagem</button>`)
    + `<button class="btn2" onclick="copy('${E(link)}')" aria-label="Copiar link">${ic('link', false, 15)}</button>`;
  const hint = mine && !u.cover_url && !u.bio ? '<div class="card p-3 mt-3 text-sm flex items-center gap-3"><div class="flex-1"><b>Complete seu perfil</b><div class="text-xs text-mut">Adicione uma capa, um local e seus animes favoritos para as pessoas conhecerem você.</div></div><button class="btn2" onclick="editProfile()">Editar</button></div>' : '';
  $('#v-other').classList.remove('hidden'); $('#v-feed').classList.add('hidden');
  $('#v-other').innerHTML = `<div class="card overflow-hidden pop">
   <div class="h-32 bg-gradient-to-br from-brand to-black/70 overflow-hidden">${u.cover_url ? `<img src="${E(u.cover_url)}" class="w-full h-full object-cover" loading="lazy">` : ''}</div>
   <div class="px-4 pb-4"><div class="flex items-end justify-between gap-2 -mt-11"><div class="ring shrink-0"><div class="bg-card rounded-full p-1">${av(u, 88)}</div></div><div class="flex gap-2 pb-1 flex-wrap justify-end">${actions}</div></div>
   <div class="flex items-center gap-2 flex-wrap mt-2"><h2 class="text-xl font-bold">${E(u.name)}</h2>${badges}</div><div class="text-sm text-brand">@${E(u.handle)}</div>
   ${u.bio ? `<p class="text-sm mt-2 whitespace-pre-wrap break-words">${E(u.bio)}</p>` : ''}
   <div class="flex flex-wrap gap-1.5 mt-3">${chips}${links}</div>
   <div class="flex gap-5 text-sm mt-3 flex-wrap"><span><b>${np || 0}</b> posts</span><span><b>${seg || 0}</b> seguidores</span><span><b>${sing || 0}</b> seguindo</span>${ex.reactions != null ? `<span><b>${ex.reactions}</b> reações</span>` : ''}</div></div></div>${hint}
   <div class="flex border-b border-line mt-3" id="pf-tabs">${PF_TABS.map((t, i) => `<button data-t="${t[0]}" class="flex-1 py-2.5 text-sm font-semibold border-b-2 ${i ? 'border-transparent text-mut' : 'border-brand text-brand'}" onclick="pfTab('${t[0]}')">${t[1]}</button>`).join('')}</div>
   <div id="pf-posts" class="space-y-3 mt-3">${safe(posts) || '<p class="text-center text-xs text-mut py-6">Sem posts ainda.</p>'}</div>
   <div id="pf-media" class="hidden mt-3"></div>
   <div id="pf-about" class="hidden mt-3 space-y-3">${pfAbout(u, gl, mine)}</div>`;
}
function pfTab(k) {
  document.querySelectorAll('#pf-tabs button').forEach(b => { const on = b.dataset.t === k; b.classList.toggle('border-brand', on); b.classList.toggle('text-brand', on); b.classList.toggle('border-transparent', !on); b.classList.toggle('text-mut', !on) });
  ['posts', 'media', 'about'].forEach(t => { const el = document.getElementById('pf-' + t); if (el) el.classList.toggle('hidden', t !== k) });
  if (k === 'media' && PF.media === null) pfMedia();
}
async function pfMedia() {
  const el = $('#pf-media'); if (!el) return; PF.media = []; el.innerHTML = '<p class="text-center text-xs text-mut py-6">Carregando...</p>';
  const { data, error } = await sb.from('posts').select('id,media_url,media_type').is('guild_id', null).eq('author', PF.id).not('media_url', 'is', null).in('media_type', ['image', 'video']).order('created_at', { ascending: false }).limit(60);
  if (error) { PF.media = null; el.innerHTML = errH(error); return }
  PF.media = data || [];
  el.innerHTML = PF.media.length ? `<div class="grid grid-cols-3 gap-1">${PF.media.map(p => `<button class="relative aspect-square bg-soft overflow-hidden rounded-md" onclick="showPost('${p.id}')">${p.media_type === 'video'
    ? `<video src="${E(p.media_url)}#t=0.1" preload="metadata" muted playsinline class="w-full h-full object-cover pointer-events-none"></video><span class="absolute bottom-1 right-1 text-white text-xs bg-black/60 rounded px-1.5">▶</span>`
    : `<img src="${E(p.media_url)}" loading="lazy" class="w-full h-full object-cover">`}</button>`).join('')}</div>` : '<p class="text-center text-xs text-mut py-6">Ainda não há fotos ou vídeos.</p>';
}
const pfGuild = g => { const t = typeof tierOf === 'function' ? tierOf(g.xp || 0)[1] : '';
  return `<button class="w-full flex items-center gap-3 text-left" onclick="openGuild('${g.id}')">${g.emblem_url ? `<img src="${E(g.emblem_url)}" class="w-10 h-10 rounded-xl object-cover shrink-0">` : `<div class="w-10 h-10 rounded-xl bg-brand text-white grid place-items-center font-bold shrink-0">${E((g.name || '?')[0])}</div>`}<div class="min-w-0 flex-1"><div class="text-sm font-semibold truncate">${E(g.name)}</div><div class="text-xs text-mut"><span>${ROLE_L[g.role] || 'Membro'}</span> · <span>${E(t)}</span> · ${g.xp || 0} XP${g.private ? ' · <span>Privada</span>' : ''}</div></div></button>` };
function pfAbout(u, gl, mine) {
  const rows = [['Anime favorito', u.fav_anime], ['Mangá favorito', u.fav_manga], ['Personagem favorito', u.fav_character]].filter(r => r[1]), gen = (u.genres || []).filter(g => GLABEL[g]);
  let h = '';
  if (rows.length || gen.length) h += `<div class="card p-4 space-y-3"><div class="text-sm font-bold text-brand">Favoritos</div>${rows.map(r => `<div class="flex justify-between gap-3 text-sm"><span class="text-mut shrink-0">${r[0]}</span><b class="text-right break-words">${E(r[1])}</b></div>`).join('')}${gen.length ? `<div class="flex flex-wrap gap-1.5">${gen.map(g => pfChip(E(GLABEL[g]))).join('')}</div>` : ''}</div>`;
  else if (mine) h += '<div class="card p-4 text-sm space-y-2"><b>Nada por aqui ainda.</b><div class="text-xs text-mut">Conte quais são seus animes, mangás e gêneros favoritos.</div><button class="btn2" onclick="editProfile()">Editar perfil</button></div>';
  h += `<div class="card p-4 space-y-3"><div class="text-sm font-bold text-brand">Guildas</div>${gl.length ? gl.map(pfGuild).join('') : '<p class="text-xs text-mut">Sem guildas públicas ainda.</p>'}</div>`;
  return h;
}

/* ---------- editar o perfil ---------- */
async function editProfile() {
  const [{ data: me }, { data: pv }] = await Promise.all([sb.from('profiles').select('*').eq('id', P.id).single(), sb.from('profile_private').select('birth_date').eq('user_id', P.id).maybeSingle()]);
  if (me) Object.assign(P, me);
  EP.cover = P.cover_url || null; EP.av = P.avatar_url || null; EP.genres = (P.genres || []).slice(); EP.hasBirth = !!(pv && pv.birth_date); EP.show = !!P.show_birthday;
  window.lastProfile = null; window.reloadOther = null; go('other'); $('#v-feed').classList.add('hidden'); $('#v-other').classList.remove('hidden');
  const ls = Array.isArray(P.links) ? P.links : [], li = i => ls[i] || {}, inp = (id, v, ph, max) => `<input id="${id}" class="inp" value="${E(v || '')}" placeholder="${ph}" maxlength="${max}">`;
  $('#v-other').innerHTML = `<div class="space-y-3 pop">
   <div class="card overflow-hidden"><div id="ep-cover" class="relative h-32 bg-gradient-to-br from-brand to-black/70"></div>
    <div class="p-3 flex gap-2 flex-wrap"><label class="btn2 cursor-pointer">${ic('camera', false, 15)} Trocar capa<input type="file" accept="image/*" class="hidden" onchange="epCover(this.files[0])"></label><button class="btn2" onclick="epCoverDel()">Remover capa</button>
    <label class="btn2 cursor-pointer">${ic('camera', false, 15)} Trocar foto<input type="file" accept="image/*" class="hidden" onchange="epAvatar(this.files[0])"></label></div></div>
   <div class="card p-4 space-y-3"><div class="text-sm font-bold text-brand">Sobre você</div>${inp('ep-name', P.name, 'Nome', 30)}
    <textarea id="ep-bio" class="inp" rows="3" maxlength="300" placeholder="Bio">${E(P.bio || '')}</textarea>${inp('ep-loc', P.location, 'Local (cidade, país)', 60)}</div>
   <div class="card p-4 space-y-3"><div class="text-sm font-bold text-brand">Favoritos</div>${inp('ep-anime', P.fav_anime, 'Anime favorito', 100)}${inp('ep-manga', P.fav_manga, 'Mangá favorito', 100)}${inp('ep-char', P.fav_character, 'Personagem favorito', 100)}
    <div class="text-xs text-mut">Gêneros favoritos (até 5)</div><div id="ep-gen" class="flex flex-wrap gap-1.5"></div></div>
   <div class="card p-4 space-y-3"><div class="text-sm font-bold text-brand">Links (até 3)</div>${[0, 1, 2].map(i => `<div class="grid grid-cols-5 gap-2"><input id="ep-ln${i}" class="inp col-span-2" value="${E(li(i).label || '')}" placeholder="Nome do link" maxlength="24"><input id="ep-lu${i}" class="inp col-span-3" value="${E(li(i).url || '')}" placeholder="https://..." maxlength="200" inputmode="url" autocapitalize="off"></div>`).join('')}</div>
   <div class="card p-4 space-y-2"><label class="flex items-center gap-3 text-sm"><input type="checkbox" id="ep-bd" class="w-5 h-5" ${EP.show ? 'checked' : ''} ${EP.hasBirth ? '' : 'disabled'}><span>Mostrar meu aniversário (dia e mês) no perfil</span></label>${EP.hasBirth ? '' : '<div class="text-xs text-mut">Informe sua data de nascimento em Menu > Definições para poder mostrar o aniversário.</div>'}</div>
   <div class="flex gap-2 justify-end"><button class="btn2" onclick="showProfile(P.id)">Cancelar</button><button class="btn" id="ep-save" onclick="epSave()">Salvar</button></div></div>`;
  epPaint();
}
function epPaint() {
  const c = $('#ep-cover'); if (c) c.innerHTML = (EP.cover ? `<img src="${E(EP.cover)}" class="w-full h-full object-cover">` : '') + `<div class="absolute bottom-2 left-3 ring"><div class="bg-card rounded-full p-0.5">${av({ avatar_url: EP.av, name: P.name }, 52)}</div></div>`;
  const g = $('#ep-gen'); if (g) g.innerHTML = GENRES.map(x => { const on = EP.genres.indexOf(x[0]) >= 0; return `<button type="button" onclick="epGenre('${x[0]}')" class="rounded-full px-3 py-1.5 text-xs font-semibold ${on ? 'bg-brand text-white' : 'bg-soft'}">${x[1]}</button>` }).join('');
}
async function epCover(f) { if (!f) return; T('Enviando capa...'); const m = await upload(f); if (!m) return; EP.cover = m.url; epPaint() }
function epCoverDel() { EP.cover = null; epPaint() }
async function epAvatar(f) {
  if (!f) return; T('Enviando foto...'); const m = await upload(f, { max: 640 }); if (!m) return;
  const { error } = await sb.from('profiles').update({ avatar_url: m.url }).eq('id', P.id); if (error) return T('Não salvou a foto: ' + error.message);
  P.avatar_url = EP.av = m.url; paintMe(); epPaint(); T('Foto atualizada!');
}
function epGenre(k) { const i = EP.genres.indexOf(k); if (i >= 0) EP.genres.splice(i, 1); else if (EP.genres.length >= 5) return T('Escolha no máximo 5 gêneros.'); else EP.genres.push(k); epPaint() }
async function epSave() {
  const v = id => ($('#' + id).value || '').trim(), name = v('ep-name');
  if (name.length < 2) return T('O nome precisa ter pelo menos 2 letras.');
  const links = [];
  for (let i = 0; i < 3; i++) {
    let u = v('ep-lu' + i), l = v('ep-ln' + i); if (!u && !l) continue;
    if (!u) return T('Preencha o endereço do link.');
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u; u = u.replace(/^http:\/\//i, 'https://');
    let okUrl = /^https:\/\/[^\s<>"']{3,200}$/.test(u); try { const x = new URL(u); okUrl = okUrl && x.protocol === 'https:' && x.hostname.indexOf('.') > 0 && !x.username } catch (e) { okUrl = false }
    if (!okUrl) return T('Link inválido: use um endereço https:// e um nome curto.');
    if (!l) { try { l = new URL(u).hostname.replace(/^www\./, '') } catch (e) { l = 'Link' } }
    links.push({ label: l.slice(0, 24), url: u });
  }
  const upd = { name, bio: v('ep-bio'), location: v('ep-loc') || null, fav_anime: v('ep-anime') || null, fav_manga: v('ep-manga') || null, fav_character: v('ep-char') || null, genres: EP.genres, links, cover_url: EP.cover };
  const btn = $('#ep-save'); btn.disabled = true;
  const { error } = await sb.from('profiles').update(upd).eq('id', P.id);
  if (error) { btn.disabled = false; return T(/column|schema cache/i.test(error.message) ? 'Falta rodar a migração 17 no Supabase.' : error.message) }
  const bd = $('#ep-bd'); if (bd && !bd.disabled && bd.checked !== EP.show) { const r = await sb.rpc('set_show_birthday', { p_show: bd.checked }); if (r.error) T(r.error.message); else P.show_birthday = bd.checked }
  Object.assign(P, upd); paintMe(); T('Perfil salvo!'); showProfile(P.id);
}
