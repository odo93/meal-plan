// تتبّع الاستخدام لاختبار الفكرة: حدث واحد لكل نوع في اليوم، يُرفع فقط عند وجود جلسة (بعد الموافقة)، ولا يُسجَّل تعديل المدرب على ملف غيره
const {JSDOM,VirtualConsole}=require('jsdom');
const html=require('./v2html')();
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x===undefined?'':x))};
const R=(j,st)=>({ok:(st||200)<300,status:st||200,text:async()=>j===undefined?'':JSON.stringify(j),json:async()=>j});
let posts=[];
const mk=ls=>new JSDOM(html,{runScripts:'dangerously',url:'https://odo93.github.io/meal-plan/v2/#/today',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){
  (ls||[]).forEach(([k,v])=>w.localStorage.setItem(k,JSON.stringify(v)));
  w.fetch=async(u,o)=>{o=o||{};const p=new URL(u,'https://odo93.github.io/meal-plan/v2/').pathname;
    if(p==='/rest/v1/app_events'&&o.method==='POST'){posts.push(JSON.parse(o.body));return R(undefined,201)}
    if(p.endsWith('version.json'))return R(undefined,404);
    if((o.method||'GET')==='GET'&&p.startsWith('/rest/v1/'))return R([]);
    return R(undefined,201)}}});
const evs=()=>posts.flat().map(x=>x.ev);
(async()=>{
 // no session (no consent): events stay on the device
 let d=mk([['mp3_meta',{users:[{id:'u1',name:'م'}],cur:'u1',mode:'self',consent:'later'}]]),w=d.window,E=s=>w.eval(s);
 E('flushEvents()');await sleep(50);
 T('no upload without a session',posts.length===0);
 T('open queued on the device',(JSON.parse(w.localStorage.getItem('mp3_evq'))||[]).some(x=>x.ev==='open'&&/^\d{4}-\d\d-\d\d$/.test(x.day)));
 // signed in
 const S=[['mp3_cloud',{email:'a@b.c',sess:{at:'AT',rt:'RT',exp:Date.now()+3600e3,uid:'U1'}}],['mp3_meta',{users:[{id:'u1',name:'م'}],cur:'u1',mode:'self',consent:'yes'}]];
 d=mk(S);w=d.window;E=s=>w.eval(s);const $=s=>w.document.querySelector(s);await sleep(50);
 E('flushEvents()');await sleep(50);
 T('open uploaded once with version',evs().filter(e=>e==='open').length===1&&posts[0][0].ver===E('APP_VER'));
 T('queue emptied after upload',(JSON.parse(w.localStorage.getItem('mp3_evq'))||[]).length===0);
 E("track('open')");E('flushEvents()');await sleep(50);
 T('open counted once per day',evs().filter(e=>e==='open').length===1);
 posts=[];E("ui.tab='day';ui.day=0;render()");
 E("act('qlog',{m:'0',i:'0'})");E('flushEvents()');await sleep(50);
 T('logging food → log',evs().includes('log')&&!evs().includes('day_done'));
 posts=[];E("act('logrest',{})");E('flushEvents()');await sleep(50);
 T('finishing the day → day_done',evs().includes('day_done'));
 posts=[];E("act('updnow',{})");E('reloadApp=()=>{}');await sleep(80);
 T('update button → update uploaded before reload',evs().includes('update'));
 // a coach editing someone else's profile does not count as that coach logging food
 d=mk([['mp3_cloud',{email:'c@b.c',sess:{at:'AT',rt:'RT',exp:Date.now()+3600e3,uid:'C1'}}],['mp3_meta',{users:[{id:'u1',name:'م'}],cur:'u1',mode:'coach',consent:'yes'}],['mp3_evday',{open:new Date().toISOString().slice(0,10)}]]);
 w=d.window;E=s=>w.eval(s);await sleep(50);posts=[];
 E("ui.remote={name:'x',role:'coach',uid:'U9'};ui.day=0");E("act('qlog',{m:'0',i:'0'})");E('flushEvents()');await sleep(50);
 T('remote edits not tracked as log',!evs().includes('log'));
 posts=[];E("lsSet('mp3_evq',[{ev:'log',day:'2020-01-01',at:'2020-01-01T00:00:00Z',ver:'1'}])");E('flushEvents()');await sleep(50);
 T('events over 29 days old are dropped, not retried forever',posts.length===0&&(JSON.parse(w.localStorage.getItem('mp3_evq'))||[]).length===0);
 await sleep(30);
 console.log('PASS',ok,'FAIL',bad,errs);process.exit(0);
})();
