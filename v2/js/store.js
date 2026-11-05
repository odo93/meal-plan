// v2/js/store.js — التخزين في الجهاز وسجل الأيام والإشعارات والبحث العربي
// سكربت عادي (ليس module): كل الملفات تتشارك نطاقاً عاماً واحداً وتُحمَّل بالترتيب في index.html.
// لا تستدعِ عند التحميل دالة من ملف لاحق؛ الاستدعاء داخل الدوال مسموح.
// ---------- التخزين: مفتاح لكل مستخدم + مفتاح مستقل لكل يوم ----------
const MK='mp3_meta',UK=id=>'mp3_u_'+id,DK=(id,i)=>'mp3_u_'+id+'_d'+i;
const lsGet=k=>{try{const s=localStorage.getItem(k);return s?JSON.parse(s):null}catch(e){return null}};
// فشل الحفظ (امتلاء المساحة أو منع التخزين) لا يمر بصمت: بانر دائم بتصدير نسخة وإعادة المحاولة
let storeErr=null;
function storeFail(e){const first=!storeErr;storeErr={at:Date.now(),quota:!!e&&(e.name==='QuotaExceededError'||e.code===22||e.code===1014)};
  if(first&&typeof toast==='function'&&document.querySelector('#toast'))try{toast('تعذّر الحفظ في هذا الجهاز')}catch(x){}}
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){storeFail(e);return false}};
const lsDel=k=>{try{localStorage.removeItem(k)}catch(e){}};
const uid=()=>'u'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const curUser=()=>meta.users.find(u=>u.id===meta.cur);
function validUser(o){return o&&o.settings&&Array.isArray(o.foods)&&Array.isArray(o.days)&&o.days.length===7&&o.days.every(d=>d&&d.meals)}
function saveUser(id,st,onlyDay){
  lsSet(UK(id),{v:2,settings:st.settings,foods:st.foods});
  st.days.forEach((d,i)=>{if(onlyDay==null||onlyDay===i)lsSet(DK(id,i),d)});
}
function loadUser(id){
  const b=lsGet(UK(id));if(!b||!b.settings||!Array.isArray(b.foods))return null;
  const days=[];for(let i=0;i<7;i++){const d=lsGet(DK(id,i));if(!d||!d.meals)return null;days.push(d)}
  return {settings:b.settings,foods:b.foods,days};
}
function saveMeta(){lsSet(MK,meta)}
// ---------- سجل الأيام: مفتاح لكل (مستخدم، تاريخ) + فهرس التواريخ ----------
const HK=(id,d)=>'mp3_u_'+id+'_h_'+d,HI=id=>'mp3_u_'+id+'_hidx';
const hIdx=id=>lsGet(HI(id))||[];
const hGet=(id,d)=>lsGet(HK(id,d));
function hPut(id,r){lsSet(HK(id,r.date),r);const ix=hIdx(id);if(!ix.includes(r.date)){ix.push(r.date);ix.sort();lsSet(HI(id),ix)}}
function hDel(id,d){lsDel(HK(id,d));lsSet(HI(id),hIdx(id).filter(x=>x!==d))}
const hAll=id=>hIdx(id).map(d=>hGet(id,d)).filter(Boolean);
const getRec=d=>ui.remote?ui.remote.hist.find(r=>r.date===d):hGet(meta.cur,d);
function wipeUser(id){lsDel(UK(id));for(let i=0;i<7;i++)lsDel(DK(id,i));hIdx(id).forEach(d=>lsDel(HK(id,d)));lsDel(HI(id))}
function syncHist(){ // يحفظ/يحدّث سجل كل يوم من الأسبوع الحالي بتاريخه عند أي تعديل في التسجيل
  const cmp=x=>JSON.stringify(Object.assign({},x,{ts:0}));
  state.days.forEach((d,di)=>{
    const date=dateOfDay(di),logged=d.meals.some(m=>m.items.some(it=>gE(it)!=null)),old=hGet(meta.cur,date);
    if(!logged){if(old)hDel(meta.cur,date);return}
    const r=snapDay(d,date,di);if(!old||cmp(old)!==cmp(r))hPut(meta.cur,r);
  });
}
function save(onlyDay){if(ui.remote){if(canWrite())rSched();return}saveMeta();saveUser(meta.cur,state,onlyDay);syncHist();if(typeof cloud!=='undefined'&&cloud.sess)cSched()}
function load(){
  const m=lsGet(MK);
  if(m&&Array.isArray(m.users)&&m.users.length){
    const cur=m.users.find(u=>u.id===m.cur)||m.users[0];m.cur=cur.id;meta=m;
    return loadUser(cur.id)||defaultState();
  }
  const old=lsGet(KEY); // ترحيل من النسخة الأولى (مستخدم واحد)
  if(validUser(old)){const id=uid();meta={users:[{id,name:'المستخدم 1'}],cur:id};saveUser(id,old);saveMeta();return old}
  return null;
}
function switchUser(id){if(!meta.users.some(u=>u.id===id))return;ui.remote=null;meta.cur=id;state=loadUser(id)||defaultState();rollWeek();save();render()}
function addUser(name,copy,kind){
  const id=uid();let st;
  if(copy){st=JSON.parse(JSON.stringify(state));st.days.forEach(clearLog)}else st=defaultState();
  meta.users.push(kind?{id,name,kind}:{id,name});meta.cur=id;state=st;save();
}
function delUser(id){
  wipeUser(id);
  meta.users=meta.users.filter(u=>u.id!==id);meta.cur=meta.users[0].id;
  state=loadUser(meta.cur)||defaultState();
}
function ask(msg,fn){modal={type:'ask',msg,fn};render()}
// undo اختياري: يظهر زر «تراجع» ويبقى الإشعار 5 ثوانٍ
function toast(t,undo){const e=$('#toast');toast.u=undo||null;e.innerHTML=esc(t)+(undo?'<button class="tu" data-act="undo">تراجع</button>':'');e.style.display='flex';clearTimeout(toast.t);toast.t=setTimeout(()=>{e.style.display='none';toast.u=null},undo?5000:3000)}

