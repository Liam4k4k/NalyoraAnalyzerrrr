const API = 'https://api.nalyora.fr/v1';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const state = {
  players: [], board: 'niveaux', guildOffset: 0, guildTotal: 0,
  guildTimer: 0, auctionTimer: 0, toastTimer: 0, auctionListings: [], auctionSlide: 0,
  marketOffset: 0, marketTotal: 0, marketTimer: 0, carouselTimer: 0,
  profile: null, profileName: '', profileTab: 'apercu', rankCache: new Map(),
};

const ICON = {
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  shield:'<path d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6z"/><path d="m9 12 2 2 4-4"/>',
  trophy:'<path d="M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4"/>',
  spark:'<path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z"/><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z"/>',
  paw:'<ellipse cx="12" cy="15.8" rx="5.2" ry="4.2"/><ellipse cx="5.2" cy="10" rx="1.7" ry="2.2"/><ellipse cx="10" cy="6.5" rx="1.7" ry="2.2"/><ellipse cx="15" cy="6.5" rx="1.7" ry="2.2"/><ellipse cx="18.8" cy="10" rx="1.7" ry="2.2"/>',
  coins:'<circle cx="8" cy="8" r="5"/><path d="M8 5v6m-2-4h3m-3 2h3M15 5h2a4 4 0 0 1 0 8h-2M13 17h4a3 3 0 0 0 3-3"/>',
  bolt:'<path d="m13 2-9 12h7l-1 8 10-13h-7z"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  box:'<path d="m12 3 9 5-9 5-9-5z"/><path d="M3 8v9l9 5 9-5V8M12 13v9m-4-16 9 5"/>',
  arrow:'<path d="M7 17 17 7M7 7h10v10"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
  chart:'<path d="M4 19V5m0 14h17"/><path d="m7 15 4-4 3 2 6-7"/>',
  refresh:'<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9a7 7 0 0 1 11.7-2L20 12M4 12l2.7 5a7 7 0 0 0 11.7-2"/>',
  anchor:'<circle cx="12" cy="5" r="2"/><path d="M12 7v13m-7-7a7 7 0 0 0 14 0M3 13h4m10 0h4"/>',
  guild:'<path d="M12 3 4 7v5c0 4.4 3.4 7.7 8 9 4.6-1.3 8-4.6 8-9V7z"/><path d="M9 12h6m-3-3v6"/>',
};
function icon(name, size = 18, className = '') { return `<svg class="hub-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name] || ICON.spark}</svg>`; }

