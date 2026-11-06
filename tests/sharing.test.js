// مشاركة الأشخاص: «من تعرض؟»، عرض شخص مشارك دون لمس بيانات الجهاز، الصلاحيات، أكواد الدعوة، الإعلانات والتحديث الإجباري
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=require('./v2html')();
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x===undefined?'':x))};
const OWNER='own-2',ME='uid-1',log=[];
let REMOTE=null,ROLE='viewer',CFG={latest_version:'2.1',min_version:'2.0',features:{}},ANN=[{id:7,title:'صيانة الليلة',body:'المزامنة تتوقف 10 دقائق',level:'info'}];
const R=(j,st)=>({ok:(st||200)<300,status:st||200,text:async()=>j===undefined?'':JSON.stringify(j)});
const mk=()=>new JSDOM(html,{runScripts:'dangerously',url:'https://odo93.github.io/meal-plan/v2/',virtualConsole:vc,pretendToBeVisual:true,beforeParse(win){
  win.localStorage.setItem('mp3_cloud',JSON.stringify({url:'https://exznecnhvsihdelwsibv.supabase.co',key:'anon',email:'me@x.y',auto:false,sess:{at:'AT1',rt:'RT1',exp:Date.now()+3600e3,uid:ME},last:''}));
  win.fetch=async(url,o)=>{o=o||{};const u=new URL(url),p=u.pathname,body=o.body?JSON.parse(o.body):null;log.push([o.method||'GET',p+u.search,body]);
    if(p==='/rest/v1/app_config')return R([CFG]);
    if(p==='/rest/v1/announcements')return R(ANN);
    if(p==='/rest/v1/shared_foods')return R([{id:'sf1',n:'كشري مصري',grp:'carb',k:150,p:5,c:28,f:2,u:null,ug:null}]);
    if(p==='/rest/v1/rpc/mp_shared_with_me')return R([{owner:OWNER,user_id:'kid1',name:'أحمد',role:ROLE,owner_email:'a@b.c'}]);
    if(p==='/rest/v1/rpc/mp_my_grants')return R([]);
    if(p==='/rest/v1/rpc/mp_accept_invite')return body.p_code==='GOOD12'?R({owner:OWNER,user_id:'kid1',name:'أحمد',role:'coach'}):R({message:'invalid_code'},400);
    if(p==='/rest/v1/mp_users'&&(o.method||'GET')==='GET')return R(u.searchParams.get('owner')==='eq.'+OWNER?[{owner:OWNER,id:'kid1',name:'أحمد',settings:REMOTE.settings,foods:REMOTE.foods}]:[]);
    if(p==='/rest/v1/mp_days'&&(o.method||'GET')==='GET')return R(REMOTE.days.map((d,idx)=>({owner:OWNER,user_id:'kid1',idx,data:d})));
    if(p==='/rest/v1/mp_history')return R([]);
    return R(undefined,201)}}});
