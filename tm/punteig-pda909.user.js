// ==UserScript==
// @name         Punteig PDA 909
// @namespace    recollit-entregat-909
// @version      1.8
// @description  v1.8: avisa «Surt avui · a prop» dels no FPE que són a prop d'un FPE d'avui o endarrerit (La Seu: mateix carrer ±5 números; pobles: mateix poble i ruta). v1.7: correccions de zona del 04/11 (Salòria 64 i 83, Boixadera, Comtat d'Urgell 42, Camí Ral de Cerdanya, Coll del Pendís, Guils, Anserall, Pla de Sant Tirs). v1.6: derivats al PS Recollit i Entregat = punt Blau. v1.5: Grapats (C/ Mont) sempre Blau. v1.4: zones Blau v4 (Jueus, Muralla, Pou, Estret, Hèrcules, Graell, Europa, Portal d'Andorra, Garriga i Massó, Mont, Roda, Partida Sant Ermengol, Poble Sec, Alt Pirineu, Baixos de Calbinyà). v1.3: Av. Valls d'Andorra sencera a Blau (18-20 continua REA). v1.2: correccions verd (Llorenç Tomàs i Costa 52-83, Comtat d'Urgell 57-59, Setúria, Circumval·lació 71-77 i 82). v1.1: tot Castellciutat va a Organyà (excepte el polígon). Punteig de llegada amb la PDA a Atlas (agencia 909): a cada lectura mostra la zona, la prioritat FPE, els Premium i els derivats a ParcelShop, amb veu i pitets. Carrega sol el llistat del dia des d'Atlas (Miraenvios), sense Excel. No modifica res del que fa Atlas.
// @match        https://atlas.gls-spain.es/pick/*
// @match        https://atlas.gls-spain.es/Pick/*
// @grant        none
// @run-at       document-start
// @updateURL    https://pickuppointandorra.com/tm/punteig-pda909.user.js
// @downloadURL  https://pickuppointandorra.com/tm/punteig-pda909.user.js
// ==/UserScript==