function safe(value = '') { return String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]); }
function avatar(player, size = 64) { return `https://mc-heads.net/avatar/${encodeURIComponent(player)}/${size}`; }
function bodyRender(player, size = 220) { return `https://mc-heads.net/body/${encodeURIComponent(player)}/${size}`; }
function number(value, decimals = 0) { return Number(value || 0).toLocaleString('fr-FR', { maximumFractionDigits: decimals }); }
function compact(value) { return Number(value || 0).toLocaleString('fr-FR', { notation: 'compact', maximumSignificantDigits: 4 }); }
function date(value) { if (!value) return '—'; const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? '—' : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(parsed); }
function shortDate(value) { if (!value) return '—'; const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? '—' : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(parsed); }
function money(value, currency = 'vault') { const unit = { vault: '$', ecoshop: 'Paws', afk: 'pts AFK' }[currency] || '$'; return `${compact(value)} ${unit}`; }
function currencyLabel(currency) { return { vault: 'Argent', ecoshop: 'Paws', afk: 'Points AFK' }[currency] || 'Argent'; }
function toast(message) { const node = $('#toast'); node.textContent = message; node.classList.add('show'); clearTimeout(state.toastTimer); state.toastTimer = setTimeout(() => node.classList.remove('show'), 2400); }
async function api(path) {
  const response = await fetch(`${API}${path}`, { headers: { Accept: 'application/json' } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.erreur?.message || `Erreur de chargement (${response.status})`);
  return data;
}
function empty(container, message) { container.innerHTML = `<p class="hub-empty">${safe(message)}</p>`; }

async function loadServer() {
  try {
    const [server, online] = await Promise.all([api('/serveur/etat'), api('/serveur/joueurs')]);
    state.players = online.joueurs || [];
    $('#online-count').textContent = number(server.en_ligne ?? online.total ?? state.players.length);
    renderPlayers();
  } catch (error) {
    $('#online-count').textContent = '—';
    empty($('#player-list'), error.message || 'Les joueurs sont momentanément indisponibles.');
  }
}

function renderPlayers() {
  const query = $('#player-search').value.trim().toLocaleLowerCase('fr');
  const players = state.players.filter(player => player.pseudo.toLocaleLowerCase('fr').includes(query));
  const list = $('#player-list');
  $('#players-empty').hidden = players.length > 0;
  if (!players.length) { list.innerHTML = ''; return; }
  list.innerHTML = players.map(player => `<button class="hub-player-row" data-open-player="${safe(player.pseudo)}"><img class="hub-avatar" src="${avatar(player.pseudo,64)}" alt="Tête Minecraft de ${safe(player.pseudo)}" loading="lazy" onerror="this.onerror=null;this.src='https://mc-heads.net/avatar/Steve/64'"><span class="hub-player-meta"><b>${safe(player.pseudo)}</b><small>${player.serveur?(player.serveur.toLocaleLowerCase('fr').includes('survival')?'Nalyora':'Lobby / Hub'):'Nalyora'}</small></span><span class="hub-player-server">En ligne <i class="hub-status-pip"></i></span></button>`).join('');
}

function showQuickProfile(player) {
  const guild = player.guilde ? `<span class="hub-profile-tag">${icon('guild',14)}<span>${safe(player.guilde.nom)} · ${safe(player.guilde.role)}</span></span>` : `<span class="hub-profile-independent">${icon('user',14)}<span>Joueur indépendant</span></span>`;
  $('#profile-result').innerHTML = `<div class="hub-profile-card"><img class="hub-avatar" src="${avatar(player.uuid || player.pseudo, 80)}" alt=""><span class="hub-profile-info"><b>${safe(player.pseudo)}</b><small>${player.en_ligne ? 'En ligne maintenant' : `Dernière visite · ${shortDate(player.derniere_connexion)}`}</small><small>Niveau ${number(player.niveau?.niveau)} · ${number(player.niveau?.xp)} XP</small></span>${guild}<button class="hub-open-profile" data-open-player="${safe(player.pseudo)}">Ouvrir le profil ↗</button></div>`;
}

async function loadProfilePreview(name) {
  const result = $('#profile-result');
  result.textContent = 'Ouverture du profil…';
  try { showQuickProfile(await api(`/joueurs/${encodeURIComponent(name)}`)); }
  catch (error) { result.textContent = error.message || 'Profil introuvable. Vérifie le pseudo et réessaie.'; }
}

function navigate(route) { location.hash = route; }
function openPlayer(name, tab = 'apercu') { navigate(`#/joueur/${encodeURIComponent(name)}?onglet=${encodeURIComponent(tab)}`); }
function openGuild(reference) { navigate(`#/guilde/${encodeURIComponent(reference)}`); }
function openAuction(id) { navigate(`#/enchere/${encodeURIComponent(id)}`); }

function profileShell(player) {
  const status = player.en_ligne ? `<span class="hub-player-state online"><i></i> En ligne</span>` : `<span class="hub-player-state"><i></i> Hors ligne</span>`;
  const guild = player.guilde ? `<span class="hub-banner-guild">${icon('guild',15)} ${safe(player.guilde.nom)}</span>` : '';
  const profileTabs=[['apercu','Aperçu','chart'],['progression','Progression','bolt'],['fortune','Fortune','coins'],['guilde','Guilde','guild']];
  return `<article class="hub-profile-page"><header class="hub-profile-banner"><div class="hub-profile-banner-content"><span class="hub-profile-kicker">PROFIL JOUEUR · NALYORA</span><div class="hub-profile-badge">${player.en_ligne ? 'En ligne' : 'Joueur Nalyora'}</div><h1>${safe(player.pseudo)}</h1><div class="hub-profile-meta">${status}<span>Première connexion · ${shortDate(player.premiere_connexion)}</span>${guild}</div></div><div class="hub-player-render-wrap"><div class="hub-player-render-glow"></div><img class="hub-player-render" src="${bodyRender(player.pseudo)}" alt="Skin Minecraft de ${safe(player.pseudo)}" onerror="this.hidden=true"></div><div class="hub-banner-stats"><div><span class="hub-stat-icon">${icon('bolt')}</span><span><small>NIVEAU</small><b>${number(player.niveau?.niveau)}</b></span></div><div><span class="hub-stat-icon">${icon('spark')}</span><span><small>EXPÉRIENCE</small><b>${number(player.niveau?.xp)} XP</b></span></div><div><span class="hub-stat-icon">${icon('clock')}</span><span><small>VU POUR LA DERNIÈRE FOIS</small><b>${shortDate(player.derniere_connexion)}</b></span></div></div></header><nav class="hub-profile-tabs hub-tabs" aria-label="Sections du profil">${profileTabs.map(([id,label,symbol])=>`<button type="button" data-profile-tab="${id}" class="tab ${state.profileTab===id?'active':''}" aria-current="${state.profileTab===id?'page':'false'}">${icon(symbol,16)}${label}</button>`).join('')}</nav><div class="hub-profile-view" id="profile-view"></div></article>`;
}

async function playerRank(name, board, currency = 'vault') {
  const key = `${board}:${currency}:${name.toLowerCase()}`;
  if (state.rankCache.has(key)) return state.rankCache.get(key);
  const path = board === 'niveaux' ? '/classements/niveaux' : `/classements/argent?monnaie=${encodeURIComponent(currency)}`;
  let offset = 0; let total = 0; let found = null;
  do {
    const page = await api(`${path}${path.includes('?') ? '&' : '?'}limite=100&decalage=${offset}`);
    const rows = page.joueurs || []; total = Number(page.total || 0);
    found = rows.find((row) => row.pseudo?.toLocaleLowerCase('fr') === name.toLocaleLowerCase('fr')) || null;
    if (found || rows.length === 0) break;
    offset += rows.length;
  } while (offset < total);
  const result = { entry: found, total };
  state.rankCache.set(key, result);
  return result;
}

function overviewTab(player) {
  const guildBlock = player.guilde
    ? `<button class="hub-profile-guild-link" data-open-guild="${safe(player.guilde.id ?? player.guilde.nom)}"><span>${icon('guild',24)}</span><span><small>GUILDE</small><b>${safe(player.guilde.nom)}</b><small>${safe(player.guilde.role)}</small></span><span aria-hidden="true">↗</span></button>`
    : '<div class="hub-no-guild">Aucune guilde associée à ce profil pour le moment.</div>';
  return `<div class="hub-overview-grid"><section class="hub-profile-section"><div class="couche-sur">PROGRESSION</div><h2>En quelques chiffres</h2><div class="hub-overview-stats"><article><span>${icon('bolt',17)}</span><small>Niveau</small><b>${number(player.niveau?.niveau)}</b></article><article><span>${icon('spark',17)}</span><small>Expérience</small><b>${number(player.niveau?.xp)} XP</b></article></div><div class="hub-profile-dates"><div><dt>Première connexion</dt><dd>${date(player.premiere_connexion)}</dd></div><div><dt>Dernière connexion</dt><dd>${date(player.derniere_connexion)}</dd></div></div></section><section class="hub-profile-section"><div class="couche-sur">ALLIANCES</div><h2>Sa guilde</h2>${guildBlock}</section></div><section class="hub-activity-chart"><div class="hub-activity-chart-heading"><div><div class="couche-sur">PRÉSENCE</div><h2>Repères de connexion</h2></div><span class="hub-activity-state ${player.en_ligne?'online':''}"><i></i>${player.en_ligne?'En ligne':'Hors ligne'}</span></div><div class="hub-timeline"><div class="hub-timeline-line"><i></i><i></i></div><div class="hub-timeline-point"><span></span><small>Première connexion</small><b>${shortDate(player.premiere_connexion)}</b></div><div class="hub-timeline-point last"><span></span><small>${player.en_ligne?'En jeu maintenant':'Dernière connexion'}</small><b>${player.en_ligne?'Maintenant':shortDate(player.derniere_connexion)}</b></div></div><p>Le temps de jeu détaillé n’est pas disponible pour ce profil.</p></section>`;
}

async function progressionTab(player) {
  const view = $('#profile-view');
  view.innerHTML = '<p class="hub-empty">Recherche du classement de niveau…</p>';
  try {
    const result = await playerRank(player.pseudo, 'niveaux');
    const rankCard = result.entry ? `<article class="hub-rank-feature"><span class="hub-rank-feature-icon">${icon('trophy',22)}</span><div><small>CLASSEMENT DE NIVEAU</small><b>#${number(result.entry.rang)}</b><span>sur ${number(result.total)} joueurs</span></div><strong>Niveau ${number(result.entry.niveau ?? player.niveau?.niveau)}</strong></article>` : `<article class="hub-rank-feature empty-rank"><span class="hub-rank-feature-icon">${icon('chart',21)}</span><div><small>CLASSEMENT DE NIVEAU</small><b>Pas encore classé</b><span>${number(result.total)} joueurs classés</span></div></article>`;
    view.innerHTML = `<div class="hub-profile-section hub-tab-intro"><div class="couche-sur">PROGRESSION</div><h2>Chaque aventure laisse sa trace.</h2><p>Retrouve le niveau actuel et la place de ${safe(player.pseudo)} dans le classement du réseau.</p></div><div class="hub-progression-cards"><article class="hub-stat-card"><span class="hub-stat-icon">${icon('bolt')}</span><small>NIVEAU ACTUEL</small><b>${number(player.niveau?.niveau)}</b><span>Progression Nalyora</span></article><article class="hub-stat-card"><span class="hub-stat-icon">${icon('spark')}</span><small>EXPÉRIENCE TOTALE</small><b>${number(player.niveau?.xp)}</b><span>Points d’expérience</span></article></div>${rankCard}`;
  } catch (error) { empty(view, error.message || 'Classement de niveau indisponible.'); }
}

async function fortuneTab(player, currency = 'vault') {
  const view = $('#profile-view');
  const tabs = `<div class="hub-money-tabs" role="tablist" aria-label="Monnaie du classement">${[['vault','Argent','coins'],['ecoshop','Paws','paw'],['afk','Points AFK','bolt']].map(([id,label,symbol])=>`<button type="button" data-money-tab="${id}" class="${currency===id?'active':''}" aria-selected="${currency===id}">${icon(symbol,15)}${label}</button>`).join('')}</div>`;
  view.innerHTML = `<div class="hub-profile-section hub-tab-intro"><div class="couche-sur">CLASSEMENTS</div><h2>Fortune & récompenses</h2><p>La place et le montant sont issus du classement public de Nalyora.</p></div>${tabs}<div class="hub-fortune-result"><p class="hub-empty">Recherche du classement ${safe(currencyLabel(currency))}…</p></div>`;
  try {
    const result = await playerRank(player.pseudo, 'argent', currency);
    const target = $('.hub-fortune-result', view);
    target.innerHTML = result.entry
      ? `<article class="hub-fortune-card"><div class="hub-fortune-icon">${icon(currency==='afk'?'bolt':currency==='ecoshop'?'paw':'coins',25)}</div><div class="hub-fortune-label"><small>CLASSEMENT · ${safe(currencyLabel(currency).toUpperCase())}</small><h3>${safe(player.pseudo)}</h3><span>Rang ${number(result.entry.rang)} sur ${number(result.total)} joueurs</span></div><strong>${money(result.entry.valeur,currency)}</strong></article><p class="hub-ranking-note">Valeur et rang actuels du classement.</p>`
      : `<article class="hub-rank-feature empty-rank"><span class="hub-rank-feature-icon">◌</span><div><small>${safe(currencyLabel(currency).toUpperCase())}</small><b>Pas encore classé</b><span>Classement consulté : ${number(result.total)} joueurs</span></div></article>`;
  } catch (error) { $('.hub-fortune-result', view).textContent = error.message || 'Classement indisponible.'; }
}

async function guildTab(player) {
  const view = $('#profile-view');
  if (!player.guilde) { view.innerHTML = `<div class="hub-profile-section hub-no-guild-page"><span>${icon('guild',30)}</span><div class="couche-sur">GUILDE</div><h2>Une aventure en solo.</h2><p>${safe(player.pseudo)} n’a pas encore rejoint de guilde.</p><a href="#guildes">Parcourir les guildes ↗</a></div>`; return; }
  view.innerHTML = '<p class="hub-empty">Chargement de la guilde…</p>';
  try {
    const reference = player.guilde.id ?? player.guilde.nom;
    const [guild, members] = await Promise.all([api(`/guildes/${encodeURIComponent(reference)}`), api(`/guildes/${encodeURIComponent(reference)}/membres?limite=100&decalage=0`)]);
    view.innerHTML = `<div class="hub-profile-section hub-tab-intro"><div class="couche-sur">GUILDE DU JOUEUR</div><h2>${safe(guild.nom)}</h2><p>${safe(player.pseudo)} · ${safe(player.guilde.role)}</p><a class="hub-inline-link" href="#/guilde/${encodeURIComponent(reference)}">Ouvrir la page de guilde ↗</a></div><div class="hub-guild-stats-small"><article><small>PALIER</small><b>${number(guild.palier)}</b></article><article><small>MEMBRES</small><b>${number(guild.membres)}</b></article><article><small>POINTS DE SAISON</small><b>${number(guild.points_saison)}</b></article><article><small>BANQUE</small><b>${money(guild.banque)}</b></article></div><section class="hub-members"><div class="hub-members-heading"><div><div class="couche-sur">LES ALLIÉS</div><h2>Membres de la guilde</h2></div><span>${number(members.total)} joueur${members.total===1?'':'s'}</span></div><div class="hub-members-list">${(members.membres||[]).map(member=>`<button class="hub-member-row" data-open-player="${safe(member.pseudo)}"><img class="hub-avatar" src="${avatar(member.uuid||member.pseudo,64)}" alt=""><span class="hub-guild-meta"><b>${safe(member.pseudo)}</b><small>${safe(member.role)}</small></span><span class="hub-member-contribution">${number(member.contribution_saison)} <small>pts saison</small></span></button>`).join('')||'<p class="hub-empty">Aucun membre public affiché.</p>'}</div></section>`;
  } catch (error) { empty(view, error.message || 'Informations de guilde indisponibles.'); }
}

async function renderPlayerTab(player, tab, currency = 'vault') {
  state.profileTab = tab;
  $$('.hub-profile-tabs [data-profile-tab]').forEach(button => { const active=button.dataset.profileTab===tab; button.classList.toggle('active',active); button.setAttribute('aria-current',active?'page':'false'); });
  if (tab==='progression') return progressionTab(player);
  if (tab==='fortune') return fortuneTab(player,currency);
  if (tab==='guilde') return guildTab(player);
  $('#profile-view').innerHTML = overviewTab(player);
}

async function renderPlayerPage(name, tab = 'apercu', currency = 'vault') {
  const container = $('#player-page-content');
  const samePlayer = state.profile?.pseudo?.toLocaleLowerCase('fr') === name.toLocaleLowerCase('fr');
  if (!samePlayer) {
    container.innerHTML = '<p class="hub-empty">Lecture du profil…</p>';
    try { state.profile = await api(`/joueurs/${encodeURIComponent(name)}`); state.profileName=name; container.innerHTML = profileShell(state.profile); }
    catch (error) { state.profile=null; container.innerHTML = `<div class="hub-not-found"><span>${icon('user',34)}</span><h1>Profil introuvable</h1><p>${safe(error.message || 'Ce joueur n’apparaît pas dans les données publiques.')}</p><a class="hub-back-button" href="#joueurs">Retour aux joueurs</a></div>`; return; }
  }
  const player = state.profile;
  await renderPlayerTab(player, tab, currency);
  document.title = `${player.pseudo} · Profil joueur Nalyora`;
}

async function loadBoard(board = state.board) {
  state.board = board;
  $('#board-select').value = board;
  $('#wealth-wrap').hidden = board !== 'argent';
  const list = $('#leaderboard-list'); empty(list, 'Chargement du classement…');
  const currency = $('#wealth-type').value;
  const path = board === 'guildes' ? '/classements/guildes?limite=10' : board === 'argent' ? `/classements/argent?monnaie=${encodeURIComponent(currency)}&limite=10` : '/classements/niveaux?limite=10';
  try {
    const data = await api(path);
    const items = board === 'guildes' ? data.guildes || [] : data.joueurs || [];
    if (!items.length) { empty(list, 'Le classement attend ses premiers joueurs.'); return; }
    list.innerHTML = items.map((item, index) => {
      const rank = item.rang ?? index + 1; const guild = board === 'guildes'; const name = guild ? item.nom : item.pseudo;
      const value = guild ? `Palier ${number(item.palier)}` : board === 'argent' ? money(item.valeur,currency) : `Niv. ${number(item.niveau ?? item.valeur)} · ${number(item.valeur)} XP`;
      const portrait = guild ? `<span class="hub-guild-crest">${icon('shield',20)}</span>` : `<img class="hub-board-avatar" src="${avatar(name,64)}" alt="Tête Minecraft de ${safe(name)}" loading="lazy" onerror="this.onerror=null;this.src='https://mc-heads.net/avatar/Steve/64'">`;
      return `<div class="hub-board-row"><span class="hub-rank ${rank<=3?['gold','silver','bronze'][rank-1]:''}">#${number(rank)}</span>${portrait}<button class="hub-board-name" ${guild?`data-open-guild="${safe(item.id??name)}"`:`data-open-player="${safe(name)}"`}>${safe(name)}</button><span class="hub-board-value">${value}</span></div>`;
    }).join('');
  } catch (error) { empty(list,error.message||'Classement indisponible.'); }
}

async function loadGuilds({ reset = true } = {}) {
  const query = $('#guild-search').value.trim();
  if (reset) { state.guildOffset=0; empty($('#guild-list'),'Chargement de l’annuaire…'); }
  const params = new URLSearchParams({ limite:'100', decalage:String(state.guildOffset) }); if (query) params.set('q',query);
  try {
    const data=await api(`/guildes?${params}`); state.guildTotal=Number(data.total||0); const guilds=data.guildes||[];
    $('#guild-count').textContent=number(state.guildTotal);
    const rows=guilds.map(guild=>`<button class="hub-guild-row" data-open-guild="${safe(guild.id??guild.nom)}"><span class="hub-guild-crest">${icon('shield',22)}</span><span class="hub-guild-meta"><b>${safe(guild.nom)}</b><small>${guild.suspendue?'En pause':'Guilde active'} · ${number(guild.membres)} membre${guild.membres===1?'':'s'}</small><span class="hub-guild-stats-inline"><span>${icon('trophy',13)} ${number(guild.points_saison)} pts saison</span><span>${icon('coins',13)} ${money(guild.banque)}</span></span></span><span class="hub-guild-level"><small>PALIER</small><b>${number(guild.palier)}</b>${icon('arrow',15)}</span></button>`).join('');
    if(reset) $('#guild-list').innerHTML=rows||'<p class="hub-empty">Aucune guilde ne correspond à ta recherche.</p>'; else $('#guild-list').insertAdjacentHTML('beforeend',rows);
    state.guildOffset+=guilds.length; $('#guild-more').hidden=state.guildOffset>=state.guildTotal||guilds.length===0; $('#guild-more').textContent=`Afficher plus de guildes (${number(Math.max(0,state.guildTotal-state.guildOffset))} restantes) ↓`;
  } catch(error) { if(reset) empty($('#guild-list'),error.message||'Annuaire des guildes indisponible.'); $('#guild-more').hidden=true; }
}

async function renderGuildPage(reference) {
  const container=$('#guild-page-content'); container.innerHTML='<p class="hub-empty">Lecture de la guilde…</p>';
  try {
    const encoded=encodeURIComponent(reference); const [guild,page]=await Promise.all([api(`/guildes/${encoded}`),api(`/guildes/${encoded}/membres?limite=100&decalage=0`)]); const members=page.membres||[];
    const rows=members.length?members.map((member,index)=>`<button class="hub-member-row" data-open-player="${safe(member.pseudo)}"><span class="hub-member-rank">${String(index+1).padStart(2,'0')}</span><img class="hub-avatar" src="${avatar(member.uuid||member.pseudo,64)}" alt=""><span class="hub-guild-meta"><b>${safe(member.pseudo)}</b><small>${safe(member.role)}</small></span><span class="hub-member-contribution">${number(member.contribution_saison)} <small>pts cette saison</small></span></button>`).join(''):'<p class="hub-empty">Aucun membre public n’est affiché pour le moment.</p>';
    container.innerHTML=`<article class="hub-guild-page"><header class="hub-guild-hero"><span class="hub-guild-hero-crest">${icon('shield',34)}</span><div><div class="couche-sur">FICHE DE GUILDE</div><h1 id="guild-page-title">${safe(guild.nom)}</h1><p>${guild.suspendue?'<span class="guild-suspended">Entretien suspendu</span>':'Guilde active'} · Créée le ${date(guild.creee_le)}</p></div><span class="hub-guild-hero-level">PALIER <b>${number(guild.palier)}</b></span></header><div class="hub-guild-stats"><article class="hub-stat-card"><span class="hub-stat-icon">${icon('user')}</span><small>MEMBRES</small><b>${number(guild.membres)}</b><span>${number(page.total)} profils publics</span></article><article class="hub-stat-card"><span class="hub-stat-icon">${icon('trophy')}</span><small>POINTS DE SAISON</small><b>${number(guild.points_saison)}</b><span>Cette saison</span></article><article class="hub-stat-card"><span class="hub-stat-icon">${icon('coins')}</span><small>BANQUE DE GUILDE</small><b>${money(guild.banque)}</b><span>Solde disponible</span></article><article class="hub-stat-card"><span class="hub-stat-icon">${icon('spark')}</span><small>EXPÉRIENCE</small><b>${compact(guild.xp)}</b><span>XP de guilde</span></article></div><section class="hub-members"><div class="hub-members-heading"><div><div class="couche-sur">LES ALLIÉS</div><h2>Membres de la guilde</h2></div><span>${number(page.total)} joueur${page.total===1?'':'s'}</span></div><label class="hub-search"><span class="search-icon" aria-hidden="true">${icon('search',15)}</span><input id="guild-member-search" placeholder="Filtrer les membres…" autocomplete="off"></label><div class="hub-members-list">${rows}</div></section></article>`;
    document.title=`${guild.nom} · Guilde Nalyora`;
  } catch(error) { container.innerHTML=`<div class="hub-not-found"><span>${icon('guild',36)}</span><h1>Guilde introuvable</h1><p>${safe(error.message||'Cette guilde n’est pas disponible.')}</p><a class="hub-back-button" href="#guildes">Retour à l’annuaire</a></div>`; }
}

function auctionCard(item, compactCard = false) {
  return `<button class="hub-auction-card ${compactCard?'compact':''}" data-open-auction="${safe(item.id)}"><span class="hub-auction-card-top">${icon('box',20)}<span>ANNONCE #${number(item.id)}</span></span><b class="hub-auction-item">${safe(item.objet)}</b><span class="hub-auction-seller">${icon('user',14)} ${safe(item.vendeur?.pseudo||'Vendeur')}</span><span class="hub-auction-card-foot"><strong>${money(item.prix)}</strong><small>Expire ${shortDate(item.expire_le)}</small></span></button>`;
}

function renderAuctionCarousel() {
  const listings=state.auctionListings;
  if(!listings.length){empty($('#auction-carousel'),'Pas d’annonce active pour l’instant. Reviens voir les prochains échanges.');$('#auction-carousel-count').textContent='0 annonce';$('#auction-carousel-dots').innerHTML='';return;}
  const per=matchMedia('(max-width: 680px)').matches?1:matchMedia('(max-width: 850px)').matches?2:3;
  const pages=Math.ceil(listings.length/per); state.auctionSlide=((state.auctionSlide%pages)+pages)%pages;
  const start=state.auctionSlide*per; const visible=listings.slice(start,start+per);
  $('#auction-carousel').innerHTML=visible.map(item=>auctionCard(item,true)).join('');
  $('#auction-carousel-count').textContent=`${number(start+1)}–${number(start+visible.length)} sur ${number(listings.length)}`;
  $('#auction-carousel-dots').innerHTML=pages<=7?Array.from({length:pages},(_,i)=>`<button type="button" data-auction-slide="${i}" class="${i===state.auctionSlide?'active':''}" aria-label="Aller aux annonces ${i+1}"></button>`).join(''):`<span>Page ${number(state.auctionSlide+1)} / ${number(pages)}</span>`;
  $('#auction-prev').disabled=pages<=1; $('#auction-next').disabled=pages<=1;
}

function stepAuctionCarousel(delta) { state.auctionSlide+=delta; renderAuctionCarousel(); }

async function loadAuctions() {
  try {
    const listings=[]; let offset=0; let total=0;
    do {
      const data=await api(`/encheres?limite=100&decalage=${offset}&tri=recent`);
      const page=data.annonces||[]; total=Number(data.total||0); listings.push(...page); offset+=page.length;
      if(!page.length)break;
    } while(offset<total);
    state.auctionListings=listings; state.auctionSlide=0; $('#auction-count').textContent=number(total); renderAuctionCarousel();
  } catch(error) { empty($('#auction-carousel'),error.message||'Marché indisponible.'); }
}

async function loadMarketPage({reset=true}={}) {
  if(reset){state.marketOffset=0;empty($('#market-page-list'),'Lecture des annonces actives…');}
  const query=$('#market-page-search').value.trim(); const params=new URLSearchParams({limite:'100',decalage:String(state.marketOffset),tri:$('#market-page-sort').value}); if(query)params.set('q',query);
  try {
    const data=await api(`/encheres?${params}`); const listings=data.annonces||[]; state.marketTotal=Number(data.total||0); $('#market-page-count').textContent=number(state.marketTotal);
    const rows=listings.map(item=>`<button class="hub-auction-row" data-open-auction="${safe(item.id)}"><span class="hub-auction-icon">${icon('box',22)}</span><span class="hub-auction-meta"><b>${safe(item.objet)}</b><small>Vendeur ${safe(item.vendeur?.pseudo||'inconnu')} · expiration ${shortDate(item.expire_le)}</small></span><span class="hub-auction-price">${money(item.prix)}<small>Voir la fiche ${icon('arrow',12)}</small></span></button>`).join('');
    if(reset)$('#market-page-list').innerHTML=rows||'<p class="hub-empty">Aucune annonce ne correspond à ta recherche.</p>';else $('#market-page-list').insertAdjacentHTML('beforeend',rows);
    state.marketOffset+=listings.length; $('#market-load-more').hidden=state.marketOffset>=state.marketTotal||listings.length===0;
  } catch(error){if(reset)empty($('#market-page-list'),error.message||'Marché indisponible.');$('#market-load-more').hidden=true;}
}

async function renderAuctionPage(id) {
  const container=$('#auction-page-content'); container.innerHTML='<p class="hub-empty">Lecture de l’annonce…</p>';
  try {
    const item=await api(`/encheres/${encodeURIComponent(id)}`);
    container.innerHTML=`<article class="hub-auction-detail"><div class="hub-auction-detail-mark">${icon('box',42)}</div><div class="couche-sur">HÔTEL DES VENTES · ANNONCE #${number(item.id)}</div><h1 id="auction-page-title">${safe(item.objet)}</h1><p class="hub-auction-detail-sub">Une annonce proposée par un joueur de Nalyora.</p><div class="hub-auction-detail-main"><div><small>PRIX DEMANDÉ</small><strong>${money(item.prix)}</strong></div><button class="hub-auction-vendor" data-open-player="${safe(item.vendeur?.pseudo||'')}"><img src="${avatar(item.vendeur?.uuid||item.vendeur?.pseudo||'Steve',64)}" alt=""><span><small>VENDEUR</small><b>${safe(item.vendeur?.pseudo||'Vendeur')}</b></span>${icon('arrow',16)}</button></div><div class="hub-auction-dates"><span><small>MISE EN VENTE</small><b>${date(item.creee_le)}</b></span><span><small>EXPIRE LE</small><b>${date(item.expire_le)}</b></span></div></article>`;
    document.title=`${item.objet} · Hôtel des ventes Nalyora`;
  } catch(error){container.innerHTML=`<div class="hub-not-found"><span>${icon('box',36)}</span><h1>Annonce introuvable</h1><p>${safe(error.message||'Cette annonce a peut-être été retirée.')}</p><a class="hub-back-button" href="#/marche">Retour au marché</a></div>`;}
}

async function loadAuctionStats(){try{const stats=await api('/encheres/statistiques');$('#average-price').textContent=money(stats.prix_moyen);$('#auction-count').textContent=number(stats.annonces_actives);}catch{$('#average-price').textContent='—';}}

function showRoute() {
  const raw=location.hash||'#accueil'; const [path,queryString='']=raw.slice(1).split('?'); const params=new URLSearchParams(queryString); const decodedPath=decodeURIComponent(path);
  const playerMatch=decodedPath.match(/^\/joueur\/(.+)$/); const guildMatch=decodedPath.match(/^\/guilde\/(.+)$/); const marketMatch=decodedPath==='/marche'; const auctionMatch=decodedPath.match(/^\/enchere\/(.+)$/); const subpage=Boolean(playerMatch||guildMatch||marketMatch||auctionMatch);
  document.body.classList.toggle('hub-subpage-open',subpage); $('#player-page').hidden=!playerMatch; $('#guild-page').hidden=!guildMatch; $('#market-page').hidden=!marketMatch; $('#auction-page').hidden=!auctionMatch;
  if(playerMatch) renderPlayerPage(playerMatch[1],params.get('onglet')||'apercu',params.get('monnaie')||'vault');
  if(guildMatch) renderGuildPage(guildMatch[1]);
  if(marketMatch) { document.title='Hôtel des ventes · Nalyora'; loadMarketPage({reset:true}); }
  if(auctionMatch) renderAuctionPage(auctionMatch[1]);
  if(!subpage) document.title='Le Hub des joueurs · Nalyora';
  if(!subpage&&raw.startsWith('#')) requestAnimationFrame(()=>{const target=$(raw);if(target)target.scrollIntoView({behavior:'smooth',block:'start'});}); else window.scrollTo({top:0,behavior:'smooth'});
}

$('#player-search').addEventListener('input',renderPlayers);
$('#player-list').addEventListener('click',event=>{const item=event.target.closest('[data-open-player]');if(item)openPlayer(item.dataset.openPlayer);});
$('#refresh-online').addEventListener('click',loadServer);
$('#profile-form').addEventListener('submit',async event=>{event.preventDefault();const name=$('#profile-input').value.trim();if(name)await loadProfilePreview(name);});
$('#profile-result').addEventListener('click',event=>{const item=event.target.closest('[data-open-player]');if(item)openPlayer(item.dataset.openPlayer);});
$('#player-page-content').addEventListener('click',event=>{
  const tab=event.target.closest('[data-profile-tab]');
  if(tab&&state.profile){const currency=new URLSearchParams(location.hash.split('?')[1]||'').get('monnaie')||'vault';navigate(`#/joueur/${encodeURIComponent(state.profile.pseudo)}?onglet=${tab.dataset.profileTab}&monnaie=${currency}`);return;}
  const moneyTab=event.target.closest('[data-money-tab]');
  if(moneyTab&&state.profile){navigate(`#/joueur/${encodeURIComponent(state.profile.pseudo)}?onglet=fortune&monnaie=${moneyTab.dataset.moneyTab}`);return;}
  const player=event.target.closest('[data-open-player]');if(player){openPlayer(player.dataset.openPlayer);return;}
  const guild=event.target.closest('[data-open-guild]');if(guild)openGuild(guild.dataset.openGuild);
});
$('#board-select').addEventListener('change',event=>loadBoard(event.target.value));
$('#classements').addEventListener('click',event=>{const player=event.target.closest('[data-open-player]');if(player)openPlayer(player.dataset.openPlayer);const guild=event.target.closest('[data-open-guild]');if(guild)openGuild(guild.dataset.openGuild);});
$('#wealth-type').addEventListener('change',()=>{if(state.board==='argent')loadBoard('argent');});
$('#guild-list').addEventListener('click',event=>{const guild=event.target.closest('[data-open-guild]');if(guild)openGuild(guild.dataset.openGuild);});
$('#guild-more').addEventListener('click',()=>loadGuilds({reset:false}));
$('#guild-search').addEventListener('input',()=>{clearTimeout(state.guildTimer);state.guildTimer=setTimeout(()=>loadGuilds({reset:true}),280);});
$('#guild-page-content').addEventListener('click',event=>{const player=event.target.closest('[data-open-player]');if(player)openPlayer(player.dataset.openPlayer);});
$('#guild-page-content').addEventListener('input',event=>{if(event.target.id!=='guild-member-search')return;const query=event.target.value.toLocaleLowerCase('fr');$$('.hub-member-row',$('#guild-page-content')).forEach(row=>{row.hidden=!row.textContent.toLocaleLowerCase('fr').includes(query);});});
$('#market-page-search').addEventListener('input',()=>{clearTimeout(state.marketTimer);state.marketTimer=setTimeout(()=>loadMarketPage({reset:true}),300);});
$('#market-page-sort').addEventListener('change',()=>loadMarketPage({reset:true}));
$('#market-load-more').addEventListener('click',()=>loadMarketPage({reset:false}));
$('#market-page-list').addEventListener('click',event=>{const row=event.target.closest('[data-open-auction]');if(row)openAuction(row.dataset.openAuction);});
$('#auction-carousel').addEventListener('click',event=>{const row=event.target.closest('[data-open-auction]');if(row)openAuction(row.dataset.openAuction);});
$('#auction-prev').addEventListener('click',()=>stepAuctionCarousel(-1));
$('#auction-next').addEventListener('click',()=>stepAuctionCarousel(1));
$('#auction-carousel-dots').addEventListener('click',event=>{const dot=event.target.closest('[data-auction-slide]');if(dot){state.auctionSlide=Number(dot.dataset.auctionSlide);renderAuctionCarousel();}});
$('#auction-page-content').addEventListener('click',event=>{const player=event.target.closest('[data-open-player]');if(player)openPlayer(player.dataset.openPlayer);});
$('#theme-toggle').addEventListener('click',()=>{const root=document.documentElement;const light=root.dataset.theme!=='clair';root.dataset.theme=light?'clair':'sombre';document.querySelector('meta[name="theme-color"]').content=light?'#edf4fb':'#071426';try{localStorage.setItem('nalyora-hub-theme',root.dataset.theme);}catch{}});
try{const saved=localStorage.getItem('nalyora-hub-theme');if(saved==='clair'||saved==='light')document.documentElement.dataset.theme='clair';else if(saved==='sombre'||saved==='dark')document.documentElement.dataset.theme='sombre';}catch{}
$('#nav-menu').addEventListener('click',event=>{const button=event.currentTarget;const header=button.closest('.nav');const open=header.classList.toggle('nav-ouverte');button.setAttribute('aria-expanded',String(open));});
$('#nav-principale').addEventListener('click',event=>{if(event.target.closest('a')){$('.nav').classList.remove('nav-ouverte');$('#nav-menu').setAttribute('aria-expanded','false');}});
window.addEventListener('hashchange',showRoute);
window.addEventListener('scroll',()=>$('.nav').classList.toggle('nav-defile',window.scrollY>8),{passive:true});
window.addEventListener('resize',()=>renderAuctionCarousel(),{passive:true});

loadServer();loadBoard();loadGuilds();loadAuctions();loadAuctionStats();showRoute();
setInterval(loadServer,45000);
setInterval(loadAuctions,60000);
if(!matchMedia('(prefers-reduced-motion: reduce)').matches)setInterval(()=>stepAuctionCarousel(1),5500);
