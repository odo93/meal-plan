// v2/js/cloud.js — المزامنة السحابية (Supabase REST)
// سكربت عادي (ليس module): كل الملفات تتشارك نطاقاً عاماً واحداً وتُحمَّل بالترتيب في index.html.
// لا تستدعِ عند التحميل دالة من ملف لاحق؛ الاستدعاء داخل الدوال مسموح.
// ---------- مزامنة سحابية اختيارية (Supabase REST) ----------
const CK='mp3_cloud';
let cloud=Object.assign({url:'https://exznecnhvsihdelwsibv.supabase.co',key:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4em5lY25odnNpaGRlbHdzaWJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1OTY4NzAsImV4cCI6MjEwOTE3Mjg3MH0.8TP92hVmjHt9KrnaWzWDWvzdgBIctk2BkBphxjzRCK0',email:'',auto:false,sess:null,last:''},lsGet(CK)||{});
const cSave=()=>lsSet(CK,cloud);
function cMsg(t){cloud.last=t;cSave();const e=$('#cst');if(e)e.textContent=t}
async function cRun(fn){if(!cloud.url||!cloud.key){cMsg('أدخل رابط المشروع والمفتاح العام أولاً');return}cMsg('جارٍ التنفيذ…');try{cMsg(await fn()||'تم')}catch(e){cMsg('خطأ: '+(e&&e.message||e))}}
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
async function cAuth(signup){
  const email=(($('#cl_em')||{}).value||cloud.email||'').trim(),pw=($('#cl_pw')||{}).value||'';
  if(!email||!pw)return 'أدخل البريد وكلمة المرور';
  cloud.email=email;
  const j=await cFetch(signup?'/auth/v1/signup'+RET():'/auth/v1/token?grant_type=password',{method:'POST',anon:true,body:{email,password:pw}});
  if(j&&j.access_token){cSess(j);loadShared().then(render);setTimeout(render,0);return 'تم تسجيل الدخول'}
  return 'تم إنشاء الحساب. أكّد بريدك من الرسالة ثم سجّل الدخول';
}
async function cHash(){ // رابط التأكيد/الاستعادة من Supabase يعود إلى التطبيق ومعه الرمز في #hash
  const q=new URLSearchParams(location.hash.slice(1)),at=q.get('access_token');
  if(!at)return false;
  history.replaceState(null,'',location.pathname+location.search);
  try{
    const u=await cFetch('/auth/v1/user',{token:at});
    cSess({access_token:at,refresh_token:q.get('refresh_token'),expires_in:+q.get('expires_in')||3600,user:u});
    cloud.email=u.email||cloud.email;cSave();
    ui.tab='me';ui.sub='sync';ui.recov=q.get('type')==='recovery';
    cMsg(ui.recov?'تم التحقق من الرابط — اكتب كلمة المرور الجديدة':'تم تأكيد الحساب وتسجيل الدخول');
    return true;
  }catch(e){cMsg('رابط غير صالح أو منتهٍ: '+(e.message||e));return false}
}
const ENC=x=>encodeURIComponent(x);
const RET=()=>/^https?:$/.test(location.protocol)?'?redirect_to='+ENC(location.origin+location.pathname):'';  // وجهة روابط البريد = هذه الصفحة نفسها (يجب أن تكون ضمن Redirect URLs)
async function cUpsert(table,rows,conflict){if(!rows.length)return;
  for(let i=0;i<rows.length;i+=200)await cFetch('/rest/v1/'+table+'?on_conflict='+conflict,{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:rows.slice(i,i+200)});
}
async function cPush(){
  const uid=cloud.sess&&cloud.sess.uid;if(!uid)return 'سجّل الدخول أولاً';
  const now=new Date().toISOString(),U=[],D=[],H=[];
  meta.users.forEach(u=>{const st=u.id===meta.cur?state:loadUser(u.id);if(!st)return;
    U.push({owner:uid,id:u.id,name:u.name,settings:st.settings,foods:st.foods,updated_at:now});
    st.days.forEach((d,i)=>D.push({owner:uid,user_id:u.id,idx:i,data:d,updated_at:now}));
    hAll(u.id).forEach(r=>H.push({owner:uid,user_id:u.id,date:r.date,data:r,updated_at:now}));});
  await cUpsert('mp_users',U,'owner,id');await cUpsert('mp_days',D,'owner,user_id,idx');await cUpsert('mp_history',H,'owner,user_id,date');
  // تنظيف ما حُذف محلياً (مستخدمون، وأيام سجل)
  const ids=meta.users.map(u=>u.id);
  await cFetch('/rest/v1/mp_users?owner=eq.'+ENC(uid)+'&id=not.in.('+ids.map(ENC).join(',')+')',{method:'DELETE'});
  for(const u of meta.users){const ds=hIdx(u.id);
    await cFetch('/rest/v1/mp_history?owner=eq.'+ENC(uid)+'&user_id=eq.'+ENC(u.id)+(ds.length?'&date=not.in.('+ds.join(',')+')':''),{method:'DELETE'})}
  return 'تم الرفع '+new Date().toLocaleTimeString('ar-u-nu-latn',{hour:'numeric',minute:'2-digit'})+' — '+U.length+' مستخدم، '+H.length+' يوم سجل';
}
async function cAll(table,order){let out=[],off=0;for(;;){const r=await cFetch('/rest/v1/'+table+'?select=*&owner=eq.'+ENC(cloud.sess.uid)+'&order='+order+'&limit=1000&offset='+off);out=out.concat(r||[]);if(!r||r.length<1000)break;off+=1000}return out}
async function cPull(){
  const U=await cAll('mp_users','id'),D=await cAll('mp_days','user_id,idx'),H=await cAll('mp_history','user_id,date');
  if(!U.length)return 'لا توجد بيانات في السحابة بعد — ارفع أولاً';
  const users=U.map(u=>{const days=Array(7).fill(null);D.filter(x=>x.user_id===u.id).forEach(x=>days[x.idx]=x.data);
    return{id:u.id,name:u.name,data:{settings:u.settings,foods:u.foods,days},hist:H.filter(x=>x.user_id===u.id).map(x=>x.data)}}).filter(u=>validUser(u.data));
  if(!users.length)return 'بيانات السحابة غير مكتملة (أيام ناقصة)';
  ask('تنزيل '+users.length+' مستخدم من السحابة سيستبدل كل بياناتك المحلية. متابعة؟',()=>restoreAll({meta:{cur:meta.cur},users}));
  return 'بانتظار تأكيدك';
}
let cT=null;function cSched(){clearTimeout(cT);cT=setTimeout(()=>cRun(cPush),4000)}
function restoreAll(o){
  meta.users.forEach(u=>wipeUser(u.id));
  const cur=o.meta&&o.users.some(u=>u.id===o.meta.cur)?o.meta.cur:o.users[0].id;
  meta={users:o.users.map(u=>({id:u.id,name:u.name||'مستخدم'})),cur};
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
