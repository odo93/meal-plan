// v2/js/cloud.js — المزامنة السحابية (Supabase REST)
// سكربت عادي (ليس module): كل الملفات تتشارك نطاقاً عاماً واحداً وتُحمَّل بالترتيب في index.html.
// لا تستدعِ عند التحميل دالة من ملف لاحق؛ الاستدعاء داخل الدوال مسموح.
// ---------- الحفظ في حساب المستخدم (Supabase REST) ----------
// الرابط والمفتاح العام ثابتان هنا ويظهران للمدير فقط في لوحة الإدارة؛ المستخدم لا يراهما ولا يغيّرهما.
// الحفظ تلقائي دائماً بعد تسجيل الدخول (لا خيار «مزامنة» للمستخدم).
const CK='mp3_cloud';
const SB_URL='https://exznecnhvsihdelwsibv.supabase.co',SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4em5lY25odnNpaGRlbHdzaWJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1OTY4NzAsImV4cCI6MjEwOTE3Mjg3MH0.8TP92hVmjHt9KrnaWzWDWvzdgBIctk2BkBphxjzRCK0';
let cloud=Object.assign({email:'',phone:'',sess:null,last:''},lsGet(CK)||{});cloud.url=SB_URL;cloud.key=SB_KEY;delete cloud.auto;
const cSave=()=>lsSet(CK,cloud);
function cMsg(t){cloud.last=t;cSave();const e=$('#cst');if(e)e.textContent=t}
async function cRun(fn){cMsg('جارٍ التنفيذ…');try{cMsg(await fn()||'تم')}catch(e){cMsg('خطأ: '+(e&&e.message||e))}}
async function cFetch(path,o){o=o||{};
  const h=Object.assign({apikey:cloud.key,'Content-Type':'application/json'},o.headers||{});
  h.Authorization='Bearer '+(o.token||(o.anon||!cloud.sess?cloud.key:await cToken()));
  const r=await fetch(cloud.url.replace(/\/+$/,'')+path,{method:o.method||'GET',headers:h,body:o.body!==undefined?JSON.stringify(o.body):undefined});
  const t=await r.text();let j=null;try{j=t?JSON.parse(t):null}catch(e){}
  if(!r.ok)throw new Error((j&&(j.msg||j.message||j.error_description||j.error))||('HTTP '+r.status));
  return j;
}
function cSess(j){cloud.sess={at:j.access_token,rt:j.refresh_token,exp:Date.now()+(j.expires_in||3600)*1000,uid:(j.user&&j.user.id)||(cloud.sess&&cloud.sess.uid)};cSave()}
async function cToken(){const s=cloud.sess;if(s.exp-Date.now()>60000)return s.at;cSess(await cFetch('/auth/v1/token?grant_type=refresh_token',{method:'POST',anon:true,body:{refresh_token:s.rt}}));return cloud.sess.at}
// CAPTCHA: يعمل فقط إن وضع المدير المفتاح العام في لوحة الإدارة (app_config.captcha_site_key)
let tsP=null;
function tsLoad(){return tsP||(tsP=new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';s.async=true;s.onload=()=>res(window.turnstile);s.onerror=()=>{tsP=null;rej(new Error('تعذّر تحميل التحقق — تأكد من الاتصال'))};document.head.appendChild(s)}))}
async function captcha(){const k=pubCfg().captcha_site_key;if(!k)return '';
  const ts=await tsLoad();
  return new Promise((res,rej)=>{let box=document.getElementById('capbox');if(!box){box=document.createElement('div');box.id='capbox';document.body.appendChild(box)}box.innerHTML='';
    const done=()=>setTimeout(()=>{const b=document.getElementById('capbox');if(b)b.remove()},0);
    ts.render(box,{sitekey:k,language:'ar',callback:t=>{done();res(t)},'error-callback':()=>{done();rej(new Error('تعذّر التحقق — حاول مرة أخرى'))}})})}
const withCap=async b=>{const t=await captcha();return t?Object.assign({},b,{gotrue_meta_security:{captcha_token:t}}):b};
// رقم الجوال: أرقام فقط مع + اختيارية في البداية، 8–15 رقماً
const normPhone=v=>{const s=String(v||'').replace(/[\s\-()]/g,'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));return /^\+?\d{8,15}$/.test(s)?s:''};
async function cAuth(signup){
  const email=(($('#cl_lem')||{}).value||($('#cl_em')||{}).value||cloud.email||'').trim(),pw=($('#cl_pw')||{}).value||'';
  if(!email||!pw)return 'أدخل البريد وكلمة المرور';
  let phone='';if(signup){phone=normPhone(($('#cl_ph')||{}).value);if(!phone)return 'أدخل رقم جوال صحيحاً (8–15 رقماً، مثل ‎+9665xxxxxxxx)';if(pw.length<6)return 'كلمة المرور 6 أحرف فأكثر'}
  cloud.email=email;if(phone)cloud.phone=phone;
  const j=await cFetch(signup?'/auth/v1/signup'+RET():'/auth/v1/token?grant_type=password',{method:'POST',anon:true,body:await withCap(signup?{email,password:pw,data:{phone}}:{email,password:pw})});
  if(j&&j.access_token){cSess(j);cloud.anon=false;delete cloud.pendEmail;cSave();afterLogin(j.user);return 'تم تسجيل الدخول'}
  return 'تم إنشاء الحساب. افتح الرسالة في بريدك واضغط رابط التفعيل، ثم سجّل الدخول';
}
// بعد الدخول: إن كان الحساب فارغاً تُحفظ بيانات الجهاز فيه، وإن كان فيه بيانات يختار المستخدم أيّهما يبقى
async function afterLogin(user){
  if(user){const ph=user.user_metadata&&user.user_metadata.phone;if(ph)cloud.phone=ph;if(user.email)cloud.email=user.email;cSave()}
  await loadShared();render();
  try{const r=await cFetch('/rest/v1/mp_users?select=id&owner=eq.'+ENC(cloud.sess.uid)+'&limit=1');
    if(Array.isArray(r)&&r.length){modal={type:'acctdata'};render()}else cRun(cPush);
  }catch(e){}
}
// حساب في الخلفية بعد موافقة المستخدم (meta.consent): يُنشأ بلا بريد فتُحفظ البيانات في قاعدة البيانات من اليوم الأول.
// يحتاج تفعيل «Anonymous sign-ins» في Supabase؛ إن لم يكن مفعّلاً تبقى البيانات في الجهاز ويُعاد المحاولة مرة يومياً.
async function anonSignIn(){
  if(cloud.sess||!meta||meta.consent!=='yes'||navigator.onLine===false)return false;
  if(cloud.anonTry&&Date.now()-cloud.anonTry<864e5)return false;
  cloud.anonTry=Date.now();cSave();
  try{const j=await cFetch('/auth/v1/signup',{method:'POST',anon:true,body:await withCap({data:{}})});
    if(!j||!j.access_token)return false;
    cSess(j);cloud.anon=true;cloud.email='';delete cloud.anonTry;cSave();await afterLogin(j.user);return true;
  }catch(e){return false}
}
// تثبيت الحساب المؤقت: إضافة البريد والجوال (رابط تأكيد على البريد، ثم اختيار كلمة مرور)
async function cUpgrade(){
  const email=(($('#cl_em')||{}).value||'').trim(),phone=normPhone(($('#cl_ph')||{}).value);
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return 'أدخل بريداً صحيحاً';
  if(!phone)return 'أدخل رقم جوال صحيحاً (8–15 رقماً)';
  await cFetch('/auth/v1/user'+RET(),{method:'PUT',body:{email,data:{phone}}});
  cloud.pendEmail=email;cloud.phone=phone;cSave();render();
  return 'أرسلنا رابط تأكيد إلى '+email+'. افتحه من هذا الجهاز ثم اختر كلمة مرور.';
}
// حذف الحساب: الخادم يؤرشف البيانات بلا اسم ولا صورة ثم يحذف الحساب؛ هنا نمسح الجهاز ونبدأ من جديد
let reloadApp=()=>location.reload();
async function cDeleteAccount(){
  await cFetch('/rest/v1/rpc/mp_delete_account',{method:'POST',body:{}});
  Object.keys(localStorage).filter(k=>k.startsWith('mp3_')&&k!=='mp3_theme'&&k!=='mp3_imported').forEach(lsDel);  // mp3_imported يمنع إعادة نسخ بيانات v1
  cloud={url:SB_URL,key:SB_KEY,email:'',phone:'',sess:null,last:''};
  setTimeout(reloadApp,50);return 'حُذف حسابك'}
// ---------- التحديثات: version.json يحمل رقم آخر نسخة و«ما الجديد» ----------
// يُفحص عند الفتح، وعند الرجوع للتطبيق (مرة كل 10 دقائق على الأكثر)، وكل 30 دقيقة.
let updAt=0,updBusy=false;
const lsRaw=k=>{try{return localStorage.getItem(k)}catch(e){return null}},lsPut=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
// تحديث قسري: يلغي عامل الخدمة ويمسح الذاكرة المؤقتة ثم يحمّل من الشبكة (مرة واحدة لكل نسخة؛ البيانات في localStorage لا تُمس)
async function hardRefresh(v){
  lsPut('mp3_hard',v);
  try{const rs=navigator.serviceWorker?await navigator.serviceWorker.getRegistrations():[];await Promise.all(rs.map(r=>r.unregister()))}catch(e){}
  try{const ks=window.caches?await caches.keys():[];await Promise.all(ks.filter(k=>k.startsWith('mp-v2-')).map(k=>caches.delete(k)))}catch(e){}
  location.replace(location.pathname+'?r='+Date.now());
}
async function checkUpdate(minGap=0){
  if(navigator.onLine===false||Date.now()-updAt<minGap)return;updAt=Date.now();
  try{const r=await fetch('version.json',{cache:'no-store'});if(!r.ok)return;const j=await r.json();
    if(j&&typeof j.v==='string'&&verLt(APP_VER,j.v)&&lsRaw('mp3_updtry')===j.v&&lsRaw('mp3_hard')!==j.v){hardRefresh(j.v);return} // حاولنا التحديث ولا تزال النسخة قديمة (ذاكرة مؤقتة عنيدة، شائعة في آيفون)
    if(j&&typeof j.v==='string'&&verLt(APP_VER,j.v)&&!(ui.upd&&ui.upd.v===j.v)){ui.upd={v:j.v,notes:Array.isArray(j.notes)?j.notes.slice(0,5).map(String):[]};render()}
  }catch(e){}}
// ---------- تتبّع الاستخدام لاختبار الفكرة (docs/VALIDATION-PLAN.md) ----------
// ستة أحداث فقط، مرة واحدة لكل حدث في اليوم. تُجمع في الجهاز وتُرفع دفعة واحدة عند وجود جلسة (أي بعد موافقة المستخدم).
const EVQ='mp3_evq',EVDAY='mp3_evday';let evT=null;
function track(ev){try{const day=todayISO(),seen=lsGet(EVDAY)||{};if(seen[ev]===day)return;seen[ev]=day;lsSet(EVDAY,seen);
  lsSet(EVQ,(lsGet(EVQ)||[]).concat({ev,day,at:new Date().toISOString(),ver:APP_VER}).slice(-300));clearTimeout(evT);evT=setTimeout(flushEvents,5000)}catch(e){}}
async function flushEvents(){const old=Date.now()-29*864e5,all=lsGet(EVQ)||[],q=all.filter(x=>Date.parse(x.at)>old);if(q.length<all.length)lsSet(EVQ,q);   // الأقدم ترفضه القاعدة
  if(!q.length||!cloud.sess||navigator.onLine===false)return;
  try{await cFetch('/rest/v1/app_events',{method:'POST',headers:{Prefer:'return=minimal'},body:q});lsSet(EVQ,(lsGet(EVQ)||[]).filter(x=>!q.some(y=>y.at===x.at&&y.ev===x.ev)))}catch(e){}}
// التحديث الآن: يحفظ في الجهاز، ويُنهي أي رفع معلّق إلى الحساب (بحد 5 ثوانٍ)، ثم يحمّل النسخة الجديدة. البيانات لا تُمس.
async function updateNow(){
  if(updBusy)return;updBusy=true;render();
  try{save()}catch(e){}
  track('update');clearTimeout(evT);
  // الرفع المعلّق وتحديث عامل الخدمة معاً، بحد 5 ثوانٍ للاثنين
  const push=cloud.sess&&!ui.remote?(clearTimeout(cT),cPush()):ui.remote&&canWrite()?(clearTimeout(rT),rPush()):null;
  const sw=navigator.serviceWorker?navigator.serviceWorker.getRegistration().then(r=>r&&r.update()):null;
  await Promise.race([Promise.all([push,sw,flushEvents()].map(p=>p&&p.catch(()=>{}))),new Promise(r=>setTimeout(r,5000))]);
  if(ui.upd)lsPut('mp3_updtry',ui.upd.v);
  reloadApp();
}
async function cSetPhone(){const ph=normPhone(($('#cl_ph')||{}).value);if(!ph)return 'أدخل رقم جوال صحيحاً (8–15 رقماً)';
  await cFetch('/auth/v1/user',{method:'PUT',body:{data:{phone:ph}}});cloud.phone=ph;cSave();render();return 'تم حفظ رقم الجوال'}
async function cHash(){ // رابط التأكيد/الاستعادة من Supabase يعود إلى التطبيق ومعه الرمز في #hash
  const q=new URLSearchParams(location.hash.slice(1)),at=q.get('access_token');
  if(!at)return false;
  history.replaceState(null,'',location.pathname+location.search);
  try{
    const u=await cFetch('/auth/v1/user',{token:at});
    cSess({access_token:at,refresh_token:q.get('refresh_token'),expires_in:+q.get('expires_in')||3600,user:u});
    cloud.email=u.email||cloud.email;cSave();
    const ty=q.get('type');if(u&&!u.is_anonymous){cloud.anon=false;delete cloud.pendEmail;cSave()}
    ui.tab='me';ui.sub='sync';ui.recov=ty==='recovery'||ty==='email_change';if(ty!=='recovery'&&ty!=='email_change')setTimeout(()=>afterLogin(u),0);
    cMsg(ty==='email_change'?'تم تأكيد بريدك — اختر كلمة مرور لتدخل بها من أي جهاز':ui.recov?'تم التحقق من الرابط — اكتب كلمة المرور الجديدة':'تم تأكيد الحساب وتسجيل الدخول');
    return true;
  }catch(e){cMsg('رابط غير صالح أو منتهٍ: '+(e.message||e));return false}
}
const ENC=x=>encodeURIComponent(x);
const RET=()=>/^https?:$/.test(location.protocol)?'?redirect_to='+ENC(location.origin+location.pathname):'';  // وجهة روابط البريد = هذه الصفحة نفسها (يجب أن تكون ضمن Redirect URLs)
async function cUpsert(table,rows,conflict){if(!rows.length)return;
  for(let i=0;i<rows.length;i+=200)await cFetch('/rest/v1/'+table+'?on_conflict='+conflict,{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:rows.slice(i,i+200)});
}
// الوارد من الحساب: إن عدّل المدرب (أو جهاز آخر لك) ملفاً بعد آخر مزامنة لهذا الجهاز، تؤخذ خطته وأصنافه
// ويبقى تسجيلك (المأكول والوزن والصورة). يُستدعى قبل كل رفع حتى لا يُكتب فوق تعديل المدرب.
const tms=t=>Date.parse(t)||0;let syncInAt=0;
async function cSyncIn(){
  if(!cloud.sess||ui.remote)return 0;const uid=cloud.sess.uid,S=meta.syncAt||(meta.syncAt={});syncInAt=Date.now();
  const U=(await cFetch('/rest/v1/mp_users?select=id,updated_at&owner=eq.'+ENC(uid))||[]).filter(u=>meta.users.some(x=>x.id===u.id));
  const need=U.filter(u=>S[u.id]&&tms(u.updated_at)>tms(S[u.id])),fresh=U.filter(u=>!S[u.id]);
  if(fresh.length){   // جهاز لم يسجّل مزامنة بعد: نأخذ من الحساب فقط الملفات التي لها مدرب أو محرر
    const G=await cFetch('/rest/v1/mp_grants?select=user_id&owner=eq.'+ENC(uid)+'&status=eq.active&role=in.(coach,editor)')||[];
    fresh.forEach(u=>{if(G.some(g=>g.user_id===u.id))need.push(u);else S[u.id]=u.updated_at})}
  let n=0;
  for(const u of need){const k='owner=eq.'+ENC(uid);
    const [C,D]=await Promise.all([cFetch('/rest/v1/mp_users?select=settings,foods,updated_at&'+k+'&id=eq.'+ENC(u.id)),cFetch('/rest/v1/mp_days?select=idx,data&'+k+'&user_id=eq.'+ENC(u.id))]);
    const c=C&&C[0],loc=u.id===meta.cur?state:loadUser(u.id);if(!c||!loc)continue;
    const days=loc.days.map((ld,i)=>{const r=(D||[]).find(x=>x.idx===i);return r&&r.data?mergeLog(clone(r.data),ld):ld});
    const st={settings:Object.assign({},c.settings,{wlog:loc.settings.wlog,pic:loc.settings.pic}),foods:c.foods,days};
    if(!st.settings.pic)delete st.settings.pic;if(!st.settings.wlog)delete st.settings.wlog;
    if(!validUser(st)){S[u.id]=c.updated_at;continue}
    fixSettings(st.settings);saveUser(u.id,st);if(u.id===meta.cur)state=st;S[u.id]=c.updated_at;n++}
  saveMeta();
  if(n){toast(n>1?'وصلت تعديلات جديدة على '+n+' ملفات من حسابك':'وصلت تعديلات جديدة على خطتك (من مدربك أو جهاز آخر)');render()}
  return n}
async function cPush(){
  const uid=cloud.sess&&cloud.sess.uid;if(!uid)return 'سجّل الدخول أولاً';
  await cSyncIn();
  const now=new Date().toISOString(),U=[],D=[],H=[];
  meta.users.forEach(u=>{const st=u.id===meta.cur?state:loadUser(u.id);if(!st)return;
    U.push({owner:uid,id:u.id,name:u.name,settings:st.settings,foods:st.foods,updated_at:now});
    st.days.forEach((d,i)=>D.push({owner:uid,user_id:u.id,idx:i,data:d,updated_at:now}));
    hAll(u.id).forEach(r=>H.push({owner:uid,user_id:u.id,date:r.date,data:r,updated_at:now}));});
  await cUpsert('mp_users',U,'owner,id');await cUpsert('mp_days',D,'owner,user_id,idx');await cUpsert('mp_history',H,'owner,user_id,date');
  const S=meta.syncAt||(meta.syncAt={});U.forEach(u=>S[u.id]=now);saveMeta();
  // تنظيف ما حُذف محلياً (مستخدمون، وأيام سجل)
  const ids=meta.users.map(u=>u.id);
  await cFetch('/rest/v1/mp_users?owner=eq.'+ENC(uid)+'&id=not.in.('+ids.map(ENC).join(',')+')',{method:'DELETE'});
  for(const u of meta.users){const ds=hIdx(u.id);
    await cFetch('/rest/v1/mp_history?owner=eq.'+ENC(uid)+'&user_id=eq.'+ENC(u.id)+(ds.length?'&date=not.in.('+ds.join(',')+')':''),{method:'DELETE'})}
  return 'آخر حفظ في حسابك: '+new Date().toLocaleTimeString('ar-u-nu-latn',{hour:'numeric',minute:'2-digit'})+' ('+U.length+(U.length>1?' ملفات':' ملف')+'، '+H.length+' يوم في السجل)';
}
async function cAll(table,order){let out=[],off=0;for(;;){const r=await cFetch('/rest/v1/'+table+'?select=*&owner=eq.'+ENC(cloud.sess.uid)+'&order='+order+'&limit=1000&offset='+off);out=out.concat(r||[]);if(!r||r.length<1000)break;off+=1000}return out}
async function cPull(){
  const U=await cAll('mp_users','id'),D=await cAll('mp_days','user_id,idx'),H=await cAll('mp_history','user_id,date');
  if(!U.length)return 'لا توجد بيانات محفوظة في حسابك بعد';
  const users=U.map(u=>{const days=Array(7).fill(null);D.filter(x=>x.user_id===u.id).forEach(x=>days[x.idx]=x.data);
    return{id:u.id,name:u.name,data:{settings:u.settings,foods:u.foods,days},hist:H.filter(x=>x.user_id===u.id).map(x=>x.data)}}).filter(u=>validUser(u.data));
  if(!users.length)return 'بيانات الحساب غير مكتملة (أيام ناقصة)';
  const syncAt={};U.forEach(u=>syncAt[u.id]=u.updated_at);   // بعد التنزيل هذا الجهاز مطابق للحساب
  if(cPull.now){cPull.now=false;restoreAll({meta:{cur:meta.cur},users,syncAt});save();render();return 'تم استرجاع بياناتك من الحساب'}
  ask('تنزيل '+users.length+(users.length>1?' ملفات':' ملف')+' من حسابك سيستبدل بيانات هذا الجهاز. متابعة؟',()=>restoreAll({meta:{cur:meta.cur},users,syncAt}));
  return 'بانتظار تأكيدك';
}
let cT=null;function cSched(){clearTimeout(cT);cT=setTimeout(()=>cRun(cPush),4000)}
function restoreAll(o){
  meta.users.forEach(u=>wipeUser(u.id));
  const cur=o.meta&&o.users.some(u=>u.id===o.meta.cur)?o.meta.cur:o.users[0].id;
  const md=meta.mode;meta={users:o.users.map(u=>Object.assign({id:u.id,name:u.name||'مستخدم'},u.data&&u.data.settings&&picOk(u.data.settings.pic)?{pic:u.data.settings.pic}:{})),cur};if(md)meta.mode=md;if(o.syncAt)meta.syncAt=o.syncAt;
  o.users.forEach(u=>{saveUser(u.id,u.data);(Array.isArray(u.hist)?u.hist:[]).forEach(r=>{if(r&&r.date)hPut(u.id,r)})});
  state=o.users.find(u=>u.id===cur).data;
}
$('#file').addEventListener('change',e=>{
  const fl=e.target.files[0];if(!fl)return;
  const r=new FileReader();r.onload=()=>{try{const o=JSON.parse(r.result);
    if(o&&o.v===2&&Array.isArray(o.users)&&o.users.length&&o.users.every(u=>u.id&&validUser(u.data))){
      ask('الاستيراد يستبدل كل المستخدمين الحاليين. متابعة؟',()=>restoreAll(o));
    }else if(validUser(o)){const id=uid();meta.users.push({id,name:'مستورد'});meta.cur=id;state=o;save();render();toast('تم الاستيراد كمستخدم جديد')}
    else throw 0;
  }catch(x){toast('ملف غير صالح')}};
  r.readAsText(fl);e.target.value='';
});
