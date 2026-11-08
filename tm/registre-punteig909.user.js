// ==UserScript==
// @name         Registre Punteig 909
// @namespace    recollit-entregat-909
// @version      2.6
// @description  v2.6: mida 4 = pantalla gran (requadre a tota l'alçada de la pantalla, per defecte); franja amb el resultat real d'Atlas (✓ puntejat / ↺ ja llegit / ✗ no llegit); també llegeix el punteig clàssic d'Atlas (ToPickCheckingWeekend). v2.5: correccions de zona del 04/11 (Salòria 64 i 83, Boixadera, Comtat d'Urgell 42, Camí Ral de Cerdanya, Coll del Pendís, Guils, Anserall, Pla de Sant Tirs). v2.4: derivats al PS Recollit i Entregat = punt Blau. v2.3: Grapats (C/ Mont) sempre Blau. v2.2: zones Blau v4 (Jueus, Muralla, Pou, Estret, Hèrcules, Graell, Europa, Portal d'Andorra, Garriga i Massó, Mont, Roda, Partida Sant Ermengol, Poble Sec, Alt Pirineu, Baixos de Calbinyà). v2.1: Av. Valls d'Andorra sencera a Blau (18-20 continua REA). v2.0: correccions verd (Llorenç Tomàs i Costa 52-83, Comtat d'Urgell 57-59, Setúria, Circumval·lació 71-77 i 82). v1.9: tot Castellciutat va a Organyà (excepte el polígon). v1.8: Aravell va a Organyà (no Arcavell/La Farga); carrer E del polígon = Madahe encara que l'adreça vingui tallada. v1.7: el requadre s'ajusta a l'alçada de la pantalla (mida 3 amb text al 125%). v1.6: correccions del 03/11 (Sant Climent, Pg. Parc 49, Dr. Robert, Andorra REA, N-145 km 9 amb 'KM: 9'). v1.5: correccions de zona del 02/11 (Sostres, Codina, Lleteries, Costa Carreu, Tomàs i Costa, Cantacorbs, Pallerols, N-145 km 9, Seur). v1.4: zona proposada als que no són al llistat, zones de l'Escàner FPE, avís ParcelShop, codis internacionals i requadre més gran. Registre de totes les lectures del punteig d'Atlas (agencia 909): consultar errors, corregir zones i exportar. Completa les zones que el Punteig 909 no sap ubicar amb les regles de carrers noves. No modifica res del que fa Atlas.
// @match        https://atlas.gls-spain.es/pick/*
// @match        https://atlas.gls-spain.es/Pick/*
// @grant        none
// @run-at       document-start
// @updateURL    https://pickuppointandorra.com/tm/registre-punteig909.user.js
// @downloadURL  https://pickuppointandorra.com/tm/registre-punteig909.user.js
// ==/UserScript==

