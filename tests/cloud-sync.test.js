const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=require('./v2html')();
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
const DB={mp_users:[],mp_days:[],mp_history:[]},log=[],BODY=[];
const d=new JSDOM(html,{runScripts:'dangerously',url:'http://x.test/',virtualConsole:vc,pretendToBeVisual:true,beforeParse(win){
  win.fetch=async(url,o)=>{o=o||{};const u=new URL(url),p=u.pathname,body=o.body?JSON.parse(o.body):null;log.push([o.method||'GET',p+u.search,o.headers.Authorization]);BODY.push([p,body]);
    const R=(j,st)=>({ok:(st||200)<300,status:st||200,text:async()=>j===undefined?'':JSON.stringify(j)});
    if(p==='/auth/v1/token'&&u.searchParams.get('grant_type')==='password')return body.password==='pw'?R({access_token:'AT1',refresh_token:'RT1',expires_in:3600,user:{id:'uid-1'}}):R({error_description:'Invalid login credentials'},400);
    if(p==='/auth/v1/token'&&u.searchParams.get('grant_type')==='refresh_token')return R({access_token:'AT2',refresh_token:'RT2',expires_in:3600,user:{id:'uid-1'}});
    if(p==='/auth/v1/signup')return R({id:'uid-9',email:body.email});
    if(p==='/auth/v1/user'&&o.method==='PUT')return R({id:'uid-1',user_metadata:body.data});
    if(/^\/rest\/v1\/(rpc|app_config|announcements|shared_foods|mp_accounts)/.test(p))return R([]);
    const m=p.match(/^\/rest\/v1\/(\w+)/);const t=m&&m[1];
    if(o.method==='POST'){const key={mp_users:['owner','id'],mp_days:['owner','user_id','idx'],mp_history:['owner','user_id','date']}[t];
      if(u.searchParams.get('on_conflict')!==key.join(','))return R({message:'bad conflict'},400);
      body.forEach(r=>{const i=DB[t].findIndex(x=>key.every(k=>x[k]===r[k]));if(i>=0)DB[t][i]=r;else DB[t].push(r)});return R(undefined,201)}
    if(o.method==='DELETE'){ if(t==='mp_users'){const ids=u.searchParams.get('id').match(/\((.*)\)/)[1].split(',');DB.mp_users=DB.mp_users.filter(r=>ids.includes(r.id))}
      else{const uid=u.searchParams.get('user_id').slice(3),dt=u.searchParams.get('date');const keep=dt?dt.match(/\((.*)\)/)[1].split(','):[];DB.mp_history=DB.mp_history.filter(r=>r.user_id!==uid||keep.includes(r.date))}return R(undefined,204)}
    if(!o.method||o.method==='GET'){const off=+u.searchParams.get('offset')||0;return R(DB[t].slice(off,off+1000))}
  };}});
