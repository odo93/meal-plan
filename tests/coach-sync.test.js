// المدرب يعدّل خطة المتدرب: حالة الحفظ ظاهرة وزر «حفظ الآن»، والتعديل يصل للمتدرب ولا يُكتب فوقه عند رفع المتدرب
const {JSDOM,VirtualConsole}=require('jsdom');
const html=require('./v2html')();
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x===undefined?'':x))};
const R=(j,st)=>({ok:(st||200)<300,status:st||200,text:async()=>j===undefined?'':JSON.stringify(j),json:async()=>j});
// قاعدة بيانات وهمية مشتركة بين جهاز المدرب وجهاز المتدرب
let DB={mp_users:[],mp_days:[],mp_history:[],mp_grants:[]};const log=[];
const KEYS={mp_users:['owner','id'],mp_days:['owner','user_id','idx'],mp_history:['owner','user_id','date']};
const match=(u,r)=>[...u.searchParams].every(([k,v])=>['select','order','limit','offset','on_conflict'].includes(k)||(v.startsWith('eq.')?String(r[k])===decodeURIComponent(v.slice(3)):v.startsWith('in.(')?v.slice(4,-1).split(',').includes(String(r[k])):true));
const mk=ls=>new JSDOM(html,{runScripts:'dangerously',url:'https://odo93.github.io/meal-plan/v2/#/today',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){
  (ls||[]).forEach(([k,v])=>w.localStorage.setItem(k,JSON.stringify(v)));
  w.fetch=async(url,o)=>{o=o||{};const u=new URL(url,'https://x.test/'),p=u.pathname,m=(o.method||'GET'),body=o.body?JSON.parse(o.body):null;log.push([m,p+u.search]);
    const t=(p.match(/^\/rest\/v1\/(\w+)$/)||[])[1];
    if(!t||!DB[t])return R([]);
    if(m==='GET')return R(DB[t].filter(r=>match(u,r)));
    if(m==='PATCH'){DB[t].filter(r=>match(u,r)).forEach(r=>Object.assign(r,JSON.parse(JSON.stringify(body))));return R(undefined,204)}
    if(m==='POST'){body.forEach(r=>{const i=DB[t].findIndex(x=>KEYS[t].every(k=>x[k]===r[k]));if(i>=0)DB[t][i]=r;else DB[t].push(r)});return R(undefined,201)}
    return R(undefined,204)}}});
const TR=[['mp3_cloud',{email:'t@b.c',sess:{at:'AT',rt:'RT',exp:Date.now()+3600e3,uid:'T1'}}],['mp3_meta',{users:[{id:'p1',name:'متدرب'}],cur:'p1',mode:'self',consent:'yes'}]];
(async()=>{
 // 1) المتدرب يرفع خطته
 let t=mk(TR),tw=t.window,TE=s=>tw.eval(s);await sleep(80);
 await TE('cPush()');
 T('trainee plan uploaded and sync stamp kept',DB.mp_users.length===1&&!!TE('meta.syncAt.p1'));
 TE("state.days[0].meals[0].items[0].e=state.days[0].meals[0].items[0].g;save()");   // سجّل أول صنف (لم يُرفع بعد)
 // 2) المدرب يفتح الملف ويعدّل
 DB.mp_grants=[{owner:'T1',user_id:'p1',grantee:'C1',role:'coach',status:'active'}];
 let c=mk([['mp3_cloud',{email:'c@b.c',sess:{at:'AT',rt:'RT',exp:Date.now()+3600e3,uid:'C1'}}],['mp3_meta',{users:[{id:'c1',name:'مدرب'}],cur:'c1',mode:'coach',consent:'yes'}]]),cw=c.window,CE=s=>cw.eval(s),$=s=>cw.document.querySelector(s);await sleep(80);
 await CE("openRemote({owner:'T1',user_id:'p1',role:'coach'})");CE("ui.tab='day';ui.day=0;render()");
 T('coach banner says edits save automatically',/كل تعديل يُحفظ تلقائياً/.test($('#app').textContent));
 CE("state.settings.bw=91;state.days[0].meals[0].items[0].g=222;save();render()");
 T('pending edit shown with «حفظ الآن»',/تعديلات لم تُحفظ بعد/.test($('#app').textContent)&&!!$('[data-act="rsave"]'));
 log.length=0;$('[data-act="rsave"]').dispatchEvent(new cw.MouseEvent('click',{bubbles:true}));await sleep(60);
 T('«حفظ الآن» writes to the trainee profile',log.some(l=>l[0]==='PATCH'&&l[1].startsWith('/rest/v1/mp_users'))&&DB.mp_users[0].settings.bw===91);
 T('saved state shown',/✓ محفوظ/.test($('#app').textContent)&&!$('[data-act="rsave"]'));
 // edit then leave at once: not lost
 CE("state.settings.bw=92;save()");log.length=0;CE("act('whome',{})");await sleep(60);
 T('leaving right after an edit still saves it',DB.mp_users[0].settings.bw===92);
 // 3) المتدرب: رفعه التالي لا يكتب فوق تعديل المدرب، ويصل له التعديل ويبقى تسجيله
 await TE('cPush()');
 T('trainee push did not overwrite the coach',DB.mp_users[0].settings.bw===92,DB.mp_users[0].settings.bw);
 T('trainee now has the coach plan',TE('state.settings.bw')===92&&TE('state.days[0].meals[0].items[0].g')===222);
 T('trainee log kept',TE('state.days[0].meals[0].items[0].e')>0&&DB.mp_days.find(d=>d.idx===0).data.meals[0].items[0].e>0);
 T('trainee told about it',/وصلت تعديلات جديدة على خطتك/.test(tw.document.getElementById('toast').textContent));
 // 4) يصل التعديل عند الفتح أيضاً (بدون رفع)
 CE("openRemote({owner:'T1',user_id:'p1',role:'coach'})");await sleep(30);CE("state.settings.bw=93;save()");await sleep(1700);
 T('auto save after 1.5 s',DB.mp_users[0].settings.bw===93);
 const n=await TE('cSyncIn()');T('trainee pulls on open/return',n===1&&TE('state.settings.bw')===93);
 T('nothing pulled when unchanged',(await TE('cSyncIn()'))===0);
 // 5) جهاز بلا مزامنة سابقة ولا مدرب: لا يستبدل بياناته
 DB.mp_grants=[];t=mk([['mp3_cloud',{email:'t@b.c',sess:{at:'AT',rt:'RT',exp:Date.now()+3600e3,uid:'T1'}}],['mp3_meta',{users:[{id:'p1',name:'متدرب'}],cur:'p1',mode:'self',consent:'yes'}]]);tw=t.window;await sleep(80);
 T('no coach and no stamp → local data kept',tw.eval('state.settings.bw')!==93&&!!tw.eval('meta.syncAt.p1'));
 console.log('PASS',ok,'FAIL',bad,errs);process.exit(0);
})();
