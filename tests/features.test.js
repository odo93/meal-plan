// تحكّم لوحة الإدارة في التطبيق: الميزات حسب نوع الاستخدام، استثناء الحساب، مزامنة النوع، والإعدادات الافتراضية
const {JSDOM,VirtualConsole}=require('jsdom');
const html=require('./v2html')();
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x===undefined?'':x))};
const R=(j,st)=>({ok:(st||200)<300,status:st||200,text:async()=>j===undefined?'':JSON.stringify(j)});
let CFG=null,ACCT=[],log=[];
function mk(o){o=o||{};return new JSDOM(html,{runScripts:'dangerously',url:'https://odo93.github.io/meal-plan/v2/',virtualConsole:vc,pretendToBeVisual:true,beforeParse(win){
  if(o.signedIn)win.localStorage.setItem('mp3_cloud',JSON.stringify({url:'https://exznecnhvsihdelwsibv.supabase.co',key:'anon',email:'me@x.y',auto:false,sess:{at:'AT1',rt:'RT1',exp:Date.now()+3600e3,uid:'U1'},last:''}));
  (o.ls||[]).forEach(([k,v])=>win.localStorage.setItem(k,JSON.stringify(v)));
  win.fetch=async(url,op)=>{op=op||{};const u=new URL(url),p=u.pathname,body=op.body?JSON.parse(op.body):null;log.push([op.method||'GET',p+u.search,body]);
    if(p==='/rest/v1/app_config')return CFG?R([CFG]):R(undefined,404);
    if(p==='/rest/v1/mp_accounts')return R(ACCT);
    if(p==='/rest/v1/rpc/mp_set_mode')return R({mode:body.p_mode,features:(ACCT[0]&&ACCT[0].features)||{}});
    if(p==='/rest/v1/rpc/mp_shared_with_me'||p==='/rest/v1/rpc/mp_my_grants'||p==='/rest/v1/announcements'||p==='/rest/v1/shared_foods')return R([]);
    return R(undefined,404)}}})}
