// الحفظ في حساب مؤقت بعد الموافقة، ثم تثبيته بالبريد والجوال
const {JSDOM,VirtualConsole}=require('jsdom');
const html=require('./v2html')();
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x===undefined?'':x))};
const R=(j,st)=>({ok:(st||200)<300,status:st||200,text:async()=>j===undefined?'':JSON.stringify(j)});
let ANON_ON=true,log=[];
function mk(ls,url){return new JSDOM(html,{runScripts:'dangerously',url:url||'https://odo93.github.io/meal-plan/v2/',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){
  (ls||[]).forEach(([k,v])=>w.localStorage.setItem(k,JSON.stringify(v)));
  w.fetch=async(u,o)=>{o=o||{};const x=new URL(u),p=x.pathname,body=o.body?JSON.parse(o.body):null;log.push([o.method||'GET',p+x.search,body]);
    if(p==='/auth/v1/signup'&&body&&!body.email)return ANON_ON?R({access_token:'ANT',refresh_token:'ANR',expires_in:3600,user:{id:'anon-1',is_anonymous:true}}):R({msg:'Anonymous sign-ins are disabled'},422);
    if(p==='/auth/v1/user'&&o.method==='PUT')return R({id:'anon-1',is_anonymous:true,new_email:body.email});
    if(p==='/auth/v1/user')return R({id:'anon-1',email:'me@x.y',is_anonymous:false});
    if(p==='/rest/v1/mp_users'&&(o.method||'GET')==='GET')return R([]);
    if(/^\/rest\/v1\/rpc\/mp_(shared_with_me|my_grants)/.test(p))return R([]);
    if(p==='/rest/v1/mp_accounts')return R([]);
    return R(undefined,201)}}})}
(async()=>{
 let d=mk(),w=d.window,$=s=>w.document.querySelector(s),E=s=>w.eval(s);
 const click=s=>$(s).dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
 E("meta.mode='self';render()");
 T('consent banner shown',!!$('#app [data-act="consent"][data-v="yes"]')&&!!$('#app a[href="privacy.html"]'));
 T('nothing sent before consent',!log.some(l=>l[1].startsWith('/auth/')));
 click('#app [data-act="consent"][data-v="later"]');
 T('«not now» hides it for 14 days',!$('#app [data-act="consent"]')&&E('meta.consentAsk')>Date.now()+13*864e5);
 E('delete meta.consentAsk;render()');
 // consent → background account → device data saved to it
 click('#app [data-act="consent"][data-v="yes"]');await sleep(120);
 const su=log.find(l=>l[1]==='/auth/v1/signup');
 T('anonymous sign-up without email',su&&!su[2].email);
 T('session is temporary',E('cloud.anon')===true&&E('cloud.sess.uid')==='anon-1'&&E('meta.consent')==='yes');
 T('consent recorded with date',/^\d{4}-/.test(E('meta.consentAt')));
 T('device data uploaded',log.some(l=>l[0]==='POST'&&l[1].startsWith('/rest/v1/mp_users')));
 T('banner gone',!$('#app [data-act="consent"]'));
 // saving is automatic
 log=[];E('state.settings.bw=71;save()');await sleep(4300);
 T('auto save to account',log.some(l=>l[0]==='POST'&&l[1].startsWith('/rest/v1/mp_users')&&l[2][0].settings.bw===71));
 // account page for a temporary account
 E("ui.tab='me';ui.sub='sync';render()");
 T('temporary account page',/حساب مؤقت/.test($('#app').textContent)&&!!$('#app [data-act="cupgrade"]')&&!$('#app [data-act="clogout"]'));
 E("act('clogout',{})");T('cannot log out of a temporary account',!!E('cloud.sess'));
 $('#cl_em').value='me@x.y';$('#cl_ph').value='0501234567';click('#app [data-act="cupgrade"]');await sleep(60);
 const up=log.find(l=>l[0]==='PUT'&&l[1].startsWith('/auth/v1/user'));
 T('upgrade sends email + phone',up&&up[2].email==='me@x.y'&&up[2].data.phone==='0501234567');
 T('waiting for confirmation shown',/بانتظار تأكيد me@x.y/.test($('#app').textContent));
 // sharing needs the email account
 E("ui.sub='family';render()");T('sharing blocked for temporary account',/أضف بريدك وجوالك/.test($('#app').textContent)&&!$('#inv_code'));
 // the confirmation link ends the temporary state and asks for a password
 d=mk([['mp3_meta',JSON.parse(w.localStorage.getItem('mp3_meta'))],['mp3_cloud',JSON.parse(w.localStorage.getItem('mp3_cloud'))]],'https://odo93.github.io/meal-plan/v2/#access_token=NEW&refresh_token=R2&expires_in=3600&type=email_change');
 w=d.window;$=s=>w.document.querySelector(s);E=s=>w.eval(s);await sleep(120);
 T('account now permanent',E('cloud.anon')===false&&E('cloud.email')==='me@x.y'&&!E('cloud.pendEmail'));
 T('asked to choose a password',!!$('#cl_np'));
 // background sign-in disabled in Supabase → stays on device, retries once a day
 ANON_ON=false;log=[];
 d=mk([['mp3_meta',{users:[{id:'u1',name:'م'}],cur:'u1',mode:'self',consent:'yes'}]]);w=d.window;E=s=>w.eval(s);await sleep(80);
 T('disabled: no session, no error',!E('cloud.sess')&&errs.length===0);
 const tries=log.filter(l=>l[1]==='/auth/v1/signup').length;await E('anonSignIn()');
 T('no retry within a day',log.filter(l=>l[1]==='/auth/v1/signup').length===tries&&tries===1);
 console.log('PASS',ok,'FAIL',bad,errs);process.exit(0);
})();
