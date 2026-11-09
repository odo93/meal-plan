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
  // 5) صنف جديد من نافذة الإضافة للوجبة: يُحفظ في الأصناف ويُضاف للوجبة معاً + فئة مخصّصة
  w=mk();E=s2=>w.eval(s2);
  E("ui.day=0;ui.aq='لبنة بالعسل';ui.ag='';modal={type:'add',m:0};render();renderAddList('لبنة بالعسل')");
  T('add modal offers manual add',!!w.document.querySelector('[data-act="newfromq"]'));
  click(w,'[data-act="newfromq"]');
  T('opens single save-and-add card with the typed name',E("modal.type")==='scan'&&w.document.getElementById('sc_n').value==='لبنة بالعسل'&&!!w.document.querySelector('[data-act="scansaveadd"]'));
  const sv=(id,v)=>{const el=w.document.getElementById(id);el.value=v;el.dispatchEvent(new w.Event('input',{bubbles:true}))};
  const gsel=w.document.getElementById('sc_g');
  T('group select has new-group option',[...gsel.options].some(o=>o.value==='__new'));
  gsel.value='__new';gsel.dispatchEvent(new w.Event('input',{bubbles:true}));
  T('new-group row appears',!!w.document.getElementById('ng_n')&&E("ui.scan.d.g")!=='__new');
  w.document.getElementById('ng_n').value='حلويات';click(w,'[data-act="addgrp"]');
  const gid=E("Object.keys(GROUPS).find(k=>GROUPS[k]==='حلويات')");
  T('custom group created and selected',/^u_/.test(gid)&&E("ui.scan.d.g")===gid&&E("state.settings.cg.length")===1,gid);
  T('duplicate group name reuses existing',(()=>{w.document.getElementById('sc_g').value='__new';w.document.getElementById('sc_g').dispatchEvent(new w.Event('input',{bubbles:true}));w.document.getElementById('ng_n').value='حلويات';click(w,'[data-act="addgrp"]');return E("state.settings.cg.length")===1})());
  sv('sc_n','لبنة بالعسل');sv('sc_k','200');sv('sc_p','8');sv('sc_c','20');sv('sc_f','9');
  const n0=E("state.days[0].meals[0].items.length"),f0=E("state.foods.length");
  click(w,'[data-act="scansaveadd"]');
  T('saved in foods with custom group',E("state.foods.length")===f0+1&&E("state.foods.find(f=>f.n==='لبنة بالعسل').grp")===gid);
  T('added to the meal too',E("state.days[0].meals[0].items.length")===n0+1);
  E("ui.tab='foods';ui.fg='';render()");
  T('custom group shown in foods list and filter chips',/حلويات/.test(w.document.body.textContent)&&E("typeof foodsList()")==='string');
  T('no script errors',errs.length===0,errs);
  console.log('PASS',ok,'FAIL',bad);process.exit(bad?1:0);
})();
