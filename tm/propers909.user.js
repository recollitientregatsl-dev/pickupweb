// ==UserScript==
// @name         Propers 909
// @namespace    recollit-entregat-909
// @version      1.4
// @description  Botó "Revisar propers" a Control de Entregas: amb la fulla d'un repartidor oberta, mostra els enviaments sense assignar (Sin asignar, 999 i 1000) que són a prop de les seves parades i permet assignar-los a la fulla. Agència 909.
// @match        https://atlas.gls-spain.es/delivery/*
// @match        https://atlas.gls-spain.es/Delivery/*
// @updateURL    https://pickuppointandorra.com/tm/propers909.user.js
// @downloadURL  https://pickuppointandorra.com/tm/propers909.user.js
// @grant        unsafeWindow
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';
  const W = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

  // ---------- configuració ----------
  const MARGE_NUM = 5;                                   // mateix carrer: fins a ±5 números
  const ORIGENS = [                                      // d'on poden sortir els propers
    { nom: 'Sin asignar', codi: '' },
    { nom: '999', dealer: 999 },
    { nom: '1000', dealer: 1000 }
  ];
  const ESPERA_ENTRE = 700, TEMPS_MAX = 20000;

  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const dorm = ms => new Promise(r => setTimeout(r, ms));
  const NRM = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[´`'’.,;:()\/\\-]/g, ' ').replace(/\s+/g, ' ').trim().replace(/\bSTA\b/g, 'SANTA').replace(/\bST\b/g, 'SANT').replace(/\bMAYOR\b/g, 'MAJOR');
  const TIPUS = /^(C|CL|CALLE|CARRER|CARRE|CR|CRA|CTRA|CARRETERA|AV|AVD|AVDA|AVDA|AVENIDA|AVINGUDA|AVGDA|PG|PS|PASSEIG|PASEO|PGE|PSG|PASSATGE|PASAJE|PL|PZA|PLAZA|PLACA|RAMBLA|RBLA|TRAV|TRAVESSIA|URB|URBANITZACIO|URBANIZACION|BARRI|BARRIO|CAMI|CAMINO|PARTIDA|PDA)$/;
  const BUIDES = /^(DE|DEL|DELS|LA|LES|EL|ELS|LOS|LAS|D|L|I|Y|NUM|NUMERO|N|NO|NO|Nº)$/;

  // carrer + número a partir de l'adreça d'Atlas
  function parseAdreca(a) {
    const t = NRM(a).replace(/\bN[º°O]?\s*(?=\d)/g, ' ');
    const m = t.match(/^(.*?)(\d+)/);
    const nomPart = (m ? m[1] : t).split(' ').filter(Boolean);
    while (nomPart.length && TIPUS.test(nomPart[0])) nomPart.shift();
    const carrer = nomPart.filter(w => !BUIDES.test(w) && !TIPUS.test(w)).join(' ');
    return { carrer, num: m ? parseInt(m[2], 10) : null };
  }
  const esSeu = (loc, cp) => cp === '25700' || cp === '25710' || /SEU|URGEL|SEO/.test(NRM(loc));
  const generica = loc => !loc || /^(LLEIDA|LERIDA)( LLEIDA| LERIDA)*$/.test(loc);
  // recull a l'agència: no són parades de cap repartidor
  const esREA = e => { const d = NRM(e.DestStreet); return /VALLS D?\s?ANDORRA\W*18\b|VALLS D?\s?ANDORRA\W*20\b/.test(d) || (/LLETERIES/.test(d) && /\b(NAU|NAVE)\s*6\b/.test(d)) || /NAVE GLS|NAU GLS|OFICINA GLS/.test(d); };
  function clau(e) {
    const loc = NRM(e.DestLocation), cp = String(e.DestCp || '').trim();
    if (esSeu(loc, cp)) { const p = parseAdreca(e.DestStreet); return { seu: true, poble: 'SEU', carrer: p.carrer, num: p.num, parada: p.carrer + '|' + p.num }; }
    return { seu: false, poble: generica(loc) ? ('CP ' + cp) : loc, carrer: '', num: null, parada: loc + '|' + NRM(e.DestStreet) };
  }
  function semblaCarrer(a, b) {
    if (!a || !b) return false;
    if (a === b) return true;
    const ta = a.split(' '), tb = b.split(' ');
    const llarg = w => w.length >= 4;
    return ta.filter(llarg).some(w => tb.includes(w)) && (a.includes(b) || b.includes(a) || ta.filter(llarg).every(w => tb.includes(w)) || tb.filter(llarg).every(w => ta.includes(w)));
  }

  // ---------- dates FPE ----------
  const avui0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  function fpe(s) {
    const m = String(s || '').match(/(\d{2})\/(\d{2})\/(\d{4})/); if (!m) return { txt: '?', dif: 99 };
    const d = new Date(+m[3], +m[2] - 1, +m[1]);
    const dif = Math.round((d - avui0()) / 864e5);
    const txt = dif < 0 ? 'Vençut ' + m[1] + '/' + m[2] : dif === 0 ? 'Avui' : dif === 1 ? 'Demà' : dif === 2 ? 'Passat demà' : 'FPE ' + m[1] + '/' + m[2];
    return { txt, dif };
  }

  // ---------- Atlas ----------
  const vm = () => (W.my && W.my.vm) || null;
  function fullaOberta() {
    const v = vm(); if (!v || !v.sheets) return null;
    const s = v.sheets(); if (!s || !s.SheetCode || !s.SheetCode()) return null;
    const val = f => { try { return s[f] ? s[f]() : ''; } catch (e) { return ''; } };
    return { codi: String(s.SheetCode()), place: String(val('PlaceCode') || 909), rep: Number(val('DealerCode')) || 0, nom: String(val('Dealer') || '') };
  }
  async function detall(codi, place) {
    const r = await fetch('/Delivery/GetSheetDetails?SheetCode=' + encodeURIComponent(codi) + '&PlaceCode=' + encodeURIComponent(place) + '&quality=', { credentials: 'include' });
    const j = await r.json();
    return (j && j.data) || [];
  }
  function fullesOrigen() {
    const v = vm(); let s = [];
    try { s = W.ko.toJS(v.sumarySheets()) || []; } catch (e) { }
    const out = [];
    for (const o of ORIGENS) {
      if (o.codi === '') { out.push({ nom: o.nom, codi: '', place: '' }); continue; }
      s.filter(x => Number(x.DealerCode) === o.dealer && x.SheetCode).forEach(x => out.push({ nom: o.nom, codi: String(x.SheetCode), place: String(x.PlaceCode || 909) }));
    }
    return out;
  }

  // ---------- càlcul ----------
  async function revisa() {
    const f = fullaOberta();
    if (!f) { estat = { msg: 'Primer obre la fulla de reparto del repartidor.' }; pinta(); return; }
    estat = { msg: 'Llegint la fulla ' + f.codi + ' i els enviaments sense assignar…', fulla: f }; pinta();
    try {
      const meus = await detall(f.codi, f.place);
      if (!meus.length) { estat = { msg: 'La fulla ' + f.codi + ' no té enviaments.', fulla: f }; pinta(); return; }
      const parades = meus.filter(e => !esREA(e)).map(e => Object.assign(clau(e), { exp: String(e.CodExp), adr: String(e.DestStreet || '').trim(), F: fpe(e.FPDelivery) })).filter(p => p.F.dif <= 0);   // només parades on SÍ ha d'anar avui (FPE avui o vençut)
      if (!parades.length) { estat = { msg: 'La fulla ' + f.codi + ' no té cap enviament amb FPE avui o vençut: no hi ha parades de referència.', fulla: f }; pinta(); return; }
      const jaHi = new Set(meus.map(e => String(e.CodExp)));
      const origens = fullesOrigen();
      if (!origens.some(o => o.codi)) { estat = { msg: 'Prem «Actualizar» d\'Atlas perquè es vegin les fulles 999 i 1000, i torna-ho a provar.', fulla: f }; pinta(); return; }
      const cand = [];
      for (const o of origens) {
        if (o.codi && o.codi === f.codi) continue;
        let d = []; try { d = await detall(o.codi, o.place); } catch (e) { }
        d.forEach(e => { if (!jaHi.has(String(e.CodExp))) cand.push(Object.assign({ __o: o.nom }, e)); });
      }
      const vistos = new Set(), res = [];
      for (const e of cand) {
        if (vistos.has(String(e.CodExp)) || esREA(e)) continue;
        const k = clau(e);
        let tipus = null, ref = null, millor = 1e9; const RANG = { parada: 0, carrer: 1, poble: 2 }; const cnd = (t, p, dist) => { const s = RANG[t] * 1000 + (p.F.dif <= 0 ? 0 : 100) + dist; if (s < millor) { millor = s; tipus = t; ref = p; } };
        for (const p of parades) {
          if (k.seu !== p.seu) continue;
          if (!k.seu) { if (k.poble && k.poble === p.poble) cnd('poble', p, 0); continue; }
          if (!semblaCarrer(k.carrer, p.carrer)) continue;
          if (k.num != null && p.num != null && k.num === p.num) { cnd('parada', p, 0); continue; }
          if (k.num != null && p.num != null && Math.abs(k.num - p.num) <= MARGE_NUM) cnd('carrer', p, Math.abs(k.num - p.num));
        }
        if (!tipus) continue;
        vistos.add(String(e.CodExp));
        const F = fpe(e.FPDelivery);
        res.push({ exp: String(e.CodExp), orig: e.__o, adr: String(e.DestStreet || '').trim(), loc: String(e.DestLocation || '').trim(), dest: String(e.DestName || '').trim(), fpe: F.txt, dif: F.dif, tipus, refExp: ref.exp, refAdr: ref.adr, refFpe: ref.F.txt, refDif: ref.F.dif, inc: String(e.DeliveryDate || '').trim() && !/^\d/.test(String(e.DeliveryDate)) ? String(e.DeliveryDate).trim() : '' });
      }
      const ordre = { parada: 0, carrer: 1, poble: 2 };
      res.sort((a, b) => (ordre[a.tipus] - ordre[b.tipus]) || (a.dif - b.dif) || a.adr.localeCompare(b.adr));
      estat = { fulla: f, items: res, nMeus: meus.length, msg: res.length ? '' : 'Cap enviament proper sense assignar. Fulla completa 👍' };
    } catch (e) { estat = { msg: 'No s\'han pogut llegir les dades d\'Atlas (' + e.message + ').', fulla: f }; }
    pinta();
  }

  // ---------- assignar (mateix camp "Asignar expedición" d'Atlas) ----------
  let espera = null;
  function enllaca() {
    const X = W.XMLHttpRequest; if (!X || X.prototype.__p909) return;
    const O = X.prototype.open, S = X.prototype.send;
    X.prototype.open = function (m, u) { this.__p909u = String(u || ''); return O.apply(this, arguments); };
    X.prototype.send = function () {
      const u = this.__p909u || '';
      if (espera && /searchExpeditions|AsigExpeditionToSheet/i.test(u)) {
        this.addEventListener('loadend', () => {
          if (!espera) return;
          let j = null; try { j = JSON.parse(this.responseText); } catch (e) { }
          const fi = r => { const e = espera; espera = null; e(r); };
          if (/searchExpeditions/i.test(u)) {
            const n = j && j.data ? j.data.length : -1;
            if (n === 0) fi({ ok: false, text: 'No trobat a Atlas' });
            else if (n > 1) fi({ ok: false, text: 'Atlas en troba ' + n + ': tria\'l a la finestra' });
          } else {
            const t = j && j.Not && j.Not.text ? String(j.Not.text) : '';
            if (j && (j.Resultado === 'OK' || j.Resultado === 'W')) fi({ ok: true, text: t || 'Assignat' });
            else fi({ ok: false, text: t || 'Error d\'Atlas' });
          }
        });
      }
      return S.apply(this, arguments);
    };
    X.prototype.__p909 = true;
  }
  function assignaUn(codi) {
    return new Promise(resolve => {
      const v = vm();
      if (!v || !W.my.getExpeditionsData || !v.expeditioncode) { resolve({ ok: false, text: 'Atlas no està a punt' }); return; }
      const t = setTimeout(() => { espera = null; resolve({ ok: false, text: 'Atlas no contesta (pot tenir una finestra d\'avisos oberta)' }); }, TEMPS_MAX);
      espera = r => { clearTimeout(t); resolve(r); };
      try { v.expeditioncode(codi); W.my.getExpeditionsData(false); } catch (e) { clearTimeout(t); espera = null; resolve({ ok: false, text: 'No s\'ha pogut enviar a Atlas' }); }
    });
  }
  async function assigna(llista) {
    const f = fullaOberta();
    if (!f || !estat.fulla || f.codi !== estat.fulla.codi) { alert('La fulla oberta ha canviat. Torna a prémer «Revisar propers».'); return; }
    if (!confirm('Assignar ' + llista.length + ' enviament' + (llista.length > 1 ? 's' : '') + ' a la fulla ' + f.codi + (f.nom ? ' (' + f.nom + ')' : '') + '?')) return;
    enMarxa = true; pinta();
    for (const it of llista) {
      it.estat = '…'; pinta();
      const r = await assignaUn(it.exp);
      it.estat = r.ok ? 'FET' : 'ERROR'; it.text = r.text; pinta();
      if (!r.ok && /finestra/.test(r.text)) break;
      await dorm(ESPERA_ENTRE);
    }
    enMarxa = false; pinta();
  }

  // ---------- interfície ----------
  let estat = {}, enMarxa = false, obert = false;
  const CSS = `
  #p909b{position:fixed;right:24px;top:50px;z-index:2147483000;background:#0b3d91;color:#fff;border:0;border-radius:8px;padding:8px 12px;font:700 13px system-ui,Arial;box-shadow:0 2px 8px rgba(0,0,0,.3);cursor:pointer}
  #p909{position:fixed;right:24px;top:88px;z-index:2147483000;width:420px;max-width:calc(100vw - 20px);max-height:70vh;display:flex;flex-direction:column;background:#fff;color:#14213a;border:1px solid #c9d2e0;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.25);font:12px/1.35 system-ui,Arial;text-align:left}
  #p909 *{box-sizing:border-box;font-family:inherit}
  #p909 .hd{display:flex;gap:6px;align-items:center;padding:5px 8px;background:#0b3d91;color:#fff;border-radius:8px 8px 0 0}
  #p909 .hd b{flex:1}
  #p909 .hd button{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.5);border-radius:4px;padding:0 6px;cursor:pointer}
  #p909 .cos{overflow:auto;padding:6px 8px;display:grid;gap:6px}
  #p909 .msg{background:#fff3cd;color:#7a5b00;border-radius:5px;padding:5px 7px}
  #p909 .res{background:#eef2f8;border-radius:5px;padding:5px 7px}
  #p909 h4{margin:4px 0 2px;font-size:12px}
  #p909 .it{display:grid;grid-template-columns:1fr auto;gap:2px 6px;align-items:center;border:1px solid #d8dee8;border-left-width:5px;border-radius:5px;padding:4px 6px}
  #p909 .it.parada{border-left-color:#c8261d} #p909 .it.carrer{border-left-color:#e0a100} #p909 .it.poble{border-left-color:#0d8a8a}
  #p909 .it small{color:#5b6780;grid-column:1/2}
  #p909 .fp{font-weight:700} #p909 .fp.v{color:#c8261d} #p909 .fp.av{color:#7a3d00;background:#ffe08a;padding:0 3px;border-radius:3px} #p909 .rf{color:#14213a}
  #p909 button.p{background:#0b3d91;color:#fff;border:0;border-radius:5px;padding:3px 8px;font-size:12px;font-weight:600;cursor:pointer}
  #p909 button.p:disabled{opacity:.5;cursor:default}
  #p909 .FET{color:#1b7f3b;font-weight:700} #p909 .ERROR{color:#c0392b;font-weight:700}`;
  const NOMS = { parada: 'A la mateixa parada (ja hi passes)', carrer: 'Al mateix carrer, a ±' + MARGE_NUM + ' números (de camí)', poble: 'Al mateix poble' };

  function pinta() {
    const w = document.getElementById('p909'); if (!w) return;
    w.style.display = obert ? 'flex' : 'none';
    const f = fullaOberta(), it = estat.items || [];
    const pend = it.filter(x => x.estat !== 'FET');
    let h = '';
    if (estat.fulla) h += `<div class="res">Fulla <b>${esc(estat.fulla.codi)}</b>${estat.fulla.nom ? ' · ' + esc(estat.fulla.nom) : ''}${estat.nMeus ? ' · ' + estat.nMeus + ' enviaments' : ''}${it.length ? ' · <b>' + it.length + ' propers sense assignar</b>' : ''}</div>`;
    if (estat.msg) h += `<div class="msg">${esc(estat.msg)}</div>`;
    if (pend.length > 1) h += `<button class="p" id="p909tots" ${enMarxa ? 'disabled' : ''}>Assignar tots (${pend.length})</button>`;
    for (const t of ['parada', 'carrer', 'poble']) {
      const g = it.filter(x => x.tipus === t); if (!g.length) continue;
      h += `<h4>${NOMS[t]} · ${g.length}</h4>`;
      h += g.map(x => `<div class="it ${t}"><div><b>${esc(x.exp)}</b> · <span class="fp ${x.dif < 0 ? 'v' : ''}">${esc(x.fpe)}</span> <small>(${esc(x.orig)})</small><br>${esc(x.adr)}${x.seu === false ? '' : ''} · ${esc(x.loc)}<br><small>${esc(x.dest)}${x.inc ? ' · ' + esc(x.inc) : ''}</small>${x.refExp ? '<br><small class="rf">\u21b3 a prop de <b>' + esc(x.refExp) + '</b> \u00b7 ' + esc(x.refAdr) + ' \u00b7 <span class="fp ' + (x.refDif <= 0 ? 'av' : '') + '">' + (x.refDif === 0 ? 'FPE avui' : esc(x.refFpe)) + '</span></small>' : ''}</div>
        <div>${x.estat ? `<span class="${esc(x.estat)}">${esc(x.estat)}</span>${x.text && x.estat === 'ERROR' ? '<br><small>' + esc(x.text) + '</small>' : ''}` : `<button class="p" data-e="${esc(x.exp)}" ${enMarxa ? 'disabled' : ''}>Assignar</button>`}</div></div>`).join('');
    }
    w.querySelector('.cos').innerHTML = h || '<div class="res">Obre la fulla del repartidor i prem «Revisar propers».</div>';
    const b = w.querySelector('#p909tots'); if (b) b.onclick = () => assigna(pend.filter(x => !x.estat));
    w.querySelectorAll('button[data-e]').forEach(x => { x.onclick = () => { const i = it.find(y => y.exp === x.dataset.e); if (i) assigna([i]); }; });
    const bb = document.getElementById('p909b');
    if (bb) bb.textContent = '🔎 Revisar propers' + (f ? ' · ' + (f.nom || f.codi) : '');
  }

  function munta() {
    if (document.getElementById('p909b') || !document.body) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const b = document.createElement('button'); b.id = 'p909b'; b.type = 'button'; document.body.appendChild(b);
    const w = document.createElement('div'); w.id = 'p909';
    w.innerHTML = '<div class="hd"><b>🔎 Propers 909</b><button id="p909r" type="button" title="Tornar a revisar">↻</button><button id="p909x" type="button">✕</button></div><div class="cos"></div>';
    document.body.appendChild(w);
    b.onclick = () => { obert = true; revisa(); };
    w.querySelector('#p909r').onclick = () => revisa();
    w.querySelector('#p909x').onclick = () => { obert = false; pinta(); };
    enllaca(); pinta();
    setInterval(() => { if (!enMarxa) { const bb = document.getElementById('p909b'); const f = fullaOberta(); if (bb) bb.textContent = '🔎 Revisar propers' + (f ? ' · ' + (f.nom || f.codi) : ''); } }, 3000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', munta); else munta();
})();
