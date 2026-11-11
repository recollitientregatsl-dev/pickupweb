// ==UserScript==
// @name         Gravar Pickup 909
// @namespace    https://pickuppointandorra.com/
// @version      1.1
// @description  Grava enviaments multimarca del Pickup Point a Mensatrans (client PICKUP MENSATRANS) a partir de destinataris habituals, i imprimeix l'etiqueta.
// @author       Recollit i Entregat
// @match        https://app.mensatrans.com/app.html*
// @run-at       document-idle
// @grant        none
// @updateURL    https://pickuppointandorra.com/gravarpickup909.user.js
// @downloadURL  https://pickuppointandorra.com/gravarpickup909.user.js
// ==/UserScript==

(function () {
  'use strict';

  /* ---------- Configuració ---------- */
  const CLIENT_ID = '199569b4049199569974ab93';           // PICKUP MENSATRANS
  const DEPT = '2';
  const FORM_HASH = '#/recogida/@/envio/?customer=' + CLIENT_ID + '&dept=' + DEPT;
  const VERSION = '1.1';
  const LS = {
    queue: 'gp909_queue', mode: 'gp909_mode', revisar: 'gp909_revisar',
    fets: 'gp909_fets', open: 'gp909_open', running: 'gp909_running'
  };
  const STOP = new Set(['DE', 'DEL', 'LA', 'LAS', 'LOS', 'EL', 'Y', 'I', 'E', 'D', 'L', 'SR', 'SRA', 'MR', 'MRS', 'MS']);

  /* ---------- Utilitats ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const ld = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const sv = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const N = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const toks = s => N(s).split(' ').filter(t => t.length >= 2 && !STOP.has(t));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ara = () => new Date().toLocaleString('ca-ES', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });

  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 1) return 2;
    const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i]);
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }

  /* ---------- Accés al formulari Angular de Mensatrans ---------- */
  function esFormPickup() {
    return location.hash.indexOf('/envio/') >= 0 && location.hash.indexOf(CLIENT_ID) >= 0 &&
      !!$('[ng-model="envio.referencia"]');
  }
  function scopeEnvio() {
    const el = $('[ng-model="envio.referencia"]');
    return el && window.angular ? angular.element(el).scope() : null;
  }
  function habituals() {
    let s = scopeEnvio();
    while (s) { if (s.departamento && Array.isArray(s.departamento.direcciones)) return s.departamento.direcciones; s = s.$parent; }
    return null;
  }
  function trobarOnSelect() {
    // Busca l'scope de la llista d'habituals (directiva amb onselect)
    const dd = document.querySelector('dd[ng-click*="onselect"]');
    if (dd) { const sc = angular.element(dd).scope(); if (sc && typeof sc.onselect === 'function') return sc; }
    // Si la pestanya d'habituals no està oberta, l'obrim
    return null;
  }
  async function obrirHabituals() {
    if (document.querySelector('dd[ng-click*="onselect"]')) return true;
    const tab = [...document.querySelectorAll('*')].find(e => e.children.length <= 2 && /^\s*habituales\s*\(\d+\)\s*$/i.test(e.textContent));
    if (tab) { tab.click(); for (let i = 0; i < 20 && !document.querySelector('dd[ng-click*="onselect"]'); i++) await sleep(150); }
    return !!document.querySelector('dd[ng-click*="onselect"]');
  }
  async function esperarForm(ms = 25000) {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      if (esFormPickup() && habituals() && habituals().length) return true;
      await sleep(300);
    }
    return false;
  }

  /* ---------- Cerca de destinatari ---------- */
  // Retorna {estat:'OK'|'DUBTE'|'NO', dir, cands:[{d,motiu}], motiu}
  function buscar(nom) {
    const dirs = habituals() || [];
    const T = toks(nom);
    if (!T.length) return { estat: 'NO', cands: [], motiu: 'Nom buit o il·legible' };
    const exactes = [], parcials = [];
    for (const d of dirs) {
      const H = toks(d.nombre);
      if (!H.length) continue;
      let ok = 0, typo = 0;
      for (const t of T) {
        if (H.includes(t)) ok++;
        else if (t.length >= 5 && H.some(h => h.length >= 5 && lev(t, h) <= 1)) typo++;
      }
      if (ok === T.length) exactes.push(d);
      else if (ok + typo === T.length && ok >= 1) parcials.push({ d, motiu: 'lletra diferent' });
      else if (ok >= 2 && ok >= T.length - 1) parcials.push({ d, motiu: 'falta una paraula' });
    }
    if (T.length < 2) {
      const c = exactes.map(d => ({ d, motiu: 'només un nom' }));
      return { estat: c.length ? 'DUBTE' : 'NO', cands: c.slice(0, 8), motiu: 'Només hi ha una paraula al nom: cal confirmar' };
    }
    if (exactes.length === 1) {
      const n = N(exactes[0].nombre);
      const iguals = dirs.filter(x => N(x.nombre) === n).length;
      if (iguals > 1) return { estat: 'DUBTE', cands: dirs.filter(x => N(x.nombre) === n).map(d => ({ d, motiu: 'nom repetit' })), motiu: 'Hi ha dos habituals amb el mateix nom' };
      return { estat: 'OK', dir: exactes[0], cands: [], motiu: '' };
    }
    if (exactes.length > 1) return { estat: 'DUBTE', cands: exactes.slice(0, 8).map(d => ({ d, motiu: 'coincideix' })), motiu: exactes.length + ' habituals coincideixen' };
    if (parcials.length) return { estat: 'DUBTE', cands: parcials.slice(0, 8), motiu: 'No hi ha cap coincidència exacta' };
    return { estat: 'NO', cands: [], motiu: 'No està registrat a Mensatrans' };
  }

  /* ---------- Omplir i gravar ---------- */
  async function seleccionar(dir) {
    if (!(await obrirHabituals())) throw new Error("No s'ha pogut obrir la llista d'habituals");
    const sc = trobarOnSelect();
    if (!sc) throw new Error("No s'ha trobat la funció de selecció d'habituals");
    sc.$apply(() => sc.onselect(dir));
    await sleep(300);
    const es = scopeEnvio();
    if (!es || !es.envio || !es.envio.destino || N(es.envio.destino.nombre) !== N(dir.nombre))
      throw new Error("El destinatari no s'ha posat bé al formulari");
  }
  function omplir(item) {
    const es = scopeEnvio();
    es.$apply(() => {
      es.envio.referencia = item.ref || '';
      es.envio.observaciones = item.obs || '';
      const p = parseFloat(String(item.pes || '').replace(',', '.'));
      if (p > 0) es.envio.datos.peso = p;
    });
  }
  async function gravarImprimir() {
    const link = [...document.querySelectorAll('a[ng-click]')].find(a => /imprimir etiquetas/i.test(a.getAttribute('title') || ''));
    if (!link) throw new Error('No trobo el botó "guardar envío e imprimir etiquetas"');
    const hash0 = location.hash;
    const blobs0 = new Set([...document.querySelectorAll('iframe')].map(f => f.src).filter(s => /^blob:/.test(s)));
    link.click();
    // Mensatrans guarda, salta a la llista d'enviaments (#/recogida/N/envios/ver) i imprimeix amb un iframe blob
    const t0 = Date.now();
    let desat = false;
    while (Date.now() - t0 < 25000) {
      await sleep(400);
      if (!desat && location.hash !== hash0 && /\/recogida\/\d+\//.test(location.hash)) { desat = true; estat('Desat ✔ · imprimint etiqueta…'); }
      if (desat) {
        const nou = [...document.querySelectorAll('iframe')].some(f => /^blob:/.test(f.src) && !blobs0.has(f.src));
        if (nou) { await sleep(3500); return true; }          // deixem temps perquè l'etiqueta arribi a la impressora
        if (Date.now() - t0 > 15000) return true;            // desat però sense iframe detectat: no bloquegem
      }
      const err = [...document.querySelectorAll('.modal, .alerta, [class*="alert"], [class*="snackbar"]')]
        .map(e => e.textContent).find(t => /error|obligatori|no se ha podido|incorrect/i.test(t || ''));
      if (err) throw new Error('Mensatrans diu: ' + err.trim().slice(0, 140));
    }
    throw new Error("Mensatrans no ha confirmat la gravació en 25 s: comprova-ho a mà abans de continuar");
  }

  /* ---------- Registres ---------- */
  function afegirRevisar(item, motiu) {
    const r = ld(LS.revisar, []);
    r.push({ nom: item.nom, ref: item.ref || '', motiu, h: ara() });
    sv(LS.revisar, r); pintar();
  }
  function afegirFet(item, dir) {
    const f = ld(LS.fets, []);
    f.unshift({ nom: dir.nombre, ref: item.ref || '', h: ara() });
    sv(LS.fets, f.slice(0, 300)); pintar();
  }
  function jaFet(ref) {
    if (!ref) return false;
    return ld(LS.fets, []).some(x => x.ref && N(x.ref) === N(ref));
  }

  /* ---------- Lot ---------- */
  function parsejarLot(txt) {
    txt = String(txt || '').trim();
    if (!txt) return [];
    if (txt[0] === '[') {
      try {
        return JSON.parse(txt).map(o => ({ nom: o.nom || o.nombre || '', ref: o.ref || o.referencia || '', obs: o.obs || o.observaciones || '', pes: o.pes || o.peso || '' })).filter(x => x.nom);
      } catch (e) { alertaPanel('El JSON no és vàlid'); return []; }
    }
    return txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => {
      const p = l.split(/\s*[|;\t]\s*/);
      return { nom: p[0] || '', ref: p[1] || '', obs: p[2] || '', pes: p[3] || '' };
    }).filter(x => x.nom && !/^nom$/i.test(x.nom));
  }

  async function processarSeguent() {
    if (!ld(LS.running, false)) return;
    const q = ld(LS.queue, []);
    if (!q.length) { sv(LS.running, false); estat('Lot acabat ✔'); pintar(); return; }
    if (!esFormPickup()) { estat('Obrint formulari nou…'); location.hash = FORM_HASH + '&t=' + Date.now(); return; }
    if (!(await esperarForm())) { estat('El formulari no carrega'); sv(LS.running, false); pintar(); return; }
    const item = q[0];
    estat('Processant: ' + item.nom);
    if (jaFet(item.ref)) {
      afegirRevisar(item, 'Referència ja gravada avui per aquest script');
      q.shift(); sv(LS.queue, q); pintar(); return seguentForm();
    }
    const r = buscar(item.nom);
    if (r.estat !== 'OK') {
      afegirRevisar(item, r.estat === 'NO' ? 'No registrat: no es grava' : 'Dubte: ' + r.motiu + (r.cands.length ? ' (' + r.cands.map(c => c.d.nombre).slice(0, 3).join(' / ') + ')' : ''));
      q.shift(); sv(LS.queue, q); pintar();
      return processarSeguent();
    }
    try {
      await seleccionar(r.dir);
      omplir(item);
      if (ld(LS.mode, 'manual') === 'auto') {
        await gravarImprimir();
        afegirFet(item, r.dir);
        q.shift(); sv(LS.queue, q); pintar();
        await sleep(800);
        return seguentForm();
      } else {
        estat('Revisa i prem «Gravar i imprimir» (o «Saltar»)');
        pendentManual = { item, dir: r.dir };
        pintar();
      }
    } catch (e) {
      afegirRevisar(item, 'Error: ' + e.message);
      sv(LS.running, false); estat('Aturat: ' + e.message); pintar();
    }
  }
  function seguentForm() {
    if (!ld(LS.queue, []).length) { sv(LS.running, false); estat('Lot acabat ✔'); pintar(); return; }
    location.hash = FORM_HASH + '&t=' + Date.now();
  }
  let pendentManual = null;

  /* ---------- Panell ---------- */
  let panel, cur = null;
  function estat(t) { const e = $('#gp909-estat'); if (e) e.textContent = t; }
  function alertaPanel(t) { estat('⚠ ' + t); }

  function crearPanell() {
    if ($('#gp909')) return;
    const css = document.createElement('style');
    css.textContent = `
#gp909{position:fixed;right:12px;bottom:12px;width:350px;max-height:86vh;overflow:auto;z-index:2147483000;background:#fff;border:2px solid #0b5cad;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.25);font:13px/1.35 Manrope,Arial,sans-serif;color:#222}
#gp909.min{width:auto;max-height:none;overflow:visible}
#gp909 .hd{background:#0b5cad;color:#fff;padding:7px 10px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;border-radius:7px 7px 0 0}
#gp909.min .bd{display:none}
#gp909 .bd{padding:9px}
#gp909 label{display:block;font-size:11px;color:#555;margin:6px 0 2px}
#gp909 input,#gp909 textarea{width:100%;box-sizing:border-box;border:1px solid #bbb;border-radius:5px;padding:5px 6px;font:inherit}
#gp909 textarea{height:90px;font-size:12px}
#gp909 button{border:0;border-radius:5px;padding:6px 9px;margin:6px 4px 0 0;cursor:pointer;font:600 12px Arial;background:#e6eef8;color:#0b5cad}
#gp909 button.pr{background:#0b8a3e;color:#fff}
#gp909 button.rd{background:#c62828;color:#fff}
#gp909 button:disabled{opacity:.45;cursor:default}
#gp909 .tabs{display:flex;gap:4px;margin-bottom:6px}
#gp909 .tabs b{flex:1;text-align:center;padding:5px;border-radius:5px;background:#eee;cursor:pointer;font-size:12px}
#gp909 .tabs b.on{background:#0b5cad;color:#fff}
#gp909 .c{padding:5px 6px;border:1px solid #ddd;border-radius:5px;margin-top:4px;cursor:pointer}
#gp909 .c:hover{background:#f1f7ff}
#gp909 .c.sel{border-color:#0b8a3e;background:#eaf7ef}
#gp909 .ok{color:#0b8a3e;font-weight:700}
#gp909 .ko{color:#c62828;font-weight:700}
#gp909 .dub{color:#b26a00;font-weight:700}
#gp909 .sm{font-size:11px;color:#666}
#gp909 .box{border-top:1px solid #ddd;margin-top:8px;padding-top:6px}
#gp909 #gp909-estat{background:#f6f6f6;border-radius:5px;padding:5px;margin-top:6px;font-size:12px;min-height:16px}
#gp909 .row{display:flex;gap:6px}#gp909 .row>div{flex:1}`;
    document.head.appendChild(css);
    panel = document.createElement('div');
    panel.id = 'gp909';
    if (!ld(LS.open, true)) panel.classList.add('min');
    document.body.appendChild(panel);
    panel.addEventListener('click', onClick);
    panel.addEventListener('input', onInput);
    panel.addEventListener('keydown', onKey);
    pintar();
  }

  let tab = 'un';
  function pintar() {
    if (!panel) return;
    const q = ld(LS.queue, []), rev = ld(LS.revisar, []), fets = ld(LS.fets, []);
    const running = ld(LS.running, false), mode = ld(LS.mode, 'manual');
    const onForm = esFormPickup();
    const nom = $('#gp909-nom') ? $('#gp909-nom').value : '';
    const ref = $('#gp909-ref') ? $('#gp909-ref').value : '';
    const obs = $('#gp909-obs') ? $('#gp909-obs').value : '';
    const pes = $('#gp909-pes') ? $('#gp909-pes').value : '';
    const lot = $('#gp909-lot') ? $('#gp909-lot').value : '';
    panel.innerHTML = `
<div class="hd" data-a="toggle"><span>📦 Gravar Pickup 909 <span class="sm" style="color:#cfe3ff">v${VERSION}</span></span><span>${panel.classList.contains('min') ? '▲' : '▼'}</span></div>
<div class="bd">
 ${!onForm ? `<div class="sm">Obre el formulari d'enviament de PICKUP MENSATRANS:</div><button class="pr" data-a="nou">Nou enviament Pickup</button>` : ''}
 <div class="tabs"><b data-t="un" class="${tab === 'un' ? 'on' : ''}">Un a un</b><b data-t="lot" class="${tab === 'lot' ? 'on' : ''}">Lot (${q.length})</b><b data-t="rev" class="${tab === 'rev' ? 'on' : ''}">Revisar (${rev.length})</b><b data-t="fets" class="${tab === 'fets' ? 'on' : ''}">Fets (${fets.length})</b></div>
 <div style="${tab === 'un' ? '' : 'display:none'}">
  <label>Destinatari (nom de l'etiqueta)</label><input id="gp909-nom" value="${esc(nom)}" placeholder="Nom i cognoms" autocomplete="off">
  <div id="gp909-cands"></div>
  <label>Referència original (escàner)</label><input id="gp909-ref" value="${esc(ref)}" placeholder="Escaneja el codi del transportista" autocomplete="off">
  <div class="row"><div><label>Observacions</label><input id="gp909-obs" value="${esc(obs)}" placeholder="p. ex. SEUR · caixa"></div>
  <div style="flex:0 0 70px"><label>Pes (kg)</label><input id="gp909-pes" value="${esc(pes)}" placeholder="1"></div></div>
  <button class="pr" data-a="gravar1" ${onForm && cur ? '' : 'disabled'}>Gravar i imprimir</button><button data-a="netejar">Netejar</button>
 </div>
 <div style="${tab === 'lot' ? '' : 'display:none'}">
  <div class="sm">Una línia per paquet: <b>NOM | REFERÈNCIA | OBSERVACIONS | PES</b></div>
  <textarea id="gp909-lot" placeholder="MARIA GARCIA PUIG | 1Z999AA10123456784 | UPS · sobre | 0,5">${esc(lot)}</textarea>
  <button data-a="carregar">Afegir a la cua</button><button data-a="buidar" ${q.length ? '' : 'disabled'}>Buidar cua</button>
  <div class="sm" style="margin-top:6px">Mode: <label style="display:inline"><input type="radio" name="gp909m" value="manual" ${mode === 'manual' ? 'checked' : ''} style="width:auto"> confirmar cada paquet</label> &nbsp; <label style="display:inline"><input type="radio" name="gp909m" value="auto" ${mode === 'auto' ? 'checked' : ''} style="width:auto"> automàtic</label></div>
  ${running ? `<button class="rd" data-a="aturar">Aturar</button>` : `<button class="pr" data-a="iniciar" ${q.length ? '' : 'disabled'}>Començar lot</button>`}
  ${pendentManual ? `<div class="box"><b>${esc(pendentManual.dir.nombre)}</b><br><span class="sm">${esc(pendentManual.dir.direccion || '')} · ${esc(pendentManual.dir.localidad || '')}</span><br><span class="sm">Ref: ${esc(pendentManual.item.ref)}</span><br><button class="pr" data-a="confirmar">Gravar i imprimir</button><button data-a="saltar">Saltar (a revisar)</button></div>` : ''}
  <div class="box">${q.slice(0, 15).map((x, i) => `<div class="sm">${i + 1}. ${esc(x.nom)} · ${esc(x.ref)}</div>`).join('') || '<span class="sm">Cua buida</span>'}${q.length > 15 ? `<div class="sm">… i ${q.length - 15} més</div>` : ''}</div>
 </div>
 <div style="${tab === 'rev' ? '' : 'display:none'}">
  <div class="sm">Paquets NO gravats. Avisa la Zule (o copia-ho a Telegram).</div>
  ${rev.map(x => `<div class="c" style="cursor:default"><b>${esc(x.nom)}</b> <span class="sm">${esc(x.h)}</span><br><span class="sm">Ref: ${esc(x.ref)}</span><br><span class="ko" style="font-weight:600">${esc(x.motiu)}</span></div>`).join('') || '<div class="sm">Res pendent ✔</div>'}
  <button data-a="copiar" ${rev.length ? '' : 'disabled'}>Copiar llista</button><button data-a="buidarrev" ${rev.length ? '' : 'disabled'}>Marcar com revisats</button>
 </div>
 <div style="${tab === 'fets' ? '' : 'display:none'}">
  ${fets.slice(0, 40).map(x => `<div class="sm">✔ ${esc(x.h)} · ${esc(x.nom)} · ${esc(x.ref)}</div>`).join('') || '<div class="sm">Encara no n\'hi ha</div>'}
  <button data-a="buidarfets" ${fets.length ? '' : 'disabled'}>Esborrar historial</button>
 </div>
 <div id="gp909-estat"></div>
</div>`;
    if (tab === 'un') pintarCands();
  }

  function pintarCands() {
    const box = $('#gp909-cands'); if (!box) return;
    const nom = ($('#gp909-nom') || {}).value || '';
    if (!esFormPickup()) { box.innerHTML = nom ? '<div class="sm">Obre el formulari per cercar.</div>' : ''; return; }
    if (toks(nom).length === 0) { box.innerHTML = ''; cur = null; actualitzarBoto(); return; }
    const r = buscar(nom);
    if (r.estat === 'OK') {
      cur = r.dir;
      box.innerHTML = `<div class="c sel"><span class="ok">✔ Registrat</span> ${esc(r.dir.nombre)}<br><span class="sm">${esc(r.dir.direccion || '')} · ${esc(r.dir.localidad || '')} · ${(r.dir.contacto && r.dir.contacto.telefono) ? '📞' : ''}${(r.dir.contacto && r.dir.contacto.email) ? ' ✉' : ''}</span></div>`;
    } else if (r.estat === 'DUBTE') {
      if (!(cur && r.cands.some(c => c.d === cur))) cur = null;
      box.innerHTML = `<div class="dub">⚠ Dubte: ${esc(r.motiu)}. Tria'l només si n'estàs segura; si no, avisa la Zule.</div>` +
        r.cands.map((c, i) => `<div class="c ${cur === c.d ? 'sel' : ''}" data-cand="${i}">${esc(c.d.nombre)} <span class="sm">(${esc(c.motiu)})</span><br><span class="sm">${esc(c.d.direccion || '')} · ${esc(c.d.localidad || '')}</span></div>`).join('');
      box._cands = r.cands;
    } else {
      cur = null;
      box.innerHTML = `<div class="ko">✖ ${esc(r.motiu)}. No es grava: avisa la Zule.</div><button data-a="arevisar">Afegir a «Revisar»</button>`;
    }
    actualitzarBoto();
  }
  function actualitzarBoto() {
    const b = panel && panel.querySelector('[data-a="gravar1"]');
    if (b) b.disabled = !(esFormPickup() && cur);
  }

  let tCerca = null;
  function onInput(e) {
    if (e.target.id === 'gp909-nom') { clearTimeout(tCerca); tCerca = setTimeout(pintarCands, 200); }
    if (e.target.name === 'gp909m') sv(LS.mode, e.target.value);
  }
  function onKey(e) {
    if (e.key !== 'Enter') return;
    if (e.target.id === 'gp909-nom') { e.preventDefault(); $('#gp909-ref').focus(); }
    else if (e.target.id === 'gp909-ref') { e.preventDefault(); $('#gp909-obs').focus(); }   // l'escàner envia Enter
    else if (e.target.id === 'gp909-obs') { e.preventDefault(); $('#gp909-pes').focus(); }
  }

  async function onClick(e) {
    const t = e.target.closest('[data-a],[data-t],[data-cand]');
    if (!t) return;
    if (t.dataset.t) { tab = t.dataset.t; pintar(); return; }
    if (t.dataset.cand != null) {
      const box = $('#gp909-cands'); cur = box._cands[+t.dataset.cand].d;
      box.querySelectorAll('.c').forEach(x => x.classList.toggle('sel', x === t)); actualitzarBoto(); return;
    }
    const a = t.dataset.a;
    try {
      if (a === 'toggle') { panel.classList.toggle('min'); sv(LS.open, !panel.classList.contains('min')); pintar(); }
      else if (a === 'nou') { location.hash = FORM_HASH + '&t=' + Date.now(); }
      else if (a === 'netejar') { ['gp909-nom', 'gp909-ref', 'gp909-obs', 'gp909-pes'].forEach(id => $('#' + id).value = ''); cur = null; pintar(); $('#gp909-nom').focus(); }
      else if (a === 'arevisar') {
        afegirRevisar({ nom: $('#gp909-nom').value, ref: $('#gp909-ref').value }, 'No registrat: no es grava');
        estat('Afegit a «Revisar»');
      }
      else if (a === 'gravar1') {
        const item = { nom: $('#gp909-nom').value, ref: $('#gp909-ref').value.trim(), obs: $('#gp909-obs').value.trim(), pes: $('#gp909-pes').value.trim() };
        if (!cur) return;
        if (jaFet(item.ref) && !confirm('Aquesta referència ja s\'ha gravat amb aquest script. La tornes a gravar?')) return;
        t.disabled = true; estat('Gravant ' + cur.nombre + '…');
        const dir = cur;
        await seleccionar(dir); omplir(item); await gravarImprimir();
        afegirFet(item, dir);
        estat('✔ Gravat i enviat a imprimir: ' + dir.nombre);
        ['gp909-nom', 'gp909-ref', 'gp909-obs', 'gp909-pes'].forEach(id => { const x = $('#' + id); if (x) x.value = ''; });
        cur = null;
        await sleep(900);
        location.hash = FORM_HASH + '&t=' + Date.now();
      }
      else if (a === 'carregar') {
        const items = parsejarLot($('#gp909-lot').value);
        if (!items.length) { alertaPanel('No hi ha cap línia vàlida'); return; }
        const q = ld(LS.queue, []).concat(items); sv(LS.queue, q);
        $('#gp909-lot').value = ''; estat(items.length + ' paquets afegits a la cua'); pintar();
      }
      else if (a === 'buidar') { if (confirm('Buidar la cua?')) { sv(LS.queue, []); pendentManual = null; pintar(); } }
      else if (a === 'iniciar') { sv(LS.running, true); pintar(); processarSeguent(); }
      else if (a === 'aturar') { sv(LS.running, false); pendentManual = null; estat('Aturat'); pintar(); }
      else if (a === 'confirmar' && pendentManual) {
        const p = pendentManual; pendentManual = null; pintar(); estat('Gravant ' + p.dir.nombre + '…');
        await gravarImprimir(); afegirFet(p.item, p.dir);
        const q = ld(LS.queue, []); q.shift(); sv(LS.queue, q); pintar(); await sleep(800); seguentForm();
      }
      else if (a === 'saltar' && pendentManual) {
        const p = pendentManual; pendentManual = null;
        afegirRevisar(p.item, 'Saltat manualment');
        const q = ld(LS.queue, []); q.shift(); sv(LS.queue, q); pintar(); seguentForm();
      }
      else if (a === 'copiar') {
        const txt = ld(LS.revisar, []).map(x => `• ${x.nom} — ref ${x.ref || '(sense)'} — ${x.motiu}`).join('\n');
        await navigator.clipboard.writeText('Pickup – paquets per revisar:\n' + txt); estat('Llista copiada ✔');
      }
      else if (a === 'buidarrev') { sv(LS.revisar, []); pintar(); }
      else if (a === 'buidarfets') { if (confirm("Esborrar l'historial de gravats?")) { sv(LS.fets, []); pintar(); } }
    } catch (err) {
      estat('⚠ ' + err.message); actualitzarBoto();
      if (ld(LS.running, false)) { sv(LS.running, false); pintar(); estat('Aturat: ' + err.message); }
    }
  }

  /* ---------- Arrencada ---------- */
  let lastHash = '';
  async function tick() {
    if (!document.body || !window.angular) return;
    crearPanell();
    if (location.hash !== lastHash) {
      lastHash = location.hash;
      cur = null; pendentManual = null;
      pintar();
      if (location.hash.indexOf('/envio/') >= 0 && location.hash.indexOf(CLIENT_ID) >= 0) {
        if (await esperarForm()) { pintar(); if (ld(LS.running, false)) processarSeguent(); }
      }
    }
  }
  setInterval(tick, 700);
})();