const w=d.window,$=s=>w.document.querySelector(s),ev=(el,t)=>el.dispatchEvent(new w.Event(t,{bubbles:true}));
const click=s=>$(s).dispatchEvent(new w.MouseEvent('click',{bubbles:true})),E=s=>w.eval(s),sleep=ms=>new Promise(r=>setTimeout(r,ms));
let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x===undefined?'':x))};
(async()=>{
 click('#nav [data-act="tab"][data-v="me"]');click('[data-act="tab"][data-v="me/sync"]');
 T('account card, no technical words',$('#app').textContent.includes('حسابك')&&!/مزامنة|Supabase|المفتاح العام|رابط المشروع/.test($('#app').textContent));
 T('no URL / key fields',!$('#cl_url')&&!$('#cl_key')&&!$('[data-k="auto"]'));
 T('fixed project',E('cloud.url')==='https://exznecnhvsihdelwsibv.supabase.co'&&E('cloud.key').length>100);
 const set=(id,v)=>{$(id).value=v;ev($(id),'change')};
 // sign-up needs a phone and sends it with the account
 click('[data-act="cauthm"][data-v="up"]');T('sign-up form has phone',!!$('#cl_ph')&&$('#cl_ph').type==='tel'&&$('#cl_pw').autocomplete==='new-password');
 set('#cl_em','a@b.c');$('#cl_ph').value='12';$('#cl_pw').value='secret1';click('[data-act="csignup"]');await sleep(50);
 T('bad phone rejected',/رقم جوال/.test($('#cst').textContent)&&!BODY.some(b=>b[0]==='/auth/v1/signup'));
 E('render()');T('password survives a background re-render',$('#cl_pw').value==='secret1');
 $('#cl_ph').value='+966 50 123 4567';click('[data-act="csignup"]');await sleep(50);
 const su=BODY.find(b=>b[0]==='/auth/v1/signup');
 T('signup sends phone',su&&su[1].data.phone==='+966501234567'&&su[1].email==='a@b.c',JSON.stringify(su));
 T('activation message',/رابط التفعيل/.test($('#cst').textContent));
 click('[data-act="cauthm"][data-v="in"]');
 $('#cl_pw').value='bad';click('[data-act="clogin"]');await sleep(50);
 T('bad login msg',$('#cst').textContent.includes('Invalid'),$('#cst').textContent);
 $('#cl_pw').value='pw';click('[data-act="clogin"]');await sleep(80);
 T('logged in',!!E('cloud.sess')&&E('cloud.sess.uid')==='uid-1'&&$('#app').textContent.includes('حفظ الآن'),E('cloud.last'));
 T('empty account → device data saved to it',DB.mp_users.length===1&&!E('modal'));
 T('password not stored',!w.localStorage.getItem('mp3_cloud').includes('"pw"'));
 // make data: add a logged day + second user
 E('state.days[0].meals[0].items[0].e=state.days[0].meals[0].items[0].g;state.days[0].lw=weekKey();save()');
 E('addUser("ثاني",true)');E('switchUser(meta.users[0].id)');
 click('[data-act="cpush"]');await sleep(150);
 console.log('last:',E('cloud.last'));
 T('users uploaded',DB.mp_users.length===2&&DB.mp_users[0].owner==='uid-1'&&Array.isArray(DB.mp_users[0].foods));
 T('days uploaded',DB.mp_days.length===14);
 T('history uploaded',DB.mp_history.length>=1&&DB.mp_history[0].data.date===DB.mp_history[0].date);
 T('auth header uses token',log.filter(l=>l[1].startsWith('/rest')&&!/app_config|announcements|shared_foods/.test(l[1])).every(l=>l[2]==='Bearer AT1'));
 // prune: delete second user locally and push
 E('delUser(meta.users[1].id)');click('[data-act="cpush"]');await sleep(150);
 T('pruned user',DB.mp_users.length===1);
 // history prune
 const before=DB.mp_history.length;E('hDel(meta.cur,hIdx(meta.cur)[0])');click('[data-act="cpush"]');await sleep(150);
 T('pruned history',DB.mp_history.length===before-1,[before,DB.mp_history.length]);
 // token refresh path
 E('cloud.sess.exp=Date.now()-1');click('[data-act="cpush"]');await sleep(150);
 T('refresh used',log.some(l=>l[1].includes('refresh_token'))&&E('cloud.sess.at')==='AT2');
 // pull: wipe local data then pull
 const nm=E('curUser().name');E('meta.users[0].name="تغيّر محلي"');E('save()');
 click('[data-act="cpull"]');await sleep(150);
 T('pull asks',$('#modal').textContent.includes('تنزيل'));
 click('[data-act="yes"]');await sleep(30);
 T('pull restored',E('curUser().name')===nm,E('curUser().name'));
 T('restored day log',E('state.days[0].meals[0].items[0].e')>0);
 // auto push
 const n0=log.length;E('state.settings.bw=75;save()');await sleep(4300);
 T('auto push fired',log.length>n0&&DB.mp_users[0].settings.bw===75);
 // phone for an existing account
 E("ui.tab='me';ui.sub='sync';render()");$('#cl_ph').value='0501234567';click('[data-act="cphone"]');await sleep(60);
 T('phone saved to account',BODY.some(b=>b[0]==='/auth/v1/user'&&b[1].data.phone==='0501234567')&&E('cloud.phone')==='0501234567');
 // signing in again with data in the account → user chooses
 E("meta.mode='coach'");E('afterLogin()');await sleep(80);
 T('choice shown when account has data',E('modal&&modal.type')==='acctdata');
 E('meta.users[0].name="محلي"');click('[data-act="acctpull"]');await sleep(150);
 T('account data restored without a second question',E('curUser().name')===nm&&!E('modal'));
 T('user type kept after restore',E('meta.mode')==='coach');
 // error display
 w.fetch=async()=>({ok:false,status:500,text:async()=>'{"message":"boom"}'});click('[data-act="cpush"]');await sleep(100);
 T('error shown',$('#cst').textContent.includes('boom'),$('#cst').textContent);
 console.log('PASS',ok,'FAIL',bad,'errs',errs);process.exit(0);
})();
