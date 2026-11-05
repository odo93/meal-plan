// زر «تحديث جديد»: يظهر عند وجود نسخة أحدث في version.json، ويحفظ البيانات ويرفعها قبل تحميل النسخة الجديدة
const {JSDOM,VirtualConsole}=require('jsdom');
const html=require('./v2html')();
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x===undefined?'':x))};
const R=(j,st)=>({ok:(st||200)<300,status:st||200,text:async()=>j===undefined?'':JSON.stringify(j),json:async()=>j});
let VER=null,log=[];
const mk=ls=>new JSDOM(html,{runScripts:'dangerously',url:'https://odo93.github.io/meal-plan/v2/',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){
  (ls||[]).forEach(([k,v])=>w.localStorage.setItem(k,JSON.stringify(v)));
  w.fetch=async(u,o)=>{o=o||{};const x=new URL(u,'https://odo93.github.io/meal-plan/v2/'),p=x.pathname;log.push([o.method||'GET',p,o.cache]);
    if(p.endsWith('/v2/version.json'))return VER?R(VER):R(undefined,404);
    if(p==='/rest/v1/mp_users'&&(o.method||'GET')==='GET')return R([]);
    if(/rpc\/mp_(shared_with_me|my_grants)/.test(p)||p==='/rest/v1/mp_accounts')return R([]);
    return R(undefined,201)}}});
(async()=>{
 VER={v:'2.0',notes:[]};let d=mk(),w=d.window,$=s=>w.document.querySelector(s),E=s=>w.eval(s);
 E("meta.mode='self';render()");await E('checkUpdate()');
 T('older/same version → no banner',!$('#app [data-act="updnow"]'));
 T('version file not cached',log.some(l=>l[1].endsWith('version.json')&&l[2]==='no-store'));
 VER={v:'99.1',notes:['ميزة أ','ميزة ب']};await E('checkUpdate()');
 T('newer version → banner with notes',!!$('#app [data-act="updnow"]')&&/تحديث جديد جاهز \(99\.1\)/.test($('#app').textContent)&&/ميزة ب/.test($('#app').textContent)&&/بياناتك تبقى كما هي/.test($('#app').textContent));
 E("act('updlater',{})");T('«later» hides it for this session',!$('#app [data-act="updnow"]'));
 // signed in: update saves locally and uploads before reloading
 d=mk([['mp3_cloud',{email:'a@b.c',sess:{at:'AT',rt:'RT',exp:Date.now()+3600e3,uid:'U1'}}],['mp3_meta',{users:[{id:'u1',name:'م'}],cur:'u1',mode:'self',consent:'yes'}]]);
 w=d.window;$=s=>w.document.querySelector(s);E=s=>w.eval(s);await sleep(100);
 E('reloadApp=()=>{window.__rl=Date.now()}');await E('checkUpdate()');
 E('state.settings.bw=77.5');log=[];
 E("act('updnow',{})");T('button shows progress',/جارٍ التحديث/.test($('#app').textContent));
 await sleep(200);
 T('data uploaded before reload',log.some(l=>l[0]==='POST'&&l[1]==='/rest/v1/mp_users'));
 T('local data saved',JSON.parse(w.localStorage.getItem('mp3_u_u1')).settings.bw===77.5);
 T('reloaded after saving',!!E('window.__rl'));
 console.log('PASS',ok,'FAIL',bad,errs);process.exit(0);
})();
