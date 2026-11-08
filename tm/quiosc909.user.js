// ==UserScript==
// @name         Quiosc Recepció 909
// @namespace    recollit-entregat-909
// @version      1.1
// @description  Pantalla tàctil de l'entrada de la nau GLS 909. El client escriu (o escaneja) el número d'enviament o el seu telèfon; la pantalla li diu si el paquet és a la nau, li dona un torn i avisa la pantalla de recepció de quin paquet ve a buscar. Consulta Atlas en directe. S'activa obrint https://atlas.gls-spain.es/shippingfinder/index?quiosc909 i es desactiva amb el codi de sortida.
// @match        https://atlas.gls-spain.es/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      script.google.com
// @connect      script.googleusercontent.com
// @run-at       document-start
// @updateURL    https://pickuppointandorra.com/tm/quiosc909.user.js
// @downloadURL  https://pickuppointandorra.com/tm/quiosc909.user.js
// ==/UserScript==

(function () {
  'use strict';

  // ================= CONFIGURACIÓ =================
  const CUA_URL = 'https://script.google.com/macros/s/AKfycbxl2jUbf_hVLsD31bl8Hl9dyUiYoeW4hhEtxgHY-HamuxAre9tx3SZVMYaBi7wkI0fU/exec';                     // URL de l'aplicació web "Recepció 909" (Apps Script) — s'omple en publicar-la
  const CLAU = 'q909-7f3a91c2e4';           // la mateixa clau que a l'Apps Script
  const CODI_SORTIDA = '90909090';          // escrit al teclat + OK: surt del mode quiosc
  const DIES_LLISTAT = 15;                  // dies d'enviaments que es carreguen per buscar pel telèfon
  const REFRESC_LLISTAT_MIN = 15;
  const INACTIVITAT_S = 40;                 // torna a l'inici si ningú toca la pantalla
  const HORARI = { 1: [[9, 14], [16, 18]], 2: [[9, 14], [16, 18]], 3: [[9, 14], [16, 18]], 4: [[9, 14], [16, 18]], 5: [[9, 14], [16, 18]] };
  // ================================================

  const W = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
  const ON = 'q909:on';
  const qs = new URLSearchParams(location.search);
  try {
    if (qs.has('quiosc909')) localStorage.setItem(ON, '1');
    if (qs.has('sortir909')) localStorage.removeItem(ON);
    // si Atlas demana la contrasenya i torna amb ReturnUrl=...quiosc909
    const ru = decodeURIComponent(qs.get('ReturnUrl') || qs.get('returnUrl') || '');
    if (/quiosc909/.test(ru)) localStorage.setItem(ON, '1');
  } catch (e) { }
  let actiu = false; try { actiu = localStorage.getItem(ON) === '1'; } catch (e) { }
  if (!actiu) return;
  if (/\/account\//i.test(location.pathname)) return;             // pàgina d'entrada d'Atlas: que el personal hi entri
  if (!/^\/shippingfinder\/index/i.test(location.pathname)) { location.replace('/shippingfinder/index?quiosc909'); return; }

  // ================= TEXTOS =================
  const TX = {
    ca: {
      tit: 'Vens a recollir un paquet?', sub: 'Escriu el número d\'enviament o el teu telèfon', ph: 'Número d\'enviament o telèfon',
      ok: 'BUSCAR', esb: 'Esborrar', cerc: 'Buscant…', torn: 'El teu torn', passa: 'Passa al taulell, ja t\'estem preparant el paquet.',
      aqui: 'És aquí', cami: 'Encara no ha arribat a la nau', prev: 'Data prevista d\'entrega', lliurat: 'Ja consta com a lliurat',
      ps: 'És al punt de recollida', locker: 'És al Locker GLS de l\'entrada: obre\'l amb el PIN o QR que t\'ha enviat GLS', rep: 'Pot haver sortit amb el repartidor',
      rept: 'Passa al taulell i ho comprovem.', taulell: 'Passa al taulell, t\'ho mirem.', notrob: 'No trobem cap enviament amb aquest número',
      notrobT: 'No trobem cap enviament amb aquest telèfon', revisa: 'Revisa el número o passa al taulell.', pagar: 'Cal pagar en recollir-lo',
      parlar: 'Vull parlar amb recepció', fet: 'Fet', tornar: 'Tornar', tancat: 'Ara la recepció és tancada', horari: 'Horari: dilluns a divendres, de 9 a 14 h i de 16 a 18 h',
      error: 'Ara no podem consultar els enviaments. Passa al taulell, si us plau.', bultos: 'bults', bult: 'bult', enviament: 'Enviament', curt: 'Número massa curt',
      trobats: n => n === 1 ? '1 enviament trobat' : n + ' enviaments trobats', avisat: 'Recepció ja està avisada.', senseAvis: 'Digues aquest número al taulell.',
      escaneja: 'També pots escanejar el codi de barres de l\'etiqueta o del SMS'
    },
    es: {
      tit: '¿Vienes a recoger un paquete?', sub: 'Escribe el número de envío o tu teléfono', ph: 'Número de envío o teléfono',
      ok: 'BUSCAR', esb: 'Borrar', cerc: 'Buscando…', torn: 'Tu turno', passa: 'Pasa al mostrador, ya te estamos preparando el paquete.',
      aqui: 'Está aquí', cami: 'Todavía no ha llegado a la nave', prev: 'Fecha prevista de entrega', lliurat: 'Ya consta como entregado',
      ps: 'Está en el punto de recogida', locker: 'Está en el Locker GLS de la entrada: ábrelo con el PIN o QR que te ha enviado GLS', rep: 'Puede haber salido con el repartidor',
      rept: 'Pasa al mostrador y lo comprobamos.', taulell: 'Pasa al mostrador, te lo miramos.', notrob: 'No encontramos ningún envío con este número',
      notrobT: 'No encontramos ningún envío con este teléfono', revisa: 'Revisa el número o pasa al mostrador.', pagar: 'Hay que pagar al recogerlo',
      parlar: 'Quiero hablar con recepción', fet: 'Hecho', tornar: 'Volver', tancat: 'Ahora la recepción está cerrada', horari: 'Horario: lunes a viernes, de 9 a 14 h y de 16 a 18 h',
      error: 'Ahora no podemos consultar los envíos. Pasa al mostrador, por favor.', bultos: 'bultos', bult: 'bulto', enviament: 'Envío', curt: 'Número demasiado corto',
      trobats: n => n === 1 ? '1 envío encontrado' : n + ' envíos encontrados', avisat: 'Recepción ya está avisada.', senseAvis: 'Di este número en el mostrador.',
      escaneja: 'También puedes escanear el código de barras de la etiqueta o del SMS'
    },
    en: {
      tit: 'Here to collect a parcel?', sub: 'Type your tracking number or your phone', ph: 'Tracking number or phone',
      ok: 'SEARCH', esb: 'Delete', cerc: 'Searching…', torn: 'Your number', passa: 'Please go to the counter, we are getting your parcel.',
      aqui: 'It is here', cami: 'It has not arrived yet', prev: 'Expected delivery date', lliurat: 'It is already marked as delivered',
      ps: 'It is at the pickup point', locker: 'It is in the GLS Locker at the entrance: open it with the PIN or QR sent by GLS', rep: 'It may be out for delivery',
      rept: 'Please go to the counter and we will check.', taulell: 'Please go to the counter.', notrob: 'No parcel found with this number',
      notrobT: 'No parcel found with this phone', revisa: 'Check the number or go to the counter.', pagar: 'Payment due on collection',
      parlar: 'I want to talk to reception', fet: 'Done', tornar: 'Back', tancat: 'Reception is closed now', horari: 'Opening hours: Monday to Friday, 9–14 h and 16–18 h',
      error: 'We cannot check parcels right now. Please go to the counter.', bultos: 'packages', bult: 'package', enviament: 'Parcel', curt: 'Number too short',
      trobats: n => n === 1 ? '1 parcel found' : n + ' parcels found', avisat: 'Reception has been notified.', senseAvis: 'Tell this number at the counter.',
      escaneja: 'You can also scan the barcode of the label or the SMS'
    },
    fr: {
      tit: 'Vous venez retirer un colis ?', sub: 'Saisissez le numéro d\'envoi ou votre téléphone', ph: 'Numéro d\'envoi ou téléphone',
      ok: 'CHERCHER', esb: 'Effacer', cerc: 'Recherche…', torn: 'Votre numéro', passa: 'Allez au comptoir, nous préparons votre colis.',
      aqui: 'Il est ici', cami: 'Il n\'est pas encore arrivé', prev: 'Date de livraison prévue', lliurat: 'Il figure déjà comme livré',
      ps: 'Il est au point relais', locker: 'Il est dans le Locker GLS de l\'entrée : ouvrez-le avec le PIN ou QR envoyé par GLS', rep: 'Il est peut-être en cours de livraison',
      rept: 'Allez au comptoir, nous vérifions.', taulell: 'Allez au comptoir, s\'il vous plaît.', notrob: 'Aucun envoi trouvé avec ce numéro',
      notrobT: 'Aucun envoi trouvé avec ce téléphone', revisa: 'Vérifiez le numéro ou allez au comptoir.', pagar: 'Paiement à la remise',
      parlar: 'Je veux parler à la réception', fet: 'Terminé', tornar: 'Retour', tancat: 'La réception est fermée', horari: 'Horaires : du lundi au vendredi, 9–14 h et 16–18 h',
      error: 'Impossible de consulter les envois pour le moment. Allez au comptoir, s\'il vous plaît.', bultos: 'colis', bult: 'colis', enviament: 'Envoi', curt: 'Numéro trop court',
      trobats: n => n === 1 ? '1 envoi trouvé' : n + ' envois trouvés', avisat: 'La réception est prévenue.', senseAvis: 'Donnez ce numéro au comptoir.',
      escaneja: 'Vous pouvez aussi scanner le code-barres de l\'étiquette ou du SMS'
    }
  };
  let LG = 'ca';
  const T = k => TX[LG][k];

  // ================= ESTATS D'ATLAS =================
  // -10 grabado · 0 manifestada · 2 en tránsito · 3 en delegación destino · 6 en reparto · 7 entregado · 9 almacenado · 11 pendiente datos en delegación
  // 19 en plataforma destino · 22 entregado en PS · 25 recepcionado en PS · 91 con incidencia · 10/12-15/23/51 devoluciones · 5/17/20/90 anulado/cerrado
  function categoria(x) {
    const s = +x.StatusId;
    const ps = String(x.nombrePSDestino || '');
    if ([3, 9, 11, 91].includes(s)) return 'aqui';
    if (s === 6) return 'rep';
    if ([-10, 0, 2, 16, 19, 21, 24].includes(s)) return 'cami';
    if (s === 25) return /LOCKER/i.test(ps) ? 'locker' : 'ps';
    if ([7, 8, 22, 50].includes(s)) return 'lliurat';
    return 'taulell';                                 // devolucions, anul·lats, retinguts, tancats...
  }
  const NOM_ESTAT = { '-10': 'GRABADO', 0: 'MANIFESTADA', 1: 'RETENIDA EN DELEGACIÓN', 2: 'EN TRÁNSITO', 3: 'EN DELEGACIÓN DESTINO', 5: 'ANULADA', 6: 'EN REPARTO', 7: 'ENTREGADO', 8: 'ENTREGA PARCIAL', 9: 'ALMACENADO', 10: 'DEVUELTA', 11: 'PENDIENTE DATOS', 12: 'DEVUELTA AL CLIENTE', 13: 'POSIBLE DEVOLUCIÓN', 14: 'SOLICITUD DEVOLUCIÓN', 15: 'EN DEVOLUCIÓN', 16: 'EN DELEGACIÓN ORIGEN', 17: 'DESTRUIDO', 18: 'RETENIDO ORDEN PAGO', 19: 'EN PLATAFORMA DESTINO', 20: 'CERRADO SINIESTRO', 21: 'RECANALIZADA', 22: 'ENTREGADO EN PS', 23: 'DEVOLUCIÓN PREPARADA', 24: 'RECOGIDA PREPARADA', 25: 'RECEPCIONADO EN PS', 50: 'PRECONFIRMADA', 51: 'ENTREGA ANULADA', 90: 'CERRADO', 91: 'CON INCIDENCIA' };
  const PREMIUM = (h, s) => { h = +h; s = +s; if (h === 0 && (s === 1 || s === 8)) return '10:30'; if (h === 2 && [1, 2, 21, 62].includes(s)) return '14H'; if (h === 18 && (s === 97 || s === 98)) return 'BP'; return ''; };
  const dataMs = v => { const ms = +String(v || '').replace(/[^\d]/g, ''); return ms ? new Date(ms) : null; };
  const ddmm = d => d ? String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') : '';
  const ddmmyyyy = d => String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  const eur = n => (+n || 0).toLocaleString('ca-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ================= ATLAS =================
  let TOK = null;
  async function token(nou) {
    if (TOK && !nou) return TOK;
    const t = await (await W.fetch('/shippingfinder/index', { credentials: 'include' })).text();
    const m = t.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/) || t.match(/value="([^"]+)"[^>]*name="__RequestVerificationToken"/);
    if (!m) throw new Error('SESSIO');
    TOK = m[1]; return TOK;
  }
  const BASE = { fltCode: '', fltDateFrom: '', fltDateTo: '', fltOrigin: '', fltPosting: '909', fltHighlighted: 'false', fltRed: '-1', fltTsp: '-1', fltLastStatus: 'true', fltLastIncidence: 'true', fltTypeCode: '0', fltTypeAduanaFile: '-1', page: '1', rows: '5000' };
  async function atlas(extra, reintent) {
    const tok = await token(reintent);
    const C = Object.assign({}, BASE, extra), p = new URLSearchParams();
    for (const k in C) p.append('searchCriteria[' + k + ']', C[k]);
    ['OrderBy', '', 'Order', '', 'draw', '0', 'start', '0', 'length', '0'].forEach((v, i, a) => { if (i % 2 === 0) p.append(v, a[i + 1]); });
    p.append('__RequestVerificationToken', tok);
    try {
      const r = await W.fetch('/ShippingFinder/GetShippings', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' }, body: p.toString() });
      const j = await r.json();
      return (j && j.data && j.data.shippingInfoList) || [];
    } catch (e) {
      if (!reintent) return atlas(extra, true);
      throw e;
    }
  }
  // cerca per codi: expedició, codi de barres, referència; prova variants de les etiquetes llargues
  async function perCodi(code) {
    const n = String(code).toUpperCase().replace(/[^0-9A-Z]/g, '');
    const vs = [n];
    if (/^\d{15,}$/.test(n)) vs.push(n.slice(-14), n.slice(0, 14));
    if (/^\d{13,}$/.test(n)) vs.push(n.slice(-12, -1), n.slice(-11));
    if (/^\d{12}$/.test(n)) vs.push(n.slice(0, 11));
    if (/^0+\d/.test(n)) vs.push(n.replace(/^0+/, ''));
    for (const v of [...new Set(vs)]) {
      const L = await atlas({ fltCode: v, rows: '20' });
      if (L.length) return L;
    }
    return [];
  }

  // llistat dels últims dies, només a memòria, per buscar pel telèfon
  let LLISTA = [], LLISTA_AT = 0, carregant = false;
  const normTel = v => {
    let d = String(v || '').replace(/\D/g, '');
    if (d.startsWith('00')) d = d.slice(2);
    if (d.length === 11 && d.startsWith('34')) d = d.slice(2);
    if (d.length === 9 && d.startsWith('376')) d = d.slice(3);
    return d;
  };
  async function carregaLlista() {
    if (carregant) return; carregant = true;
    try {
      const out = [], vist = new Set();
      for (let k = DIES_LLISTAT - 1; k >= 0; k--) {
        const d = new Date(); d.setDate(d.getDate() - k);
        if (d.getDay() === 0) continue;
        let L = []; try { L = await atlas({ fltDateFrom: ddmmyyyy(d), fltDateTo: ddmmyyyy(d) }); } catch (e) { L = []; }
        L.forEach(x => {
          const e = String(x.ShippingId || ''); if (!e || vist.has(e)) return; vist.add(e);
          const t = [normTel(x.PostingMobilePhone), normTel(x.PostingPhone)].filter(v => v.length >= 6);
          if (t.length) out.push({ e, t });
        });
      }
      if (out.length) { LLISTA = out; LLISTA_AT = Date.now(); }
    } finally { carregant = false; }
  }
  async function perTelefon(tel) {
    const n = normTel(tel);
    if (!LLISTA.length || Date.now() - LLISTA_AT > REFRESC_LLISTAT_MIN * 60000) await carregaLlista();
    const exps = LLISTA.filter(r => r.t.includes(n)).map(r => r.e).slice(-10);
    const res = [];
    for (const e of exps) { const L = await atlas({ fltCode: e, rows: '5' }); if (L[0]) res.push(L[0]); }   // estat en directe
    return res;
  }

  // ================= CUA DE RECEPCIÓ =================
  function inicials(nom) {
    return String(nom || '').trim().split(/\s+/).filter(Boolean).slice(0, 3).map(p => p[0].toUpperCase() + '.').join(' ');
  }
  function fitxa(x) {
    const ps = String(x.nombrePSDestino || '');
    return {
      exp: String(x.ShippingId), cat: categoria(x), st: +x.StatusId, stn: NOM_ESTAT[x.StatusId] || String(x.StatusId),
      fpe: ddmm(dataMs(x.EstimatedDate)), nom: String(x.PostingName || '').trim(), adr: (String(x.PostingAddress || '') + ' · ' + String(x.PostingCity || '')).trim(),
      bul: +x.Packages || 0, kg: +x.Kgs || 0, cod: +x.CashOnDelivery || 0, due: +x.Due || 0, ps: ps.replace(/^PS\s+/i, ''), prem: PREMIUM(x.Schedule, x.ServiceId),
      rem: String(x.SourceName || '').trim()
    };
  }
  function envia(dades) {
    return new Promise(res => {
      if (!CUA_URL || typeof GM_xmlhttpRequest === 'undefined') return res(null);
      try {
        GM_xmlhttpRequest({
          method: 'POST', url: CUA_URL, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, timeout: 8000,
          data: JSON.stringify(Object.assign({ k: CLAU }, dades)),
          onload: r => { try { res(JSON.parse(r.responseText)); } catch (e) { res(null); } },
          onerror: () => res(null), ontimeout: () => res(null)
        });
      } catch (e) { res(null); }
    });
  }
  function tornLocal() {
    const avui = new Date().toISOString().slice(0, 10);
    let o = {}; try { o = JSON.parse(localStorage.getItem('q909:torn') || '{}'); } catch (e) { }
    if (o.d !== avui) o = { d: avui, n: 0 };
    o.n++; try { localStorage.setItem('q909:torn', JSON.stringify(o)); } catch (e) { }
    return 'L' + o.n;
  }

  // ================= HORARI =================
  function obert() {
    const d = new Date(), h = d.getHours() + d.getMinutes() / 60, f = HORARI[d.getDay()];
    return !!(f && f.some(([a, b]) => h >= a && h < b));
  }

  // ================= PANTALLA =================
  const CSS = `
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;user-select:none}
  html,body{height:100%;overflow:hidden;background:#061ab1;font-family:'Segoe UI',Arial,sans-serif;color:#fff;touch-action:manipulation}
  #q{height:100%;display:flex;flex-direction:column}
  header{display:flex;align-items:center;justify-content:space-between;padding:18px 32px;background:#04128a}
  .logo{font-weight:800;font-size:30px;letter-spacing:1px}.logo b{color:#ffd400}
  .lg button{background:transparent;border:2px solid #ffffff55;color:#fff;font-size:20px;font-weight:700;border-radius:10px;padding:8px 14px;margin-left:8px}
  .lg button.on{background:#ffd400;color:#061ab1;border-color:#ffd400}
  main{flex:1;display:flex;align-items:center;justify-content:center;padding:20px 32px;gap:48px}
  .esq{flex:1;max-width:620px}
  h1{font-size:52px;line-height:1.1;font-weight:800;margin-bottom:14px}
  .sub{font-size:26px;opacity:.9;margin-bottom:26px}
  .camp{background:#fff;color:#061ab1;border-radius:16px;font-size:46px;font-weight:700;padding:18px 24px;min-height:92px;letter-spacing:2px;display:flex;align-items:center;word-break:break-all}
  .camp.buit{color:#9aa3d6;font-size:30px;font-weight:600;letter-spacing:0}
  .avis{min-height:34px;margin-top:12px;font-size:22px;color:#ffd400}
  .scan{margin-top:18px;font-size:19px;opacity:.75}
  .tancat{margin-top:18px;background:#ffd400;color:#061ab1;border-radius:12px;padding:12px 16px;font-size:20px;font-weight:700}
  .tec{display:grid;grid-template-columns:repeat(3,128px);gap:14px}
  .tec button{height:104px;border:0;border-radius:18px;background:#fff;color:#061ab1;font-size:44px;font-weight:800;box-shadow:0 5px 0 #0004}
  .tec button:active{transform:translateY(3px);box-shadow:0 2px 0 #0004}
  .tec .del{background:#c8cdf0;font-size:28px}
  .tec .ok{grid-column:span 3;background:#ffd400;font-size:38px;height:96px}
  .res{width:100%;max-width:1100px;text-align:center}
  .torn{display:inline-block;background:#ffd400;color:#061ab1;border-radius:24px;padding:16px 48px;margin-bottom:22px}
  .torn small{display:block;font-size:26px;font-weight:700}.torn b{font-size:110px;line-height:1}
  .msg{font-size:34px;font-weight:700;margin-bottom:22px}
  .cards{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-bottom:26px;max-height:46vh;overflow:auto}
  .card{background:#fff;color:#061ab1;border-radius:16px;padding:16px 22px;min-width:330px;max-width:520px;text-align:left;border-left:14px solid #999}
  .card.aqui{border-color:#18a34a}.card.cami{border-color:#f59e0b}.card.lliurat,.card.ps,.card.locker{border-color:#3b82f6}.card.rep,.card.taulell{border-color:#e11d48}
  .card .e{font-size:18px;opacity:.7}.card .s{font-size:28px;font-weight:800;margin:4px 0}.card .d{font-size:20px}
  .card .p{margin-top:8px;background:#fff3c4;border-radius:8px;padding:6px 10px;font-size:20px;font-weight:700}
  .bts{display:flex;gap:18px;justify-content:center}
  .bts button{border:0;border-radius:16px;font-size:30px;font-weight:800;padding:22px 44px;background:#fff;color:#061ab1}
  .bts .g{background:#ffd400}
  .espera{font-size:40px;font-weight:700;opacity:.9}
  .peu{font-size:18px;opacity:.6;text-align:center;padding:10px}
  `;
  let entrada = '', timerInact = null, timerFet = null;

  function pinta(html) {
    document.getElementById('cos').innerHTML = html;
    reiniciaInact();
  }
  function reiniciaInact() {
    clearTimeout(timerInact);
    timerInact = setTimeout(() => { entrada = ''; inici(); }, INACTIVITAT_S * 1000);
  }
  function capcalera() {
    document.getElementById('lg').innerHTML = Object.keys(TX).map(l => `<button data-lg="${l}" class="${l === LG ? 'on' : ''}">${l.toUpperCase()}</button>`).join('');
  }
  function inici(avis) {
    clearTimeout(timerFet);
    capcalera();
    pinta(`<div class="esq">
        <h1>${T('tit')}</h1><div class="sub">${T('sub')}</div>
        <div class="camp ${entrada ? '' : 'buit'}" id="camp">${entrada ? esc(entrada) : T('ph')}</div>
        <div class="avis" id="avis">${avis ? esc(avis) : ''}</div>
        <div class="scan">${T('escaneja')}</div>
        ${obert() ? '' : `<div class="tancat">${T('tancat')}<br><span style="font-weight:600">${T('horari')}</span></div>`}
      </div>
      <div class="tec">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-k="${n}">${n}</button>`).join('')}
        <button class="del" data-k="C">✕</button><button data-k="0">0</button><button class="del" data-k="B">⌫</button>
        <button class="ok" data-k="OK">${T('ok')}</button></div>`);
  }
  function actualitzaCamp() {
    const c = document.getElementById('camp'); if (!c) return;
    c.className = 'camp' + (entrada ? '' : ' buit');
    c.textContent = entrada || T('ph');
    const a = document.getElementById('avis'); if (a) a.textContent = '';
  }
  function tecla(k) {
    if (!document.getElementById('camp')) return;
    if (k === 'C') entrada = '';
    else if (k === 'B') entrada = entrada.slice(0, -1);
    else if (k === 'OK') return busca();
    else if (entrada.length < 30) entrada += k;
    actualitzaCamp();
  }

  async function busca() {
    const v = entrada.trim();
    if (v === CODI_SORTIDA) { try { localStorage.removeItem(ON); } catch (e) { } location.href = '/'; return; }
    const d = v.replace(/\D/g, '');
    let via;
    const nomesXifres = /^\d+$/.test(v);
    if (nomesXifres && (d.length === 6 || d.length === 9 || (d.length === 11 && /^(34[6-9]|00376)/.test(d)) || (d.length === 13 && /^0034/.test(d)))) via = 'tel';
    else if (/^[0-9A-Z-]{10,}$/i.test(v)) via = 'codi';
    else { inici(T('curt')); return; }
    pinta(`<div class="res"><div class="espera">${T('cerc')}</div></div>`);
    let L;
    try { L = via === 'codi' ? await perCodi(v) : await perTelefon(v); }
    catch (e) { return resultat({ error: true, via }); }
    resultat({ via, fitxes: L.map(fitxa), q: v });
  }

  async function resultat({ error, via, fitxes, q }) {
    entrada = '';
    if (error) {
      pinta(`<div class="res"><div class="msg">${T('error')}</div><div class="bts"><button class="g" data-a="inici">${T('tornar')}</button></div></div>`);
      envia({ a: 'add', via, q: amaga(q), items: [], torn: false, err: 1 });
      return programaFet(20);
    }
    // ordre: primer els que són aquí
    const ord = { aqui: 0, rep: 1, taulell: 2, cami: 3, locker: 4, ps: 5, lliurat: 6 };
    fitxes.sort((a, b) => ord[a.cat] - ord[b.cat]);
    const calTorn = fitxes.some(f => ['aqui', 'rep', 'taulell'].includes(f.cat));
    if (!fitxes.length) {
      envia({ a: 'add', via, q: amaga(q), items: [], torn: false });
      pinta(`<div class="res"><div class="msg">${via === 'tel' ? T('notrobT') : T('notrob')}</div><div class="msg" style="font-weight:500">${T('revisa')}</div>
        <div class="bts"><button data-a="inici">${T('tornar')}</button><button class="g" data-a="parlar">${T('parlar')}</button></div></div>`);
      ULT = { via, q, fitxes };
      return programaFet(30);
    }
    ULT = { via, q, fitxes };
    let tornHtml = '';
    if (calTorn) {
      const r = await envia({ a: 'add', via, q: amaga(q), items: fitxes, torn: true, lang: LG });
      const n = r && r.torn ? r.torn : tornLocal();
      tornHtml = `<div class="torn"><small>${T('torn')}</small><b>${esc(n)}</b></div>
        <div class="msg">${fitxes.some(f => f.cat === 'aqui') ? T('passa') : T('rept')}<br><span style="font-weight:500;font-size:24px">${r && r.torn ? T('avisat') : T('senseAvis')}</span></div>`;
    } else {
      envia({ a: 'add', via, q: amaga(q), items: fitxes, torn: false, lang: LG });
    }
    pinta(`<div class="res">${tornHtml}
      ${via === 'tel' ? `<div class="msg" style="font-size:24px;font-weight:600">${T('trobats')(fitxes.length)}</div>` : ''}
      <div class="cards">${fitxes.slice(0, 6).map(cardClient).join('')}</div>
      <div class="bts">${calTorn ? '' : `<button data-a="parlar">${T('parlar')}</button>`}<button class="g" data-a="inici">${T('fet')}</button></div></div>`);
    programaFet(calTorn ? 25 : 35);
  }
  let ULT = null;
  async function parlar() {
    if (!ULT) return inici();
    const r = await envia({ a: 'add', via: ULT.via, q: amaga(ULT.q), items: ULT.fitxes, torn: true, parlar: 1, lang: LG });
    const n = r && r.torn ? r.torn : tornLocal();
    pinta(`<div class="res"><div class="torn"><small>${T('torn')}</small><b>${esc(n)}</b></div>
      <div class="msg">${T('taulell')}<br><span style="font-weight:500;font-size:24px">${r && r.torn ? T('avisat') : T('senseAvis')}</span></div>
      <div class="bts"><button class="g" data-a="inici">${T('fet')}</button></div></div>`);
    ULT = null; programaFet(20);
  }
  function cardClient(f) {
    const tit = { aqui: '✅ ' + T('aqui'), cami: '🕓 ' + T('cami'), lliurat: '✔ ' + T('lliurat'), ps: '📍 ' + T('ps') + (f.ps ? ': ' + f.ps : ''), locker: '🔐 Locker GLS', rep: '🚚 ' + T('rep'), taulell: 'ℹ️ ' + T('taulell') }[f.cat];
    let det = '';
    if (f.cat === 'cami' && f.fpe) det = `${T('prev')}: <b>${f.fpe}</b>`;
    else if (f.cat === 'locker') det = T('locker');
    else if (f.bul) det = `${f.bul} ${f.bul === 1 ? T('bult') : T('bultos')}`;
    const pag = (f.cod > 0 || f.due > 0) && ['aqui', 'rep', 'taulell'].includes(f.cat) ? `<div class="p">💶 ${T('pagar')}: ${eur(f.cod + f.due)}</div>` : '';
    return `<div class="card ${f.cat}"><div class="e">${T('enviament')} ···${esc(f.exp.slice(-4))} ${f.nom ? '· ' + esc(inicials(f.nom)) : ''}</div><div class="s">${tit}</div><div class="d">${det}</div>${pag}</div>`;
  }
  function amaga(q) { const s = String(q || ''); return s.length <= 4 ? s : '…' + s.slice(-4); }
  function programaFet(s) { clearTimeout(timerFet); timerFet = setTimeout(() => inici(), s * 1000); }

  // ================= ARRENCADA =================
  function munta() {
    try { W.stop(); } catch (e) { }
    document.documentElement.innerHTML = `<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Recepció GLS 909</title><style>${CSS}</style></head>
      <body><div id="q"><header><div class="logo" id="logo">GLS <b>·</b> Recollit i Entregat</div><div class="lg" id="lg"></div></header><main id="cos"></main>
      <div class="peu">Agència GLS 909 · La Seu d'Urgell</div></div></body>`;
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      reiniciaInact();
      if (b.dataset.k) tecla(b.dataset.k);
      else if (b.dataset.lg) { LG = b.dataset.lg; const ent = entrada; inici(); entrada = ent; actualitzaCamp(); }
      else if (b.dataset.a === 'inici') { entrada = ''; inici(); }
      else if (b.dataset.a === 'parlar') parlar();
    });
    // lector de codis de barres USB o teclat físic
    document.addEventListener('keydown', e => {
      reiniciaInact();
      if (!document.getElementById('camp')) { if (e.key === 'Enter') return; entrada = ''; inici(); }
      if (e.key === 'Enter') { e.preventDefault(); busca(); return; }
      if (e.key === 'Backspace') { e.preventDefault(); tecla('B'); return; }
      if (/^[0-9A-Za-z-]$/.test(e.key)) { e.preventDefault(); if (entrada.length < 30) { entrada += e.key.toUpperCase(); actualitzaCamp(); } }
    }, true);
    inici();
    // primer llistat per telèfon en segon pla, i cada X minuts
    setTimeout(() => carregaLlista().catch(() => { }), 1500);
    setInterval(() => carregaLlista().catch(() => { }), REFRESC_LLISTAT_MIN * 60000);
    // manté viva la sessió d'Atlas i comprova que no ha caducat
    setInterval(() => token(true).catch(() => { location.reload(); }), 10 * 60000);
  }
  if (document.documentElement) munta();
  else document.addEventListener('readystatechange', munta, { once: true });
})();
