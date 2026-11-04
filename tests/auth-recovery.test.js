const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(__dirname+'/../v2/index.html','utf8');
const errs=[],log=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
const mk=(url)=>new JSDOM(html,{runScripts:'dangerously',url,virtualConsole:vc,pretendToBeVisual:true,beforeParse(win){
 win.fetch=async(u,o)=>{o=o||{};const p=new URL(u).pathname;log.push([o.method||'GET',p,o.headers.Authorization,o.body]);
  const R=j=>({ok:true,status:200,text:async()=>JSON.stringify(j)});
  if(p==='/auth/v1/user')return R({id:'uid-9',email:'a@b.c'});return R({})}}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x||''))};
(async()=>{
 let d=mk('https://odo93.github.io/meal-plan/#access_token=AT9&refresh_token=RT9&expires_in=3600&type=recovery');let w=d.window,$=s=>w.document.querySelector(s);
 await sleep(200);
 T('hash cleared',!/access_token/.test(w.location.hash));
 T('session from hash',w.eval('cloud.sess&&cloud.sess.uid')==='uid-9'&&w.eval('cloud.sess.at')==='AT9');
 T('recovery shows new pw',!!$('#cl_np'),$('#app').textContent.slice(0,80));
 T('user call used hash token',log.some(l=>l[1]==='/auth/v1/user'&&l[2]==='Bearer AT9'));
 $('#cl_np').value='abc';$('[data-act="cnewpw"]').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));await sleep(50);
 T('short pw rejected',$('#cst').textContent.includes('6'));
 $('#cl_np').value='abcdef';$('[data-act="cnewpw"]').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));await sleep(100);
 T('PUT password',log.some(l=>l[0]==='PUT'&&l[1]==='/auth/v1/user'&&l[3].includes('abcdef')&&l[2]==='Bearer AT9'));
 T('new pw box gone',!$('#cl_np'));
 // forgot
 d=mk('https://odo93.github.io/meal-plan/');w=d.window;$=s=>w.document.querySelector(s);
 $('#nav [data-act="tab"][data-v="me"]').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));$('[data-act="tab"][data-v="me/sync"]').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
 $('#cl_em').value='x@y.z';$('[data-act="cforgot"]').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));await sleep(100);
 T('recover POST',log.some(l=>l[0]==='POST'&&l[1]==='/auth/v1/recover'&&l[3].includes('x@y.z')),log.map(l=>l[1]));
 T('msg',$('#cst').textContent.includes('أُرسل'));
 console.log('PASS',ok,'FAIL',bad,errs);process.exit(0)})();