function swapCands(it,by){
  const o=F(it.f);if(!o)return[];
  const key=by==='kcal'?'k':KEYM[o.grp];
  const ov=o[key]*it.g/100,base=mac(it);
  return state.foods.filter(c=>c.id!==o.id&&REL[o.grp].includes(c.grp)&&c[key]>0).map(c=>{
    const g=roundG(c,ov/c[key]*100),m=mac({f:c.id,g});
    return{c,g,d:{k:m.k-base.k,p:m.p-base.p,c:m.c-base.c,f:m.f-base.f}};
  }).sort((a,b)=>Math.abs(a.d.k)-Math.abs(b.d.k));
}
const sg=x=>(x>0?'+':'')+rd(x);
// بحث عربي مرن: يتجاهل التشكيل والتطويل والهمزات والتاء المربوطة والألف المقصورة و«ال» التعريف، ويقبل عدة كلمات
const AR=s=>String(s==null?'':s).toLowerCase().replace(/[ً-ٰٟـ]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/(^|\s)ال(?=\S)/g,'$1');
function searchFoods(q,grp){
  const t=AR(q).split(/\s+/).filter(Boolean);
  return state.foods.map((f,ix)=>{
    if(grp&&f.grp!==grp)return null;
    const n=AR(f.n),ws=n.split(/\s+/),g=AR(GROUPS[f.grp]);let sc=0;
    for(const w of t){
      if(n.startsWith(w))sc+=3;else if(ws.some(x=>x.startsWith(w)))sc+=2;else if(n.includes(w))sc+=1;else if(g.includes(w))sc+=0.5;else return null;
    }
    return{f,sc,ix};
  }).filter(Boolean).sort((a,b)=>b.sc-a.sc||a.ix-b.ix).map(x=>x.f);
}
