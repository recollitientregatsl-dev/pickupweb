// ==UserScript==
// @name         Zona Recepció 909
// @namespace    recollit-entregat-909
// @version      1.6
// @description  v1.6: si és a la fulla d'un repartidor, la pantalla es pinta del color de la zona per adreça; la veu diu «FPE vençuda» en lloc de «Fora FPE». v1.5: la veu diu la FPE (FPE vençuda / FPE avui / FPE demà / FPE dia X). v1.4: FPE en gran al costat de la fitxa (es veu de lluny). v1.3: mostra sempre la FPE (data prevista d'entrega) amb avís AVUI / VENÇUDA / futura. Pantalla per al personal de recepció de la nau GLS 909: escaneja o escriu el número d'enviament i et diu de quin color és la zona on l'has de buscar (Vermell, Verd, Groc, Blau, Polígon, Organyà, Cerdanya, La Farga, Agència...), si és a l'estanteria, a la fulla d'un repartidor, al ParcelShop, si encara no ha arribat o si ja està lliurat. Consulta Atlas en directe i fa servir les mateixes zones que el Punteig 909. S'obre NOMÉS amb https://atlas.gls-spain.es/shippingfinder/index?zona909 (adreça pròpia); l'adreça normal de Mil Envíos no es toca mai.
// @match        https://atlas.gls-spain.es/*
// @grant        none
// @run-at       document-start
// @updateURL    https://pickuppointandorra.com/tm/zona-recepcio909.user.js
// @downloadURL  https://pickuppointandorra.com/tm/zona-recepcio909.user.js
// ==/UserScript==

