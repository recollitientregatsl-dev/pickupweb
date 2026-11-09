// ==UserScript==
// @name         Tancament 909 (boto Atlas)
// @namespace    recollit-entregat-909
// @version      1.24
// @description  Tancament diari Atlas agencia 909: boto Executar/Simular
// @match        https://atlas.gls-spain.es/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://pickuppointandorra.com/tm/tancament909.user.js
// @downloadURL  https://pickuppointandorra.com/tm/tancament909.user.js
// ==/UserScript==

const TANC909=function(){
const S=window.TANC={v:'1.24',res:null,step:'',running:false,done:new Set()};
const sl=ms=>new Promise(r=>setTimeout(r,ms));
const z=n=>String(n).padStart(2,'0');
const avui=()=>{const d=new Date();return z(d.getDate())+'/'+z(d.getMonth()+1)+'/'+d.getFullYear();};
const ymd=s=>{const p=String(s||'').split(' ')[0].split('/');return p.length===3?p[2]+p[1]+p[0]:'';};
let T='',TT='',R=null,vt=false;
const rows=()=>[...document.querySelectorAll('tr')].filter(r=>r.cells.length>15&&/^\d{9,}/.test((r.cells[6]?.innerText||'').trim()));
const ex=r=>r.cells[6].innerText.trim();
const row=e=>rows().find(r=>ex(r)===e);
const blue=r=>{if(/background-color-3/.test(r.className))return true;
const m=(getComputedStyle(r.cells[6]).color.match(/\d+/g)||[0,0,0]).map(Number);return m[2]>130&&m[2]>m[0]+40;};
const info=r=>{const inc=r.cells[20].innerText.trim();return {e:ex(r),f:r.cells[7].innerText.trim(),inc,del:/^\d\d\/\d\d\/\d{4} \d\d:\d\d/.test(inc),b:blue(r),hr:r.cells[3].innerText.trim(),srv:r.cells[4].innerText.trim(),dst:r.cells[5].innerText.trim(),fe:(r.cells[21]?.innerText||'').trim(),cli:(r.cells[24]?.innerText||'').trim(),nc:(r.cells[25]?.innerText||'').trim()};};
const PLA={'562':'Andorra','763':'Sabadell (a confirmar)'};
const dies=d=>{const y=ymd(d);if(!y)return '?';const a=new Date(+y.slice(0,4),+y.slice(4,6)-1,+y.slice(6));return Math.round((new Date().setHours(0,0,0,0)-a)/864e5);};
const isPk=x=>/^909-5$/.test(x.cli)||/^PICKUP/i.test(x.nc);
const ECO=x=>x.hr==='18'&&x.srv==='37';
const ATT=/^(AUSENTE|PUNTO ENTREGA NO DISPONIBLE)/i;
const EXPR=x=>x.hr==='0'||x.hr==='2';
const OBSE='AGOTADOS INTENTOS DESTINATARIO TIENE 10 DIAS PARA RECOGER EN AGENCIA';
const shn=l=>{const h=hoja(),d=(ttl(l).match(/\d\d\/\d\d\/\d{4}/)||[''])[0];return pre(l)+(h?' f.'+h:'')+(d?' '+d:'');};
const rI=sh=>rows().map(info).filter(x=>{if(S.wh&&!S.wh[x.e])S.wh[x.e]={K:S.cK,g:S.cG,sh,inc:x.inc,del:x.del,pk:isPk(x),rng:(S.rng||[]).join('-')};if(S.done.has(x.e))return false;if(x.dst&&x.dst!=='909'){const n=dies(x.fe);add('malc',x.e+' Dst '+x.dst+(PLA[x.dst]?' '+PLA[x.dst]:'')+' - '+n+' dies - '+sh+(n>2?' !!':''));dn(x.e);return false;}if(isPk(x)){if(!x.del)add('pick',x.e+' '+(x.inc||'sense incidencia')+' '+sh);dn(x.e);return false;}return true;});
const nm=l=>l.innerText.replace(/\s+/g,'');
const cnt=l=>+((nm(l).match(/\[(\d+)\]$/)||[0,0])[1]);
const ttl=l=>(l.title||'').replace(/\s+/g,' ').trim();
const lis=()=>[...document.querySelectorAll('li')].filter(l=>l.innerText.length<40&&/^[RZL]\d+.*\[\d+\]$/.test(nm(l)));
const cat=l=>{const n=nm(l),t=ttl(l).toUpperCase();if(/^R\d/.test(n))return 'R';if(/^Z1000\[/.test(n))return 'Z1000';if(/^Z2000\[/.test(n))return 'Z2000';if(/REA GRANS|ESTANT|RECOGEN EN/.test(t))return 'REA';if(/NAU RECOLLIT/.test(t))return 'NAU';if(/LECTURA DE LLEGADA|VERDE|ROJO|AMARILLO|AZUL|CERDANYA|ORGANYA|FARGA|ENVIOS EXTRA/.test(t))return 'ARR';return 'ALT';};
const pre=l=>nm(l).split('[')[0];
const key=l=>{const all=lis().filter(x=>pre(x)===pre(l)&&ttl(x)===ttl(l));return {pre:pre(l),t:ttl(l),k:all.indexOf(l),n:nm(l)};};
const fl0=K=>{const all=lis().filter(x=>pre(x)===K.pre&&ttl(x)===K.t);return all[K.k]||all[0];};
const fl=async K=>{let l=fl0(K);if(l)return l;
S.step='refresc llista fulles';await S.prep();l=fl0(K);if(l)return l;await sl(3000);return fl0(K);};
const hoja=()=>(document.body.innerText.match(/Hoja de reparto: ?(\d+)/)||[])[1];
async function openLi(l){const h0=hoja();l.click();for(let t=0;t<40;t++){await sl(600);
const h=hoja(),m=(document.body.innerText.match(/Env\u00edos: ?(\d+)/)||[])[1],n=rows().length;if(h&&h!==h0&&m!==undefined&&+m===n){await sl(500);return n>0;}}return false;}
const toast=()=>[...document.querySelectorAll('[class*=toast]')].map(x=>x.innerText).join('|');
async function wt(){for(let t=0;t<15&&document.querySelectorAll('.toast').length;t++)await sl(400);}
async function sel(r){jQuery(r.cells[3]).trigger('click');await sl(1000);}
const btn=re=>[...document.querySelectorAll('button')].find(b=>b.offsetParent&&re.test(b.innerText));
const rw=async e=>{for(let t=0;t<10;t++){const r=row(e);if(r)return r;await sl(800);}return null;};
async function assign(e,rep){const r=await rw(e);if(!r)return 'NO TROBAT';if(S.dry)return 'OK';await wt();await sel(r);
const i=document.getElementById('nr-asigrep');i.focus();i.value=rep;jQuery(i).trigger(jQuery.Event('keyup',{keyCode:48,which:48})).trigger('change');await sl(300);jQuery(i.parentElement.querySelector('.input-group-addon')).trigger('click');await sl(2500);return /correctamente/.test(toast())?'OK':'ERR';}
const modal=()=>!!document.getElementById('ni-incidenceType')?.offsetParent;
const dmy=d=>z(d.getDate())+'/'+z(d.getMonth()+1)+'/'+d.getFullYear();
const nextWD=()=>{const d=new Date();do d.setDate(d.getDate()+1);while(d.getDay()===0||d.getDay()===6);return dmy(d);};
async function psol(sol,dt){const v=window.my&&my.vmincidence;let req=false;for(let t=0;t<8;t++){req=!!(v&&v.requiresProvidedSolution&&v.requiresProvidedSolution())||!!document.getElementById('ni-providedSolution')?.offsetParent;if(req)break;await sl(200);}if(!req)return true;sol=sol||51;const ps=document.getElementById('ni-providedSolution');if(v&&v.providedSolutionId)v.providedSolutionId(sol);if(ps){ps.value=String(sol);jQuery(ps).trigger('change');}await sl(400);if(sol===50){const ds=dt||nextWD();const di=document.getElementById('ni-providedDeliveryDate');try{const pk=jQuery('#providedDeliveryDate').data('DateTimePicker');if(pk&&window.moment)pk.date(moment(ds,'DD/MM/YYYY'));}catch(e){}if(di){di.value=ds;jQuery(di).trigger('change');}await sl(300);if(!di||di.value!==ds)return false;}return v&&v.providedSolutionId?v.providedSolutionId()===sol:true;}
async function grab(e,code,obs,inc,sol,dt){const r=await rw(e);if(!r)return 'NO TROBAT';if(inc&&(PARC.test(r.cells[20].innerText)||(S.ev[e]||[]).some(v=>PARC.test(v.x))))return 'PARCIAL';if(S.dry)return 'OK';await sel(r);
const a=[...document.querySelectorAll('a')].find(a=>/^\s*Incidencias\s*$/.test(a.innerText));if(!a)return 'NO MENU';a.click();for(let t=0;t<15&&!modal();t++)await sl(400);if(!modal())return 'NO MODAL';await sl(400);
const ci=document.getElementById('chkIncidence'),cs=document.getElementById('chkSolution');if(ci.checked!==inc){ci.click();await sl(400);}if(cs.checked!==!inc){cs.click();await sl(400);}const s=document.getElementById('ni-incidenceType');
const o=[...s.options].find(o=>code instanceof RegExp?code.test(o.text):o.text.startsWith(code));if(!o){btn(/Cancelar/)?.click();await sl(800);return 'NO PERMES';}s.value=o.value;jQuery(s).trigger('change');await sl(300);if(inc&&/^I - (96|81) -/.test(o.text.trim())&&!await psol(sol,dt)){btn(/Cancelar/)?.click();await sl(800);return 'NO SOLUCIO';}
const io=document.getElementById('ni-observations');io.value=obs||'';jQuery(io).trigger('input').trigger('change');
const gb=btn(/Guardar/);if(!gb){btn(/Cancelar/)?.click();await sl(800);return 'NO GUARDAR';}gb.click();for(let t=0;t<15&&modal();t++)await sl(500);await sl(1200);if(modal()){btn(/Cancelar/)?.click();await sl(800);return 'ERR';}return 'OK';}
async function elim(e){const r=await rw(e);if(!r)return 'NO TROBAT';if(S.dry)return 'OK';await wt();await sel(r);
const oc=window.confirm;window.confirm=()=>true;
const a=[...document.querySelectorAll('a')].find(a=>/^\s*Eliminar de reparto\s*$/.test(a.innerText));if(!a){window.confirm=oc;return 'NO MENU';}a.click();await sl(2500);window.confirm=oc;return /eliminad/i.test(toast())?'OK':'ERR';}
const tt=()=>{const t=document.body.innerText;
const i=t.lastIndexOf('Seguimiento');return i<0?'':t.slice(i).split('Condiciones Generales')[0];};
function parse(x){const L=x.split('\n').map(s=>s.trim()).filter(Boolean),ev=[];for(let i=0;i<L.length;i++){const k=L[i].replace(/^[^A-Z]+/,''),d=L[i+1]||'',y=L[i+3]||'';if(!/^\d\d\/\d\d\/\d{4}/.test(d))continue;if(k==='INCIDENCIA')ev.push({t:'I',d,x:y});else if(k==='SOLUCION')ev.push({t:'S',d,x:y});else if(k==='ENTREGA'||(k==='ESTADO'&&/DEVUELTA AL CLIENTE|^ENTREGADO/.test(y)))ev.push({t:'E',d,x:y});else if(k==='ESTADO'&&/^EN DEVOLUCI/.test(y))ev.push({t:'D',d,x:y});else if(k==='ESTADO'&&/^EN REPARTO/.test(y))ev.push({t:'P',d,x:y});}return ev;}
async function trk(e){const r=await rw(e);if(!r)return null;
const b0=tt();jQuery(r.cells[3]).trigger('click');let x='';for(let k=0;k<25;k++){await sl(300);x=tt();if(x&&x!==b0&&/Tracking/.test(x)&&/\d\d\/\d\d\/\d{4}/.test(x))break;if(k===6&&!x){[...document.querySelectorAll('button,a')].find(b=>/Ver Tracking/.test(b.innerText))?.click();await sl(1500);jQuery(r.cells[3]).trigger('click');}}if(!x||x===b0){add('exc',e+' sense tracking');return null;}await sl(250);
const raw=tt();if(/SOLICITUD DE DEVOLUCI/i.test(raw)&&!R.dsol.includes(e))add('dsol',e);
const pe=parse(raw);S.ev[e]=pe;return pe;}
const stt=ev=>{const is=ev.filter(x=>x.t==='I'||x.t==='S'),l=is[is.length-1],kp=ev.filter(x=>x.t==='P').map(x=>tk(x.d)).sort().pop()||'';return {incT:ev.some(x=>x.t==='I'&&x.d.startsWith(T)&&tk(x.d)>=kp),last:l,del:ev.some(x=>x.t==='E'&&!/DEVUELTA/.test(x.x)),dev:ev.some(x=>x.t==='D'||/DEVUELTA AL CLIENTE/.test(x.x)),s51:ev.some(x=>x.t==='S'&&/PASARAN A RECOGER|RECOGERAN EN AGENCIA/.test(x.x))};};
const add=(k,v)=>R[k].push(v);
const EDS=/ENTREGA DIA SIGUIENTE|EN RUTA|ENTREGAR HOY/i,tk=d=>ymd(d)+String(d).slice(11,19);
const sosp=ev=>{const s0=ev.find(v=>v.t==='S'&&EDS.test(v.x));if(!s0)return null;const k0=tk(s0.d);if(ev.some(v=>v.t==='P'&&tk(v.d)>=k0))return null;const ds=new Set(ev.filter(v=>v.t==='I'&&tk(v.d)>=k0).map(v=>ymd(v.d)));return ds.size>=2?{n:ds.size,d0:s0.d.slice(0,5)}:null;};
const dn=e=>S.done.add(e);
const R1000=/^(AUSENTE|CAUSA DE FUERZA MAYOR|PUNTO ENTREGA NO DISPONIBLE|FACILITADA SOLUCION.*|NO TIENE DINERO|RETORNO NO PREPARADO)$/,R2000=/^(NO ACEPTA|FALTAN DATOS|DIRECCI[O\u00d3]N INCORRECTA)/,STORE=/LOC-|MAGATZEM|RACO|ALMACENADO/;
const PARC=/FALTA[N]? BULTOS|ENTREGA PARCIAL/i,DET=/DETERIORAD/,NOTOUCH=/(^|\D)(707070|808080|818181|828282|838383|848484|858585)(\D|$)/,PS=/PARCEL ?SHOP/i;
const nd=s=>!!(s.last&&s.last.t==='S'&&!/PASARAN A RECOGER|RECOGERAN EN AGENCIA/.test(s.last.x));
const OBS2='AGOTADOS INTENTOS. DESTINATARIO TIENE 10 DIAS PARA RECOGER EL ENVIO';
const FT=/FALTA DE TIEMPO/i,TRANS=/RETRASO EN RUTA/i;
const lastFT=ev=>{const i=ev.filter(v=>v.t==='I').pop();return !!i&&FT.test(i.x);};
async function to(e,rep,sh){const a=await assign(e,rep);if(a==='OK'){add(rep==='1000'?'a1000':'a2000',e);dn(e);S.mv&&S.mv.add(e);}else add('err',e+' ->'+rep+' '+a+' '+sh);}
const pc=(g,e,sh)=>{if(g!=='PARCIAL')return false;add('parc',e+' '+sh);dn(e);return true;};
const isParc=(x,ev)=>PARC.test(x.inc||'')||(ev||[]).some(v=>PARC.test(v.x));
async function elimDel(x,sh){const ev=await trk(x.e);if(!ev)return;if(isParc(x,ev)){add('parc',x.e+' parcial '+sh);return to(x.e,'1000',sh);}const r=await elim(x.e);if(r==='OK'){add('elim',x.e+' '+sh);dn(x.e);}else add('err',x.e+' eliminar '+r+' '+sh);}
async function i93(e,obs,sh,rep){const g=await grab(e,'I - 93 -',obs,true);if(pc(g,e,sh))return false;if(g!=='OK'){add(g==='NO PERMES'?'exc':'err',e+' I93 '+(g==='NO PERMES'?'no permesa (entregat?)':g)+' '+sh);return false;}add('i93',e);dn(e);if(rep)await to(e,'1000',sh);return true;}
async function s51(e,obs,sh){const g=await grab(e,'S - 51 -',obs,false);if(g==='NO PERMES'){const ev=S.ev[e]||await trk(e);if(ev&&stt(ev).s51){add('s51',e+' (ja tenia REA)');dn(e);return;}}if(g==='OK'){add('s51',e);dn(e);}else add(g==='NO PERMES'?'exc':'err',e+' S51 '+(g==='NO PERMES'?'no permesa':g)+' '+sh);}
async function aus2(x,sh){if(EXPR(x)){const ev=await trk(x.e);if(!ev)return;const a=ev.filter(v=>v.t==='I'&&/^AUSENTE/.test(v.x));if(a.length>=2&&a[a.length-1].d.slice(0,10)===a[a.length-2].d.slice(0,10)){add('exp2',x.e+' '+(x.hr==='0'?'10:30':'14h')+' 2 ausentes el '+a[a.length-1].d.slice(0,5)+': sense S-51, a 1000 '+sh);return to(x.e,'1000',sh);}}return s51(x.e,OBS2,sh);}
async function eco(x,sh,mv){let g=await grab(x.e,'S - 51 -',OBSE,false);if(g==='NO PERMES'){const a=await grab(x.e,'I - 96 -',OBSE,true,51);g=a==='OK'?'OK':'I96 '+a;}if(g==='OK'){add('eco',x.e+' '+sh);dn(x.e);if(mv)await to(x.e,'1000',sh);}else add(g==='NO PERMES'?'exc':'err',x.e+' Economy S51 '+g+' '+sh);}
async function inc93(x,obs,sh,rep){const y=ymd(x.f);if(!y||y>TT){add('fut',x.e+' '+sh);return false;}if(y<TT){const ev=await trk(x.e);if(!ev)return false;
const s=stt(ev);if(s.del){add('exc',x.e+' entregat i encara a '+sh);return false;}if(s.incT)return false;if(!nd(s)){add('pas',x.e+' FPE '+x.f.slice(0,5)+' '+sh);return false;}}return i93(x.e,obs,sh,rep);}
async function det(x,sh){const y=ymd(x.f);if(!y||y>TT){add('exc',x.e+' DETERIORADO FPE futura: nomes a 2000 '+sh);return to(x.e,'2000',sh);}const g=await grab(x.e,/NO ACEPTA EXPEDICI/i,'',true);if(pc(g,x.e,sh))return;if(g!=='OK'){add(g==='NO PERMES'?'exc':'err',x.e+' NO ACEPTA '+g+' '+sh);return;}add('det',x.e);await to(x.e,'2000',sh);}
async function rea(e,sh){const g=await grab(e,'I - 96 -','',true,51);if(pc(g,e,sh))return;if(g==='OK'){add('rea',e);dn(e);}else add(g==='NO PERMES'?'exc':'err',e+' I96 REA '+g+' '+sh);}
async function fxt(e,obs,sh,rep){const g=await grab(e,'I - 93 -',obs,true);if(pc(g,e,sh))return;if(g==='OK'){add('ft',e);dn(e);}else add(g==='NO PERMES'?'exc':'err',e+' FALTA DE TIEMPO->I93 '+g+' '+sh);if(rep)await to(e,'1000',sh);}
async function incR(x,obs,sh){const y=ymd(x.f);if(y&&y<TT){const ev=await trk(x.e);if(!ev){add('exc',x.e+' FPE passada sense tracking, no tocat '+sh);return;}const s=stt(ev);if(s.del){add('exc',x.e+' entregat i encara a '+sh);return;}if(s.incT)return to(x.e,'1000',sh);}return i93(x.e,obs,sh,true);}
const PSH=x=>x.hr==='19'||PS.test(x.hr||'');
async function qSin(){const tk=document.querySelector('input[name=__RequestVerificationToken]');if(!tk)throw new Error('sense token Atlas');const p=new URLSearchParams({entOrdinaria:true,fhasta:'',fdesde:'',fpedesde:T,fpehasta:T,entDomiciliaria:true,entCampanas:true,entGrandesSuperficies:true,Cliente:'',destino:'909',Repartidor:'',prodPropio:'',resumen:false,detalle:true,agrupar:3,informe:5,Zona0:true,Zona1:true,Zona2:true,SinAtributos:'',fechavista:'',codred:'',columnas:'9',itemsResultManagementZzDetalle:'',itemsResultManagementZzResumen:'',PSEnVuelo:true,__RequestVerificationToken:tk.value});const r=await fetch('/ManagementZz/GetInformesManagementZ',{method:'POST',body:p.toString(),headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','X-Requested-With':'XMLHttpRequest'}});if(!r.ok)throw new Error('HTTP '+r.status);const j=await r.json();if(typeof j==='string')throw new Error(j.slice(0,80));return j.ManagmentZzDetalle||[];}
async function sinInf(o){const L=await qSin();if(!L.length)return;const fet=new Set();
for(const d of L){const e=String(d.codexp),w=S.wh[e];if(!w||!w.K||w.pk||w.del||w.inc||S.mv.has(e)||!['R','ARR','Z1000','ALT'].includes(w.g)||w.rng!==T+'-'+T)continue;
S.step='Sin inf. '+e;const l=await fl(w.K);if(!l)continue;if(!row(e)&&!await openLi(l))continue;if(!row(e))continue;
const mv=!(w.g==='ALT'&&STORE.test(String(w.K.t).toUpperCase()));if(await i93(e,o.motiuZ,'Sin inf. '+w.sh,mv)){fet.add(e);add('sinfOk',e+' '+w.sh+(S.dry?' (simulacio)':''));}}
let F2=L.filter(d=>!fet.has(String(d.codexp)));if(fet.size&&!S.dry){await sl(2000);try{F2=await qSin();}catch(err){}}
for(const d of F2){const e=String(d.codexp),w=S.wh[e];add('sinf',e+(String(d.horario)==='19'?' PARCEL SHOP':'')+' estat '+d.codestado+' - '+(w?w.sh+(w.inc?' ('+w.inc+')':''):'no vist a cap fulla del tancament')+(d.incidencia?' - ult. inc. '+String(d.incidencia).slice(0,30):''));}}
const F={
R:async(l,o)=>{const sh=shn(l);for(const x of rI(sh)){if(x.del||S.done.has(x.e))continue;
S.step=sh+' '+x.e;if(FT.test(x.inc)){await fxt(x.e,o.motiuR,sh,true);continue;}if(DET.test(x.inc)){await det(x,sh);continue;}if(R2000.test(x.inc)){await to(x.e,'2000',sh);continue;}if(PARC.test(x.inc)){add('parc',x.e+' '+sh);await to(x.e,'1000',sh);continue;}if(!x.inc||TRANS.test(x.inc)){await incR(x,o.motiuR,sh);continue;}if(ECO(x)&&ATT.test(x.inc)){await eco(x,sh,true);continue;}if(R1000.test(x.inc)){await to(x.e,'1000',sh);continue;}if(x.inc==='AUSENTE SEGUNDA VEZ'){await aus2(x,sh);continue;}add('exc',x.e+' '+x.inc+' '+sh);}await sl(1500);for(const x of rows().map(info))if(!x.del&&!S.done.has(x.e)&&!R.exc.some(s=>s.startsWith(x.e)))add('resR',x.e+' '+(x.inc||'sense incidencia')+' '+sh);},
ARR:async(l,o)=>{const sh=shn(l);for(const x of rI(sh)){if(S.done.has(x.e))continue;
S.step=sh+' '+x.e;
const y=ymd(x.f),le=!!y&&y<=TT;if(x.del){if(/^Z999(\D|$)/.test(sh))await elimDel(x,sh);else if(le)add('exc',x.e+' entregat i encara a '+sh);continue;}if(PARC.test(x.inc)){add('parc',x.e+' '+sh);await to(x.e,'1000',sh);continue;}if(FT.test(x.inc)){await fxt(x.e,o.motiuZ,sh,true);continue;}if(DET.test(x.inc)){await det(x,sh);continue;}if(!x.inc){if(le)await inc93(x,o.motiuZ,sh,true);continue;}if(ECO(x)&&ATT.test(x.inc))await eco(x,sh,true);else if(R2000.test(x.inc))await to(x.e,'2000',sh);else if(x.inc==='AUSENTE SEGUNDA VEZ')await aus2(x,sh);else if(R1000.test(x.inc)){if(le){const ev=await trk(x.e);if(!ev)continue;
const s=stt(ev);if(!s.incT&&(y===TT||nd(s))&&!await i93(x.e,o.motiuZ,sh,false))continue;}await to(x.e,'1000',sh);}else add('exc',x.e+' '+x.inc+' '+sh);}
if(/^Z999(\D|$)/.test(sh)){await sl(1200);for(const x of rows().map(info))if(!x.del&&PSH(x)&&!isPk(x)&&!S.mv.has(x.e)&&!R.ps999.some(s=>s.startsWith(x.e+' ')))add('ps999',x.e+' FPE '+x.f.slice(0,5)+' ('+dies(x.f)+' d) - '+(x.inc||'sense incidencia')+' - '+sh);}},
NAU:async(l,o)=>{const sh=shn(l);for(const x of rI(sh)){if(x.del||S.done.has(x.e))continue;if(FT.test(x.inc)){S.step=sh+' '+x.e;await fxt(x.e,o.motiuZ,sh,true);continue;}if(x.inc)continue;if(ymd(x.f)>TT){add('fut',x.e+' '+sh);continue;}S.step=sh+' '+x.e;await rea(x.e,sh);}},
ALT:async(l,o)=>{const sh=shn(l)+' '+ttl(l).slice(0,18);
const mv=!STORE.test(ttl(l).toUpperCase());for(const x of rI(sh)){if(x.del||S.done.has(x.e))continue;
const y=ymd(x.f);if(!y||y>TT)continue;
S.step=sh+' '+x.e;if(FT.test(x.inc)){await fxt(x.e,o.motiuZ,sh,mv);continue;}if(y<TT&&x.inc)continue;
const ev=await trk(x.e);if(!ev)continue;
const s=stt(ev);if(s.del){add('exc',x.e+' entregat i encara a '+sh);continue;}if(s.incT)continue;if(y<TT&&!nd(s)){add('pas',x.e+' FPE '+x.f.slice(0,5)+' '+sh);continue;}if(await i93(x.e,o.motiuZ,sh,mv)&&!mv)add('exc',x.e+' I93 posada, no moguda (magatzem) '+sh);}},
REA:async(l,o)=>{const sh=shn(l)+' '+ttl(l).slice(0,18);for(const x of rI(sh)){if(x.del||S.done.has(x.e))continue;if(ymd(x.f)>TT){add('fut',x.e+' '+sh);continue;}S.step=sh+' '+x.e;
const ev=await trk(x.e);if(!ev)continue;
const s=stt(ev);if(s.del){add('exc',x.e+' entregat i encara a '+sh);continue;}const fT=ymd(x.f)===TT;if(s.s51&&!(fT&&!s.incT))continue;if(s.last&&s.last.t==='S'&&!/PASARAN A RECOGER|RECOGERAN EN AGENCIA/.test(s.last.x)&&s.last.d.startsWith(T)){add('exc',x.e+' sol. avui: '+s.last.x.slice(0,40)+' '+sh);continue;}await rea(x.e,sh);}},
Z2000:async(l,o)=>{for(const x of rI('Z2000')){if(x.del||S.done.has(x.e)||ymd(x.f)!==TT)continue;
S.step='Z2000 '+x.e;
const ev=await trk(x.e);if(!ev)continue;
const s=stt(ev);if(s.del)continue;if(FT.test(x.inc)||lastFT(ev)){await fxt(x.e,o.motiuZ,'Z2000',false);continue;}if(s.incT)continue;await i93(x.e,o.motiuZ,'Z2000',false);}},
Z1000:async(l,o)=>{for(const x of rI('Z1000')){const y=ymd(x.f);if(S.done.has(x.e)||!y||y>TT)continue;
S.step='Z1000 '+x.e;if(R2000.test(x.inc)){await to(x.e,'2000','Z1000');continue;}if(DET.test(x.inc)){await det(x,'Z1000');continue;}const ev=await trk(x.e);if(!ev)continue;
const s=stt(ev);if(s.dev){const r=await elim(x.e);r==='OK'?add('elim',x.e):add('err',x.e+' eliminar '+r);continue;}if(s.del){if(isParc(x,ev)){add('parc',x.e+' parcial, es queda a Z1000');dn(x.e);}else{const r=await elim(x.e);if(r==='OK'){add('elim',x.e+' Z1000');dn(x.e);}else add('err',x.e+' eliminar '+r+' Z1000');}continue;}if(ECO(x)&&!s.s51&&ev.some(v=>v.t==='I'&&ATT.test(v.x))){await eco(x,'Z1000',false);continue;}if(FT.test(x.inc)||lastFT(ev)){await fxt(x.e,o.motiuZ,'Z1000',false);continue;}if(s.incT){if(s.last&&s.last.t==='S'&&s.last.d.startsWith(T))add('sol',x.e+': '+s.last.x.replace(/\{[^}]*\}/g,'').replace(/\s+/g,' ').slice(0,70));continue;}if(PS.test(x.inc)||ev.some(v=>PS.test(v.x))){const g=await grab(x.e,'I - 96 -','SACAMOS EN PROXIMO REPARTO',true,50);if(pc(g,x.e,'Z1000'))continue;if(g==='OK'){add('ps',x.e);dn(x.e);}else add(g==='NO PERMES'?'exc':'err',x.e+' I96 ParcelShop '+(g==='NO PERMES'?'no permesa (ja recepcionat al PS?)':g));continue;}if(s.last&&s.last.t==='I'&&R2000.test(s.last.x)){await to(x.e,'2000','Z1000');continue;}if(y<TT&&!nd(s)){add('pas',x.e+' FPE '+x.f.slice(0,5)+' Z1000');continue;}const sq=sosp(ev);if(sq)add('sos',x.e+' incidentat '+(sq.n+1)+' dies des de '+sq.d0+' (entrega dia siguiente) sense sortir a reparto: revisar si esta entregat (incidentat igualment)');await i93(x.e,o.motiuZ,'Z1000',false);}}};
S.prep=async()=>{const [d1,d2]=S.rng||[T,T];for(const id of ['chkOpenSheet','chkCloseSheet','chkSettledSheet']){const c=document.getElementById(id);if(c&&!c.checked)c.click();}[...document.querySelectorAll('input[name=fltDateFrom],input[name=fltDateTo]')].filter(i=>i.offsetParent).forEach(i=>{i.value=i.name==='fltDateFrom'?d1:d2;jQuery(i).trigger('change');});window.scrollTo(0,0);[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&/^\s*Actualizar\s*$/.test(b.innerText)).sort((a,b)=>a.getBoundingClientRect().y-b.getBoundingClientRect().y)[0].click();for(let t=0;t<20;t++){await sl(1000);if(d2===T?lis().some(l=>/^R\d/.test(nm(l))&&ttl(l).includes(T)):(t>=3&&!lis().some(l=>ttl(l).includes(T))))break;}await sl(1500);};
S.run=async(o={})=>{if(S.running)return 'ja corre';if(!/\/delivery/i.test(location.pathname)||![...document.querySelectorAll('button')].some(b=>b.offsetParent&&/^\s*Actualizar\s*$/.test(b.innerText))){alert('Obre Gestion de Mercancia > Reparto i torna-ho a provar.');return 'no es Reparto';}S.running=true;o={motiuR:'EXCESO DE MERCANCIA',motiuZ:'EXCESO DE MERCANCIA',...o};T=o.data||avui();TT=ymd(T);vt=false;
S.dry=!!o.dry;
S.vw=setInterval(()=>{document.title=(S.dry?'SIM ':'TANC ')+S.step+(document.hidden?' - SEGON PLA!':'');if(document.hidden&&!vt){vt=true;add('exc','AVIS: pestanya en segon pla durant el tancament (va molt mes lent)');}},5000);
S.done=new Set();
S.ev={};S.rng=[T,T];S.wh={};S.mv=new Set();S.cK=null;S.cG='';R=S.res={t0:new Date().toLocaleTimeString(),sinf:[],sinfOk:[],ps999:[],ant:[],a1000:[],a2000:[],s51:[],i93:[],rea:[],elim:[],sol:[],det:[],ps:[],parc:[],dsol:[],pas:[],fut:[],ft:[],sos:[],exp2:[],resR:[],eco:[],pick:[],malc:[],exc:[],err:[]};
try{if(o.prep!==false){S.step='prep';await S.prep();}const G={R:[],ARR:[],NAU:[],ALT:[],REA:[],Z2000:[],Z1000:[]};for(const l of lis()){if(!cnt(l))continue;if(NOTOUCH.test(pre(l))||NOTOUCH.test(ttl(l)))continue;
const c=cat(l);if(c==='R'&&!ttl(l).includes(T))continue;G[c].push(key(l));}if(!G.R.length)add('err','cap fulla R amb data '+T);
for(const g of (o.groups||['Z1000','ARR','R','NAU','Z2000','ALT','REA']))for(const K of G[g]){const l=await fl(K);
S.step=g+' '+K.n;S.cK=K;S.cG=g;if(!l){add('err','fulla no trobada '+K.n);continue;}try{if(await openLi(l))await F[g](l,o);else add('err','no carrega '+K.n);}catch(err){add('err',g+' '+nm(l)+' '+err.message);}}
if(o.ant!==false){const N=+o.diesAnt||7,d0=new Date(+TT.slice(0,4),+TT.slice(4,6)-1,+TT.slice(6)),a=new Date(d0),b=new Date(d0);a.setDate(a.getDate()-N);b.setDate(b.getDate()-1);S.rng=[dmy(a),dmy(b)];S.step='prep dies anteriors';await S.prep();const GA={Z1000:[],ARR:[],ALT:[],Z2000:[]};for(const l of lis()){if(!cnt(l))continue;if(NOTOUCH.test(pre(l))||NOTOUCH.test(ttl(l)))continue;const c=cat(l);if(!GA[c]||ttl(l).includes(T))continue;GA[c].push(key(l));}
for(const g of (o.groupsAnt||['Z1000','ARR','ALT','Z2000']))for(const K of GA[g]){const l=await fl(K);S.step='ANT '+g+' '+K.n;S.cK=K;S.cG=g;if(!l){add('err','fulla anterior no trobada '+K.n);continue;}try{if(await openLi(l)){const sh=shn(l),cn=()=>R.a1000.length+R.a2000.length+R.i93.length+R.elim.length+R.s51.length+R.eco.length+R.ps999.length,n0=cn();await F[g](l,o);add('ant',g+' '+sh+' '+K.n+(cn()>n0?' -> amb canvis/avisos':''));}else add('err','no carrega (dia anterior) '+K.n);}catch(err){add('err','ANT '+g+' '+K.n+' '+err.message);}}
S.rng=[T,T];S.step='prep avui';await S.prep();}
if(o.sinf!==false){S.step='trazabilitat Sin inf.';try{await sinInf(o);}catch(err){add('err','Pas Sin inf.: '+err.message);}}
}catch(err){add('err','FATAL '+err.message);}
R.t1=new Date().toLocaleTimeString();clearInterval(S.vw);document.title='TANC FET';
S.running=false;
S.step='FET';try{localStorage.setItem('CL_TANC_RES',JSON.stringify({data:T,dry:S.dry,res:R}));if(!S.dry){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({data:T,res:R},null,1)],{type:'application/json'}));a.download='TANCAMENT_'+TT.slice(6)+TT.slice(4,6)+TT.slice(2,4)+'.json';document.body.appendChild(a);a.click();a.remove();}}catch(e){}if(!S.dry&&o.q!==false){S.step='descarrega Q';document.title='TANC descarrega Q';try{window.__QDATA=T;R.q=await S.q();}catch(e){R.q='ERR '+e.message;}S.step='FET';document.title='TANC FET';}return S.n();};
S.q=async () => {
  const pad = n => String(n).padStart(2, '0');
  const avui = new Date();
  const D = window.__QDATA || `${pad(avui.getDate())}/${pad(avui.getMonth() + 1)}/${avui.getFullYear()}`;
  const [dd, mm, yyyy] = D.split('/');
  const d6 = dd + mm + yyyy.slice(2), d8 = yyyy + mm + dd;
  const hms = pad(avui.getHours()) + pad(avui.getMinutes()) + pad(avui.getSeconds());
  if (typeof XLSX === 'undefined') return 'ERROR: obre Atlas > Gestion (managementZz) i torna-ho a executar';
  const tokEl = document.querySelector('input[name=__RequestVerificationToken]');
  if (!tokEl) return 'ERROR: no hi ha sessio d Atlas (torna a entrar)';
  const tok = tokEl.value;
  const espera = ms => new Promise(r => setTimeout(r, ms));
  const desa = async (blob, nom) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nom;
    document.body.appendChild(a); a.click(); a.remove();
    await espera(700);
  };
  const res = { data: D, fitxers: [], avisos: [] };

  // 1. Trazabilitat (resum + detall)
  const mz = async (resumen) => {
    const p = new URLSearchParams({
      entOrdinaria: true, fhasta: '', fdesde: '', fpedesde: D, fpehasta: D, entDomiciliaria: true,
      entCampanas: true, entGrandesSuperficies: true, Cliente: '', destino: '909', Repartidor: '',
      prodPropio: '', resumen: resumen, detalle: !resumen, agrupar: 3, informe: 5, Zona0: true, Zona1: true,
      Zona2: true, SinAtributos: '', fechavista: '', codred: '', itemsResultManagementZzDetalle: '',
      itemsResultManagementZzResumen: '', PSEnVuelo: true, __RequestVerificationToken: tok
    });
    const r = await fetch('/ManagementZz/GetInformesManagementZ', {
      method: 'POST', body: p.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' }
    });
    if (!r.ok) throw new Error('trazabilitat ' + r.status);
    return r.json();
  };
  const COLS = [['Centro', 'Agrupa'], ['Salidas', 'TotalSalidas'], ['Cruce', 'TotalCruce'], ['Plataforma', 'TotalPlataforma'],
    ['Llegadas', 'TotalLlegadas'], ['%', 'PorcentajeLlegadas'], ['Reparto', 'TotalRepartos'], ['% ', 'PorcentajeReparto'],
    ['Entregas', 'TotalEntregadas'], ['%  ', 'PorcentajeEntregadas'], ['Faltas', 'TotalLFaltas'], ['%   ', 'PorcentajeFaltas'],
    ['Mal can', 'TotalLMalCan'], ['%    ', 'PorcentajeMalCans'], ['clNoEnlaza', 'TotalNoEnlaza'], ['%     ', 'PorcentajeNoEnlaza'],
    ['Mal doc.', 'TotalMalDoc'], ['%      ', 'PorcentajeMalDoc'], ['No acepta', 'TotalNoAceptas'], ['%       ', 'PorcentajeNoAcepta'],
    ['Con inc.', 'TotalConInc'], ['%        ', 'PorcentajeConInc'], ['En reparto', 'TotalEnReparto'], ['Sin inf.', 'TotalSinInf'],
    ['%         ', 'PorcentajeSinInf'], ['Cal. total', 'TotalCalTot'], ['Cerradas', 'TotalCerradas'], ['%          ', 'PorcentajeCerradas'],
    ['R. nave', 'TotalLRnave'], ['%           ', 'PorcentajeRnave'], ['Festivos', 'TotalFestivos'], ['%            ', 'PorcentajeFestivos'],
    ['TOTAL', 'Total_Total'], ['Sin traza', 'TotalSinTraza'], ['Env. Z0', 'TotalEnvZ0'], ['Ent Z0', 'TotalEntZ0'],
    ['%             ', 'PorcentajeEntZ0'], ['Env. Z1', 'TotalEnvZ1'], ['Ent Z1', 'TotalEntZ1'], ['%              ', 'PorcentajeEntZ1'],
    ['Env. Z2', 'TotalEnvZ2'], ['Ent Z2', 'TotalEntZ2'], ['%               ', 'PorcentajeEntZ2'], ['Cod', 'ValorAgrupa']];
  const jr = await mz(true);
  const files = jr.IlistmanagmentZzTrazabilidadEstandarResumen || [];
  if (!files.length) res.avisos.push('Trazabilitat sense dades');
  else {
    const aoa = [COLS.map(c => c[0])].concat(files.map(f => COLS.map(c => f[c[1]] ?? '')));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Hoja Resumen trazabilidad');
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    await desa(new Blob([out], { type: 'application/octet-stream' }), `InformeResumenTrazabilidad_${d6}.xlsx`);
    res.fitxers.push('trazabilitat');
    const tot = files.find(f => String(f.Agrupa).trim().toUpperCase() === 'TOTALES');
    if (tot) { res.entregues = tot.TotalEntregadas; res.cal = tot.TotalCalTot; res.sininf = tot.TotalSinInf; }
  }
  const jd = await mz(false);
  const det = (jd.ManagmentZzDetalle || []).map(x => ({ exp: String(x.codexp), estat: String(x.codestado), fecha: x.fecha, horario: x.horario, servei: x.codservicio, org: x.codplaza_org }));
  await desa(new Blob([JSON.stringify({ data: D, expedicions: det })], { type: 'application/json' }), `FPE_DETALL_${d6}.json`);
  res.fitxers.push('detall FPE (' + det.length + ')');

  // 2. Recollides
  const pb = $.param({ searchCriteria: { Request: false, DateFrom: D, DateTo: D, ClientOnly: false, Tab: 1 }, __RequestVerificationToken: tok });
  const rp = await fetch('/PickUp/ExcelDownload', { method: 'POST', body: pb, headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' } });
  if (rp.ok && /sheet/.test(rp.headers.get('content-type') || '')) {
    await desa(await rp.blob(), `HojaExcel_${d8}-${hms}.xlsx`);
    res.fitxers.push('recollides');
  } else res.avisos.push('Recollides no descarregades (' + rp.status + ')');

  // 3. Marklist per repartidor (el dia es passa tal qual: no cal posar la data de dema)
  const reps = [];
  for (const n of [1, 2, 3, 4, 5, 6, 7, 10]) {
    const u = '/Maps/ExportRuta?' + new URLSearchParams({ codplaza: '909', codrepartidor: String(n), fecha: D });
    const r = await fetch(u);
    const t = await r.text();
    if (!r.ok || t.length < 200 || !/<tr/i.test(t)) continue;
    await desa(new Blob([t], { type: 'application/vnd.ms-excel' }), `Marklist - ${n === 10 ? 'NAU' : 'R' + n} - ${d6}.xls`);
    reps.push(n === 10 ? 'NAU' : 'R' + n);
  }
  res.fitxers.push('marklist ' + (reps.join(' ') || 'cap'));
  window.__QRES = res;
  return 'OK ' + D + ' | ' + res.fitxers.join(' | ') + ' | entregues FPE ' + res.entregues + ' de ' + res.cal +
    ' | sense info ' + res.sininf + (res.avisos.length ? ' | AVISOS ' + res.avisos.join(' ; ') : '');
};
S.n=()=>S.res&&Object.fromEntries(Object.entries(S.res).map(([k,v])=>[k,Array.isArray(v)?v.length:v]));
S.seg=async(o={})=>{const d=o.data||avui();
const [a,b,c]=d.split('/').map(Number);
const x=new Date(c,b-1,a+1),dm=z(x.getDate())+'/'+z(x.getMonth()+1)+'/'+x.getFullYear();
S.step='seg';
const w=window,dc=document,$=jQuery,f={remove(){}};if(!/Maps/.test(location.pathname)){S.step='seg: obre /Maps/Index';return null;}
const rs=()=>{const t=dc.body.innerText;
const i=t.indexOf('Resumen de Movimientos');if(i<0)return null;
const s=t.slice(i,i+220);
const g=re=>+((s.match(re)||[0,NaN])[1]);return {ent:g(/Entregas: (\d+)/),inc:g(/\nIncidencias: (\d+)/),rec:g(/\nRecogidas: (\d+)/),irec:g(/Incidencias Recogidas: (\d+)/)};};
const pick=async q=>{const i=dc.getElementById('fltRepartidor');$(i).typeahead('val','');await sl(300);$(i).typeahead('val',q);$(i).trigger('input');await sl(1500);
const s=[...dc.querySelectorAll('.tt-suggestion')].find(e=>e.innerText.trim().startsWith(q+' '));if(!s)return false;$(s).trigger('click');s.click();await sl(500);return true;};
const upd=()=>[...dc.querySelectorAll('button')].find(b=>/^\s*Actualizar\s*$/.test(b.innerText)).click();
const reps=o.reps||['R1','R2','R3','R4','R5','R7'];
const out={};
$('#fltFecha').val(d).trigger('change');for(const q of reps){if(!await pick(q))continue;
const b0=JSON.stringify(rs());upd();let r;for(let t=0;t<20;t++){await sl(1000);r=rs();if(r&&JSON.stringify(r)!==b0&&!isNaN(r.ent))break;}await sl(1500);out[q]=rs();}
if(o.marklist!==false){$('#fltFecha').val(dm).trigger('change');for(const q of reps){if(!await pick(q))continue;upd();await sl(5000);dc.getElementById('btExportar').click();await sl(4000);}}
f.remove();
S.segRes=out;
S.step='seg FET';return out;};
S.llista=()=>{let res=S.res;if(!res){try{res=JSON.parse(localStorage.getItem('CL_TANC_RES')||'null')?.res;}catch(e){}}if(!res){alert('Encara no hi ha cap tancament ni simulacio feta.');return;}
const LB=[['sinf','SIN INF. FPE AVUI (penalitzen!)'],['ps999','PARCEL SHOP encallats a la 999'],['exc','A revisar'],['sos','Sospitosos entregats (incidentats igualment, revisar)'],['exp2','Express 10:30/14h: 2 ausentes mateix dia (sense S-51)'],['malc','Mal classificats (Dst no 909): reexpedir'],['pick','Pickups (no tocats)'],['eco','Economy: S-51 agotados intentos'],['err','ERRORS'],['dsol','Sol.licitud devolucio (AVIS)'],['resR','Queden a fulles R'],['pas','FPE passada sense dades noves'],['parc','Parcials / falten bultos'],['elim','Eliminats de reparto'],['a1000','A la 1000'],['a2000','A la 2000'],['i93','I-93 posades'],['s51','S-51 agotados intentos'],['rea','REA'],['ps','ParcelShop (I-96)'],['det','Deteriorats'],['ft','FALTA DE TIEMPO'],['fut','FPE futura'],['sol','Solucions d avui'],['sinfOk','Sin inf. corregits al pas final (I-93)'],['ant','Fulles de dies anteriors revisades']];
const es=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
let txt='TANCAMENT 909 '+(S.dry?'(SIMULACIO) ':'')+(res.t0||'')+'\n';let h='';for(const [k,t] of LB){const a=res[k];if(!Array.isArray(a)||!a.length)continue;txt+='\n'+t+' ('+a.length+'):\n'+a.join('\n')+'\n';h+='<div style="margin-top:10px"><b>'+es(t)+' ('+a.length+')</b>'+a.map(v=>'<div style="padding:1px 0;font-family:Consolas,monospace;font-size:12px">'+es(v)+'</div>').join('')+'</div>';}
document.getElementById('tanc909l')?.remove();const d=document.createElement('div');d.id='tanc909l';d.style.cssText='position:fixed;right:300px;bottom:14px;z-index:99999;background:#fff;color:#1c1c1c;padding:12px 14px;border-radius:10px;font:13px/1.4 Arial,sans-serif;box-shadow:0 3px 12px #0006;width:420px;max-height:80vh;overflow-y:auto;text-align:left';
d.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:15px">Detall del tancament</b><span><button id=tancCp style="padding:4px 8px;border:0;border-radius:4px;background:#061ab1;color:#fff;cursor:pointer">Copiar</button> <button id=tancCl style="padding:4px 8px;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer">Tancar</button></span></div>'+(h||'<div style="margin-top:10px">Res a mostrar.</div>');document.body.appendChild(d);
document.getElementById('tancCl').onclick=()=>d.remove();document.getElementById('tancCp').onclick=async e=>{try{await navigator.clipboard.writeText(txt);e.target.textContent='Copiat';}catch(err){}};};
S.panel=()=>{if(!/\/delivery/i.test(location.pathname))return;document.getElementById('tanc909p')?.remove();
const p=document.createElement('div');p.id='tanc909p';p.style.cssText='position:fixed;right:14px;bottom:14px;z-index:99999;background:#061ab1;color:#fff;padding:12px 14px;border-radius:10px;font:14px/1.45 Arial,sans-serif;box-shadow:0 3px 12px #0006;width:270px';
const bs='font:bold 15px Arial,sans-serif;padding:8px 0;border:0;border-radius:6px;cursor:pointer;width:48%;opacity:1;';p.innerHTML='<div style="font-weight:bold;font-size:16px;margin-bottom:8px;display:flex;justify-content:space-between"><span>Tancament 909 v'+S.v+'</span><span id=tancMin style="cursor:pointer;padding:0 6px" title="Amagar / mostrar">&#8211;</span></div><div id=tancBody><div style="display:flex;justify-content:space-between"><button id=tancGo style="'+bs+'background:#18a34a;color:#fff">EXECUTAR</button><button id=tancSim style="'+bs+'background:#ffd400;color:#061ab1">SIMULAR</button></div><button id=tancLl style="font:bold 13px Arial,sans-serif;padding:6px 0;border:0;border-radius:6px;cursor:pointer;width:100%;margin-top:6px;background:#fff;color:#061ab1">VEURE LLISTA</button><div id=tancSt style="margin-top:10px;white-space:pre-line;font-size:13px"></div></div>';document.body.appendChild(p);
const st=()=>{const n=S.n(),el=document.getElementById('tancSt');if(!el)return;let t=S.running?(S.dry?'SIMULANT... ':'EXECUTANT... ')+S.step:(S.step==='FET'?(S.dry?'SIMULACIO FETA':'TANCAMENT FET'):'Preparat');if(n)t+='\n\nA la 1000: '+n.a1000+'\nA la 2000: '+n.a2000+'\nI-93 posades: '+n.i93+'\nS-51 (agotados intentos): '+n.s51+'\nREA (I-96 Recogeran en agencia): '+n.rea+'\nParcelShop (I-96): '+n.ps+'\nDeteriorats: '+n.det+'\nParcials / falten bultos (a 1000): '+n.parc+'\nFALTA DE TIEMPO -> F. MAYOR: '+n.ft+'\nFPE futura (sense incidencia): '+n.fut+'\nFPE passada sense dades noves: '+n.pas+'\nSol.licitud devolucio (AVIS): '+n.dsol+'\nEliminats de reparto: '+n.elim+'\nQUEDEN A FULLES R: '+n.resR+'\nSospitosos entregats: '+n.sos+'\nEconomy S-51: '+n.eco+'\nPickups (no tocats): '+n.pick+'\nMal classificats (reexpedir): '+n.malc+'\nPARCEL SHOP a la 999: '+n.ps999+'\nFulles dies anteriors: '+n.ant+'\nSin inf. corregits: '+n.sinfOk+'\nSIN INF. FPE AVUI: '+n.sinf+(n.sinf?' !!':'')+'\nA revisar: '+n.exc+'\nERRORS: '+n.err+(n.q?'\nDescarrega Q: '+(/^OK/.test(n.q)?'feta (informe Q en uns minuts)':String(n.q).slice(0,60)):'');el.innerText=t;};setInterval(st,2000);st();
const go=d=>{if(S.running)return;
const m=prompt((d?'SIMULAR':'EXECUTAR')+' el tancament de '+avui()+'.\nObservacio per a les I-93 (pots canviar-la):','EXCESO DE MERCANCIA');if(m===null)return;
const t=(m||'EXCESO DE MERCANCIA').trim().toUpperCase();S.run({dry:d,motiuR:t,motiuZ:t});};document.getElementById('tancMin').onclick=()=>{const b=document.getElementById('tancBody'),h=b.style.display!=='none';b.style.display=h?'none':'';p.style.width=h?'auto':'270px';try{localStorage.setItem('TANC_MIN',h?'1':'');}catch(e){}};try{if(localStorage.getItem('TANC_MIN')){document.getElementById('tancBody').style.display='none';p.style.width='auto';}}catch(e){}document.getElementById('tancGo').onclick=()=>go(false);document.getElementById('tancSim').onclick=()=>go(true);document.getElementById('tancLl').onclick=()=>S.llista();};S.panel();

};
try{localStorage.setItem('TANC909','('+TANC909.toString()+')()');}catch(e){}
TANC909();