(async()=>{
 // 1) no config at all → everything visible (today's behaviour)
 let d=mk(),w=d.window,$=s=>w.document.querySelector(s),E=s=>w.eval(s);
 E("meta.mode='self';ui.tab='foods';render()");
 T('default: scan visible',!!$('#app .scanb'));
 E("ui.tab='week';render()");T('default: shop tab visible',!!$('#app [data-act="wk"][data-v="shop"]'));
 E("ui.tab='me';ui.sub='family';render()");T('default: add person + share',!!$('#app [data-act="uadd"]')&&/المشاركة|كود/.test($('#app').textContent));
 E("ui.sub='data';render()");T('default: USDA card',/USDA/.test($('#app').textContent));

 // 2) admin turned features off for «لنفسي»; cached config applies offline
 const F={scan:{self:false,family:true,coach:true,org:true},shop:{self:false},multi:{self:false},share:{self:false},online:{self:false},clients:{coach:false}};
 d=mk({ls:[['mp3_pub',{features:F,defaults:{}}]]});w=d.window;$=s=>w.document.querySelector(s);E=s=>w.eval(s);
 E("meta.mode='self';ui.tab='foods';ui.fq='zzzz';render()");
 T('self: scan hidden',!$('#app .scanb'));
 E("ui.tab='week';ui.wk='shop';render()");T('self: shop tab hidden and falls back to week',!$('#app [data-act="wk"]')&&E('ui.wk')==='week');
 E("ui.tab='me';ui.sub='family';render()");T('self: no add person, no sharing',!$('#app [data-act="uadd"]')&&!$('#inv_code'));
 E("ui.sub='data';render()");T('self: USDA card hidden',!/مصادر البحث الأونلاين/.test($('#app').textContent));
 E("modal={type:'add',m:0};render()");T('self: add dialog has no photo scan',!$('#am_img'));E('modal=null;render()');
 E("act('uadd',{})");T('self: uadd action ignored',E('modal')===null);
 E("meta.mode='family';ui.tab='foods';render()");T('family: scan visible',!!$('#app .scanb'));
 E("meta.mode='coach';ui.tab='me';ui.sub='';render()");T('coach: clients hidden by admin',!/متدربيني/.test($('#app').textContent));
 E("meta.mode='org';render()");T('org: clients shown (not set → on)',/متدربيني/.test($('#app').textContent));

 // 3) per-account override beats the type setting
 E("lsSet('mp3_acct',{features:{scan:true,shop:false}});meta.mode='self';ui.tab='foods';render()");
 T('override on beats type off',!!$('#app .scanb'));
 E("meta.mode='family';ui.tab='week';render()");T('override off beats type on',!$('#app [data-act="wk"]'));

 // 4) defaults for new people only
 d=mk({ls:[['mp3_pub',{features:{},defaults:{goal:'cut',act:1.375,g:{cut:{pr:2.5,val:0.5},bulk:{fat:-3}}}}]]});w=d.window;E=s=>w.eval(s);
 const st=JSON.parse(E('JSON.stringify((()=>{const s=defaultState();fixSettings(s.settings);return s.settings})())'));
 T('new person: admin goal + activity',st.goal==='cut'&&st.act===1.375);
 T('new person: admin goal values',st.g.cut.pr===2.5&&st.g.cut.val===0.5);
 T('invalid default ignored',st.g.bulk.fat===25);
 const kept=JSON.parse(E("JSON.stringify(fixSettings({g:{cut:{mode:'rate',val:0.75,pr:2.2,prB:'bw',fat:25,fatM:'pct'}}}).g.cut)"));
 T('existing values untouched',kept.pr===2.2&&kept.val===0.75);

 // 5) public config is cached for offline use
 CFG={latest_version:'2.3',min_version:'2.0',features:{scan:{self:false}},defaults:{goal:'maint'}};
 d=mk();w=d.window;await sleep(60);
 T('loadPublic asks for defaults',log.some(l=>/app_config\?select=.*defaults/.test(l[1])));
 T('config cached',JSON.parse(w.localStorage.getItem('mp3_pub')).features.scan.self===false&&JSON.parse(w.localStorage.getItem('mp3_pub')).defaults.goal==='maint');

 // 6) signed in: cloud type wins; overrides cached
 CFG=null;log=[];ACCT=[{mode:'coach',features:{shop:false}}];
 d=mk({signedIn:true,ls:[['mp3_meta',null]]});w=d.window;E=s=>w.eval(s);await sleep(80);
 T('cloud type adopted',E('meta.mode')==='coach',E('meta.mode'));
 T('account overrides cached',JSON.parse(w.localStorage.getItem('mp3_acct')).features.shop===false);
 // user changes type → pushed to cloud
 E("act('umode',{v:'family'})");await sleep(40);
 const pm=log.find(l=>l[1]==='/rest/v1/rpc/mp_set_mode');
 T('type change pushed',pm&&pm[2].p_mode==='family'&&E('meta.mode')==='family'&&!E('meta.modePending'));
 // a change made offline is pushed on next sync instead of being overwritten
 log=[];E("meta.mode='self';meta.modePending=true;saveMeta()");await E('syncAcct()');
 T('pending local change pushed, not overwritten',log.some(l=>l[1]==='/rest/v1/rpc/mp_set_mode'&&l[2].p_mode==='self')&&E('meta.mode')==='self'&&!E('meta.modePending'));
 // no cloud row yet → local type is uploaded
 log=[];ACCT=[];await E('syncAcct()');
 T('first sync uploads local type',log.some(l=>l[1]==='/rest/v1/rpc/mp_set_mode'&&l[2].p_mode==='self'));
 console.log('PASS',ok,'FAIL',bad,errs);process.exit(0);
})();