(function () {
  'use strict';
  const ON = 'zr909:on', PEND = 'zr909:pend', K_HIST = 'zr909:hist', K_SO = 'zr909:so';
  const qs = new URLSearchParams(location.search);
  // v1.2: la pantalla NOMÉS surt a l'adreça amb ?zona909. L'adreça normal /shippingfinder/index (Mil Envíos) queda sempre lliure.
  try { localStorage.removeItem(ON); } catch (e) { }                        // neteja el mode "enganxat" de la v1.0/1.1
  try {
    const ru = decodeURIComponent(qs.get('ReturnUrl') || qs.get('returnUrl') || '');
    if (/zona909/.test(ru)) sessionStorage.setItem(PEND, '1');               // si caduca la sessió, recorda-ho només en aquesta pestanya
  } catch (e) { }
  if (/\/account\//i.test(location.pathname)) return;                       // que el personal entri la contrasenya d'Atlas
  if (!/^\/shippingfinder\/index/i.test(location.pathname)) return;         // la resta d'Atlas funciona normal
  let actiu = qs.has('zona909');
  try {
    if (!actiu && sessionStorage.getItem(PEND) === '1') { actiu = true; history.replaceState(null, '', '/shippingfinder/index?zona909'); }
    sessionStorage.removeItem(PEND);
  } catch (e) { }
  if (!actiu) return;

  // ================= ZONES (mateix motor que Punteig 909 PC repartidors v1.0) =================
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
  POL:'POLIGON',PGNO:'POLIGON',PARCELA:'PARCELLA',ZELOETA:'ZULUETA',ZULOETA:'ZULUETA',CALASSANC:'CALASANC',CALASANZ:'CALASANC',PARQUE:'PARC',PARK:'PARC',REGERENCIA:'REGENCIA',LALT:'ALT',PAUCLARIS:'CLARIS',BRUIDEU:'BRUDIEU',CONTACT:'COMPTAT',MONTORULL:'MONTURULL',LLESTERIAS:'LLETERIES',LLESTERIES:'LLETERIES',LLETERIAS:'LLETERIES',CORREUS:'CARREUS',DELEGACIO:'DELEGACION',LORRI:'ORRI',RECOGEN:'RECOGE',POLIGONO:'POLIGON',INDUSTRIAL:'POLIGON',PI:'PI'};
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


  const COL = zonaNova.COL;
  const ESP = {
    AGENCIA: { bg: '#1f2a44', fg: '#fff' }, REP: { bg: '#e11d48', fg: '#fff' }, CAMI: { bg: '#f59e0b', fg: '#1d1a0a' },
    LLIURAT: { bg: '#6b7280', fg: '#fff' }, PS: { bg: '#c2185b', fg: '#fff' }, NO: { bg: '#8a94a6', fg: '#fff' }, ERR: { bg: '#b91c1c', fg: '#fff' }
  };
  const SAY = { REA: 'Agència', VERMELL: 'Vermell', VERD: 'Verd', GROC: 'Groc', BLAU: 'Blau', 'ORGANYÀ': 'Organyà', CERDANYA: 'Cerdanya', 'LA FARGA': 'La Farga', 'POLÍGON': 'Polígon' };

  // ================= UTILITATS =================
  const W = window;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dataMs = v => { const ms = +String(v || '').replace(/[^\d]/g, ''); return ms ? new Date(ms) : null; };
  const ddmm = d => d ? String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') : '';
  const hhmm = d => d ? String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') : '';
  const eur = n => (+n || 0).toLocaleString('ca-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  const NOM_ESTAT = { '-10': 'GRABADO', 0: 'MANIFESTADA', 1: 'RETENIDA', 2: 'EN TRÀNSIT', 3: 'EN DELEGACIÓ', 5: 'ANUL·LADA', 6: 'EN REPARTO', 7: 'LLIURAT', 8: 'LLIURAMENT PARCIAL', 9: 'EMMAGATZEMAT', 10: 'DEVOLTA', 11: 'PENDENT DADES', 12: 'DEVOLTA AL CLIENT', 13: 'POSSIBLE DEVOLUCIÓ', 14: 'SOL·LICITUD DEVOLUCIÓ', 15: 'EN DEVOLUCIÓ', 16: 'EN DELEGACIÓ ORIGEN', 17: 'DESTRUÏT', 18: 'RETINGUT ORDRE PAGAMENT', 19: 'EN PLATAFORMA DESTÍ', 20: 'TANCAT SINISTRE', 21: 'RECANALITZADA', 22: 'LLIURAT EN PS', 23: 'DEVOLUCIÓ PREPARADA', 24: 'RECOLLIDA PREPARADA', 25: 'RECEPCIONAT EN PS', 50: 'PRECONFIRMADA', 51: 'LLIURAMENT ANUL·LAT', 90: 'TANCAT', 91: 'AMB INCIDÈNCIA' };
  const PREMIUM = (h, s) => { h = +h; s = +s; if (h === 0 && (s === 1 || s === 8)) return '10:30'; if (h === 2 && [1, 2, 21, 62].includes(s)) return '14H'; return ''; };

  // ================= ATLAS =================
  let TOK = null;
  async function token(nou) {
    if (TOK && !nou) return TOK;
    const t = await (await W.fetch('/shippingfinder/index', { credentials: 'include' })).text();
    const m = t.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/) || t.match(/value="([^"]+)"[^>]*name="__RequestVerificationToken"/);
    if (!m) throw new Error('SESSIO');
    TOK = m[1]; return TOK;
  }
  const BASE = { fltCode: '', fltDateFrom: '', fltDateTo: '', fltOrigin: '', fltPosting: '909', fltHighlighted: 'false', fltRed: '-1', fltTsp: '-1', fltLastStatus: 'true', fltLastIncidence: 'true', fltTypeCode: '0', fltTypeAduanaFile: '-1', page: '1', rows: '20' };
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
  // expedició, codi de barres de l'etiqueta o referència (prova les variants de les etiquetes llargues)
  async function perCodi(code) {
    const n = String(code).toUpperCase().replace(/[^0-9A-Z]/g, '');
    const vs = [n];
    if (/^\d{15,}$/.test(n)) vs.push(n.slice(-14), n.slice(0, 14));
    if (/^\d{13,}$/.test(n)) vs.push(n.slice(-12, -1), n.slice(-11));
    if (/^\d{12}$/.test(n)) vs.push(n.slice(0, 11));
    if (/^0+\d/.test(n)) vs.push(n.replace(/^0+/, ''));
    for (const v of [...new Set(vs)]) {
      const L = await atlas({ fltCode: v });
      if (L.length) return L;
    }
    return [];
  }
  // última lectura de zona del tracking operatiu: a [999], a [Rpt 3], a [700012]...
  async function zonaOP(x) {
    try {
      const r = await W.fetch('/ShippingFinder/GetTrackingOP/?CodExp=' + encodeURIComponent(x.ShippingId) + '&CodPlaza=' + encodeURIComponent(x.SourceSquareId || ''), { credentials: 'include' });
      const j = await r.json(); const L = (j && j.Data) || [];
      for (let i = L.length - 1; i >= 0; i--) {
        const m = String(L[i].evento || '').match(/\ba \[([^\]]+)\]/);
        if (m) { const d = dataMs(L[i].fecha); return { z: m[1].trim(), d }; }
      }
    } catch (e) { }
    return null;
  }

  // ================= DECISIÓ: ON L'HE DE BUSCAR? =================
  function decideix(x, op) {
    const s = +x.StatusId;
    const P = String(x.nombrePSDestino || '').trim();
    const zr = zonaNova(x.PostingAddress, x.PostingCity, x.PostingSourceCode, P) || { z: '?' };
    const zc = zr.z || '?';
    const colorZona = { t: zc === 'REA' ? 'AGÈNCIA' : zc === '?' ? 'ZONA ?' : zc, c: COL[zc] || COL['?'], say: SAY[zc] || '' };
    const opz = op ? op.z : '';
    const opTxt = op ? opz + (op.d ? ' · ' + ddmm(op.d) + ' ' + hhmm(op.d) : '') : '';
    const rpt = opz.match(/^Rpt\s*(\d+)/i);
    const mz = opz.match(/^(?:Zona\s*)?(\d+)$/i); const num = mz ? +mz[1] : null;

    if ([7, 8, 22, 50].includes(s)) return { gran: 'JA LLIURAT', c: ESP.LLIURAT, sub: 'Atlas el dona per lliurat (' + (NOM_ESTAT[s] || s) + ').', say: 'Ja lliurat' };
    if ([-10, 0, 2, 16, 19, 21, 24].includes(s)) return { gran: 'NO HA ARRIBAT', c: ESP.CAMI, sub: 'Encara no és a la nau (' + (NOM_ESTAT[s] || s) + ').' + (x.EstimatedDate ? ' Data prevista: ' + ddmm(dataMs(x.EstimatedDate)) + '.' : ''), say: 'No ha arribat' };
    if (s === 25) return /LOCKER/i.test(P)
      ? { gran: 'LOCKER GLS', c: ESP.PS, sub: 'És al Locker GLS de l\'entrada: el client l\'obre amb el PIN o QR de GLS.', say: 'Locker' }
      : { gran: 'AL PARCELSHOP', c: ESP.PS, sub: 'Recepcionat a ' + P.replace(/^PS\s+/i, '') + '.', say: 'Parcel shop' };
    if ([10, 12, 13, 14, 15, 23, 5, 17, 20, 90, 51].includes(s)) return { gran: 'REVISAR', c: ESP.ERR, sub: 'Estat a Atlas: ' + (NOM_ESTAT[s] || s) + '. Mira la zona de devolucions o pregunta.', say: 'Revisar', alt: colorZona };

    // a la fulla d'un repartidor (no la 10, que és la nau)
    if (rpt && +rpt[1] !== 10 && s === 6)
      return { gran: 'REPARTIDOR R' + rpt[1], c: zc === '?' ? ESP.REP : colorZona.c, sub: 'Assignat a la fulla del R' + rpt[1] + '. Si la furgoneta encara no ha sortit, busca\'l a la zona ' + colorZona.t + '; si ja ha sortit, és a la furgoneta.', say: 'Repartidor ' + rpt[1] + '. ' + colorZona.say, alt: colorZona, op: opTxt };
    // guardat a l'agència: fulla 10 (NAU), 400 emmagatzemat o estanteria
    if ((rpt && +rpt[1] === 10) || s === 9 || num === 400 || (num && num >= 700000))
      return { gran: 'AGÈNCIA', c: ESP.AGENCIA, sub: (s === 9 || num === 400 || (num && num >= 700000) ? 'Emmagatzemat a l\'agència' + (num && num !== 999 && num !== 1000 ? ' (zona ' + num + ')' : '') : 'Fulla 10 · NAU (guardat a l\'agència)') + '.', say: 'Agència', op: opTxt, alt: colorZona };

    // a la nau, classificat per zones de repartiment
    let sub = '';
    if (zr.pt) sub = 'Punt: ' + zr.pt + '. ';
    if (P && !/LOCKER|AGENCIA COLABORADORA/i.test(P)) sub += 'Derivat a ParcelShop ' + P.replace(/^PS\s+/i, '') + '. ';
    if (zc === '?') sub += (zr.alt ? zr.alt + '. ' : '') + 'No reconec el carrer: mira l\'adreça i la zona per carrer. ';
    if (num === 1000) sub += 'Atlas el té a INCIDÈNCIES (1000): pot ser a la gàbia d\'incidències. ';
    if (num === 2000) sub += 'Atlas el té a la 2000 (no accepta / falten dades). ';
    if (s === 91) sub += 'Té una incidència oberta. ';
    return { gran: colorZona.t, c: colorZona.c, sub: sub.trim(), say: colorZona.say || (zc === '?' ? 'Zona no trobada' : ''), op: opTxt };
  }

  // ================= SO I VEU =================
  let soOn = (() => { try { return localStorage.getItem(K_SO) !== '0'; } catch (e) { return true; } })();
  let AC = null;
  function beep(ok) {
    if (!soOn) return;
    try { AC = AC || new AudioContext(); const seq = ok ? [[880, 0], [1320, .12]] : [[300, 0], [220, .2]]; seq.forEach(([f, t]) => { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = f; g.gain.value = .2; o.connect(g); g.connect(AC.destination); o.start(AC.currentTime + t); o.stop(AC.currentTime + t + .14); }); } catch (e) { }
  }
  function parla(t) {
    if (!soOn || !t) return;
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); const vs = speechSynthesis.getVoices(); const v = vs.find(x => /^ca/i.test(x.lang)) || vs.find(x => /^es/i.test(x.lang)); if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'ca-ES'; speechSynthesis.speak(u); } catch (e) { }
  }

  // ================= PANTALLA =================
  const CSS = `
  #zr909{position:fixed;inset:0;z-index:2147483000;background:#eef0f8;font-family:'Segoe UI',Arial,sans-serif;color:#0b1446;display:flex;flex-direction:column}
  #zr909 *{box-sizing:border-box}
  #zr909 header,#zr909 .cerca,#zr909 .llegenda{flex:none}
  #zr909 header{position:static!important;height:auto!important;width:auto!important;top:auto!important;background:#061ab1;color:#fff;display:flex;align-items:center;gap:10px;padding:6px 14px}
  #zr909 header h1{font-size:18px;margin:0;padding:0;flex:1;line-height:1.25;height:auto;color:#fff}#zr909 header h1 b{color:#ffd400}
  #zr909 header button{background:#ffd400;color:#061ab1;border:0;border-radius:8px;padding:5px 10px;font-weight:800;font-size:14px;cursor:pointer}
  #zr909 header button.x{background:#fff2}
  #zr909 .cerca{display:flex;gap:10px;padding:8px 14px}
  #zr909 .cerca input{flex:1;font-size:26px;font-family:Consolas,monospace;padding:7px 14px;border:3px solid #061ab1;border-radius:12px;outline:none;min-width:0}
  #zr909 .cerca button{font-size:22px;font-weight:800;border:0;border-radius:12px;padding:0 26px;background:#061ab1;color:#fff;cursor:pointer}
  #zr909 main{flex:1;display:flex;gap:12px;padding:0 14px 10px;min-height:0}
  #zr909 .res{flex:1;display:flex;flex-direction:column;gap:8px;min-width:0;overflow:auto}
  #zr909 .gran{border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:14px 20px;min-height:min(44vh,360px);flex:none;box-shadow:0 4px 14px #0b144633}
  #zr909 .gran .t1{font-size:clamp(14px,2.6vh,22px);font-weight:700;opacity:.85;text-transform:uppercase;letter-spacing:2px}
  #zr909 .gran .t2{font-size:clamp(44px,min(10vw,17vh),150px);font-weight:900;line-height:1.05;word-break:break-word}
  #zr909 .gran .t3{font-size:clamp(15px,2.8vh,24px);font-weight:600;margin-top:6px;max-width:900px}
  #zr909 .gran .alt{margin-top:8px;font-size:clamp(15px,2.6vh,22px);font-weight:800;border-radius:10px;padding:6px 16px;border:3px solid #fff}
  #zr909 .fit{background:#fff;border-radius:14px;padding:8px 14px;font-size:15px;box-shadow:0 2px 8px #0b144622;line-height:1.5}
  #zr909 .fit .c{font-family:Consolas,monospace;font-weight:800;font-size:19px;color:#061ab1}
  #zr909 .fit .g{color:#5a6290}
  #zr909 .fit.ff{display:flex;align-items:stretch;gap:14px}
  #zr909 .fit .fi{flex:1;min-width:0}
  #zr909 .fpeG{flex:none;width:clamp(220px,36%,520px);border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px 12px;text-align:center;line-height:1.05}
  #zr909 .fpeG .l{font-size:clamp(16px,2.6vh,26px);font-weight:800;letter-spacing:3px;opacity:.9}
  #zr909 .fpeG .d{font-size:clamp(48px,9vh,110px);font-weight:900}
  #zr909 .fpeG .e{font-size:clamp(22px,4vh,44px);font-weight:900;letter-spacing:1px}
  #zr909 .bd{display:inline-block;border-radius:6px;padding:1px 8px;font-size:14px;font-weight:800;color:#fff;background:#7c3aed;margin-left:6px;vertical-align:middle}
  #zr909 .cob{display:inline-block;background:#fff3c4;border-radius:8px;padding:4px 10px;font-weight:800;margin-top:4px;font-size:17px}
  #zr909 .buit{color:#5a6290;font-size:24px;text-align:center;padding:50px 20px;background:#fff;border-radius:18px}
  #zr909 aside{width:250px;flex:none;background:#fff;border-radius:14px;padding:10px;overflow:auto;box-shadow:0 2px 8px #0b144622}
  #zr909 aside h3{margin:4px 6px 8px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#5a6290}
  #zr909 aside div.h{display:flex;align-items:center;gap:8px;padding:7px 6px;border-top:1px solid #eef0f8;cursor:pointer;font-size:14px}
  #zr909 aside div.h i{display:inline-block;width:14px;height:14px;border-radius:4px;flex:none}
  #zr909 aside div.h span{font-family:Consolas,monospace;font-weight:700}
  #zr909 aside div.h small{margin-left:auto;color:#5a6290;white-space:nowrap}
  #zr909 .llegenda{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 8px}
  #zr909 .llegenda b{border-radius:6px;padding:1px 8px;font-size:12px}
  @media (max-height:620px){#zr909 .llegenda{display:none}}
  @media (max-width:900px){#zr909 aside{display:none}}
  `;
  let arrel, inp;
  function munta() {
    if (document.getElementById('zr909')) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    arrel = document.createElement('div'); arrel.id = 'zr909';
    const lleg = ['VERMELL', 'VERD', 'GROC', 'BLAU', 'POLÍGON', 'ORGANYÀ', 'CERDANYA', 'LA FARGA', 'REA'].map(z => `<b style="background:${COL[z].bg};color:${COL[z].fg}">${z === 'REA' ? 'AGÈNCIA' : z}</b>`).join('');
    arrel.innerHTML = `
      <header><h1>On és el paquet? · Recepció GLS <b>909</b></h1><button data-a="so"></button><button class="x" data-a="x" title="Tancar">✕</button></header>
      <div class="cerca"><input id="zr909i" placeholder="Escaneja o escriu el número d'enviament" autocomplete="off" inputmode="numeric"><button data-a="ok">BUSCAR</button></div>
      <div class="llegenda">${lleg}</div>
      <main><div class="res" id="zr909r"><div class="buit">Escaneja l'etiqueta, el codi del SMS o escriu el número d'enviament.</div></div>
      <aside><h3>Últimes consultes</h3><div id="zr909h"></div></aside></main>`;
    document.body.appendChild(arrel);
    inp = arrel.querySelector('#zr909i');
    arrel.querySelector('[data-a="ok"]').onclick = () => busca(inp.value);
    arrel.querySelector('[data-a="x"]').onclick = () => { location.href = '/shippingfinder/index'; };
    const bso = arrel.querySelector('[data-a="so"]');
    const pintaSo = () => bso.textContent = soOn ? '🔊 Veu' : '🔇 Veu';
    pintaSo();
    bso.onclick = () => { soOn = !soOn; try { localStorage.setItem(K_SO, soOn ? '1' : '0'); } catch (e) { } pintaSo(); if (soOn) { beep(true); parla('Veu activada'); } inp.focus(); };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); busca(inp.value); } });
    arrel.querySelector('#zr909h').onclick = e => { const d = e.target.closest('.h'); if (d) busca(d.dataset.c); };
    // el cursor sempre torna al camp perquè la pistola llegeixi
    document.addEventListener('click', () => setTimeout(() => { if (!window.getSelection().toString()) inp.focus(); }, 50));
    setInterval(() => { if (document.activeElement !== inp && !document.hidden) inp.focus(); }, 3000);
    pintaHist(); inp.focus();
  }

  function hist() { try { return JSON.parse(localStorage.getItem(K_HIST) || '[]'); } catch (e) { return []; } }
  function desaHist(h) {
    const L = hist().filter(x => x.c !== h.c); L.unshift(h);
    try { localStorage.setItem(K_HIST, JSON.stringify(L.slice(0, 40))); } catch (e) { }
    pintaHist();
  }
  function pintaHist() {
    const H = arrel && arrel.querySelector('#zr909h'); if (!H) return;
    const L = hist();
    H.innerHTML = L.length ? L.map(h => `<div class="h" data-c="${esc(h.c)}"><i style="background:${esc(h.bg)}"></i><span>${esc(h.c)}</span><b>${esc(h.g)}</b><small>${esc(h.h)}</small></div>`).join('') : '<div class="h" style="cursor:default;color:#5a6290">Encara cap</div>';
  }

  function blocGran(r, n, tot) {
    return `<div class="gran" style="background:${r.c.bg};color:${r.c.fg}">
      <div class="t1">${tot > 1 ? 'Enviament ' + n + ' de ' + tot + ' · ' : ''}Busca'l a</div>
      <div class="t2">${esc(r.gran)}</div>
      ${r.sub ? `<div class="t3">${esc(r.sub)}</div>` : ''}
      ${r.alt && r.alt.t !== r.gran ? `<div class="alt" style="background:${r.alt.c.bg};color:${r.alt.c.fg};border-color:${r.c.fg}">Zona per adreça: ${esc(r.alt.t)}</div>` : ''}
    </div>`;
  }
  function fpeVeu(x) {
    const fd = dataMs(x.EstimatedDate); if (!fd) return '';
    const h = new Date(); h.setHours(0,0,0,0); const d0 = new Date(fd); d0.setHours(0,0,0,0); const dif = Math.round((d0 - h) / 864e5);
    return dif < 0 ? 'FPE vençuda' : dif === 0 ? 'FPE avui' : dif === 1 ? 'FPE demà' : 'FPE dia ' + d0.getDate();
  }
  function fitxa(x, r) {
    const cob = (+x.CashOnDelivery || 0) + (+x.Due || 0);
    const prem = PREMIUM(x.Schedule, x.ServiceId);
    const fd = dataMs(x.EstimatedDate); let fpeH = '';
    if (fd) { const h = new Date(); h.setHours(0,0,0,0); const d0 = new Date(fd); d0.setHours(0,0,0,0); const dif = Math.round((d0 - h) / 864e5);
      const [et, bg, fg] = dif === 0 ? ['AVUI', '#d7261e', '#fff'] : dif < 0 ? ['VENÇUDA', '#7a0b0b', '#fff'] : [dif === 1 ? 'DEMÀ' : 'FUTURA', '#dfe6fb', '#061ab1'];
      fpeH = `<div class="fpeG" style="background:${bg};color:${fg}"><div class="l">FPE</div><div class="d">${ddmm(fd)}</div><div class="e">${et}</div></div>`; }
    else fpeH = `<div class="fpeG" style="background:#eceef4;color:#555"><div class="l">FPE</div><div class="e">SENSE DATA</div></div>`;
    return `<div class="fit ff"><div class="fi">
      <span class="c">${esc(x.ShippingId)}</span>${prem ? `<span class="bd">${prem}</span>` : ''} · <b>${+x.Packages || '?'} bult${+x.Packages === 1 ? '' : 's'}</b> · ${String(+x.Kgs || 0).replace('.', ',')} kg · <span class="g">${esc(NOM_ESTAT[x.StatusId] || x.StatusId)}</span>
      <div><b>${esc(String(x.PostingName || '').trim())}</b></div>
      <div class="g">${esc(String(x.PostingAddress || '').trim())} · ${esc(String(x.PostingCity || '').trim())}${x.SourceName ? ' · Rem.: ' + esc(String(x.SourceName).trim()) : ''}</div>
      ${r.op ? `<div class="g">Última lectura a Atlas: <b>${esc(r.op)}</b></div>` : ''}
      ${cob > 0 ? `<div class="cob">💶 Cobrar ${eur(cob)}${+x.CashOnDelivery > 0 ? ' (reemborsament ' + eur(x.CashOnDelivery) + ')' : ''}${+x.Due > 0 ? ' (ports deguts ' + eur(x.Due) + ')' : ''}</div>` : ''}
      </div>${fpeH}
    </div>`;
  }

  let cercant = false;
  async function busca(v) {
    const code = String(v || '').trim();
    inp.value = ''; inp.focus();
    if (cercant) return;
    const R = arrel.querySelector('#zr909r');
    if (code.replace(/\D/g, '').length < 6 && code.replace(/[^0-9A-Z]/gi, '').length < 6) { R.innerHTML = blocGran({ gran: 'NÚMERO CURT', c: ESP.NO, sub: 'Escaneja l\'etiqueta o escriu el número sencer.' }); beep(false); return; }
    cercant = true;
    R.innerHTML = `<div class="buit">Buscant <b>${esc(code)}</b> a Atlas…</div>`;
    try {
      let L = await perCodi(code);
      // el mateix enviament pot sortir repetit (bults): un per expedició
      const vist = new Set(); L = L.filter(x => { const k = String(x.ShippingId); if (vist.has(k)) return false; vist.add(k); return true; }).slice(0, 4);
      if (!L.length) {
        R.innerHTML = blocGran({ gran: 'NO TROBAT', c: ESP.NO, sub: 'Atlas no troba cap enviament de la 909 amb ' + code + '. Revisa el número o busca\'l amb el client.' });
        beep(false); parla('No trobat'); desaHist({ c: code, g: 'NO TROBAT', bg: ESP.NO.bg, h: hhmm(new Date()) });
        return;
      }
      const ops = await Promise.all(L.map(zonaOP));
      const rs = L.map((x, i) => decideix(x, ops[i]));
      R.innerHTML = L.map((x, i) => blocGran(rs[i], i + 1, L.length) + fitxa(x, rs[i])).join('');
      beep(true);
      parla(rs.map((r, i) => [r.say, r.gran === 'JA LLIURAT' ? '' : fpeVeu(L[i])].filter(Boolean).join('. ')).filter(Boolean).join('. '));
      L.forEach((x, i) => desaHist({ c: String(x.ShippingId), g: rs[i].gran, bg: rs[i].c.bg, h: hhmm(new Date()) }));
    } catch (e) {
      const ses = String(e && e.message) === 'SESSIO';
      R.innerHTML = blocGran({ gran: ses ? 'ENTRA A ATLAS' : 'ERROR', c: ESP.ERR, sub: ses ? 'La sessió d\'Atlas ha caducat: torna a entrar amb l\'usuari de l\'agència. Després es reobre sola aquesta pantalla.' : 'No s\'ha pogut consultar Atlas (' + (e && e.message || e) + '). Torna-ho a provar.' });
      beep(false);
      if (ses) setTimeout(() => location.href = '/shippingfinder/index?zona909', 2500);
    } finally { cercant = false; }
  }

  // ================= ARRENCADA =================
  W.__zr909 = { zonaNova, decideix };
  const go = () => { if (document.body) munta(); else setTimeout(go, 50); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
