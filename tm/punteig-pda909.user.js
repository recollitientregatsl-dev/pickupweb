// ==UserScript==
// @name         Punteig PDA 909
// @namespace    recollit-entregat-909
// @version      3.4
// @description  v3.4: carrer i número en lletra gran sota la zona (als pobles, el poble en gran i el carrer a sota), perquè el repartidor el llegeixi d'un cop d'ull. v3.3: derivats a ParcelShop es mostren curts (PS CELINA). v3.2: obre sol el punteo del dia si el troba tancat (un cop Atlas ha carregat l'estat i abans de cada lectura). v3.1: des de la icona, si Atlas demana la contrasenya, després d'entrar torna sol a Punteo; si el punteo del dia és tancat, toca «Abrir punteo» abans de preparar-ho. v3.0: un sol toc per començar: l'enllaç https://atlas.gls-spain.es/pick/index?auto909=999 (icona a la pantalla d'inici o QR) obre «Puntear», assigna la fulla 999 i deixa el cursor a «Código de barras». v2.9: textos de la pantalla gran ajustats (el nom de la zona sempre cap sencer; la prioritat llarga no es trepitja). Quan Atlas demana el número de bult, la pantalla es plega perquè es vegi la finestra d'Atlas, la veu ho avisa i, si s'hi escaneja l'etiqueta sencera, no la deixa passar (cal escriure només el número de bult, normalment 1). v2.8: les brides de saca (codi de 11 xifres que comença per 00 o 10) surten com «SACA PUNTEJADA» en lloc de «no és al llistat». v2.7: la pantalla gran ocupa tota l'alçada (zona al mig, resultat a dalt, prioritat i adreça a baix, amb més aire). v2.6: amb el punteig clàssic, les etiquetes amb codi llarg (no el número d'expedició) es busquen al llistat pel número d'expedició que torna Atlas, i surten amb zona i FPE. v2.5: pantalla gran per defecte (zona, resultat d'Atlas i prioritat en lletra grossa; comptadors i pendents amagats, es mostren amb el botó 📊). v2.4: també llegeix la resposta del punteig clàssic d'Atlas (ToPickCheckingWeekend / ToPick), el que fan servir les PDA amb codis d'expedició: puntejat / ja llegit / no llegit. v2.3: a Firefox (PDA) ara rep la resposta d'Atlas de cada lectura (puntejat / ja llegit / no llegit) en lloc de «sense confirmar». v2.2: funciona també amb el formulari clàssic de punteig d'Atlas («Código de barras» / «Repartidor»), que és el que surt a les PDA: zona a cada lectura i sense teclat de pantalla. v2.1: amb la pantalla plegada, el formulari de punteig d'Atlas es pot desplaçar per sobre de la barra blava (el camp «Código de barras» ja no queda tapat) i el cursor hi torna sol després de triar la fulla, perquè el làser llegeixi a Atlas. v2.0: pantalla completa plegable (per triar la fulla a Atlas) amb el resultat real del punteig d'Atlas: ✓ puntejat (verd), ✗ no llegit (vermell), ↺ ja llegit (taronja), ⚠ sense confirmar; veu del color només quan Atlas confirma; sense teclat de pantalla; comptadors i pendents FPE per zona. v1.9: serveis 97/98 = BUSINESS PARCEL (són nacionals); avís INTERNACIONAL (importació, compta per a l'SPC) amb pitet de Premium i veu. v1.8: avisa «Surt avui · a prop» dels no FPE que són a prop d'un FPE d'avui o endarrerit (La Seu: mateix carrer ±5 números; pobles: mateix poble i ruta). v1.7: correccions de zona del 04/11 (Salòria 64 i 83, Boixadera, Comtat d'Urgell 42, Camí Ral de Cerdanya, Coll del Pendís, Guils, Anserall, Pla de Sant Tirs). v1.6: derivats al PS Recollit i Entregat = punt Blau. v1.5: Grapats (C/ Mont) sempre Blau. v1.4: zones Blau v4 (Jueus, Muralla, Pou, Estret, Hèrcules, Graell, Europa, Portal d'Andorra, Garriga i Massó, Mont, Roda, Partida Sant Ermengol, Poble Sec, Alt Pirineu, Baixos de Calbinyà). v1.3: Av. Valls d'Andorra sencera a Blau (18-20 continua REA). v1.2: correccions verd (Llorenç Tomàs i Costa 52-83, Comtat d'Urgell 57-59, Setúria, Circumval·lació 71-77 i 82). v1.1: tot Castellciutat va a Organyà (excepte el polígon). Punteig de llegada amb la PDA a Atlas (agencia 909): a cada lectura mostra la zona, la prioritat FPE, els Premium i els derivats a ParcelShop, amb veu i pitets. Carrega sol el llistat del dia des d'Atlas (Miraenvios), sense Excel. No modifica res del que fa Atlas.
// @match        https://atlas.gls-spain.es/*
// @match        https://atlas.gls-spain.es/pick/*
// @match        https://atlas.gls-spain.es/Pick/*
// @grant        none
// @run-at       document-start
// @updateURL    https://pickuppointandorra.com/tm/punteig-pda909.user.js
// @downloadURL  https://pickuppointandorra.com/tm/punteig-pda909.user.js
// ==/UserScript==

