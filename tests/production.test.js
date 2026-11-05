// تجهيز الإنتاج: تسجيل أخطاء التطبيق، وCAPTCHA عند وجود المفتاح العام
const {JSDOM,VirtualConsole}=require('jsdom');
const html=require('./v2html')();
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x===undefined?'':x))};
const R=(j,st)=>({ok:(st||200)<300,status:st||200,text:async()=>j===undefined?'':JSON.stringify(j)});
let log=[];
const mk=ls=>new JSDOM(html,{runScripts:'dangerously',url:'https://odo93.github.io/meal-plan/v2/',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){
  (ls||[]).forEach(([k,v])=>w.localStorage.setItem(k,JSON.stringify(v)));
  w.fetch=async(u,o)=>{o=o||{};const x=new URL(u),p=x.pathname,body=o.body?JSON.parse(o.body):null;log.push([o.method||'GET',p,body,o.headers]);
    if(p==='/auth/v1/signup')return R({access_token:'A',refresh_token:'R',expires_in:3600,user:{id:'an1',is_anonymous:true}});
    if(p==='/rest/v1/mp_users'&&(o.method||'GET')==='GET')return R([]);
    if(/rpc\/mp_(shared_with_me|my_grants)/.test(p)||p==='/rest/v1/mp_accounts')return R([]);
    return R(undefined,404)}}});
(async()=>{
 let d=mk(),w=d.window,E=s=>w.eval(s);
 const boom=(msg,file,line)=>w.dispatchEvent(new w.ErrorEvent('error',{message:msg,filename:file===undefined?w.location.origin+'/meal-plan/v2/js/render.js':file,lineno:line||12}));
 boom('TypeError: x is undefined');await sleep(20);
 const e1=log.filter(l=>l[1]==='/rest/v1/app_errors');
 T('error sent to database',e1.length===1&&e1[0][2].msg==='TypeError: x is undefined'&&e1[0][2].src==='/meal-plan/v2/js/render.js'&&e1[0][2].line===12&&e1[0][2].ver===E('APP_VER'));
 T('uses the public key only',e1[0][3].apikey===E('cloud.key')&&e1[0][3].Authorization==='Bearer '+E('cloud.key'));
 boom('TypeError: x is undefined');await sleep(20);T('same error not repeated',log.filter(l=>l[1]==='/rest/v1/app_errors').length===1);
 boom('Failed to fetch');boom('ext error','chrome-extension://abc/x.js');boom('Script error.','');await sleep(20);
 T('network / extension / opaque errors ignored',log.filter(l=>l[1]==='/rest/v1/app_errors').length===1);
 for(let i=0;i<8;i++)boom('err '+i);await sleep(30);
 T('at most 5 per session',log.filter(l=>l[1]==='/rest/v1/app_errors').length===5);
 w.dispatchEvent(Object.assign(new w.Event('unhandledrejection'),{reason:new Error('async fail')}));
 T('promise errors handled without crash',errs.length===0);

 // CAPTCHA: no key → no token; key set → Turnstile token goes with the sign-up
 log=[];d=mk([['mp3_pub',{features:{},defaults:{},captcha_site_key:'0x4AAAAAAATEST'}],['mp3_meta',{users:[{id:'u1',name:'م'}],cur:'u1',mode:'self'}]]);w=d.window;E=s=>w.eval(s);
 E("tsP=Promise.resolve({render:(el,o)=>{window.__cap={key:o.sitekey,box:!!document.getElementById('capbox')};setTimeout(()=>o.callback('TOKEN-1'),0);return 'w1'}})");
 E("act('consent',{v:'yes'})");await sleep(120);
 T('widget rendered with site key',E('window.__cap&&window.__cap.key')==='0x4AAAAAAATEST'&&E('window.__cap.box'));
 const su=log.find(l=>l[1]==='/auth/v1/signup');
 T('captcha token sent with sign-up',su&&su[2].gotrue_meta_security&&su[2].gotrue_meta_security.captcha_token==='TOKEN-1',JSON.stringify(su&&su[2]));
 T('widget removed after use',!w.document.getElementById('capbox'));
 T('signed in after captcha',E('cloud.anon')===true);
 console.log('PASS',ok,'FAIL',bad,errs);process.exit(0);
})();