(function () {
  'use strict';

  // ---------- configuracio ----------
  const K_LOG = 'p909:log';      // registre de lectures
  const K_FIX = 'p909:fix';      // correccions de zona
  const K_DATA = 'p909:data';    // llistat ShippingsExport del Punteig 909
  const DIES_GUARDATS = 7;
  const MAX_LECTURES = 6000;
  const ZONES = ['VERMELL', 'VERD', 'GROC', 'BLAU', 'POLÍGON', 'CERDANYA', 'ORGANYÀ', 'LA FARGA', 'REA', 'PARCELSHOP', 'MALA CANALITZACIÓ'];
  const TIPUS = {
    ok: { t: 'Correcte', c: '#1b7f3b' },
    nozona: { t: 'Sense zona', c: '#b8860b' },
    dubte: { t: 'Zona dubtosa', c: '#b8860b' },
    nollista: { t: 'No és al llistat', c: '#c0392b' },
    lectura: { t: 'Lectura errònia', c: '#8e44ad' },
    atlas: { t: 'Error Atlas', c: '#c0392b' },
    repetit: { t: 'Repetit', c: '#7f8c8d' }
  };

  // ---------- emmagatzematge ----------
  const get = (k, def) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; } catch (e) { return def; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const avui = () => new Date().toLocaleDateString('sv-SE');
  const hora = () => new Date().toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

  function netejaRegistre() {
    const lim = new Date(Date.now() - DIES_GUARDATS * 864e5).toLocaleDateString('sv-SE');
    let log = get(K_LOG, []).filter(x => x.dia >= lim);
    if (log.length > MAX_LECTURES) log = log.slice(-MAX_LECTURES);
    set(K_LOG, log);
    return log;
  }

  // ---------- llistat i cerca ----------
  let IDX = null, IDX_AT = null;
  function index() {
    const d = get(K_DATA, null);
    if (!d || !d.recs) return {};
    if (IDX && IDX_AT === d.at) return IDX;
    IDX = {}; IDX_AT = d.at;
    d.recs.forEach(r => (r.c || []).forEach(c => { IDX[String(c)] = r; }));
    return IDX;
  }
  function busca(code) {
    const ix = index(), c = String(code).trim();
    const n = c.toUpperCase().replace(/[^0-9A-Z]/g, '');
    const vs = [c, n, n.slice(0, 14), n.slice(0, 10), n.replace(/^0+/, ''), /^\d{12}$/.test(n) ? n.slice(0, 11) : '', /^\d{15,}$/.test(n) ? n.slice(-14) : '', /^\d{13,}$/.test(n) ? n.slice(-12, -1) : '', /^\d{13,}$/.test(n) ? n.slice(-11) : ''];
    for (const v of vs) if (v && ix[v]) return ix[v];
    return null;
  }
  const formatOk = c => /^\d{10,12}$|^\d{14}$|^\d{18,20}$/.test(c);


  // ---------- regles de zones (mateixes que l'Escàner FPE, 29/10/2026) ----------
  // Es fan servir només per als enviaments que el Punteig 909 deixa sense zona o amb dubte.
  const zonaNova = (function () {
const ZONES={VERMELL:{bg:'#d7261e',fg:'#ffffff'},VERD:{bg:'#2e7d32',fg:'#ffffff'},GROC:{bg:'#f1c232',fg:'#1d1a0a'},BLAU:{bg:'#3b78e7',fg:'#ffffff'},
  'ORGANYÀ':{bg:'#7b4bb7',fg:'#ffffff'},CERDANYA:{bg:'#0d8a8a',fg:'#ffffff'},'LA FARGA':{bg:'#a8581a',fg:'#ffffff'},REA:{bg:'#1f2a44',fg:'#ffffff'},'PS RECOLLIT':{bg:'#c2185b',fg:'#ffffff'},'POLÍGON':{bg:'#5b6780',fg:'#ffffff'},'?':{bg:'#8a94a6',fg:'#ffffff'}};
const ZORDER=['VERMELL','VERD','GROC','BLAU','POLÍGON','ORGANYÀ','CERDANYA','LA FARGA','PS RECOLLIT','REA','?'];
const O='o',E='e',A='a',FI=9999;
const STREETS=[
 // VERMELL
 ['VERMELL','AGUSTI'],['VERMELL','ALSINA'],['VERMELL','BAIXADA MOLI'],['VERMELL','BISBE GUITART'],['VERMELL','COPRINCEPS'],['VERMELL','PIFARRE'],
 ['VERMELL','CARME PLACA'],['VERMELL','CARRERONET'],['VERMELL','CATALUNYA'],['VERMELL','ERMENGOL',[[O,1,9],[E,2,26]]],['VERMELL','ESTRET'],
 ['VERMELL','ESTUDIS'],['VERMELL','EUROPA'],['VERMELL','FONT'],['VERMELL','ANDREU CAPELLA'],['VERMELL','HERCULES'],['VERMELL','SALLE'],
 ['VERMELL','BRUDIEU'],['VERMELL','GARRIGA'],['VERMELL','ESTONAC'],['VERMELL','CALASANC'],['VERMELL','ZULUETA',[[O,1,7],[E,2,10]]],
 ['VERMELL','SOSTRES'],['VERMELL','JUEUS'],['VERMELL','SABATER'],['VERMELL','MAJOR',[[O,53,89],[E,72,80]]],['VERMELL','MIGDIA'],
 ['VERMELL','MIQUEL'],['VERMELL','MISSIO'],['VERMELL','MONGES'],['BLAU','MONT'],['BLAU','GRAPATS'],['VERMELL','MURALLA'],
 ['VERMELL','PANISTRERA'],['VERMELL','ORRI',[[O,1,11],[E,2,6]]],['VERMELL','OT'],['VERMELL','PORTAL ANDORRA'],['VERMELL','POU'],
 ['VERMELL','QUARTER'],['VERMELL','QUATRE PRATS'],['VERMELL','VALLS ANDORRA',[[A,1,30]]],['VERMELL','SOLDEVILA'],
 ['VERMELL','GUILLEM GRAELL',[[O,1,11],[E,2,16]]],
 // VERD
 ['VERD','CIRCUMVALLACIO',[[E,84,FI],[O,79,FI]]],['VERD','COMPTAT URGELL',[[E,46,90],[O,61,FI]]],['VERD','SEBASTIA'],['VERD','SANSA'],['VERD','VIOLA'],
 ['VERD','LLETERIES'],['VERD','LLORENC TOMAS',[[E,52,78],[O,55,83]]],['VERD','PARC',[[O,47,93],[E,52,102]]],['VERD','INGLA'],
 ['VERD','CLARIS'],['VERD','PONENT'],['VERD','PRATS CADI'],['VERD','REGENCIA'],['VERD','ROMANI'],['VERD','SALORIA',[[E,58,FI],[O,63,FI]]],
 ['VERD','SEGLA'],['VERD','TRES PONTS'],['VERD','VALIRA'],['VERD','VERNS'],['VERD','VERDAGUER'],
 // GROC
 ['GROC','VIVES'],['GROC','NAVARRI'],['GROC','CADINELL'],['GROC','CODINA'],['GROC','BARIDANA'],['GROC','ORDIGUER'],['GROC','CRISTALL'],
 ['GROC','TRISTAINA'],['GROC','CIRCUMVALLACIO',[[E,2,82],[O,1,77]]],['GROC','COMPTAT URGELL',[[O,1,59],[E,2,38]]],['GROC','ERMENGOL',[[O,11,FI],[E,28,FI]]],
 ['GROC','PORTELLA'],['GROC','MORAGUES'],['GROC','GREGAL'],['GROC','PLANDOLIT'],['GROC','HORTA VALIRA'],['GROC','INSTITUT'],['GROC','DESPI'],
 ['GROC','ZULUETA',[[O,9,FI],[E,12,FI]]],['GROC','LLORENC TOMAS',[[O,1,49],[E,2,48]]],['GROC','MAGDALENA'],['GROC','JANER'],['GROC','MORERES'],
 ['GROC','PERE PUJOL'],['GROC','ORRI',[[O,13,FI],[E,8,FI]]],['GROC','PALANCA'],['GROC','PARC BOIXADERA'],['GROC','PARC',[[O,1,43],[E,2,50]]],
 ['GROC','FITER'],['GROC','POLLANCRES'],['GROC','URGELLET'],['GROC','RONDA'],['GROC','SALORIA',[[O,1,61],[E,2,56]]],['GROC','SETURIA'],
 // BLAU
 ['BLAU','AIGUES'],['BLAU','ARENYS'],['BLAU','AUSIAS'],['BLAU','BELLAVISTA'],['BLAU','BENLLOCH'],['BLAU','RAL CERDANYA'],['BLAU','CANONGES'],
 ['BLAU','CAPDEVILA'],['BLAU','CARME'],['BLAU','CLOS'],['BLAU','CREU'],['BLAU','PEIRO'],['BLAU','DOMENEC'],['BLAU','EMIGDI'],['BLAU','ERES'],
 ['BLAU','ESCORXADOR'],['BLAU','LORCA'],['BLAU','FIRAL'],['BLAU','GUILLEM GRAELL',[[O,13,FI],[E,18,FI]]],['BLAU','FUSTER'],['BLAU','MARTORELL'],
 ['BLAU','JOSEP PLA'],['BLAU','JUST'],['BLAU','COMPANYS'],['BLAU','MAJOR',[[O,1,51],[E,2,70],[O,91,FI],[E,82,FI]]],['BLAU','CAPMANY'],['BLAU','MARIA'],['BLAU','RODOREDA'],
 ['BLAU','MONTURULL'],['BLAU','NICOLAU'],['BLAU','OMS'],['BLAU','OR'],['BLAU','PALMA'],['BLAU','PATALIN'],['BLAU','PATI PALAU'],['BLAU','PERAFITA'],
 ['BLAU','PERDIU'],['BLAU','FORQUES'],['BLAU','LLAMBART'],['BLAU','FRARES'],['BLAU','RODA'],['BLAU','ROURES'],['BLAU','SERRADORA'],['BLAU','SORT'],
 ['BLAU','VALLS ANDORRA',[[A,31,FI]]],['BLAU','VESCOMPTAT'],['BLAU','STASH'],['VERD','STILGRUP'],['GROC','BISBE IGLESIAS'],['REA','TORRE PEU'],['ORGANYÀ','TORRE SOLSONA'],['CERDANYA','AL PIRINEU'],['BLAU','DEGANAT'],['ORGANYÀ','TERRATS'],['ORGANYÀ','SERRA'],['REA','PARATGE TORRES'],['BLAU','COSTA CARREUS'],['REA','TERRA VELLA'],['VERMELL','JOAN BAPTISTA'],['ORGANYÀ','CAMPMAJOR'],['CERDANYA','ALT PIRINEU']
];
const ORGANYA=['ADRALL','ALINYA','ARAVELL','ARFA','BALCO DEL PIRINEU','BELLESTAR','CABO','CANELLES','CASTELLAR DE TOST','CASTELLCIUTAT','COLL DE NARGO','EL PLA DE SANT TIRS','ELS CASTELLS',"FIGOLS D'ORGANYA",'HOSTALETS DE TOST','MASIES DE NARGO','MONTFERRER','NOVES DE SEGRE','ORGANYA','PERLES','PUJAL DE CABO','CASTELLBO','PARROQUIA HORTO','RIBERA URGELLET','EL PLA','FIGOLS'];
const FARGA=['ARGOLELL','LA FARGA DE MOLES','FARGA MOLES','ANSERALL','ARCAVELL','CALBINYA','BESCARAN','CIVIS','OS DE CIVIS','VALLS DE VALIRA','SANT JOAN FUMAT','ARS','ASNURRI'];
const CERDANYA=['ALAS','ALL','AMBRET','ANSOVELL','ARDAIX','ARDOVOL','ARISTOT','ARSEGUEL','BANYS DE SANT VICENC','BAR','BARRI SANT ANTONI','BARRI SANT PERE','BEIXEC','BELLVER','BOR','CAVA','COBORRIU DE BELLVER','CORTAS','COSTA CARREUS','ELS ARENYS','ESTANA','MARTINET','MONTELLA','NAS','NEFOL','OLIA','OLOPTE','PARATGE DE SANT PERE','PEDRA','PI','POBLE SEC','PONT DE BAR','PRATS I SANSOR','QUER FORADAT','RIU DE CERDANYA','RIU DE SANTA MARIA','SANAVASTRE','SANTA EUGENIA','STA MAGDALENA DE BELLVER','TALLO','TOLORIU',"TORRES D'ALAS",'VILELLA','VILIELLA','VILLEC','ESTAMARIU','PRULLANS','BALTARGA','LLES','PRATS','BEDERS','LES TORRES','BASTANIST'];
const STOP=new Set('C CL CA CALLE CARRER CR CRA AV AVD AVDA AVGDA AVINGUDA AVENIDA PG PSG PASSEIG PASEO PSO CTRA CARRETERA PTGE PASSATGE PASAJE PJE DE DEL DELS LA LES LOS LAS ELS EL L D LO I Y SANT SANTA SAN ST STA S N NUM NO NR BAIXOS BAJOS BJ BX PIS PISO PTA PORTA PUERTA ESC ESCALA BLOC BLOQUE LOCAL CAMI CAMINO'.split(' '));
const SYN={COMTAT:'COMPTAT',VESCOMTAT:'VESCOMPTAT',GUILLEN:'GUILLEM',SOLARIA:'SALORIA',AIGES:'AIGUES',PORTALS:'PORTAL',CARMEN:'CARME',BARRIO:'BARRI',ANTONIO:'ANTONI',SEBASTIAN:'SEBASTIA',LERIDA:'LLEIDA',MAYOR:'MAJOR',CATALUNA:'CATALUNYA',CIRCUNVALLACIO:'CIRCUMVALLACIO',CIRCUNVALACIO:'CIRCUMVALLACIO',CIRCUMVALACIO:'CIRCUMVALLACIO',CIRCUNVALACION:'CIRCUMVALLACIO',CIRCUNVALLACION:'CIRCUMVALLACIO',
  DOMENECH:'DOMENEC',ORGANA:'ORGANYA',PL:'PLACA',PZA:'PLACA',PLAZA:'PLACA',PCA:'PLACA',PLAÇA:'PLACA',SEO:'SEU',URGEL:'URGELL',LLORENS:'LLORENC',LORENZO:'LLORENC',
  POL:'POLIGON',PGNO:'POLIGON',PARCELA:'PARCELLA',ZELOETA:'ZULUETA',ZULOETA:'ZULUETA',CALASSANC:'CALASANC',CALASANZ:'CALASANC',PARQUE:'PARC',PARK:'PARC',REGERENCIA:'REGENCIA',LALT:'ALT',BRUIDEU:'BRUDIEU',CONTACT:'COMPTAT',MONTORULL:'MONTURULL',LLESTERIAS:'LLETERIES',LLESTERIES:'LLETERIES',LLETERIAS:'LLETERIES',CORREUS:'CARREUS',DELEGACIO:'DELEGACION',LORRI:'ORRI',RECOGEN:'RECOGE',POLIGONO:'POLIGON',INDUSTRIAL:'POLIGON',PI:'PI'};
function ztoks(s){
  s=String(s??'').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/Ç/g,'C').replace(/Ñ/g,'N').replace(/L[·.]L/g,'LL').replace(/[^A-Z0-9]+/g,' ').replace(/([A-Z]{3,})(\d)/g,'$1 $2').trim();
  if(!s)return [];const out=[];
  for(let t of s.split(' ')){const mn=t.match(/^(?:N|NO|NUM|NUMERO)(\d{1,4})$/);if(mn){out.push(mn[1]);continue}t=SYN[t]||t;out.push(t);if(/^[DL][AEIOU]/.test(t)&&t.length>=6){const u=t.slice(1);out.push(SYN[u]||u)}}
  return out;
}
const keyT=k=>ztoks(k).filter(t=>!STOP.has(t));
const SRULES=STREETS.map(([z,k,s])=>({z,t:keyT(k),s}));
const PRULES=[...ORGANYA.map(p=>({z:'ORGANYÀ',t:keyT(p)})),...CERDANYA.map(p=>({z:'CERDANYA',t:keyT(p)})),...FARGA.map(p=>({z:'LA FARGA',t:keyT(p)})),...['ARGESTUES','VANSA','OSSERA','ARDUIX','TUIXENT','BISCARBO','FORNOLS','SORRIBES','CORNELLANA','JOSA'].map(p=>({z:'REA',t:keyT(p),pt:'Poble REA'}))];
// token match tolerant to one lost letter (accents lost in exports) and long-word variants
function tokIn(set,rt){if(set.has(rt))return true;
  for(const a of set){if(rt.length>=4&&a.length===rt.length-1){for(let i=0;i<rt.length;i++)if(rt.slice(0,i)+rt.slice(i+1)===a)return true}
    if(rt.length>=5&&a.length===rt.length+1){for(let i=0;i<a.length;i++)if(a.slice(0,i)+a.slice(i+1)===rt)return true}
    if(rt.length>=7&&a.length>=7&&Math.abs(a.length-rt.length)<=2&&a.slice(0,7)===rt.slice(0,7))return true}
  return false}
function streetZone(addr){
  const at=ztoks(addr),set=new Set(at.filter(t=>!STOP.has(t)));
  const RAW=String(addr??'').toUpperCase();
  if(set.has('POLIGON')||set.has('PI')&&at.includes('POLIGON'))return {z:'POLÍGON'};
  if(/\bP\.\s?I\b|TRALDISPORTA|\bPARCEL(A|·LA|LA)\b/.test(RAW)||set.has('PARCELLA')||set.has('SECTOR')&&(set.has('ZONA')||set.has('ZI')))return {z:'POLÍGON'};
  // accents lost in the export can split a word in two (SAL RIA, SAL?RIA): also try each pair joined
  const JN=[];for(let i=0;i+1<at.length;i++){if(/^[A-Z]{2,}$/.test(at[i])&&/^[A-Z]{2,}$/.test(at[i+1])&&!STOP.has(at[i])&&!STOP.has(at[i+1]))JN.push(at[i]+at[i+1])}
  const near=(a,rt)=>a===rt||(rt.length>=5&&a.length===rt.length-1&&[...rt].some((_,i)=>rt.slice(0,i)+rt.slice(i+1)===a));
  const tm=rt=>tokIn(set,rt)||JN.some(a=>near(a,rt));
  let best=[],bs=0;
  const pos=r=>{let m=99;for(const t of r.t){let k=at.indexOf(t);if(k<0)for(let j=0;j<at.length;j++){if(tokIn(new Set([at[j]]),t)||(j+1<at.length&&near(at[j]+at[j+1],t))){k=j;break}}if(k>=0&&k<m)m=k}return m};
  for(const r of SRULES){if(r.t.length&&r.t.every(tm)){const sc=r.t.join('').length+r.t.length*10;if(sc>bs){bs=sc;best=[r]}else if(sc===bs)best.push(r)}}
  // two different streets with the same score: the one written first is the address
  if(best.length>1&&new Set(best.map(r=>r.t.join(' '))).size>1){const mp=Math.min(...best.map(pos));best=best.filter(r=>pos(r)===mp)}
  if(!best.length)return null;
  // number: first 1-4 digit token after the street words
  const last=Math.max(0,pos(best[0]),...best[0].t.map(t=>at.indexOf(t)));let n=null;
  for(let i=last+1;i<at.length;i++){if(/^\d{1,4}$/.test(at[i])){n=+at[i];break}}
  if(n==null){const m=at.find(t=>/^\d{1,4}$/.test(t));if(m)n=+m}
  const hit=new Set(),all=new Set();
  for(const r of best){all.add(r.z);if(!r.s){hit.add(r.z);continue}
    if(n!=null&&r.s.some(([p,a,b])=>n>=a&&n<=b&&(p===A||(p===O)===(n%2===1))))hit.add(r.z)}
  const zs=[...(hit.size?hit:all)];
  const WEAK=['RAL CERDANYA','VALLS ANDORRA','PORTAL ANDORRA','CARME PLACA','QUATRE PRATS','TRES PONTS','PRATS CADI','AL PIRINEU','TORRE PEU','TORRE SOLSONA'];
  const strong=best.every(r=>r.t.length>=2&&r.t.join('').length>=10&&!WEAK.includes(r.t.join(' ')));
  return {z:zs.length===1?zs[0]:'?',alt:zs.length>1?zs.join(' / '):null,n,strong};
}
function baseZone(addr,loc,cp){
  const lt=new Set(ztoks(loc).filter(t=>!STOP.has(t)));const at=new Set(ztoks(addr).filter(t=>!STOP.has(t)));
  const cps=String(cp??'').replace(/\D/g,'');
  if(lt.has('VIELHA')||lt.has('ARAN')||lt.has('MIJARAN'))return {z:'?',alt:"D'una altra agència"};
  // barris de La Seu que van amb la ruta Cerdanya
  if(at.has('BARRI')||at.has('PARATGE')){if(at.has('ANTONI')||at.has('PERE'))return {z:'CERDANYA'}}
  const explicitSeu=lt.has('SEU')||(lt.has('URGELL')&&lt.size<=2&&!lt.has('BELLVER'));
  let pob=null;if(!explicitSeu){let bs=0;for(const r of PRULES){if(r.t.every(t=>tokIn(lt,t))){const sc=r.t.join('').length+(r.t.every(t=>lt.has(t))?100:0);if(sc>bs){bs=sc;pob=r}}}}
  const isSeu=explicitSeu||(!pob&&cps==='25700');
  if(!isSeu&&(!cps||cps==='25700')){const sz0=streetZone(addr);if(sz0&&sz0.strong&&sz0.z!=='?'&&['VERMELL','VERD','GROC','BLAU'].includes(sz0.z))return {z:sz0.z,n:sz0.n,alt:null}}
  if(!isSeu){
    let best=null,bs=0;for(const r of PRULES){if(r.t.every(t=>tokIn(lt,t))){const sc=r.t.join('').length+(r.t.every(t=>lt.has(t))?100:0);if(sc>bs){bs=sc;best=r}}}
    if(best){if(best.z==='ORGANYÀ'&&(lt.has('MONTFERRER')||lt.has('CASTELLCIUTAT'))&&at.has('POLIGON'))return {z:'POLÍGON'};return {z:best.z}}
    if(!lt.size&&!cps)return streetZone(addr)||{z:'?'};
    {let pb=null,ps=0;for(const r of PRULES){const j=r.t.join('');if(j.length>=4&&r.t.every(t=>tokIn(at,t))&&j.length>ps){ps=j.length;pb=r}}if(pb)return {z:pb.z}}
    if(cps==='25720'||cps==='25726')return {z:'CERDANYA'};
    return {z:'?',alt:'Població fora de llista'};
  }
  const RAW=String(addr??'').toUpperCase();
  if(/\b(CTRA|CRTA|CARRETERA|CR|CTR)\b\.?\s*(DE\s+)?(LLEIDA|LERIDA)\b/.test(RAW))return {z:'ORGANYÀ'};
  if(/\bC\s*-?\s*14\b/.test(RAW))return {z:'ORGANYÀ'};
  if(/\bN\s*-?\s*260\b/.test(RAW)&&/\b(CENTRE|CTRE|CTRO|CENTRO|C)\s*\.?\s*IND/.test(RAW))return {z:'ORGANYÀ'};
  if(/\bN\s*-?\s*260\b|NACIONAL\s*260/.test(RAW))return {z:'CERDANYA'};
  const sz=streetZone(addr);
  if(sz&&sz.z==='?'&&sz.n==null&&at.has('VALLS')&&at.has('ANDORRA'))return {z:'REA',pt:'Valls d\'Andorra'};
  if(sz&&sz.z==='VERMELL'&&at.has('ANDORRA')&&sz.n>=18&&sz.n<=20)return {z:'REA',pt:'Valls d\'Andorra 18-20'};
  if(sz)return sz;
  // a village or barri written inside the address
  let pb=null,ps=0;for(const r of PRULES){const j=r.t.join('');if(j.length>=6&&r.t.every(t=>at.has(t))&&j.length>ps){ps=j.length;pb=r}}
  if(pb)return {z:pb.z};
  if(['RECOGE','RECOGIDA','RETIRAMOS','RETIRA','SUCURSAL','TRANSPORTISTA','AGENCIA','DELEGACION'].some(w=>at.has(w)))return {z:'REA',pt:'Recull a l\'agència'};
  if(![...at].some(t=>!['SEU','URGELL','DURGELL','LLEIDA'].includes(t)&&!/^\d+$/.test(t)))return {z:'REA',pt:'Sense adreça'};
  return {z:'?',alt:'Carrer no trobat a la llista'};
}

// correccions de zona de Borja (02/11/2026): passen per davant de les regles de carrers, no dels punts de concentracio
const CORR909R=[["VALLS D.?ANDORRA", "SEU|URGELL", "BLAU", ""], ["LLOREN[CS][^0-9]{0,25}\\b(5[2-9]|[67]\\d|8[0-3])\\b", "", "VERD", ""], ["COMTAT D.?URGELL[^0-9]{0,15}\\b(57|59)\\b", "", "VERD", ""], ["SETURIA[^0-9]{0,15}\\b(62|64|95|97)\\b", "", "VERD", ""], ["CIRCU[MN]+\\W?VAL[^0-9]{0,15}\\b(71|73|75|77|82)\\b", "", "VERD", ""], ["PLA DE CODINA", "", "CERDANYA", ""], ["CODINA", "", "GROC", "POLIGON|\\bPOL\\b|INDUSTRI"], ["LL?E?S?TERI", "", "VERD", "\\b(NAU|NAVE|NAV)\\s*6\\b"], ["PLA DE LES FORQUES", "", "BLAU", ""], ["COSTA CARREU", "", "BLAU", ""], ["PATI PALAU", "", "BLAU", ""], ["SOSTRES", "", "GROC", ""], ["AURELI.? CAPMANY|AURELIA CAMPNAY", "", "BLAU", ""], ["TOMAS I COSTA|LLORENS I COSTA|LLORENC I COSTA", "", "GROC", ""], ["CANTACORB", "", "REA", ""], ["", "PALLEROLS", "REA", ""], ["145.*KM\\W*9\\b", "", "LA FARGA", ""], ["", "145.*KM\\W*9\\b", "LA FARGA", ""], ["CALLE B NAVE 18|C B NAU 18|SEUR", "", "POLÍGON", ""], ["SANT CLIMENT", "", "ORGANYÀ", ""], ["PARC\\W+49", "", "VERD", ""], ["\\b(DR|DOCTOR)\\.? ROBERT", "", "ORGANYÀ", ""], ["", "ANDORRA LA VELLA|ESCALDES|ENCAMP|ORDINO|CANILLO|LA MASSANA|SANT JULIA DE LORIA", "REA", ""], ["CASTELLCIUTAT|CASERNA|REC DELS NOGUERS|COSTA (DE LA )?CIUTADELLA|SANT ISIDRE|TERRATS|\\bBOLA\\b|MERCADAL|\\bHORTAL\\b|PORQUES|MARC COMES|CINTO VERDAGUER|MOSSEN JACINT VERDAGUER DE CASTELL|VINYETA|\\bARBRE\\b|SANT SEBASTIA|TORRE SOLSONA", "", "ORGANYÀ", "POLIGON|\\bPOL\\b|INDUSTRI|GERMANDAT|JACINT"], ["", "CASTELLCIUTAT", "ORGANYÀ", "POLIGON|\\bPOL\\b|INDUSTRI|GERMANDAT|JACINT"], ["JUEUS|MURALLA|\\bPOU\\b|\\bESTRET\\b|HERCULES|GRAELL|EUROPA|PORTAL D.?.?ANDORRA|GARRIGA|\\bMONT\\b|\\bRODA\\b", "SEU|URGELL|^$", "BLAU", ""], ["(PARTIDA|PDA|PD)\\.? (DE )?SANT ERMENGOL", "", "BLAU", ""], ["POBLE ?SEC|ALT PIRINEU|BAIXOS.{0,6}CAL[BV]IN", "", "BLAU", ""], ["", "POBLE ?SEC|BAIXOS.{0,6}CAL[BV]IN", "BLAU", ""], ["SALORIA\\W*83(?!\\d)", "", "VERD", ""], ["SALORIA[^0-9]{0,6}\\b64\\b", "", "VERD", ""], ["CONDADO DE URGEL+[^0-9]{0,15}\\b(57|59)\\b", "", "VERD", ""], ["COMPTAT D.?URGELL[^0-9]{0,15}\\b42\\b", "", "GROC", ""], ["BOIXADERA", "SEU|URGELL", "GROC", ""], ["\\bDE JESUS\\b", "SEU|URGELL", "BLAU", ""], ["OFICINA GLS", "", "REA", ""], ["ARAVELL\\W*\\/?\\W*BELLESTAR", "", "ORGANYÀ", ""], ["", "GUILS DEL CANTO", "REA", ""], ["", "PLA DE SANT TIRS", "ORGANYÀ", ""], ["", "^ANSERA", "LA FARGA", ""], ["(CAMINO REAL|CAMI RAL)\\W+(DE\\W+)?CERDANYA", "SEU|URGELL", "BLAU", ""], ["COLL DEL PENDIS", "", "CERDANYA", ""]];const CORR909N=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ');function CORR909(ad,loc){const A=CORR909N(ad),L=CORR909N(loc);for(const [a,l,z,x] of CORR909R){if(!a&&!l)continue;if(a&&!new RegExp(a).test(A))continue;if(l&&!new RegExp(l).test(L))continue;if(x&&new RegExp(x).test(A))continue;return z}return null}
// concentration points and pickup-at-agency, then the street/village zone
function zoneOf(addr,loc,cp,ps){
  const at=new Set(ztoks(addr).filter(t=>!STOP.has(t)));const raw=String(addr??'').toUpperCase();const P=String(ps??'').toUpperCase().trim();
  const num=()=>{const a=ztoks(addr);for(const w of a)if(/^\d{1,4}$/.test(w))return +w;return null};
  const has=w=>at.has(w),n=num();
  if(/AGENCIA COLABORADORA/.test(P)||(has('LLETERIES')&&(has('NAU')||has('NAVE'))&&(/\b(NAU|NAVE)\s*6\b/.test(raw))))return {z:'REA',pt:'Lleteries nau 6'};
  if(/RECOLLIT/.test(P))return {z:'BLAU',pt:'PS Recollit i Entregat'};
  if(/B42877704|MADAHE|RAPIDAND/.test(raw)||(/^\s*(CALLE|CARRER|CL|C)\s*[\/.]?\s*E\b/.test(raw)&&/CASTELLCIUTAT|SEU|URGELL|MONTFERRER|^\s*$/.test(String(loc??'').toUpperCase()))||/MADAHE/.test(P)||(has('E')&&(has('POLIGON')||has('ZI')||has('SECTOR')||has('NAVE'))))return {z:'POLÍGON',pt:'Madahe / Rapidand'};
  const base=baseZone(addr,loc,cp);
  let pt='';
  if(has('GRAPATS')||((has('ESTACIO')||has('ESTACION'))&&[...at].some(w=>/^AUTOBUS/.test(w))))pt='Grapats';
  else if(/GO ?PACK/.test(P)||/GO ?PACK/.test(raw)||(has('CANONGES')&&n===52))pt='Go Pack Express';
  else if(has('STASH')||(base.z==='BLAU'&&has('MAJOR')&&n===6))pt='Stash';
  else if(has('CAPICUA')||(has('CAP')&&has('CUA'))||(has('MAJOR')&&n===53&&base.z==='VERMELL'))pt='Cap i Cua';
  else if((has('PEPE')&&has('DALDA'))||(has('REGENCIA')&&n===17))pt='Pepe y Dalda';
  else if(has('SALORIA')&&n===83)pt='Maido';
  else if(has('CARLIN')||(has('SALORIA')&&n===30))pt='Carlin';
  else if(has('CELINA')||/CELINA/.test(P)||(has('SALORIA')&&n===34))pt='Celina';
  else if(has('MONT')&&(base.z==='BLAU'||base.z==='VERMELL')&&!has('ANDORRA'))pt='Grapats';
  else if(P&&!/LOCKER/.test(P))pt=P.replace(/^PS\s+/,'');
  else if(/LOCKER/.test(P))pt='Locker agència';
  if(/LUI/.test(P)&&/LEI/.test(P))pt='Lui & Lei';
  if(/PETRONOR/.test(P))pt='Petronor Organyà';
  if(/TIA MAR/.test(P)||(has('CANONGES')&&n===41))pt='Tia María';
  // a delivery point fixes the zone, whatever the recipient's own address says
  const PZ={'Grapats':'BLAU','Go Pack Express':'BLAU','Stash':'BLAU','Pepe y Dalda':'VERD','Maido':'VERD','Carlin':'GROC','Celina':'GROC','Lui & Lei':'VERMELL','Locker agència':'REA','Petronor Organyà':'ORGANYÀ','Cap i Cua':'VERMELL','Tia María':'BLAU'};
  if(PZ[pt])return {z:PZ[pt],pt};
  const kz=CORR909(addr,loc);
  if(kz&&!base.pt)return {z:kz,pt};
  return {...base,pt:base.pt||pt};
}

zoneOf.COL = ZONES;
return zoneOf;
  })();

  // ===================== v1.3 / v1.4 =====================
  // Dades extra de l'Excel que carrega el Punteig 909: ParcelShop, CP i codis internacionals (REFN / Referencia)
  const K_EXT = 'r909:ext', K_MIDA = 'r909:mida';
  let EXT = null;
  const ext = () => EXT || (EXT = (get(K_EXT, null) || {}).m || {});
  const extDe = r => r ? ext()[String((r.c || [])[0] || '')] : null;
  const psNom = v => { const P = String(v == null ? '' : v).trim(); return P && !/LOCKER|AGENCIA COLABORADORA/i.test(P) ? P.replace(/^PS\s+/i, '') : ''; };
  function llegeixExcel(files) {
    if (!window.XLSX || !files || !files.length) return;
    const m = {}; let pend = files.length;
    [...files].forEach(f => {
      const fr = new FileReader();
      fr.onload = () => {
        try {
          const wb = XLSX.read(new Uint8Array(fr.result), { type: 'array' });
          const a = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true, defval: '' });
          const hi = a.findIndex(r => r.filter(c => String(c).trim()).length >= 3);
          const H = a[hi].map(h => norm(h).replace(/ /g, ''));
          const ix = k => H.indexOf(k);
          const iE = ix('expedicion'), iPS = ix('nombrepsdestino'), iCP = ix('cpdestinatario'), iRN = ix('refn'), iRF = ix('referencia');
          a.slice(hi + 1).forEach(r => {
            const e = String(r[iE] == null ? '' : r[iE]).trim(); if (!e) return;
            const refs = [iRN, iRF].map(i => i >= 0 ? String(r[i] == null ? '' : r[i]).replace(/\D/g, '') : '').filter(v => /^\d{9,12}$/.test(v) && v !== e);
            m[e] = [psNom(iPS >= 0 ? r[iPS] : ''), iCP >= 0 ? String(r[iCP] == null ? '' : r[iCP]).trim() : '', [...new Set(refs)]];
          });
        } catch (err) { }
        if (--pend === 0) {
          set(K_EXT, { at: Date.now(), m }); EXT = null;
          // quan el Punteig 909 ja ha desat el llistat, hi apliquem les zones noves i els codis extra
          setTimeout(() => { const d = get(K_DATA, null); const n = aplicaCorreccions(); if (n > 0 && d) recarregaUnCop(String(d.at) + '+ext'); }, 3000);
        }
      };
      fr.readAsArrayBuffer(f);
    });
  }
  document.addEventListener('change', ev => { const t = ev.target; if (t && t.id === 'p909f' && t.files && t.files.length) llegeixExcel(t.files); }, true);

  // ---------- requadre del Punteig 909: mida, avís ParcelShop i enviaments que no troba ----------
  // mida 2 i 3: més alt però prou estret perquè es vegi el color del requadre de punteig d'Atlas a l'esquerra
  const CSS2 = `#p909{max-height:calc(100vh - 24px);overflow:auto}#p909.r909m2{width:min(520px,40vw)}#p909.r909m2 #p909r{zoom:1.5}
#p909.r909m4{position:fixed!important;top:64px!important;right:8px!important;bottom:8px!important;left:auto!important;width:min(1150px,64vw)!important;max-height:none!important;display:flex!important;flex-direction:column}#p909.r909m4 .bd{flex:1;display:flex;flex-direction:column;overflow:hidden}#p909.r909m4 #p909r{flex:1}
  #p909 .r909at{font:800 30px system-ui,Arial;text-align:center;padding:10px 8px;color:#fff!important;border-radius:6px;margin:0 0 6px}#p909 .r909at.ok{background:#0f8a4b!important}#p909 .r909at.dup{background:#ef6c00!important}#p909 .r909at.ko{background:#c8261d!important}
  #p909.r909m3{width:min(760px,50vw)}#p909.r909m3 #p909r{zoom:2.3}
  .r909ps{background:#c2185b;color:#fff;font:800 22px system-ui,Arial;padding:8px 12px;text-transform:uppercase;letter-spacing:.02em}
  .r909zn{padding:10px;text-align:center}.r909zn b{display:block;font-size:44px;line-height:1;text-transform:uppercase}
  .r909zn i{display:block;font-style:normal;font-weight:700;font-size:20px;text-transform:uppercase;margin-top:2px}
  .r909ok{padding:6px 12px;font:600 12px system-ui,Arial;color:#555;background:#f3f5f9}
  .r909nl{background:#b8860b;color:#fff;font:800 18px system-ui,Arial;padding:6px 12px;text-transform:uppercase;text-align:center}`;
  const SAY = { REA: 'REA', 'PS RECOLLIT': 'Parcel shop', VERMELL: 'Red', VERD: 'Verd', GROC: 'Groc', BLAU: 'Blau', 'ORGANYÀ': 'Organyà', CERDANYA: 'Cerdanya', 'LA FARGA': 'La Farga', 'POLÍGON': 'Polígon' };
  function parla(t, ms) { setTimeout(() => { try { const u = new SpeechSynthesisUtterance(t); u.lang = 'es-ES'; u.rate = 1.2; u.pitch = 1.2; speechSynthesis.speak(u); } catch (e) { } }, ms || 0); }
  let AC = null;
  function beepPS() { try { AC = AC || new AudioContext(); const g = AC.createGain(); g.gain.value = .2; g.connect(AC.destination);
    [[880, 0], [660, .15], [880, .3], [660, .45]].forEach(([fq, t0]) => { const o = AC.createOscillator(); o.type = 'square'; o.connect(g); o.frequency.value = fq; o.start(AC.currentTime + t0); o.stop(AC.currentTime + t0 + .12); }); } catch (e) { } }
  let darrerCodi = '', darrerT = 0, avisat = '', propi = false;
  const nouCodi = c => { c = String(c || '').trim(); if (c && (c !== darrerCodi || Date.now() - darrerT > 3000)) { darrerCodi = c; darrerT = Date.now(); } };
  document.addEventListener('keydown', e => { const t = e.target; if (e.key === 'Enter' && t && t.tagName === 'INPUT' && t.type !== 'file' && !(t.closest && t.closest('#r909'))) nouCodi(t.value); }, true);
  // dades que torna Atlas en llegir un codi, per localitzar o proposar zona als que no són al llistat
  let infoAtlas = { codi: '', o: null };
  // camps que llegeix el punteig d'Atlas: Data.Item2.{codexp, cp, info01, info02, fecha, servicio, referencia}
  function treuInfo(d) {
    const i = (d && (d.Item2 || d.Details)) || {}, t = v => v == null ? '' : String(v).trim();
    const exp = t(i.codexp || i.codExp), info = [t(i.info01), t(i.info02)].filter(Boolean).join(' ');
    return { exp: /^\d{8,}$/.test(exp) ? exp : '', cp: t(i.cp || i.pc), ad: info, l: '', fecha: t(i.fecha), ref: t(i.referencia) };
  }
  function retoca() {
    const el = document.getElementById('p909r');
    if (!el || !darrerCodi || Date.now() - darrerT > 20000 || el.querySelector('[data-r909]')) return;
    const ia = infoAtlas.codi === darrerCodi ? infoAtlas.o : null;
    const r = busca(darrerCodi) || (ia && ia.exp ? busca(ia.exp) : null) || (ia && /^\d{9,12}$/.test(ia.ref || '') ? busca(ia.ref) : null), x = extDe(r) || [], clau = darrerCodi + '|' + darrerT, primer = avisat !== clau;
    const noLlistat = /no (és|es) al llistat|no trobat|no est[àa] al llistat/i.test(el.innerText || '');
    propi = true;
    try {
      // el Punteig 909 diu que no és al llistat però el trobem (etiquetes internacionals, codis amb dígit de control...)
      if (r && noLlistat) {
        avisat = clau;
        const col = (zonaNova.COL || {})[r.z] || { bg: '#5b6780', fg: '#fff' };
        const a = avui(), k = !r.d ? 'Sense FPE' : r.d === a ? 'Repartir avui' : r.d < a ? 'Endarrerit' : 'Deixar a la gàbia';
        el.innerHTML = `<div data-r909="1" class="r909zn" style="background:${col.bg};color:${col.fg}"><b>${esc(r.z || '?')}</b>${r.pt ? `<i>${esc(r.pt)}</i>` : ''}</div>` +
          `<div class="pr">${k}</div><div class="sb">FPE ${esc(r.d || '—')} · ${esc(r.l || '')} · ${esc(r.ad || '')}</div><div class="r909ok">Localitzat pel Registre · codi ${esc(darrerCodi)} · exp. ${esc(r.c[0])}</div>`;
        if (primer) parla(SAY[r.z] || 'Sense zona', 700);
      }
      // no és al llistat: proposem zona amb l'adreça i el CP que dona Atlas
      else if (!r && noLlistat && ia && (ia.ad || ia.cp)) {
        avisat = clau;
        const o = ia, z = (!o.ad && o.cp === '25700') ? { z: '?', alt: 'La Seu · sense adreça' } : (zonaNova(o.ad || '', o.l || '', o.cp || '', '') || { z: '?' });
        const zz = z.z && z.z !== '?' ? z.z : '', col = (zonaNova.COL || {})[zz] || { bg: '#8a94a6', fg: '#fff' };
        el.innerHTML = `<div data-r909="1" class="r909nl">No és al llistat · zona proposada</div>` +
          `<div class="r909zn" style="background:${col.bg};color:${col.fg}"><b>${esc(zz || '?')}</b><i>${esc(z.pt || (zz ? 'Proposta per adreça' : (z.alt || 'Sense zona clara')))}</i></div>` +
          `<div class="sb">${esc(['CP ' + (o.cp || '—'), o.ad, o.exp ? 'exp. ' + o.exp : ''].filter(Boolean).join(' · '))}</div><div class="r909ok">Codi ${esc(darrerCodi)} · revisar FPE a Atlas</div>`;
        if (primer) parla('No és al llistat. Proposat ' + (SAY[zz] || 'sense zona'), 900);
      }
      if (r && x[0]) {
        avisat = clau;
        const d = document.createElement('div'); d.className = 'r909ps'; d.setAttribute('data-r909', '1');
        d.textContent = '📦 Derivat a ParcelShop · ' + x[0]; el.prepend(d);
        if (primer) { beepPS(); parla('Parcel shop', 1700); }
      }
    } finally { setTimeout(() => { propi = false; }, 0); }
  }
  // v1.7: el requadre mai surt de la pantalla (pantalles petites o text al 125%): redueix el zoom fins que hi cap
  const ZBASE = { 1: 1, 2: 1.5, 3: 2.3, 4: 3.4 };
  let encT = null, encBusy = false;
  function encaixa() {
    const p = document.getElementById('p909'), r = document.getElementById('p909r'); if (!p || !r) return;
    encBusy = true; let z = ZBASE[+(get(K_MIDA, 1) || 1)] || 1; r.style.zoom = z; let i = 0;
    while (p.scrollHeight > innerHeight - 24 && z > 0.7 && i < 30) { z = Math.round((z - 0.1) * 10) / 10; r.style.zoom = z; i++; }
    setTimeout(() => { encBusy = false; }, 50);
  }
  const encaixaAviat = () => { if (encBusy) return; clearTimeout(encT); encT = setTimeout(encaixa, 80); };
  addEventListener('resize', encaixaAviat);
  let observat = null;
  function muntaPunteig() {
    const p = document.getElementById('p909'), el = document.getElementById('p909r');
    if (el && observat !== el) { observat = el; new MutationObserver(() => { if (!propi) setTimeout(retoca, 40); encaixaAviat(); }).observe(el, { childList: true, subtree: true, characterData: true }); }
    if (!p || p.querySelector('[data-a="r909mida"]')) return;
    const hd = p.querySelector('.hd'); if (!hd) return;
    const b = document.createElement('button'); b.setAttribute('data-a', 'r909mida'); b.title = 'Mida del requadre (1-4)'; try { if (!localStorage.getItem('r909:mida4')) { localStorage.setItem('r909:mida4', '1'); set(K_MIDA, 4); } } catch (e) { }
    const aplica = () => { const m = +(get(K_MIDA, 1) || 1); p.classList.remove('r909m2', 'r909m3', 'r909m4'); if (m > 1) p.classList.add('r909m' + m); b.textContent = '🔍 ' + m; encaixa(); };
    b.addEventListener('click', ev => { ev.stopPropagation(); ev.preventDefault(); set(K_MIDA, (+(get(K_MIDA, 1) || 1)) % 4 + 1); aplica(); }, true);
    hd.insertBefore(b, hd.querySelector('[data-a="min"]') || null); aplica();
  }
  setInterval(muntaPunteig, 1000);


  // ---------- correccions ----------
  const clauAdreca = r => norm(r.l) + '|' + norm(r.ad);
  function aplicaCorreccions() {
    const fix = get(K_FIX, { exp: {}, adr: {} });
    const d = get(K_DATA, null);
    if (!d || !d.recs) return 0;
    let n = 0;
    d.recs.forEach(r => {
      const e = String((r.c || [])[0] || '');
      const f = fix.exp[e] || fix.adr[clauAdreca(r)];
      if (f && r.z !== f.z) { r.z = f.z; r.a = 'Corregit' + (f.nota ? ': ' + f.nota : ''); n++; return; }
      if (!f) {
        try {
          const x = extDe(r) || [];
          const z = zonaNova(r.ad, r.l, x[1] || '', x[0] || '');
          if (z && z.z && z.z !== '?' && z.z !== 'PS RECOLLIT' && !/ \/ /.test(z.z) && z.z !== r.z) { r.z = z.z; r.a = 'Zona nova'; n++; }
          else if ((!r.z || r.z === '?') && z && z.alt && z.alt !== r.a) { r.a = z.alt; }
          if (z && z.pt && z.pt !== r.pt) { r.pt = z.pt; n++; }
          if (x[2] && Array.isArray(r.c)) x[2].forEach(c => { if (!r.c.includes(c)) { r.c.push(c); n++; } });
        } catch (err) { }
      }
    });
    if (n) { set(K_DATA, d); IDX = null; }
    return n;
  }
  function desaCorreccio(exp, zona, nota, totaAdreca) {
    const fix = get(K_FIX, { exp: {}, adr: {} });
    const r = busca(exp);
    const f = { z: zona, nota: nota || '', quan: new Date().toISOString(), ad: r ? r.ad : '', l: r ? r.l : '', n: r ? r.n : '' };
    fix.exp[exp] = f;
    if (totaAdreca && r) fix.adr[clauAdreca(r)] = f;
    set(K_FIX, fix);
    const log = get(K_LOG, []);
    log.forEach(x => { if (x.exp === exp) { x.corr = zona; x.nota = nota || x.nota; } });
    set(K_LOG, log);
    const n = aplicaCorreccions();
    pendentF5 = pendentF5 || n > 0;
  }

  // ---------- captura de lectures ----------
  function classifica(code, r, okAtlas, dia) {
    if (!okAtlas) return 'atlas';
    if (!r) return formatOk(code) ? 'nollista' : 'lectura';
    if (!r.z || r.z === '?') return 'nozona';
    if (/ \/ /.test(r.z)) return 'dubte';
    return 'ok';
  }
  // v2.6: franja amb el resultat real d'Atlas a dalt del requadre (puntejat / ja llegit / no llegit)
  function resultatAtlas(j) {
    const d = j && j.Data; if (!d) return '';
    let s = null;
    if (d.Item1 !== undefined) s = +d.Item1;
    else if (d.Result !== undefined) { const R = +d.Result; if (R === 2) return ''; s = ({ 1: 1, 1001: 1, 0: 0, 1000: 0, '-1': -1, '-2': -2, '-3': -3 })[R]; }
    if (s === 1) return 'ok'; if (s === -2 || s === -3) return 'dup'; if (s === 0 || s === -1) return 'ko'; return '';
  }
  function posaFranja(k) {
    if (!k) return;
    const el = document.getElementById('p909r'); if (!el) return;
    const T = { ok: '✓ PUNTEJAT A ATLAS', dup: '↺ JA LLEGIT', ko: '✗ NO LLEGIT · torna-ho a passar' };
    propi = true;
    try { el.querySelectorAll('.r909at').forEach(x => x.remove()); const d = document.createElement('div'); d.className = 'r909at ' + k; d.setAttribute('data-r909', '1'); d.textContent = T[k]; el.prepend(d); }
    finally { setTimeout(() => { propi = false; }, 0); }
    encaixaAviat();
  }
  function registra(code, status, resp) {
    code = String(code || '').trim();
    if (!code) return;
    nouCodi(code); setTimeout(retoca, 80);
    let r = busca(code);
    let okAtlas = status >= 200 && status < 300, msg = '', atlasRaw = '';
    try {
      const j = JSON.parse(resp);
      const m = j && (j.Message || j.message || j.Error || j.error || (j.Data && (j.Data.Message || j.Data.Item3)));
      if (m) msg = String(m).slice(0, 160);
      if (j && j.Data && j.Data.Item1 !== undefined) msg = 'resultat ' + j.Data.Item1 + (msg ? ' · ' + msg : '');
      else if (j && j.Data && j.Data.Result !== undefined) { if (+j.Data.Result === 2) return; msg = 'resultat ' + j.Data.Result + (msg ? ' · ' + msg : ''); }
      const fr = resultatAtlas(j); setTimeout(() => posaFranja(fr), 350);
      if (j && j.Success === false) okAtlas = false;
      if (!r) { const o = treuInfo(j && j.Data); infoAtlas = { codi: code, o }; atlasRaw = JSON.stringify(j && j.Data ? j.Data : j).slice(0, 400); if (o.exp) r = busca(o.exp); }
    } catch (e) { if (resp && !okAtlas) msg = String(resp).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 160); }
    const log = netejaRegistre();
    const dia = avui();
    const exp = r ? String(r.c[0]) : '';
    const rep = log.some(x => x.dia === dia && (x.codi === code || (exp && x.exp === exp)));
    let tipus = classifica(code, r, okAtlas, dia);
    const e = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      dia, hora: hora(), codi: code, exp, tipus, rep,
      zona: r ? r.z : '', motiu: r ? r.a : '', fpe: r ? r.d : '',
      pob: r ? r.l : '', adr: r ? r.ad : '', dest: r ? r.n : '',
      atlas: (okAtlas ? 'OK' : 'HTTP ' + status) + (msg ? ' · ' + msg : ''), vist: '', corr: '', nota: '', raw: atlasRaw
    };
    log.push(e);
    set(K_LOG, log);
    // el que ha vist l'operari al requadre del Punteig 909
    setTimeout(() => {
      const el = document.getElementById('p909r');
      if (!el) return;
      const l2 = get(K_LOG, []), x = l2.find(y => y.id === e.id);
      if (x) { x.vist = el.innerText.replace(/\s*\n\s*/g, ' · ').slice(0, 140); set(K_LOG, l2); }
      refresca();
    }, 500);
  }

  // intercepta el punteig d'Atlas sense modificar-lo
  const codiDeUrl = u => { try { const sp = new URL(u, location.href).searchParams; return sp.get('codigo') || sp.get('DistrictCode'); } catch (e) { return null; } };
  const codiDeCos = b => { try { if (!b) return null; if (typeof b === 'string') { const m = b.match(/(?:codigo|DistrictCode)=([^&]+)/i) || b.match(/"codigo"\s*:\s*"?([^",}]+)/i); return m ? decodeURIComponent(m[1]) : null; } if (b instanceof FormData) return b.get('codigo'); } catch (e) { } return null; };
  const esPunteig = u => /ProcesaPunteo|\/pick\/ToPickCheckingWeekend/i.test(String(u || ''));

  const XO = XMLHttpRequest.prototype.open, XS = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, u) { this.__r909 = esPunteig(u) ? { u: String(u) } : null; return XO.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function (body) {
    const info = this.__r909;
    if (info) {
      const code = codiDeUrl(info.u) || codiDeCos(body);
      this.addEventListener('loadend', () => { try { registra(code, this.status, this.responseText); } catch (e) { } });
    }
    return XS.apply(this, arguments);
  };
  if (window.fetch) {
    const F = window.fetch;
    window.fetch = function (input, init) {
      const u = typeof input === 'string' ? input : (input && input.url);
      const p = F.apply(this, arguments);
      if (esPunteig(u)) {
        const code = codiDeUrl(u) || codiDeCos(init && init.body);
        p.then(res => res.clone().text().then(t => registra(code, res.status, t))).catch(() => registra(code, 0, ''));
      }
      return p;
    };
  }

  // ---------- interficie ----------
  let pendentF5 = false, filtre = 'errors', diaSel = null;
  const CSS = `
  #r909b{position:fixed;left:12px;bottom:12px;z-index:2147483000;background:#0b3d91;color:#fff;border:0;border-radius:20px;padding:8px 14px;font:600 13px system-ui,Arial;box-shadow:0 2px 8px rgba(0,0,0,.3);cursor:pointer}
  #r909b .n{background:#c0392b;border-radius:10px;padding:1px 7px;margin-left:6px}
  #r909{position:fixed;inset:20px;z-index:2147483001;background:#fff;color:#222;border-radius:10px;box-shadow:0 6px 30px rgba(0,0,0,.4);display:none;flex-direction:column;font:13px system-ui,Arial}
  #r909 header{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 14px;border-bottom:1px solid #ddd}
  #r909 header h2{font-size:16px;margin:0 10px 0 0}
  #r909 .cnt{display:flex;gap:6px;flex-wrap:wrap;padding:8px 14px;border-bottom:1px solid #eee}
  #r909 .cnt span{border-radius:12px;padding:3px 10px;color:#fff;font-weight:600;cursor:pointer}
  #r909 .cnt span.off{opacity:.45}
  #r909 .warn{background:#fff3cd;color:#7a5b00;padding:6px 14px;display:none}
  #r909 .body{overflow:auto;flex:1}
  #r909 table{border-collapse:collapse;width:100%}
  #r909 th{position:sticky;top:0;background:#f3f5f9;text-align:left;padding:6px;font-size:12px;border-bottom:1px solid #ccc}
  #r909 td{padding:5px 6px;border-bottom:1px solid #eee;vertical-align:top}
  #r909 td.t{font-weight:700;white-space:nowrap}
  #r909 tr.fet td{background:#eef8f0}
  #r909 button,#r909 select,#r909 input{font:inherit;padding:4px 8px;border:1px solid #bbb;border-radius:5px;background:#fff}
  #r909 button.p{background:#0b3d91;color:#fff;border-color:#0b3d91}
  #r909 .x{margin-left:auto}
  #r909 small{color:#666}`;

  function munta() {
    if (document.getElementById('r909b') || !document.body) return;
    const st = document.createElement('style'); st.textContent = CSS + CSS2; document.head.appendChild(st);
    const b = document.createElement('button'); b.id = 'r909b'; b.innerHTML = '📋 Registre <span class="n" style="display:none"></span>';
    b.onclick = () => obre(true); document.body.appendChild(b);
    const w = document.createElement('div'); w.id = 'r909';
    w.innerHTML = `<header><h2>Registre de punteig 909</h2>
      <label>Dia <select id="r909d"></select></label>
      <label><input type="checkbox" id="r909e" checked> Només errors</label>
      <input id="r909q" placeholder="Cerca codi, carrer, destinatari…" style="min-width:220px">
      <button id="r909copy">Copiar errors</button><button id="r909csv">Exportar Excel</button><button id="r909del">Esborrar dia</button>
      <button class="x p" id="r909x">Tancar</button></header>
      <div class="cnt" id="r909c"></div><div class="warn" id="r909w">Hi ha correccions noves. Premeu <b>F5</b> perquè el Punteig 909 les faci servir.</div>
      <div class="body"><table><thead><tr><th>Hora</th><th>Codi llegit</th><th>Tipus</th><th>Zona</th><th>FPE</th><th>Població · adreça · destinatari</th><th>Atlas / s'ha vist</th><th>Corregir</th></tr></thead><tbody id="r909t"></tbody></table></div>`;
    document.body.appendChild(w);
    w.querySelector('#r909x').onclick = () => obre(false);
    w.querySelector('#r909e').onchange = e => { filtre = e.target.checked ? 'errors' : 'tots'; pinta(); };
    w.querySelector('#r909d').onchange = e => { diaSel = e.target.value; pinta(); };
    w.querySelector('#r909q').oninput = pinta;
    w.querySelector('#r909csv').onclick = exportaCsv;
    w.querySelector('#r909copy').onclick = copiaErrors;
    w.querySelector('#r909del').onclick = () => {
      const d = diaSel || avui();
      if (confirm('Esborrar el registre del dia ' + d + '? Les correccions de zona es mantenen.')) { set(K_LOG, get(K_LOG, []).filter(x => x.dia !== d)); pinta(); refresca(); }
    };
    w.querySelector('#r909t').addEventListener('click', ev => {
      const bt = ev.target.closest('button[data-e]'); if (!bt) return;
      const tr = bt.closest('tr'), exp = bt.dataset.e;
      const z = tr.querySelector('select').value, nota = tr.querySelector('input.nt').value.trim(), tot = tr.querySelector('input.ta').checked;
      if (!z) { alert('Tria la zona correcta.'); return; }
      desaCorreccio(exp, z, nota, tot); pinta(); refresca();
    });
    refresca();
  }

  const esError = x => x.tipus !== 'ok' && x.tipus !== 'repetit';
  function filtrats() {
    const d = diaSel || avui(), q = norm((document.getElementById('r909q') || {}).value);
    return get(K_LOG, []).filter(x => x.dia === d && (filtre === 'tots' || esError(x)) &&
      (!q || norm([x.codi, x.exp, x.adr, x.pob, x.dest, x.zona].join(' ')).includes(q))).reverse();
  }
  function pinta() {
    const w = document.getElementById('r909'); if (!w) return;
    const log = get(K_LOG, []);
    const dies = [...new Set(log.map(x => x.dia).concat([avui()]))].sort().reverse();
    const sd = w.querySelector('#r909d'); diaSel = diaSel || avui();
    sd.innerHTML = dies.map(d => `<option ${d === diaSel ? 'selected' : ''}>${d}</option>`).join('');
    const delDia = log.filter(x => x.dia === diaSel);
    const c = {}; delDia.forEach(x => { c[x.tipus] = (c[x.tipus] || 0) + 1; });
    const nRep = delDia.filter(x => x.rep).length;
    w.querySelector('#r909c').innerHTML = `<span style="background:#34495e">Lectures: ${delDia.length}</span>` +
      Object.keys(TIPUS).filter(k => k !== 'repetit' && c[k]).map(k => `<span style="background:${TIPUS[k].c}">${TIPUS[k].t}: ${c[k]}</span>`).join('') +
      (nRep ? `<span style="background:#7f8c8d">Repetits: ${nRep}</span>` : '');
    w.querySelector('#r909w').style.display = pendentF5 ? 'block' : 'none';
    const opts = z => '<option value="">— zona —</option>' + ZONES.map(o => `<option ${o === z ? 'selected' : ''}>${o}</option>`).join('');
    w.querySelector('#r909t').innerHTML = filtrats().map(x => {
      const T = TIPUS[x.tipus] || TIPUS.ok;
      const pot = x.exp || x.codi;
      return `<tr class="${x.corr ? 'fet' : ''}"><td>${esc(x.hora)}</td>
        <td>${esc(x.codi)}${x.exp && x.exp !== x.codi ? '<br><small>exp. ' + esc(x.exp) + '</small>' : ''}${x.rep ? '<br><small>repetit</small>' : ''}</td>
        <td class="t" style="color:${T.c}">${T.t}${x.motiu ? '<br><small>' + esc(x.motiu) + '</small>' : ''}</td>
        <td>${esc(x.corr || x.zona)}${x.corr ? '<br><small>abans: ' + esc(x.zona) + '</small>' : ''}</td>
        <td>${esc(x.fpe)}</td>
        <td><b>${esc(x.pob)}</b><br>${esc(x.adr)}<br><small>${esc(x.dest)}</small></td>
        <td><small>${esc(x.atlas)}<br>${esc(x.vist)}</small></td>
        <td style="white-space:nowrap"><select>${opts(x.corr)}</select>
          <input class="nt" placeholder="nota" value="${esc(x.nota)}" style="width:110px"><br>
          <label><input type="checkbox" class="ta" checked> mateixa adreça</label>
          <button class="p" data-e="${esc(pot)}">Desar</button></td></tr>`;
    }).join('') || '<tr><td colspan="8" style="padding:20px;text-align:center;color:#666">Cap lectura amb aquest filtre.</td></tr>';
  }
  function refresca() {
    const b = document.getElementById('r909b'); if (!b) return;
    const n = get(K_LOG, []).filter(x => x.dia === avui() && esError(x) && !x.corr).length;
    const s = b.querySelector('.n'); s.textContent = n; s.style.display = n ? 'inline' : 'none';
    if (document.getElementById('r909').style.display === 'flex') pinta();
  }
  function obre(on) { const w = document.getElementById('r909'); w.style.display = on ? 'flex' : 'none'; if (on) { diaSel = avui(); pinta(); } }

  function exportaCsv() {
    const d = diaSel || avui();
    const rows = get(K_LOG, []).filter(x => x.dia === d);
    const cols = [['dia', 'Dia'], ['hora', 'Hora'], ['codi', 'Codi llegit'], ['exp', 'Expedició'], ['tipus', 'Tipus'], ['zona', 'Zona'], ['corr', 'Zona corregida'], ['motiu', 'Motiu'], ['fpe', 'FPE'], ['pob', 'Població'], ['adr', 'Adreça'], ['dest', 'Destinatari'], ['atlas', 'Atlas'], ['vist', "S'ha vist"], ['nota', 'Nota']];
    const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const csv = '﻿' + cols.map(c => q(c[1])).join(';') + '\r\n' +
      rows.map(x => cols.map(c => q(c[0] === 'tipus' ? (TIPUS[x.tipus] || {}).t + (x.rep ? ' (repetit)' : '') : x[c[0]])).join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'registre_punteig_909_' + d + '.csv'; document.body.appendChild(a); a.click(); a.remove();
  }
  function copiaErrors() {
    const d = diaSel || avui();
    const rows = get(K_LOG, []).filter(x => x.dia === d && esError(x));
    const txt = `Registre punteig 909 · ${d}\n${rows.length} lectures amb incidència\n\n` + rows.map(x =>
      `${x.hora} · ${(TIPUS[x.tipus] || {}).t} · ${x.exp || x.codi}${x.adr ? ' · ' + x.adr + ', ' + x.pob : ''}${x.dest ? ' · ' + x.dest : ''}${x.corr ? ' → ' + x.corr : ''}`).join('\n');
    navigator.clipboard.writeText(txt).then(() => alert('Copiat (' + rows.length + ' línies).'), () => prompt('Copia el text:', txt));
  }

  // aplica correccions quan es carrega un llistat nou i munta la interficie
  // si s'han completat zones d'un llistat, recarrega un sol cop perquè el Punteig 909 les faci servir
  function recarregaUnCop(at) {
    let fet = null; try { fet = sessionStorage.getItem('r909:reload'); } catch (e) { }
    if (fet !== String(at)) { try { sessionStorage.setItem('r909:reload', String(at)); } catch (e) { } setTimeout(() => location.reload(), 1500); }
    else { pendentF5 = true; refresca(); }
  }
  let ultimAt = null;
  setInterval(() => {
    const d = get(K_DATA, null);
    if (d && d.at !== ultimAt) { ultimAt = d.at; if (aplicaCorreccions() > 0) recarregaUnCop(d.at); }
  }, 4000);
  try { const n0 = aplicaCorreccions(); ultimAt = (get(K_DATA, {}) || {}).at; if (n0 > 0) recarregaUnCop(ultimAt); } catch (e) { }
  netejaRegistre();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', munta); else munta();
  window.r909 = { registra, busca, desaCorreccio, aplicaCorreccions, retoca };
})();