(function () {
  'use strict';
  // v3.1: fora de Punteo només s'encarrega de tornar-hi després d'entrar la contrasenya (si s'havia obert des de la icona)
  try {
    const KA = 'pda909:auto', ara = Date.now();
    if (!/^\/pick\//i.test(location.pathname)) {
      const rq = (() => { try { return decodeURIComponent(new URLSearchParams(location.search).get('ReturnUrl') || ''); } catch (e) { return ''; } })();
      const m = rq.match(/auto909=(\d{1,6})/);
      if (m) localStorage.setItem(KA, JSON.stringify({ f: m[1], t: ara }));
      if (!/\/account\//i.test(location.pathname)) {
        const a = JSON.parse(localStorage.getItem(KA) || 'null');
        if (a && ara - a.t < 15 * 60000) { localStorage.removeItem(KA); location.replace('/pick/index?auto909=' + a.f); }
      }
      return;
    }
    const qa = new URLSearchParams(location.search).get('auto909');
    if (qa !== null) localStorage.setItem(KA, JSON.stringify({ f: /^\d{1,6}$/.test(qa) ? qa : '999', t: ara })); else localStorage.removeItem(KA);
  } catch (e) { }
  const K_LIST = 'pda909:list', K_CFG = 'pda909:cfg', K_LOG = 'pda909:log';
  const get = (k, def) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; } catch (e) { return def; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const avui = () => new Date().toLocaleDateString('sv-SE');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const dm = iso => iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) : '—';

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

  // ---------- llistat del dia, directament d'Atlas (Miraenvios) ----------
  let IDX = null, IDX_AT = null;
  function llista() { return get(K_LIST, null); }
  function index() {
    const d = llista();
    if (!d || !d.recs) return {};
    if (IDX && IDX_AT === d.at) return IDX;
    IDX = {}; IDX_AT = d.at;
    d.recs.forEach(r => (r.c || []).forEach(c => { IDX[String(c)] = r; }));
    return IDX;
  }
  // mateixa cerca que el Registre: codi de barres, expedició, referència, etiquetes de 18-20 xifres...
  function busca(code) {
    const ix = index(), c = String(code).trim();
    const n = c.toUpperCase().replace(/[^0-9A-Z]/g, '');
    const vs = [c, n, n.slice(0, 14), n.slice(0, 10), n.replace(/^0+/, ''), /^\d{12}$/.test(n) ? n.slice(0, 11) : '', /^\d{15,}$/.test(n) ? n.slice(-14) : '', /^\d{13,}$/.test(n) ? n.slice(-12, -1) : '', /^\d{13,}$/.test(n) ? n.slice(-11) : ''];
    for (const v of vs) if (v && ix[v]) return ix[v];
    return null;
  }
  const PS_CURT = [[/CELINA/i, 'CELINA'], [/TIA\s*MAR/i, 'TIA MARIA'], [/RECOLLIT/i, 'RECOLLIT I ENTREGAT'], [/MAIDO/i, 'MAIDO'], [/CARLIN/i, 'CARLIN'], [/GRAPATS/i, 'GRAPATS']];
  const psCurt = P => { for (const [re, n] of PS_CURT) if (re.test(P)) return n; const w = P.split(/\s+/); return (w[0].length < 4 && w[1] ? w[0] + ' ' + w[1] : w[0]).toUpperCase(); };
  const psNom = v => { const P = String(v == null ? '' : v).trim(); return P && !/LOCKER|AGENCIA COLABORADORA/i.test(P) ? psCurt(P.replace(/^PS\s+/i, '')) : ''; };
  function premium(h, s) {
    h = +h; s = +s;
    if (h === 0 && (s === 1 || s === 8)) return '10:30';
    if (h === 2 && [1, 2, 21, 62].includes(s)) return '14H';
    if (h === 18 && (s === 97 || s === 98)) return 'BP';
    return '';
  }
  // internacionals (importació SPC): servei 85, plaça d'origen internacional (N90-N98, K90) o CP d'origen no espanyol
  const intl = x => { const z = String(x.SourceZipCode || '').trim();
    const nm = String(x.SourceNemonic || '').trim().toUpperCase();
    return +x.ServiceId === 85 || /^N9/.test(nm) || nm === 'K90' || (!!z && !/^\d{3,5}$/.test(z)); };
  const ddmmyyyy = d => String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  const CRIT = ['fltCode', '', 'fltDateFrom', '', 'fltDateTo', '', 'fltOrigin', '', 'fltPosting', '909', 'fltPay', '', 'fltHighlighted', 'false', 'fltService', '', 'fltSchedule', '', 'fltCustomerPlace', '', 'fltCustomerId', '', 'fltCustomerIdMultiple', '', 'fltNetworkCustomer', '',
    'fltExpectedDeliveryDateFrom', '', 'fltExpectedDeliveryDateTo', '', 'fltRed', '-1', 'fltTsp', '-1', 'fltDigitized', '', 'fltRCS', '', 'fltInsured', '', 'fltOptionalReturn', '', 'fltMandatoryReturn', '', 'fltHotlineCustomer', '', 'fltOnDelivery', '', 'fltMinOnDelivery', '', 'fltDue', '',
    'fltMinDue', '', 'fltCustom', '', 'fltMinCustom', '', 'fltAmountsToRecipient', '', 'fltCustomerBillOffice', '', 'fltCustomerBillId', '', 'fltStatus', '', 'fltStatusDateFrom', '', 'fltStatusTimeFrom', '', 'fltStatusDateTo', '', 'fltStatusTimeTo', '', 'fltLastStatus', 'true',
    'fltIncidence', '', 'fltIncidenceDateFrom', '', 'fltIncidenceTimeFrom', '', 'fltIncidenceDateTo', '', 'fltIncidenceTimeTo', '', 'fltLastIncidence', 'true', 'fltSender', '', 'fltAddressee', '', 'fltZipCode', '', 'fltOriginDepartment', '', 'fltDestinationPhone', '', 'fltDestinationDepartment', '',
    'fltObservations', '', 'psOrigin', '', 'psDestination', '', 'psOriginNet', '', 'psDestinationNet', '', 'haspsdestination', '', 'haspsorigin', '', 'psnacido', '', 'psenvuelo', '', 'idCPdestino', '', 'fltTypeCode', '0', 'fltTypeAduanaFile', '-1', 'page', '1', 'rows', '5000'];
  async function tokenAtlas() {
    const t = await (await fetch('/shippingfinder/index', { credentials: 'include' })).text();
    const m = t.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/) || t.match(/value="([^"]+)"[^>]*name="__RequestVerificationToken"/);
    if (!m) throw new Error('Atlas no dona el token (sessió caducada?)');
    return m[1];
  }
  async function diaAtlas(tok, dia) {
    const p = new URLSearchParams();
    for (let i = 0; i < CRIT.length; i += 2) {
      let v = CRIT[i + 1];
      if (CRIT[i] === 'fltDateFrom' || CRIT[i] === 'fltDateTo') v = dia;
      p.append('searchCriteria[' + CRIT[i] + ']', v);
    }
    ['OrderBy', '', 'Order', '', 'draw', '0', 'start', '0', 'length', '0'].forEach((v, i, a) => { if (i % 2 === 0) p.append(v, a[i + 1]); });
    p.append('__RequestVerificationToken', tok);
    const r = await fetch('/ShippingFinder/GetShippings', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' }, body: p.toString() });
    const j = await r.json();
    return (j && j.data && j.data.shippingInfoList) || [];
  }
  let carregant = false;
  async function carregaLlista(dies) {
    if (carregant) return; carregant = true;
    dies = dies || 9;
    try {
      estat('Connectant amb Atlas…');
      const tok = await tokenAtlas();
      const vist = new Set(), recs = [];
      for (let k = dies - 1; k >= 0; k--) {
        const d = new Date(); d.setDate(d.getDate() - k);
        estat('Carregant llistat · dia ' + (dies - k) + ' de ' + dies + ' · ' + recs.length + ' env.');
        let L = [];
        try { L = await diaAtlas(tok, ddmmyyyy(d)); } catch (e) { L = []; }
        L.forEach(x => {
          // fora: entregats, tancats, anul·lats i sense qualitat (mateix filtre que el ShippingsExport del matí)
          // (QualityBody, com fa Miraenvios: 0-2 entrega, 19-21 tancades, 22-23 anul·lades, la resta fora de 3-18/24/25 sense qualitat)
          const q = +x.QualityBody;
          if (!((q >= 3 && q <= 18) || q === 24 || q === 25)) return;
          const e = String(x.ShippingId || ''); if (!e || vist.has(e)) return; vist.add(e);
          const ms = +String(x.EstimatedDate || '').replace(/[^\d]/g, '');
          const fpe = ms ? new Date(ms).toISOString().slice(0, 10) : '';
          const c = [e]; [x.Barcode, x.Reference, x.REFN].forEach(v => { v = String(v == null ? '' : v).replace(/\s/g, ''); if (/^\d{9,20}$/.test(v) && !c.includes(v)) c.push(v); });
          const ad = String(x.PostingAddress || ''), l = String(x.PostingCity || ''), cp = String(x.PostingSourceCode || ''), ps = psNom(x.nombrePSDestino);
          let z = {}; try { z = zonaNova(ad, l, cp, x.nombrePSDestino || '') || {}; } catch (er) { }
          recs.push({ c, d: fpe, z: z.z || '?', a: z.alt || '', pt: z.pt || '', p: premium(x.Schedule, x.ServiceId), l, ad, n: String(x.PostingName || ''), ps, cod: +x.CashOnDelivery || 0, i: intl(x) ? 1 : 0 });
        });
      }
      if (!recs.length) throw new Error('Atlas no ha tornat cap enviament');
      set(K_LIST, { at: new Date().toISOString(), dia: avui(), recs }); IDX = null;
      estat(''); capcalera(); parla('Llistat carregat', 0);
    } catch (e) {
      estat('No s\'ha pogut carregar el llistat: ' + (e && e.message || e) + '. Toca ↻ per tornar-ho a provar.', true);
    } finally { carregant = false; }
  }

  // ---------- so i veu ----------
  const SAY = { REA: 'Agència', 'PS RECOLLIT': 'Parcel shop', VERMELL: 'Vermell', VERD: 'Verd', GROC: 'Groc', BLAU: 'Blau', 'ORGANYÀ': 'Organyà', CERDANYA: 'Cerdanya', 'LA FARGA': 'La Farga', 'POLÍGON': 'Polígon' };
  const cfg = () => get(K_CFG, { veu: true, so: true });
  function parla(t, ms) {
    if (!cfg().veu || !t) return;
    setTimeout(() => { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'ca-ES'; const v = speechSynthesis.getVoices().find(x => /^ca/i.test(x.lang)) || speechSynthesis.getVoices().find(x => /^es/i.test(x.lang)); if (v) { u.voice = v; u.lang = v.lang; } u.rate = 1.15; speechSynthesis.speak(u); } catch (e) { } }, ms || 0);
  }
  let AC = null;
  function to(seq) {
    if (!cfg().so) return;
    try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume();
      const g = AC.createGain(); g.gain.value = .25; g.connect(AC.destination);
      seq.forEach(([f, t0, dur]) => { const o = AC.createOscillator(); o.type = 'square'; o.frequency.value = f; o.connect(g); o.start(AC.currentTime + t0); o.stop(AC.currentTime + t0 + dur); });
    } catch (e) { }
  }
  const SO = {
    ok: [[1046, 0, .15]],                                   // FPE avui: un pitet agut
    late: [[1318, 0, .1], [1318, .15, .1], [1318, .3, .1]],  // endarrerit: tres pitets aguts
    fut: [[392, 0, .35]],
    prop: [[659, 0, .12], [988, .16, .2]],                  // a prop d'un FPE: dos pitets que pugen                                    // futur: un pitet greu llarg
    miss: [[262, 0, .2], [196, .25, .35]],                   // no és al llistat: greu-greu
    prem: [[880, 0, .12], [660, .14, .12], [880, .28, .12], [660, .42, .12]]
  };

  // ---------- pantalla v2.0: pantalla completa plegable + resultat real d'Atlas ----------
  const W = (typeof unsafeWindow !== 'undefined' && unsafeWindow) || window;
  const COL = () => zonaNova.COL || {};
  const ZORD = ['VERMELL', 'VERD', 'GROC', 'BLAU', 'POLÍGON', 'ORGANYÀ', 'CERDANYA', 'LA FARGA', 'PS RECOLLIT', 'REA', '?'];
  const K_SCAN = 'pda909:scan';
  const CSS = `
#pda909{position:fixed;left:0;right:0;top:0;bottom:0;z-index:2147483000;font-family:system-ui,Arial,sans-serif;background:#eef1f6;color:#14213a;display:flex;flex-direction:column;overflow:hidden}
#pda909.min{top:auto;height:50px;box-shadow:0 -4px 16px rgba(0,0,0,.35)}
#pda909.min .cos{display:none}
  body:has(#pda909.min) .modal{padding-bottom:90px!important}body:has(#pda909.min) .modal-dialog{margin-bottom:90px!important}
#pda909 .hd{display:flex;align-items:center;gap:5px;padding:6px 8px;background:#061ab1;color:#fff;min-height:38px;flex:none}
#pda909 .hd .t{flex:1;min-width:0;line-height:1.15}
#pda909 .hd .t b{display:block;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#pda909 .hd .t b.nf{color:#ffd54f}
#pda909 .hd .t span{display:block;font-size:11px;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#pda909 .hd button{background:rgba(255,255,255,.15);color:#fff;border:0;border-radius:6px;font:600 16px system-ui;padding:7px 9px;min-width:38px}
#pda909 .hd button.on{background:#ffd54f;color:#14213a}
#pda909 .cos{flex:1;overflow:auto;padding:8px;display:flex;flex-direction:column;gap:8px}
#pda909 .at{border-radius:10px;padding:10px 8px;text-align:center;font-weight:800;font-size:min(8vw,34px);line-height:1.1}
#pda909 .at small{display:block;font-size:min(4.2vw,17px);font-weight:600;margin-top:4px}
#pda909 .at.wait{background:#dfe4ec;color:#55627a}
#pda909 .at.ok{background:#0f8a4b;color:#fff}
#pda909 .at.dup{background:#ef6c00;color:#fff}
#pda909 .at.ko{background:#c8261d;color:#fff;font-size:min(12vw,54px);padding:26px 8px}
#pda909 .at.none{background:#7a1010;color:#fff;font-size:min(9vw,40px);padding:20px 8px}
@keyframes pda909p{50%{opacity:.35}}
#pda909 .at.ko,#pda909 .at.none{animation:pda909p .5s 5}
#pda909 .cd{background:#fff;border:3px solid #14213a;border-radius:12px;overflow:hidden}
#pda909 .zn{text-align:center;padding:10px 6px 8px;font-weight:800;text-transform:uppercase;line-height:1}
#pda909 .zn b{display:block;font-size:min(17vw,84px)}
#pda909 .zn i{display:block;font-style:normal;font-size:min(5.5vw,24px);margin-top:4px}
#pda909 .cd.petit .zn b{font-size:min(10vw,44px)}
#pda909 .cd.petit .zn i{font-size:min(4.5vw,18px)}
#pda909 .pr{text-align:center;font-weight:800;font-size:min(7.5vw,34px);padding:6px;text-transform:uppercase}
#pda909 .pr.ok{background:#e3f5ea;color:#0f8a4b}#pda909 .pr.late{background:#fbe5e3;color:#c8261d}#pda909 .pr.fut{background:#e9edf3;color:#55627a}#pda909 .pr.prop{background:#e3effd;color:#0b4fb3}#pda909 .pr.miss{background:#fdf0d8;color:#a86400}
#pda909 .pm{background:#c8261d;color:#fff;text-align:center;font-weight:800;font-size:min(6.5vw,30px);padding:6px}
#pda909 .in{background:#e65100;color:#fff;text-align:center;font-weight:800;font-size:min(5.5vw,24px);padding:5px}
#pda909 .ps{background:#c2185b;color:#fff;text-align:center;font-weight:800;font-size:min(5.5vw,24px);padding:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#pda909 .sb{padding:6px 10px 8px;font-size:13px;color:#3a4558}
#pda909 .sb.prop{color:#0b4fb3;font-weight:700}
#pda909 .sb code{font-family:monospace;font-size:13px}
#pda909 .er{background:#fbe5e3;color:#c8261d;border:2px solid #c8261d;border-radius:10px;padding:8px 10px;font-weight:700;font-size:14px;display:flex;gap:8px;align-items:center}
#pda909 .er div{flex:1}
#pda909 .er button{background:#c8261d;color:#fff;border:0;border-radius:6px;font:700 14px system-ui;padding:6px 10px}
#pda909 .kp{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
#pda909 .kp div{background:#fff;border-radius:8px;padding:6px;font-size:11px;color:#55627a;line-height:1.15}
#pda909 .kp b{display:block;font-size:22px;color:#14213a}
#pda909 .kp .g b{color:#0f8a4b}#pda909 .kp .r b{color:#c8261d}#pda909 .kp .o b{color:#ef6c00}
#pda909 .pd{background:#fff;border-radius:10px;padding:8px}
#pda909 .pd h4{margin:0 0 4px;font-size:12px;letter-spacing:.5px;color:#55627a;text-transform:uppercase}
#pda909 .pd .xp{font-size:13px;margin-bottom:6px}
#pda909 .pd .ch{display:flex;flex-wrap:wrap;gap:5px}
#pda909 .pd .ch span{border-radius:6px;padding:4px 8px;font-weight:800;font-size:13px}
#pda909 .st{padding:8px 10px;font-size:14px;background:#fff3cd;color:#7a5b00;border-radius:8px}
#pda909 .st.err{background:#fbe5e3;color:#c8261d}
#pda909 .nf{background:#fff3cd;color:#7a5b00;border-radius:10px;padding:12px;font-size:16px;font-weight:700;text-align:center}
#pda909 .idle{padding:18px 12px;text-align:center;font-size:18px;color:#55627a;background:#fff;border-radius:12px}
#pda909.gran .kp,#pda909.gran .pd{display:none}
#pda909.gran .at{font-size:min(12vw,58px);padding:16px 8px}
#pda909.gran .at small{font-size:min(6vw,28px)}
#pda909.gran .zn{padding:14px 6px 12px}
#pda909.gran .zn b,#pda909.gran .cd.petit .zn b{font-size:min(27vw,150px)}
#pda909.gran .zn i,#pda909.gran .cd.petit .zn i{font-size:min(7.5vw,36px);margin-top:8px}
#pda909.gran .pr{font-size:min(10vw,50px);padding:10px 6px}
#pda909.gran .pm,#pda909.gran .ps,#pda909.gran .in{font-size:min(7.5vw,36px);padding:10px 6px}
#pda909.gran .sb,#pda909.gran .sb code{font-size:min(4.6vw,22px)}
#pda909.gran .idle{font-size:min(6vw,28px);padding:30px 12px}
#pda909.gran #pda909b{flex:1;display:flex;flex-direction:column;gap:12px;min-height:0}
#pda909.gran #pda909b .cd{flex:1;display:flex;flex-direction:column;min-height:0}
#pda909.gran #pda909b .zn{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center}
#pda909.gran .at{padding:22px 8px}
#pda909.gran .pr{padding:18px 6px}
#pda909.gran .sb{padding:14px 14px 16px;line-height:1.4}
#pda909.gran .sb code{display:inline-block;margin-bottom:4px}
#pda909.gran .idle{flex:1;display:flex;align-items:center;justify-content:center}
#pda909.gran .zn b{white-space:nowrap;max-width:100%;overflow:hidden}
#pda909.gran .pr{line-height:1.15;font-size:min(8.5vw,42px)}
#pda909.gran .pr.llarg{font-size:min(6.5vw,32px)}
#pda909 .cr{background:#fff;color:#14213a;text-align:center;font-weight:900;text-transform:uppercase;padding:8px 8px 10px;border-top:3px solid #14213a;line-height:1.05;letter-spacing:.3px}
#pda909 .cr b{display:block;font-size:min(9vw,44px);overflow-wrap:anywhere}
#pda909 .cr i{display:block;font-style:normal;font-weight:700;font-size:min(5.5vw,26px);color:#3a4558;margin-top:4px;overflow-wrap:anywhere}
#pda909 .cr.llarg b{font-size:min(7vw,34px)}
#pda909.gran .cr{padding:14px 8px 16px}
#pda909.gran .cr b{font-size:min(12vw,64px)}
#pda909.gran .cr.llarg b{font-size:min(8.5vw,46px)}
#pda909.gran .cr i{font-size:min(7vw,34px)}
#pda909 .cd.petit .cr b{font-size:min(7vw,32px)}`;

  let caixa = null, darrerFulla = '', ultim = '';
  const codiInput = () => { const a = document.getElementById('pnt-codigoV2'), b = document.getElementById('pnt-code'); if (a && a.offsetParent !== null) return a; if (b && b.offsetParent !== null) return b; return a || b; };
  const visible = e => !!(e && e.offsetParent !== null);
  const scans = () => { const s = get(K_SCAN, null); return s && s.dia === avui() && s.m && s.n ? s : { dia: avui(), m: {}, n: { ok: 0, dup: 0, ko: 0, none: 0 } }; };
  function guardaScan(key, st, k) {
    const s = scans(); s.n[st] = (s.n[st] || 0) + 1;
    if (key && (st === 'ok' || st === 'dup')) s.m[key] = k || 'miss';
    set(K_SCAN, s);
  }

  function munta() {
    if (caixa || !document.body) return;
    const st = document.createElement('style'); st.textContent = CSS; (document.head || document.body).appendChild(st);
    caixa = document.createElement('div'); caixa.id = 'pda909';
    caixa.innerHTML = `<div class="hd"><div class="t"><b id="pda909f"></b><span id="pda909t"></span></div><button data-a="st" title="Comptadors">📊</button><button data-a="kb" title="Teclat">⌨</button><button data-a="re" title="Tornar a carregar el llistat">↻</button><button data-a="veu" title="Veu"></button><button data-a="min" title="Amagar / mostrar">▾</button></div>
<div class="cos"><div class="st" id="pda909s" hidden></div><div id="pda909x"></div><div id="pda909e"></div><div id="pda909b"><div class="idle">Escaneja. Aquí sortirà si Atlas l'ha puntejat, la zona i la prioritat FPE.</div></div><div class="kp" id="pda909k"></div><div class="pd" id="pda909p"></div></div>`;
    document.body.appendChild(caixa);
    // els botons no han de treure el cursor del camp on escriu la pistola
    caixa.addEventListener('mousedown', e => e.preventDefault(), true);
    caixa.addEventListener('touchstart', () => { to([]); }, { passive: true });
    caixa.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (b) {
        const a = b.dataset.a, c = cfg();
        if (a === 're') carregaLlista();
        if (a === 'veu') { c.veu = !c.veu; set(K_CFG, c); }
        if (a === 'kb') { c.kbd = !c.kbd; set(K_CFG, c); teclat(); }
        if (a === 'st') { c.stats = !c.stats; set(K_CFG, c); modeGran(); }
        if (a === 'min') { if (caixa.classList.contains('min')) obre(); else plega(); }
        if (a === 'ne') { errs.length = 0; pintaErrors(); }
        capcalera();
      }
      if (!caixa.classList.contains('min')) enfoca();
    });
    if (!visible(codiInput())) plega();
    capcalera(); comptadors(); teclat(); modeGran();
    const d = llista();
    if (!d || d.dia !== avui()) carregaLlista();
  }
  function modeGran() { if (!caixa) return; const on = !!cfg().stats; caixa.classList.toggle('gran', !on); const b = caixa.querySelector('[data-a="st"]'); if (b) b.className = on ? 'on' : ''; }
  function obre() { if (!caixa) return; caixa.classList.remove('min'); caixa.querySelector('[data-a="min"]').textContent = '▾'; enfoca(); }
  function plega() { if (!caixa) return; caixa.classList.add('min'); caixa.querySelector('[data-a="min"]').textContent = '▴'; }
  const swEl = () => [...document.querySelectorAll('.sweet-alert')].find(e => getComputedStyle(e).display !== 'none' && e.getClientRects().length && /visible|showSweetAlert/.test(e.className));
  const swActiu = () => !!swEl();
  function enfoca() { if (swActiu()) return; const ci = codiInput(); if (visible(ci) && document.activeElement !== ci) { try { ci.focus({ preventScroll: true }); } catch (e) { } } }
  function teclat() { const ci = codiInput(); if (!ci) return; if (cfg().kbd) ci.removeAttribute('inputmode'); else ci.setAttribute('inputmode', 'none'); }

  function fullaActual() {
    if (darrerFulla) return darrerFulla;
    try { const v = W.codeDeliveryMan; if (v) return String(v).replace(/^@@/, ''); } catch (e) { }
    const e = document.getElementById('pnt-repartidorV2'); if (e && e.value) return String(e.value).replace(/^@@/, ''); const e2 = document.getElementById('nr-Name'); if (e2 && e2.value && e2.offsetParent !== null) return String(e2.value).replace(/^@@/, '');
    try { const d = W.my && W.my.vm && W.my.vm.dataDeliveryMan && W.my.vm.dataDeliveryMan(); const c = d && (typeof d.Code === 'function' ? d.Code() : d.Code); if (c) return String(c); } catch (e) { }
    return '';
  }
  function capcalera() {
    if (!caixa) return;
    const d = llista(), n = d && d.recs ? d.recs.length : 0, f = fullaActual(), fb = caixa.querySelector('#pda909f');
    fb.textContent = f ? 'Fulla ' + f : '⚠ Tria la fulla a Atlas';
    fb.className = f ? '' : 'nf';
    caixa.querySelector('#pda909t').textContent = (d && d.dia === avui()
      ? `${n} env. · llistat ${new Date(d.at).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })}`
      : 'Sense llistat d\'avui') + (ultim ? ' · últim: ' + ultim : '');
    caixa.querySelector('[data-a="veu"]').textContent = cfg().veu ? '🔊' : '🔇';
    caixa.querySelector('[data-a="kb"]').className = cfg().kbd ? 'on' : '';
  }
  function estat(t, err) {
    const s = caixa && caixa.querySelector('#pda909s'); if (!s) return;
    s.hidden = !t; s.textContent = t || ''; s.className = 'st' + (err ? ' err' : '');
  }

  // ---------- a prop d'un FPE d'avui ----------
  const NRM = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[´`'’.,;:()\/\\-]/g, ' ').replace(/\s+/g, ' ').trim().replace(/\bSTA\b/g, 'SANTA').replace(/\bST\b/g, 'SANT').replace(/\bMAYOR\b/g, 'MAJOR');
  const TIPUS = /^(C|CL|CALLE|CARRER|CARRE|CR|CRA|CTRA|CARRETERA|AV|AVD|AVDA|AVENIDA|AVINGUDA|AVGDA|PG|PS|PASSEIG|PASEO|PGE|PSG|PASSATGE|PASAJE|PL|PZA|PLAZA|PLACA|RAMBLA|RBLA|TRAV|TRAVESSIA|URB|URBANITZACIO|URBANIZACION|BARRI|BARRIO|CAMI|CAMINO|PARTIDA|PDA)$/;
  const BUIDES = /^(DE|DEL|DELS|LA|LES|EL|ELS|LOS|LAS|D|L|I|Y|NUM|NUMERO|N|NO)$/;
  function parseAdreca(a) {
    const t = NRM(a).replace(/\bN[º°O]?\s*(?=\d)/g, ' ');
    const m = t.match(/^(.*?)(\d+)/);
    const np = (m ? m[1] : t).split(' ').filter(Boolean);
    while (np.length && TIPUS.test(np[0])) np.shift();
    return { carrer: np.filter(w => !BUIDES.test(w) && !TIPUS.test(w)).join(' '), num: m ? parseInt(m[2], 10) : null };
  }
  function semblaCarrer(a, b) {
    if (!a || !b) return false; if (a === b) return true;
    const ta = a.split(' '), tb = b.split(' '), ll = w => w.length >= 4;
    return ta.filter(ll).some(w => tb.includes(w)) && (a.includes(b) || b.includes(a) || ta.filter(ll).every(w => tb.includes(w)) || tb.filter(ll).every(w => ta.includes(w)));
  }
  const ZSEU = z => /^(VERMELL|VERD|GROC|BLAU|POL.GON)$/.test(String(z || ''));
  const MARGE_NUM = 5;
  let PROP = null;
  function llistaProp() {
    const d = llista(); if (!d || !d.recs) return [];
    if (PROP && PROP.at === d.at && PROP.dia === avui()) return PROP.L;
    const a = avui();
    const L = d.recs.filter(x => x.d && x.d <= a && !x.ps && x.z !== 'REA' && x.z !== '?')
      .map(x => ({ x, seu: ZSEU(x.z), loc: NRM(x.l), p: parseAdreca(x.ad) }));
    PROP = { at: d.at, dia: a, L }; return L;
  }
  function aprop(r) {
    if (r.ps || r.z === 'REA' || r.z === '?') return null;
    const seu = ZSEU(r.z), loc = NRM(r.l), p = parseAdreca(r.ad);
    if (seu && (!p.carrer || p.num == null)) return null;
    if (!seu && (!loc || /^(LLEIDA|LERIDA)$/.test(loc))) return null;
    for (const o of llistaProp()) {
      if (o.x === r) continue;
      if (seu) { if (o.seu && o.p.num != null && Math.abs(p.num - o.p.num) <= MARGE_NUM && semblaCarrer(p.carrer, o.p.carrer)) return o.x; }
      else if (!o.seu && o.loc === loc && o.x.z === r.z) return o.x;
    }
    return null;
  }
  function classe(r) {
    const a = avui();
    if (r.d === a) return ['ok', 'Repartir avui'];
    if (r.d && r.d < a) return ['late', 'Endarrerit'];
    const o = aprop(r);
    if (o) return ['prop', 'Surt avui · a prop' + (r.d ? ' (FPE ' + dm(r.d) + ')' : ''), o];
    if (!r.d) return ['fut', 'Sense FPE'];
    return ['fut', 'Deixar · FPE ' + dm(r.d)];
  }

  // ---------- cada lectura: primer la pantalla, després la confirmació d'Atlas ----------
  let darrer = '', darrerT = 0, actual = '', bultoAvisat = false;
  const PEND = new Map();
  const errs = [];
  function nou(code) {
    code = String(code || '').trim(); if (!code) return;
    if (!caixa) munta(); if (!caixa) return;
    if (code === darrer && Date.now() - darrerT < 1500) return;
    darrer = code; darrerT = Date.now();
    obre();
    const r = busca(code);
    const p = { code, r, t: Date.now(), st: 'wait', enviat: false, fet: false };
    if (r) { const [k, txt, o] = classe(r); Object.assign(p, { k, txt, o }); }
    PEND.set(code, p); actual = code;
    pinta(p);
    p.t1 = setTimeout(() => { if (!p.fet && !p.enviat) resol(p, 'none', 'No s\'ha enviat a Atlas'); }, 2000);
    p.t2 = setTimeout(() => { if (!p.fet) resol(p, 'none', 'Atlas no respon'); }, 7000);
  }
  function troba(code) {
    code = String(code || '').trim();
    if (code && PEND.has(code)) return PEND.get(code);
    let best = null; for (const p of PEND.values()) if (!p.fet && (!best || p.t < best.t)) best = p;
    return best;
  }
  const tx = v => v == null ? '' : String(v).trim();
  function resol(p, st, msg, it) {
    if (!p || p.fet) return;
    p.fet = true; clearTimeout(p.t1); clearTimeout(p.t2); PEND.delete(p.code);
    p.st = st; p.msg = msg || ''; p.it = it || null;
    if (it && tx(it.codrepatidor)) darrerFulla = tx(it.codrepatidor);
    if (!p.r && it && st !== 'ko') {
      const exp = tx(it.codexp), ref = tx(it.referencia);
      const r = (exp && busca(exp)) || (/^\d{9,12}$/.test(ref) ? busca(ref) : null);
      if (r) { p.r = r; const [k, txt, o] = classe(r); Object.assign(p, { k, txt, o }); } else proposta(p, it);
    }
    guardaScan(p.r ? p.r.c[0] : p.code, st, p.r ? p.k : 'miss');
    const zt = p.r ? (p.r.z === '?' ? 'sense zona' : p.r.z) : (p.pz && p.pz.z ? p.pz.z : '');
    ultim = { ok: '✓ ', dup: '↺ ', ko: '✗ ', none: '⚠ ' }[st] + ({ ok: zt || 'puntejat', dup: 'ja llegit', ko: 'no llegit', none: 'sense resposta' }[st]);
    if (p.code === actual) pinta(p);
    if ((st === 'ko' || st === 'none') && p.code !== actual) { errs.unshift(p); errs.length = Math.min(errs.length, 3); }
    pintaErrors(); capcalera(); comptadors();
    if (st === 'none') to(SO.miss);
    if (st === 'ok' && p.code === actual) avisa(p);
  }
  function proposta(p, it) {
    const ad = [tx(it.info01), tx(it.info02)].filter(Boolean).join(' '), cp = tx(it.cp);
    if (!ad && !cp) return;
    let z = {}; try { z = (!ad && cp === '25700') ? { z: '?', alt: 'La Seu · sense adreça' } : (zonaNova(ad, '', cp, '') || {}); } catch (e) { }
    p.pz = { z: z.z && z.z !== '?' ? z.z : '', pt: z.pt || '', alt: z.alt || '', ad, cp, exp: tx(it.codexp) };
  }
  const esSaca = c => /^(00|10)\d{9}$/.test(String(c || '').trim());
  function avisa(p) {
    const r = p.r;
    if (!r && esSaca(p.code)) { parla('Saca puntejada', 450); return; }
    if (!r) { parla('No és al llistat. ' + (SAY[p.pz && p.pz.z] || 'Sense zona'), 450); return; }
    const suf = { ok: 'avui', late: 'endarrerit', prop: 'a prop', fut: 'deixar' }[p.k] || '';
    let veu = r.ps ? 'Derivat. ' + r.ps : (SAY[r.z] || 'Sense zona') + (suf ? ', ' + suf : '');
    let ms = 450;
    if (r.p || r.i) { setTimeout(() => to(SO.prem), 450); ms = 1150; }
    if (r.i) veu = 'Internacional. ' + veu;
    if (r.p) veu = 'Premium. ' + veu;
    parla(veu, ms);
  }

  function bandaAtlas(p) {
    const f = p.it && tx(p.it.codrepatidor) ? 'Fulla ' + tx(p.it.codrepatidor) : '';
    const M = {
      wait: ['wait', '⏳ Esperant Atlas…', ''],
      ok: ['ok', '✓ PUNTEJAT', f],
      dup: ['dup', '↺ JA LLEGIT', 'Ja estava puntejat' + (f ? ' · ' + f : '')],
      ko: ['ko', '✗ NO LLEGIT', p.msg || 'Bult incorrecte'],
      none: ['none', '⚠ SENSE CONFIRMAR', (p.msg || 'Atlas no respon') + ' · torna a escanejar']
    };
    const [c, t, s] = M[p.st] || M.wait;
    return `<div class="at ${c}">${t}${s ? `<small>${esc(s)}</small>` : ''}</div>`;
  }
  // v1.1/3.4: carrer en gran, com treballen els repartidors (La Seu: carrer i número; pobles: poble i carrer)
  const ABREV = [[/^(C\/|C\.|CL\.?|CALLE|CARRER|CARRE|C)\s+/, 'C/ '], [/^(AVDA\.?|AVGDA\.?|AVENIDA|AVINGUDA|AV\.?)\s+/, 'AV. '], [/^(PASSEIG|PASEO|PG\.?|PSO\.?)\s+/, 'PG. '], [/^(PLAZA|PLAÇA|PLACA|PZA\.?|PL\.?)\s+/, 'PL. '], [/^(CARRETERA|CTRA\.?|CRTA\.?|CRA\.?)\s+/, 'CTRA. '], [/^(PASSATGE|PASAJE|PGE\.?|PTGE\.?)\s+/, 'PTGE. '], [/^(TRAVESSIA|TRAVESIA|TRAV\.?)\s+/, 'TRAV. '], [/^(PARTIDA|PDA\.?|PD\.?)\s+/, 'PDA. ']];
  function carrerGran(ad) {
    let t = String(ad || '').toUpperCase().replace(/\s+/g, ' ').trim(); if (!t) return '';
    t = t.replace(/^C\/(?=\S)/, 'C/ ');
    for (const [re, ab] of ABREV) if (re.test(t)) { t = t.replace(re, ab); break; }
    const m = /\bKM\b/.test(t) ? null : t.match(/^(.*?\D)\s*,?\s*(?:N[º°O]?\.?\s*)?(\d+\s*(?:[-\/]\s*\d+)?(?:\s?[A-Z](?![A-Z]))?)/);
    if (m) t = m[1].replace(/[\s,·-]+$/, '') + ' ' + m[2].replace(/\s+/g, '');
    return t.length > 60 ? t.slice(0, 58) + '…' : t;
  }
  function bandaCarrer(ad, loc, z, seu) {
    if (z === 'REA') return '';
    const c = carrerGran(ad), l = String(loc || '').toUpperCase().trim();
    let gran = c, petit = '';
    if (!seu && l && !/SEU D.?URGELL|^LA SEU$/.test(l)) { gran = l; petit = c; }
    if (!gran) return '';
    return `<div class="cr${gran.length > 22 ? ' llarg' : ''}"><b>${esc(gran)}</b>${petit ? `<i>${esc(petit)}</i>` : ''}</div>`;
  }
  function targeta(r, k, txt, o, petit) {
    const col = COL()[r.z] || { bg: '#8a94a6', fg: '#fff' };
    const pm = r.p ? `<div class="pm">⚠ PREMIUM ${r.p === 'BP' ? 'BUSINESS PARCEL' : 'EXPRESS ' + r.p}</div>` : '';
    const inl = r.i ? '<div class="in">🌍 INTERNACIONAL · compta per a l\'SPC</div>' : '';
    const ps = r.ps ? `<div class="ps">📦 PS ${esc(r.ps)}</div>` : '';
    return `<div class="cd${petit ? ' petit' : ''}">` + pm + inl + ps +
      `<div class="zn" style="background:${col.bg};color:${col.fg}"><b>${esc(r.z === '?' ? 'Sense zona' : r.z)}</b>${r.pt ? `<i>${esc(r.pt)}</i>` : (r.a ? `<i>${esc(r.a)}</i>` : '')}</div>` +
      (r.ps || r.pt ? '' : bandaCarrer(r.ad, r.l, r.z, ZSEU(r.z) || r.z === '?')) +
      `<div class="pr ${k}">${esc(txt)}</div>${o ? `<div class="sb prop">Al costat de: ${esc(o.ad)} · ${esc(o.l)} · FPE ${esc(dm(o.d))}</div>` : ''}` +
      `<div class="sb"><code>${esc(r.c[0])}</code> · ${esc(r.l)} · ${esc(r.ad)}${r.cod ? ' · <b>Reemborsament ' + r.cod.toFixed(2) + ' €</b>' : ''}</div></div>`;
  }
  function pinta(p) {
    const B = caixa && caixa.querySelector('#pda909b'); if (!B) return;
    const at = bandaAtlas(p);
    if (p.st === 'ko') { B.innerHTML = at + `<div class="sb">Codi <code>${esc(p.code)}</code> · torna'l a passar o revisa l'etiqueta.</div>`; return; }
    let cos;
    if (p.r) cos = targeta(p.r, p.k, p.txt, p.o, p.st === 'dup');
    else if (esSaca(p.code)) cos = `<div class="cd"><div class="zn" style="background:#14213a;color:#fff"><b>SACA</b><i>${p.st === 'wait' ? 'esperant Atlas…' : (p.st === 'dup' ? 'Ja estava puntejada' : 'Saca puntejada')}</i></div><div class="sb">Brida <code>${esc(p.code)}</code></div></div>`;
    else if (p.pz) {
      const col = COL()[p.pz.z] || { bg: '#8a94a6', fg: '#fff' };
      cos = `<div class="cd${p.st === 'dup' ? ' petit' : ''}"><div class="pr miss">No és al llistat · zona proposada</div><div class="zn" style="background:${col.bg};color:${col.fg}"><b>${esc(p.pz.z || '?')}</b><i>${esc(p.pz.pt || (p.pz.z ? 'Per adreça: revisa l\'etiqueta' : (p.pz.alt || 'Sense zona clara')))}</i></div>` + (p.pz.pt ? '' : bandaCarrer(p.pz.ad, '', p.pz.z, true)) +
        `<div class="sb">${esc(['CP ' + (p.pz.cp || '—'), p.pz.ad, p.pz.exp ? 'exp. ' + p.pz.exp : ''].filter(Boolean).join(' · '))} · revisar FPE</div></div>`;
    } else cos = `<div class="cd"><div class="pr miss">No és al llistat</div><div class="sb">Codi <code>${esc(p.code)}</code>${p.st === 'wait' ? ' · esperant Atlas…' : ''}</div></div>`;
    B.innerHTML = at + cos;
    try {
      B.querySelectorAll('.zn b').forEach(b => { const n = Math.max(3, (b.textContent || '').trim().length); const vw = Math.min(26, 80 / (n * 0.72)); b.style.fontSize = 'min(' + vw.toFixed(1) + 'vw,' + Math.round(vw * 5.6) + 'px)'; });
      B.querySelectorAll('.pr').forEach(e => { if ((e.textContent || '').trim().length > 16) e.classList.add('llarg'); });
    } catch (e) { }
  }
  function pintaErrors() {
    const E = caixa && caixa.querySelector('#pda909e'); if (!E) return;
    E.innerHTML = errs.length ? `<div class="er"><div>✗ Lectura anterior sense puntejar: ${errs.map(p => '<code>' + esc(p.code) + '</code>').join(', ')}<br>Torna-la a passar.</div><button data-a="ne">OK</button></div>` : '';
  }
  function comptadors() {
    if (!caixa) return;
    const s = scans(), v = Object.values(s.m), c = k => v.filter(x => x === k).length;
    const T = (cls, n, l) => `<div class="${cls}"><b>${n}</b>${l}</div>`;
    caixa.querySelector('#pda909k').innerHTML =
      T('g', c('ok'), 'FPE avui') + T('r', c('late'), 'Endarrerits') + T('', c('fut') + c('prop'), 'Futurs') + T('o', c('miss'), 'No al llistat') +
      T('g', s.n.ok || 0, '✓ Puntejats') + T('o', s.n.dup || 0, '↺ Ja llegits') + T('r', s.n.ko || 0, '✗ No llegits') + T('r', s.n.none || 0, '⚠ Sense resp.');
    const P = caixa.querySelector('#pda909p'), d = llista();
    if (!d || !d.recs || d.dia !== avui()) { P.innerHTML = ''; P.hidden = true; return; }
    const a = avui(), L = d.recs.filter(r => r.d && r.d <= a), fal = L.filter(r => !s.m[r.c[0]]), per = {};
    fal.forEach(r => { per[r.z] = (per[r.z] || 0) + 1; });
    const zs = Object.keys(per).sort((x, y) => (ZORD.indexOf(x) + 99) % 99 - (ZORD.indexOf(y) + 99) % 99);
    P.hidden = false;
    P.innerHTML = `<h4>FPE avui o endarrerits pendents d'escanejar</h4><div class="xp">${L.length - fal.length} de ${L.length} localitzats · en falten ${fal.length}</div><div class="ch">` +
      zs.map(z => { const col = COL()[z] || { bg: '#8a94a6', fg: '#fff' }; return `<span style="background:${col.bg};color:${col.fg}">${esc(z === '?' ? 'SENSE ZONA' : z)} · ${per[z]}</span>`; }).join('') + '</div>';
  }

  // la pistola escriu al camp d'Atlas i prem Enter: llegim el codi en aquell moment
  document.addEventListener('keydown', e => {
    if (!(e.key === 'Enter' || e.keyCode === 13)) return;
    const t = e.target;
    if (!t || t.tagName !== 'INPUT' || t.type === 'file' || (t.closest && t.closest('#pda909'))) return;
    if (t.closest && t.closest('.sweet-alert')) { const vb = String(t.value || '').trim(); if (/^\d{6,}$/.test(vb)) { e.preventDefault(); e.stopImmediatePropagation(); t.value = ''; parla('Escriu només el número de bult', 50); const sb = caixa && caixa.querySelector('#pda909t'); if (sb) sb.textContent = 'Escriu només el número de bult (1, 2…), no escanegis'; } return; }
    const v = String(t.value || '').trim();
    if (t.id === 'pnt-repartidorV2' || t.id === 'nr-Name' || t.id === 'nr-Pistol' || /^@@/.test(v)) { darrerFulla = ''; setTimeout(capcalera, 800); return; }
    if (t.id === 'q_header') return;
    const ci = codiInput(); if (ci && t !== ci) return;
    nou(v);
  }, true);
  // resposta del punteig d'Atlas: Item1 = 1 OK · 0/-1 no llegit · -2/-3 ja llegit
  const esPunteig = u => /ProcesaPunteo|\/pick\/ToPickCheckingWeekend/i.test(String(u || ''));
  const codiDe = (u, b) => { try { const sp = new URL(u, location.href).searchParams, q = sp.get('codigo') || sp.get('DistrictCode'); if (q) return q; } catch (e) { }
    try { if (typeof b === 'string') { const m = b.match(/(?:codigo|DistrictCode)=([^&]+)/i) || b.match(/"codigo"\s*:\s*"?([^",}]+)/i); return m ? decodeURIComponent(m[1]) : null; } if (b instanceof FormData) return b.get('codigo'); } catch (e) { } return null; };
  function respostaAtlas(code, txt) {
    const p = troba(code); if (!p) return;
    let j; try { j = JSON.parse(txt); } catch (e) { return resol(p, 'none', 'Resposta d\'Atlas il·legible (sessió caducada?)'); }
    const d = j && j.Data, clas = d && d.Item1 === undefined && d.Result !== undefined;
    if (clas && +d.Result === 2) return; // avís de dissabte d'Atlas: esperem la lectura definitiva
    const s = d ? (clas ? ({ 1: 1, 1001: 1, 0: 0, 1000: 0, '-1': -1, '-2': -2, '-3': -3 })[+d.Result] : +d.Item1) : NaN;
    const it0 = (d && (clas ? d.Details : d.Item2)) || {}, it = Object.assign({}, it0, { cp: it0.cp || it0.pc, codexp: it0.codexp || it0.codExp || '' });
    if (s === 1) resol(p, 'ok', '', it);
    else if (s === -2 || s === -3) resol(p, 'dup', '', it);
    else if (s === 0) resol(p, 'ko', 'No existeix l\'enviament', it);
    else if (s === -1) resol(p, 'ko', 'Bult incorrecte', it);
    else resol(p, 'none', (j && j.Message) || 'Resposta desconeguda d\'Atlas', it);
  }
  // v2.3: el ganxo de les peticions s'injecta a la pàgina (a Firefox, Tampermonkey no veu les peticions d'Atlas des del seu espai)
  try {
    const inj = document.createElement('script');
    inj.textContent = "(function(){if(window.__pda909hook)return;window.__pda909hook=1;var XO=XMLHttpRequest.prototype.open,XS=XMLHttpRequest.prototype.send;XMLHttpRequest.prototype.open=function(m,u){this.__pda=/ProcesaPunteo|\\/pick\\/ToPickCheckingWeekend/i.test(String(u||''))?String(u):null;return XO.apply(this,arguments)};XMLHttpRequest.prototype.send=function(b){var x=this;if(x.__pda){var bb=(typeof b==='string')?b:null;document.dispatchEvent(new CustomEvent('pda909-req',{detail:JSON.stringify({u:x.__pda,b:bb})}));x.addEventListener('loadend',function(){document.dispatchEvent(new CustomEvent('pda909-resp',{detail:JSON.stringify({u:x.__pda,b:bb,s:x.status,t:x.responseText})}))})}return XS.apply(this,arguments)}})();";
    (document.head || document.documentElement).appendChild(inj); inj.remove();
  } catch (e) { }
  const llegeixDet = e => { try { return JSON.parse(typeof e.detail === 'string' ? e.detail : String(e.detail)); } catch (er) { return null; } };
  document.addEventListener('pda909-req', e => { const o = llegeixDet(e); if (!o) return; const p0 = troba(codiDe(o.u, o.b)); if (p0) p0.enviat = true; });
  document.addEventListener('pda909-resp', e => {
    const o = llegeixDet(e); if (!o) return; const code = codiDe(o.u, o.b);
    try { if (o.s && o.s < 400) respostaAtlas(code, o.t); else resol(troba(code), 'none', 'Error de connexió amb Atlas'); } catch (er) { }
  });
  if (window.fetch) {
    const F = window.fetch;
    window.fetch = function (input, init) {
      const u = typeof input === 'string' ? input : (input && input.url), p = F.apply(this, arguments);
      if (esPunteig(u)) { const code = codiDe(u, init && init.body), p0 = troba(code); if (p0) p0.enviat = true;
        p.then(res => res.clone().text().then(t => respostaAtlas(code, t))).catch(() => resol(troba(code), 'none', 'Error de connexió amb Atlas')); }
      return p;
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', munta); else munta();
  // manteniment: cursor al camp d'Atlas, sense teclat de pantalla, i plegar si Atlas mostra un avís
  setInterval(() => {
    if (!caixa) { munta(); return; }
    teclat();
    const sw = swEl();
    const bulto = !!sw && /bulto/i.test(sw.innerText || '');
    if (sw && !caixa.classList.contains('min')) plega();
    if (bulto) {
      const bi = sw.querySelector('input'); if (bi && bi.getAttribute('inputmode') !== 'numeric') bi.setAttribute('inputmode', 'numeric');
      if (!bultoAvisat) {
        bultoAvisat = true;
        const pa = PEND.get(actual); if (pa && !pa.fet) { clearTimeout(pa.t1); clearTimeout(pa.t2); pa.fet = true; PEND.delete(pa.code); }
        parla('Atlas demana el número de bult', 100);
      }
    } else bultoAvisat = false;
    const ci = codiInput(), x = caixa.querySelector('#pda909x');
    if (x) x.innerHTML = visible(ci) ? '' : '<div class="nf">Atlas encara no està punteiant: plega la pantalla amb ▾, tria la fulla (normalment 999) i torna a obrir-la.</div>';
    if (!caixa.classList.contains('min')) enfoca();
    else if (visible(ci) && !sw) {
      // plegada: si ningú està escrivint en un altre camp (p. ex. la fulla), el cursor torna a «Código de barras» i el fem visible
      const ae = document.activeElement, escrivint = ae && ae !== ci && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) && ae.type !== 'button' && ae.type !== 'submit';
      if (!escrivint && ae !== ci) { try { ci.focus({ preventScroll: true }); ci.scrollIntoView({ block: 'center' }); } catch (e) { } }
    }
    capcalera();
  }, 1200);
  setInterval(() => { const d = llista(); if (d && d.dia !== avui() && !carregant) carregaLlista(); }, 60000);
  // v3.0: obrir l'enllaç https://atlas.gls-spain.es/pick/index?auto909=999 (icona o QR) ho deixa tot llest: obre «Puntear», assigna la fulla i posa el cursor a «Código de barras»
  (function autoPrepara() {
    let q = null; try { q = new URLSearchParams(location.search).get('auto909'); } catch (e) { }
    if (q === null) return;
    const fulla = /^\d{1,6}$/.test(q) ? q : '999';
    const codi = "(function(){var f='" + fulla + "',n=0;var t=setInterval(function(){n++;if(n>60){clearInterval(t);return;}try{if(!(window.my&&my.openModal&&my.vm&&my.vm.codeDeliveryMan&&document.getElementById('bt-puntear')&&my.vm.btnOpenEnable&&(my.vm.btnOpenEnable()||my.vm.btnCloseEnable())))return;clearInterval(t);var obert=0;try{if(my.vm.btnOpenEnable&&my.vm.btnOpenEnable()&&my.OpenDay&&!window.__pda909obrint){window.__pda909obrint=1;setTimeout(function(){window.__pda909obrint=0},6000);my.OpenDay();obert=1;}}catch(e){}setTimeout(function(){var m=document.getElementById('modal-punteo');if(!(m&&m.classList.contains('in')))my.openModal(false);setTimeout(function(){try{var dm=my.vm.dataDeliveryMan?ko.toJS(my.vm.dataDeliveryMan()):null;var ara=dm&&(dm.Code||dm.code);if(String(ara||'')!==f){my.vm.codeDeliveryMan(f);my.InsertDeliveryman();}}catch(e){console.log('auto909',e)}setTimeout(function(){var c=document.getElementById('pnt-code');if(c){c.focus();}document.dispatchEvent(new CustomEvent('pda909-llest'));},900);},900);},obert?2500:0);}catch(e){console.log('auto909',e)}},500);})();";
    const llanca = () => { try { const s = document.createElement('script'); s.textContent = codi; (document.head || document.documentElement).appendChild(s); s.remove(); } catch (e) { } };
    document.addEventListener('pda909-llest', () => {
      try { history.replaceState(null, '', location.pathname); } catch (e) { }
      darrerFulla = fulla; obre(); capcalera();
      const B = caixa && caixa.querySelector('#pda909b'); if (B) B.innerHTML = '<div class="at ok">✓ LLEST PER PUNTEJAR<small>Fulla ' + fulla + ' · dispara el làser</small></div>';
      parla('Llest per puntejar', 300);
    }, { once: true });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', llanca); else llanca();
  })();
  // v3.2: si el punteo del dia és tancat, l'obre sol (quan Atlas ja ha carregat l'estat, i abans de cada lectura)
  (function obrePunteoSiCal() {
    if (!/^\/pick\//i.test(location.pathname)) return;
    const codi = "(function(){if(window.__pda909dia)return;window.__pda909dia=1;function obre(){try{if(!window.__pda909obrint&&window.my&&my.vm&&my.vm.btnOpenEnable&&my.vm.btnOpenEnable()&&my.OpenDay){window.__pda909obrint=1;my.OpenDay();setTimeout(function(){window.__pda909obrint=0},6000);document.dispatchEvent(new CustomEvent('pda909-dia'));}}catch(e){}}var n=0,t=setInterval(function(){n++;try{if(window.my&&my.vm&&my.vm.btnOpenEnable&&(my.vm.btnOpenEnable()||my.vm.btnCloseEnable())){clearInterval(t);obre();}}catch(e){}if(n>60)clearInterval(t);},500);document.addEventListener('keydown',function(e){if((e.key==='Enter'||e.keyCode===13)&&e.target&&(e.target.id==='pnt-code'||e.target.id==='pnt-codigoV2'))obre();},true);})();";
    const llanca = () => { try { const s = document.createElement('script'); s.textContent = codi; (document.head || document.documentElement).appendChild(s); s.remove(); } catch (e) { } };
    document.addEventListener('pda909-dia', () => { try { parla('Obrint el punteo', 50); } catch (e) { } });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', llanca); else llanca();
  })();
  window.pda909 = { nou, busca, carregaLlista };
})();