(function () {
  'use strict';
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
  const psNom = v => { const P = String(v == null ? '' : v).trim(); return P && !/LOCKER|AGENCIA COLABORADORA/i.test(P) ? P.replace(/^PS\s+/i, '') : ''; };
  function premium(h, s) {
    h = +h; s = +s;
    if (h === 0 && (s === 1 || s === 8)) return '10:30';
    if (h === 2 && [1, 2, 21, 62].includes(s)) return '14H';
    if (h === 18 && (s === 97 || s === 98)) return 'BP';
    return '';
  }
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
          recs.push({ c, d: fpe, z: z.z || '?', a: z.alt || '', pt: z.pt || '', p: premium(x.Schedule, x.ServiceId), l, ad, n: String(x.PostingName || ''), ps, cod: +x.CashOnDelivery || 0 });
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

  // ---------- pantalla ----------
  const COL = () => zonaNova.COL || {};
  const CSS = `
  #pda909{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;font-family:system-ui,Arial,sans-serif;box-shadow:0 -4px 16px rgba(0,0,0,.35);background:#fff;color:#14213a;display:flex;flex-direction:column;max-height:62vh;transition:max-height .15s}
  #pda909.min{max-height:46px}
  #pda909 .hd{display:flex;align-items:center;gap:6px;padding:6px 8px;background:#061ab1;color:#fff;font-size:13px;min-height:34px}
  #pda909 .hd .t{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #pda909 .hd button{background:rgba(255,255,255,.15);color:#fff;border:0;border-radius:6px;font:600 15px system-ui;padding:6px 10px;min-width:38px}
  #pda909 .zn{text-align:center;padding:8px 6px 6px;font-weight:800;text-transform:uppercase;line-height:1}
  #pda909 .zn b{display:block;font-size:min(17vw,96px)}
  #pda909 .zn i{display:block;font-style:normal;font-size:min(6vw,30px);margin-top:4px}
  #pda909 .pr{text-align:center;font-weight:800;font-size:min(8vw,40px);padding:6px;text-transform:uppercase}
  #pda909 .pr.ok{background:#e3f5ea;color:#0f8a4b}#pda909 .pr.late{background:#fbe5e3;color:#c8261d}#pda909 .pr.fut{background:#e9edf3;color:#55627a}#pda909 .pr.prop{background:#e3effd;color:#0b4fb3}#pda909 .sb.prop{color:#0b4fb3;font-weight:700}#pda909 .pr.miss{background:#fdf0d8;color:#a86400}
  #pda909 .pm{background:#c8261d;color:#fff;text-align:center;font-weight:800;font-size:min(7vw,32px);padding:6px}
  #pda909 .ps{background:#c2185b;color:#fff;text-align:center;font-weight:800;font-size:min(6vw,26px);padding:6px}
  #pda909 .sb{padding:6px 10px 10px;font-size:14px;color:#3a4558;overflow:auto}
  #pda909 .st{padding:8px 10px;font-size:14px;background:#fff3cd;color:#7a5b00}
  #pda909 .st.err{background:#fbe5e3;color:#c8261d}
  #pda909 .idle{padding:14px;text-align:center;font-size:18px;color:#55627a}`;
  let caixa = null;
  function munta() {
    if (caixa || !document.body) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    caixa = document.createElement('div'); caixa.id = 'pda909';
    caixa.innerHTML = `<div class="hd"><span class="t" id="pda909t"></span><button data-a="re" title="Tornar a carregar el llistat">↻</button><button data-a="veu" title="Veu"></button><button data-a="min" title="Amagar">▾</button></div>
      <div class="st" id="pda909s" hidden></div><div id="pda909b"><div class="idle">Punteja com sempre. Aquí sortirà la zona i la prioritat de cada paquet.</div></div>`;
    document.body.appendChild(caixa);
    // els botons no han de treure el cursor del camp on escriu la pistola
    caixa.addEventListener('mousedown', e => e.preventDefault(), true);
    caixa.addEventListener('touchstart', () => { to([]); }, { passive: true });
    caixa.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const a = b.dataset.a, c = cfg();
      if (a === 're') carregaLlista();
      if (a === 'veu') { c.veu = !c.veu; set(K_CFG, c); capcalera(); }
      if (a === 'min') { caixa.classList.toggle('min'); b.textContent = caixa.classList.contains('min') ? '▴' : '▾'; }
    });
    capcalera();
    const d = llista();
    if (!d || d.dia !== avui()) carregaLlista();
  }
  function capcalera() {
    if (!caixa) return;
    const d = llista(), n = d && d.recs ? d.recs.length : 0;
    const lg = get(K_LOG, { dia: '', n: 0 }), nl = lg.dia === avui() ? lg.n : 0;
    caixa.querySelector('#pda909t').textContent = d && d.dia === avui()
      ? `Punteig PDA 909 · ${n} env. · ${new Date(d.at).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })} · ${nl} llegits`
      : 'Punteig PDA 909 · sense llistat d\'avui';
    caixa.querySelector('[data-a="veu"]').textContent = cfg().veu ? '🔊' : '🔇';
  }
  function estat(t, err) {
    const s = caixa && caixa.querySelector('#pda909s'); if (!s) return;
    s.hidden = !t; s.textContent = t || ''; s.className = 'st' + (err ? ' err' : '');
  }

  // ---------- cada lectura ----------
  let darrer = '', darrerT = 0;
  // ---------- a prop d'un FPE d'avui ----------
  const NRM = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[´`'’.,;:()\/\\-]/g, ' ').replace(/\s+/g, ' ').trim().replace(/\bSTA\b/g, 'SANTA').replace(/\bST\b/g, 'SANT').replace(/\bMAYOR\b/g, 'MAJOR');
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
  function mostra(code) {
    if (!caixa) munta(); if (!caixa) return;
    code = String(code || '').trim(); if (!code) return;
    if (code === darrer && Date.now() - darrerT < 1500) return;
    darrer = code; darrerT = Date.now();
    const lg = get(K_LOG, { dia: '', n: 0 }); if (lg.dia !== avui()) { lg.dia = avui(); lg.n = 0; } lg.n++; set(K_LOG, lg); capcalera();
    caixa.classList.remove('min'); caixa.querySelector('[data-a="min"]').textContent = '▾';
    const r = busca(code), B = caixa.querySelector('#pda909b');
    if (!r) {
      B.innerHTML = `<div class="pr miss">No és al llistat</div><div class="sb">Codi ${esc(code)} · esperant Atlas…</div>`;
      to(SO.miss); B.dataset.code = code; return;
    }
    const [k, txt, o] = classe(r);
    const col = COL()[r.z] || { bg: '#8a94a6', fg: '#fff' };
    const pm = r.p ? `<div class="pm">⚠ PREMIUM ${r.p === 'BP' ? 'INTERNACIONAL' : 'EXPRESS ' + r.p}</div>` : '';
    const ps = r.ps ? `<div class="ps">📦 Derivat a ParcelShop · ${esc(r.ps)}</div>` : '';
    B.innerHTML = pm + ps + `<div class="zn" style="background:${col.bg};color:${col.fg}"><b>${esc(r.z === '?' ? 'Sense zona' : r.z)}</b>${r.pt ? `<i>${esc(r.pt)}</i>` : (r.a ? `<i>${esc(r.a)}</i>` : '')}</div>` +
      `<div class="pr ${k}">${esc(txt)}</div>${o ? `<div class="sb prop">Al costat de: ${esc(o.ad)} · ${esc(o.l)} · FPE ${esc(dm(o.d))}</div>` : ''}<div class="sb">${esc(r.c[0])} · ${esc(r.l)} · ${esc(r.ad)}${r.cod ? ' · <b>Reemborsament ' + r.cod.toFixed(2) + ' €</b>' : ''}</div>`;
    delete B.dataset.code;
    to(SO[k]);
    let veu = r.ps ? 'Parcel shop' : (SAY[r.z] || 'Sense zona');
    if (r.p) { setTimeout(() => to(SO.prem), 350); veu = 'Premium. ' + veu; }
    parla(veu, 300);
  }
  // no és al llistat: Atlas torna l'expedició, el CP i l'adreça → la busquem o proposem zona
  function respostaAtlas(code, txt) {
    const B = caixa && caixa.querySelector('#pda909b');
    if (!B || B.dataset.code !== String(code || '').trim()) return;
    let i = {}; try { const j = JSON.parse(txt); i = (j && j.Data && j.Data.Item2) || {}; } catch (e) { return; }
    const t = v => v == null ? '' : String(v).trim();
    const exp = t(i.codexp), ref = t(i.referencia), r = (exp && busca(exp)) || (/^\d{9,12}$/.test(ref) ? busca(ref) : null);
    if (r) { darrer = ''; lgUndo(); mostra(r.c[0]); return; }
    const ad = [t(i.info01), t(i.info02)].filter(Boolean).join(' '), cp = t(i.cp);
    if (!ad && !cp) return;
    let z = {}; try { z = (!ad && cp === '25700') ? { z: '?', alt: 'La Seu · sense adreça' } : (zonaNova(ad, '', cp, '') || {}); } catch (e) { }
    const zz = z.z && z.z !== '?' ? z.z : '', col = COL()[zz] || { bg: '#8a94a6', fg: '#fff' };
    B.innerHTML = `<div class="pr miss">No és al llistat · zona proposada</div><div class="zn" style="background:${col.bg};color:${col.fg}"><b>${esc(zz || '?')}</b><i>${esc(z.pt || (zz ? 'Per adreça: revisa l\'etiqueta' : (z.alt || 'Sense zona clara')))}</i></div>` +
      `<div class="sb">${esc(['CP ' + (cp || '—'), ad, exp ? 'exp. ' + exp : ''].filter(Boolean).join(' · '))} · revisar FPE</div>`;
    delete B.dataset.code;
    parla('No és al llistat. ' + (SAY[zz] || 'Sense zona'), 200);
  }
  function lgUndo() { const lg = get(K_LOG, { dia: '', n: 0 }); if (lg.n > 0) { lg.n--; set(K_LOG, lg); } }

  // la pistola escriu al camp d'Atlas i prem Enter: llegim el codi en aquell moment
  document.addEventListener('keydown', e => {
    const t = e.target;
    if ((e.key === 'Enter' || e.keyCode === 13) && t && t.tagName === 'INPUT' && t.type !== 'file' && !(t.closest && t.closest('#pda909'))) mostra(t.value);
  }, true);
  // resposta del punteig d'Atlas (per als que no són al llistat)
  const esPunteig = u => /ProcesaPunteo/i.test(String(u || ''));
  const codiDe = (u, b) => { try { const q = new URL(u, location.href).searchParams.get('codigo'); if (q) return q; } catch (e) { }
    try { if (typeof b === 'string') { const m = b.match(/codigo=([^&]+)/i) || b.match(/"codigo"\s*:\s*"?([^",}]+)/i); return m ? decodeURIComponent(m[1]) : null; } if (b instanceof FormData) return b.get('codigo'); } catch (e) { } return null; };
  const XO = XMLHttpRequest.prototype.open, XS = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, u) { this.__pda = esPunteig(u) ? String(u) : null; return XO.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function (b) {
    if (this.__pda) { const code = codiDe(this.__pda, b); this.addEventListener('loadend', () => { try { respostaAtlas(code, this.responseText); } catch (e) { } }); }
    return XS.apply(this, arguments);
  };
  if (window.fetch) {
    const F = window.fetch;
    window.fetch = function (input, init) {
      const u = typeof input === 'string' ? input : (input && input.url), p = F.apply(this, arguments);
      if (esPunteig(u)) { const code = codiDe(u, init && init.body); p.then(res => res.clone().text().then(t => respostaAtlas(code, t))).catch(() => { }); }
      return p;
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', munta); else munta();
  setInterval(() => { munta(); const d = llista(); if (d && d.dia !== avui() && !carregant) carregaLlista(); }, 60000);
  window.pda909 = { mostra, busca, carregaLlista };
})();