(async()=>{
 const d=mk(),w=d.window,$=s=>w.document.querySelector(s),$$=s=>[...w.document.querySelectorAll(s)],E=s=>w.eval(s);
 const click=s=>{const el=typeof s==='string'?$(s):s;el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}))};
 REMOTE=JSON.parse(E('JSON.stringify(defaultState())'));REMOTE.settings.bw=55;
 await sleep(80);
 // 1) public config: announcement + shared foods
 T('announcement shown',$('#app').textContent.includes('صيانة الليلة'));
 click('[data-act="annx"][data-v="7"]');
 T('announcement dismissed',!$('#app').textContent.includes('صيانة الليلة')&&JSON.parse(w.localStorage.getItem('mp3_ann_seen')).includes(7));
 T('shared food searchable',E("catSearch('كشري').some(c=>c.n==='كشري مصري')"));
 T('public requests use anon key',log.filter(l=>/app_config|announcements/.test(l[1])).length>=2);
 // 2) «من تعرض؟» lists the shared person
 click('#top [data-act="who"]');await sleep(30);
 T('who lists shared',$$('#modal [data-act="whopick"]').length===1&&$('#modal').textContent.includes('أحمد'));
 const before=Object.keys(w.localStorage).sort().map(k=>k+'='+w.localStorage.getItem(k)).join('\n');
 click('#modal [data-act="whopick"][data-v="0"]');await sleep(60);
 T('remote opened',E('ui.remote&&ui.remote.name')==='أحمد'&&E('S().bw')===55);
 T('remote banner',$('#app').textContent.includes('تعرض الآن: أحمد')&&$('#app').textContent.includes('مشاهدة فقط'));
 // 3) viewer: no edits, no logging, nothing written to this device
 click('[data-act="qlog"][data-m="0"][data-i="0"]');
 T('viewer cannot log',E('gE(state.days[ui.day].meals[0].items[0])')==null&&$('#toast').textContent.includes('التسجيل لصاحب الخطة'));
 const q=$('[data-ch="qty"]');q.value='999';q.dispatchEvent(new w.Event('change',{bubbles:true}));
 T('viewer cannot edit',$('#toast').textContent.includes('مشاهدة فقط'));
 await sleep(1700);
 T('viewer sends no writes',!log.some(l=>l[0]==='PATCH'));
 const after=Object.keys(w.localStorage).sort().map(k=>k+'='+w.localStorage.getItem(k)).join('\n');
 T('local storage untouched',before===after);
 // 4) back to my own profile
 click('[data-act="whome"]');
 T('back to mine',!E('ui.remote')&&E('S().bw')!==55);
 // 5) editor: plan edits go to the owner's rows and keep the owner's latest logging
 ROLE='editor';E('ui.shared=null');click('#top [data-act="who"]');await sleep(30);click('#modal [data-act="whopick"][data-v="0"]');await sleep(60);
 T('editor opened',E('ui.remote.role')==='editor'&&$('#app').textContent.includes('تُحفظ في حسابه'));
 const di=E('ui.day');REMOTE.days[di].meals[0].items[0].e=REMOTE.days[di].meals[0].items[0].g; // صاحب الخطة سجّل للتو
 const q2=$('[data-ch="qty"][data-m="0"][data-i="1"]');q2.value='7';q2.dispatchEvent(new w.Event('change',{bubbles:true}));
 await sleep(1800);
 const pu=log.filter(l=>l[0]==='PATCH'&&l[1].startsWith('/rest/v1/mp_users')),pd=log.filter(l=>l[0]==='PATCH'&&l[1].startsWith('/rest/v1/mp_days'));
 T('editor patches owner rows',pu.length===1&&pu[0][1].includes('owner=eq.'+OWNER)&&pd.length===7,[pu.length,pd.length]);
 const sent=pd.find(l=>l[1].includes('idx=eq.'+di))[2].data;
 T('owner log kept on merge',sent.meals[0].items[0].e!=null);
 T('editor change sent',JSON.stringify(sent.meals[0].items[1])!==JSON.stringify(REMOTE.days[di].meals[0].items[1]));
 click('[data-act="whome"]');
 // 6) invite codes
 click('#nav [data-v="me"]');click('[data-v="me/family"]');
 click('[data-act="share"]');T('share sheet',!!$('#modal [data-act="gcreate"]'));
 click('[data-act="srole"][data-v="coach"]');click('[data-act="gcreate"]');await sleep(80);
 const g=log.find(l=>l[0]==='POST'&&l[1].startsWith('/rest/v1/mp_grants'));
 T('grant created with code',g&&/^[A-HJ-NP-Z2-9]{6}$/.test(g[2].code)&&g[2].role==='coach'&&g[2].owner===ME,g&&g[2]);
 T('person pushed before invite',log.findIndex(l=>l[1].startsWith('/rest/v1/mp_users?on_conflict'))<log.indexOf(g));
 T('code shown',$('#sh_code')&&$('#sh_code').textContent===g[2].code);
 click('[data-act="close"]');
 $('#inv_code').value='bad999';click('[data-act="gaccept"]');await sleep(60);
 T('bad code message',$('#inv_msg').textContent.includes('غير صحيح'));
 $('#inv_code').value='good12';click('[data-act="gaccept"]');await sleep(60);
 T('good code accepted',log.some(l=>l[1]==='/rest/v1/rpc/mp_accept_invite'&&l[2].p_code==='GOOD12'));
 // 7) pull only my own rows
 log.length=0;E("cRun(cPull)");await sleep(60);
 T('pull filters owner',log.filter(l=>l[0]==='GET'&&/mp_(users|days|history)/.test(l[1])).every(l=>l[1].includes('owner=eq.'+ME)));
 // 8) forced update
 CFG.min_version='9.0';E('loadPublic()');await sleep(60);
 T('update required banner',$('#app').textContent.includes('تحديث مطلوب')&&!!$('[data-act="updnow"]'));
 console.log('PASS',ok,'FAIL',bad,errs);process.exit(0)})();
