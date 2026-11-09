// ملاحظات المستخدمين: أرقام عشرية طويلة، تكرار بانر التحديث
const {JSDOM,VirtualConsole}=require('jsdom');
const html=require('./v2html')();
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x===undefined?'':JSON.stringify(x)))};
const mk=(pre)=>{const d=new JSDOM(html,{runScripts:'dangerously',url:'https://odo93.github.io/meal-plan/v2/',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){
  w.fetch=async()=>({ok:false,status:404,json:async()=>({}),text:async()=>''});if(pre)pre(w)}});
  const w=d.window;w.eval("meta.mode='self';ui.day=0;render()");return w};
const click=(w,s)=>(typeof s==='string'?w.document.querySelector(s):s).dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
// 1) صنف بالوحدة لا يُخزَّن بأرقام عشرية طويلة (8 جم كارب لقطعة 15 جم → 53.33 لا 53.333333333333336)
let w=mk(),E=s=>w.eval(s);
E("ui.tab='foods';ui.nfT=true;render()");
const setv=(id,v)=>{const el=w.document.getElementById(id);if(!el)throw new Error('missing #'+id);el.value=v};
setv('nf_n','بسكويت اختبار');setv('nf_b','u');setv('nf_u','قطعة');setv('nf_ug','15');setv('nf_k','70');setv('nf_p','0');setv('nf_c','8');setv('nf_f','4');
click(w,'[data-act="addfood"]');
const f=E("state.foods.find(x=>x.n==='بسكويت اختبار')");
T('food added',!!f);
T('values rounded to 2 decimals',f&&[f.k,f.p,f.c,f.f].every(v=>Math.abs(v*100-Math.round(v*100))<1e-6),f);
T('per-100g conversion correct',f&&Math.abs(f.c-53.33)<0.01);
// 2) أصناف قديمة بأرقام طويلة تُنظَّف عند الفتح
{const w2=mk();const st=JSON.parse(w2.eval("JSON.stringify(state)"));
  T('long decimals rounded in list rows',!/\d\.\d{3,}/.test((()=>{w2.eval("state.foods.push({id:'cx1',n:'طويل',grp:'carb',k:467,p:0,c:53.333333333333336,f:26.666666666666668,u:'',ug:0});modal={type:'add',m:0};ui.aq='طويل';render();renderAddList('طويل')");return w2.document.querySelector('#addList').textContent})()));}
// 3) بانر v1: لا يظهر إن فُتحت هذه النسخة على الجهاز، ويبقى مخفياً بعد «لاحقاً»
const ver=JSON.parse(require('fs').readFileSync(require('path').join(__dirname,'..','v2','version.json'),'utf8')).v;
const v1=require('fs').readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
const run=(pre)=>new Promise(res=>{const d=new JSDOM(v1,{runScripts:'dangerously',url:'https://odo93.github.io/meal-plan/',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){pre&&pre(w);w.fetch=async()=>({ok:true,json:async()=>({v:ver,notes:['x']})})}});setTimeout(()=>res(d.window),200)});
(async()=>{
  let b=await run();T('v1 banner shows for a new version',b.document.getElementById('v2upd').style.display==='block');
  b=await run(w=>w.localStorage.setItem('mp3_seenver',ver));T('v1 banner hidden when this version already opened in v2',b.document.getElementById('v2upd').style.display!=='block');
  b=await run(w=>w.localStorage.setItem('v2upd_hide',ver));T('v1 banner stays hidden after later (next visit)',b.document.getElementById('v2upd').style.display!=='block');
  // 4) v2 يسجّل النسخة المفتوحة، ويستعمل التحديث القسري مرة واحدة فقط
  w=mk(w0=>{w0.localStorage.setItem('mp3_updtry','9.9');});E=s=>w.eval(s);
  T('v2 records seen version',w.localStorage.getItem('mp3_seenver')===E('APP_VER'));
  T('pending update flag kept while version is older',w.localStorage.getItem('mp3_updtry')==='9.9');
  T('hardRefresh available',E("typeof hardRefresh")==='function');
  T('no script errors',errs.length===0,errs);
  console.log('PASS',ok,'FAIL',bad);process.exit(bad?1:0);
})();
