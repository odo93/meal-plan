// v2/js/core.js — الثوابت والحالة العامة وقوالب الوجبات والتواريخ ولقطة اليوم
// سكربت عادي (ليس module): كل الملفات تتشارك نطاقاً عاماً واحداً وتُحمَّل بالترتيب في index.html.
// لا تستدعِ عند التحميل دالة من ملف لاحق؛ الاستدعاء داخل الدوال مسموح.
const KEY='mealplan_v1';
// ---- استيراد بيانات النسخة الأولى (نسخ فقط، لا تعديل ولا حذف) ----
(function(){try{if(localStorage.getItem('mp3_imported'))return;
  if(localStorage.getItem('mp3_meta')){localStorage.setItem('mp3_imported','existing');return}
  let n=0;for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);
    if(k&&k.indexOf('mealplan_v2_')===0){localStorage.setItem('mp3_'+k.slice(12),localStorage.getItem(k));n++}}
  localStorage.setItem('mp3_imported',n?('v1:'+n+':'+new Date().toISOString()):'none')}catch(e){}})();
const DAYS=['السبت','الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة'];
const GROUPS={pro:'بروتين',dairy:'ألبان',carb:'نشويات وبقوليات',fruit:'فواكه',fat:'دهون',veg:'خضار'};
const REL={pro:['pro','dairy'],dairy:['dairy','pro'],carb:['carb','fruit'],fruit:['fruit','carb'],fat:['fat'],veg:['veg']};
const KEYM={pro:'p',dairy:'p',carb:'c',fruit:'c',fat:'f',veg:'k'};
const KEYL={p:'بروتين',c:'كارب',f:'دهون',k:'سعرات'};
const PROT={chicken:'chk_b',beef:'beef_l',fish:'fish_w'};
const PL={chicken:'دجاج',beef:'لحم',fish:'سمك'};
// القيم لكل 100 جم: id, الاسم, المجموعة, سعرات, بروتين, كارب, دهون, [وحدة, وزن الوحدة]
const FOODS0=[
['chk_b','صدر دجاج مشوي','pro',165,31,0,3.6],
['chk_t','فخذ دجاج بدون جلد مشوي','pro',179,25,0,8.2],
['beef_l','لحم بقري قليل الدهن مشوي','pro',185,29,0,7.5],
['beef_g','لحم مفروم مطبوخ (دهن 15%)','pro',250,26,0,15],
['lamb','لحم ضأن مطبوخ','pro',235,25,0,14],
['fish_w','سمك أبيض مشوي (قاروص/بلطي)','pro',130,26,0,2.7],
['salmon','سلمون مشوي','pro',206,22,0,12],
['tuna','تونة معلبة بالماء (مصفاة)','pro',116,26,0,1],
['egg','بيض كامل','pro',143,12.6,0.7,9.5,'حبة',50],
['eggw','بياض بيض','pro',52,10.9,0.7,0.2,'حبة',33],
['whey','واي بروتين','pro',400,80,10,5,'سكوب',30],
['yog0','زبادي خالي الدسم','dairy',50,5,7,0.2],
['yogg','زبادي يوناني خالي الدسم','dairy',59,10,3.6,0.4],
['cott','جبن قريش قليل الدسم','dairy',72,12,2.7,1],
['chz_l','جبن لايت قليل الدسم','dairy',150,22,2,6],
['milk0','حليب خالي الدسم','dairy',34,3.4,5,0.1],
['rice','أرز أبيض (نيء)','carb',360,7,79,0.6],
['pasta','مكرونة (نيئة)','carb',360,13,73,1.5],
['oats','شوفان (نيء)','carb',389,16.9,66,6.9],
['bulgur','برغل (نيء)','carb',342,12,76,1.3],
['quinoa','كينوا (نيئة)','carb',368,14,64,6],
['pot','بطاطس مسلوقة','carb',87,1.9,20,0.1],
['sweetp','بطاطا حلوة مسلوقة','carb',90,2,21,0.2],
['bread','خبز بني','carb',247,13,41,3.4],
['ful','فول مطبوخ','carb',110,8,19,0.5],
['lentil','عدس مطبوخ','carb',116,9,20,0.4],
['chick','حمص مطبوخ','carb',164,8.9,27,2.6],
['mango','مانجو','fruit',60,0.8,15,0.4],
['banana','موز','fruit',89,1.1,23,0.3],
['apple','تفاح','fruit',52,0.3,14,0.2],
['orange','برتقال','fruit',47,0.9,12,0.1],
['straw','فراولة','fruit',32,0.7,7.7,0.3],
['grape','عنب','fruit',69,0.7,18,0.2],
['dates','تمر','fruit',282,2.5,75,0.4],
['oil','زيت زيتون','fat',884,0,0,100],
['peanut','سوداني غير مملح','fat',567,26,16,49],
['almond','لوز','fat',579,21,22,50],
['walnut','عين جمل','fat',654,15,14,65],
['tahini','طحينة','fat',595,17,21,54],
['avo','أفوكادو','fat',160,2,9,15],
['pbut','زبدة فول سوداني','fat',588,25,20,50],
['salad','سلطة خضار','veg',20,1,4,0.2],
['cuc','خيار','veg',15,0.7,3.6,0.1],
['saute','خضار سوتيه/مشوية','veg',40,2,7,1]
];
// قوالب الوجبات: [الصنف, الجرامات, الدور (P بروتين / C كارب / F دهون / x ثابت), slot]
const TPL={
high:[
 {n:'الوجبة 1 — فطور',it:[['ful',100,'C'],['egg',150,'x'],['bread',60,'C'],['oil',5,'F'],['salad',100,'x']]},
 {n:'الوجبة 2 — غداء',it:[['rice',70,'C'],['@prot',220,'P','prot'],['oil',5,'F'],['salad',100,'x']]},
 {n:'الوجبة 3 — سناك',it:[['mango',100,'C'],['peanut',10,'F'],['yog0',180,'x']]},
 {n:'الوجبة 4 — عشاء',it:[['bread',60,'C'],['chz_l',80,'P'],['pot',100,'C']]}],
low:[
 {n:'الوجبة 1 — فطور',it:[['egg',150,'x'],['cott',100,'P'],['bread',30,'C'],['oil',5,'F'],['salad',150,'x']]},
 {n:'الوجبة 2 — غداء',it:[['rice',30,'C'],['@prot',250,'P','prot'],['oil',10,'F'],['saute',200,'x']]},
 {n:'الوجبة 3 — سناك',it:[['yogg',150,'P'],['peanut',15,'F'],['straw',100,'C']]},
 {n:'الوجبة 4 — عشاء',it:[['tuna',100,'P'],['pot',80,'C'],['saute',150,'x'],['oil',5,'F']]}]
};
let state=null, meta=null, ui={tab:'day',day:(new Date().getDay()+1)%7}, modal=null;
const $=s=>document.querySelector(s);
const rd=Math.round;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const F=id=>state.foods.find(x=>x.id===id);

const FOOD=it=>it.fd||F(it.f); // سجلات التاريخ تحمل نسخة من قيم الصنف وقت الحفظ (fd)
function mac(it){const f=FOOD(it);if(!f)return{k:0,p:0,c:0,f:0};const q=it.g/100;return{k:f.k*q,p:f.p*q,c:f.c*q,f:f.f*q}}
function sum(items){const t={k:0,p:0,c:0,f:0};items.forEach(i=>{const m=mac(i);t.k+=m.k;t.p+=m.p;t.c+=m.c;t.f+=m.f});return t}

// ---------- تسجيل الفعلي: it.e = المأكول (جم) · it.em = وجبة الأكل الفعلية · it.x = صنف خارج الخطة ----------
const gE=it=>typeof it.e==='number'?it.e:null;
const emOf=(it,mi)=>typeof it.em==='number'?it.em:mi;
function macE(it){const f=FOOD(it),g=gE(it);if(!f||g==null)return{k:0,p:0,c:0,f:0};const q=g/100;return{k:f.k*q,p:f.p*q,c:f.c*q,f:f.f*q}}
const T0=()=>({k:0,p:0,c:0,f:0}),addT=(t,m)=>{t.k+=m.k;t.p+=m.p;t.c+=m.c;t.f+=m.f;return t};
const fmtQ=(f,g)=>f&&f.u&&f.ug?(+(g/f.ug).toFixed(1))+' '+f.u:rd(g)+' جم';
const mealShort=(d,i)=>(d.meals[i]?d.meals[i].n:'').split('—')[0].trim();
// ---------- التواريخ (الأسبوع يبدأ السبت) ----------
const MON=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const addDays=(dt,n)=>new Date(dt.getFullYear(),dt.getMonth(),dt.getDate()+n);
const iso=dt=>dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');
const parseISO=s=>{const p=String(s).split('-').map(Number);return new Date(p[0],p[1]-1,p[2])};
function weekStart(){const n=new Date();return addDays(n,-((n.getDay()+1)%7))}
const weekKey=()=>iso(weekStart());
const dateOfDay=di=>iso(addDays(weekStart(),di));
const todayISO=()=>iso(new Date());
// التواريخ عبر Intl (أرقام لاتينية كبقية التطبيق) مع بديل يدوي إن لم يتوفر
const DTF=(o=>{try{return new Intl.DateTimeFormat('ar-u-nu-latn',o)}catch(e){return null}});
const DF_L=DTF({day:'numeric',month:'long',year:'numeric'}),DF_S=DTF({day:'numeric',month:'long'});
function dateLabel(s){const d=parseISO(s);return DF_L?DF_L.format(d):d.getDate()+' '+MON[d.getMonth()]+' '+d.getFullYear()}
function dateShort(s){const d=parseISO(s);return DF_S?DF_S.format(d):d.getDate()+' '+MON[d.getMonth()]}
function rangeLabel(a,b){const x=parseISO(a),y=parseISO(b);try{if(DF_L&&DF_L.formatRange)return DF_L.formatRange(x,y)}catch(e){}return dateLabel(a)+' – '+dateLabel(b)}
// لقطة اليوم كسجل مستقل (وثيقة واحدة لكل مستخدم/تاريخ — جاهزة للنقل لقاعدة بيانات لاحقاً)
function snapDay(d,date,di){
  return{date,dow:di,name:d.name,mode:d.mode,prot:d.prot,tg:targets(d),
    meals:d.meals.map(m=>({n:m.n,items:m.items.map(it=>{const f=F(it.f);if(!f)return null;
      const o={f:it.f,fd:{n:f.n,u:f.u,ug:f.ug,k:f.k,p:f.p,c:f.c,f:f.f,grp:f.grp},g:it.g};
      if(it.e!=null)o.e=it.e;if(typeof it.em==='number')o.em=it.em;if(it.x)o.x=true;return o}).filter(Boolean)})),ts:Date.now()};
}
function clearLog(d){d.meals.forEach(m=>{m.items=m.items.filter(it=>!it.x);m.items.forEach(it=>{delete it.e;delete it.em})});d.lw=null}
function rollWeek(){ // عند أسبوع جديد: يُؤرشف تسجيل الأسبوع السابق في السجل ثم يُمسح من بطاقات الأيام
  const k=weekKey();let ch=false;
  state.days.forEach((d,di)=>{
    if(d.lw&&iso(parseISO(d.lw))!==k){
      if(d.meals.some(m=>m.items.some(it=>gE(it)!=null)))hPut(meta.cur,snapDay(d,iso(addDays(parseISO(d.lw),di)),di));
      clearLog(d);ch=true;
    }
  });
  return ch;
}
function stTag(it,mi){
  if(it.x)return '<span class="tag x">خارج الخطة</span>';
  const e=gE(it);if(e==null)return '';
  if(e===0)return '<span class="tag sk">✗ لم يُؤكل</span>';
  const d=state.days[ui.day],em=emOf(it,mi),f=F(it.f),chg=Math.abs(e-it.g)>0.5,parts=[chg?'≠ '+fmtQ(f,e):'✓ أُكل'];
  if(em!==mi)parts.push('↪ '+mealShort(d,em));
  return `<span class="tag ${chg||em!==mi?'':'ok2'}">${parts.join(' · ')}</span>`;
}
function movedIn(d,mi){
  const r=[];d.meals.forEach((mm,mj)=>{if(mj===mi)return;mm.items.forEach(it=>{if(typeof it.em==='number'&&it.em===mi&&gE(it)>0){const f=F(it.f);if(f)r.push(`<div class="mv">↩ ${esc(f.n)} ${fmtQ(f,gE(it))} — من ${esc(mealShort(d,mj))}</div>`)}})});
  return r.join('');
}
function dayLog(d){
  const plan=T0(),eaten=T0(),pend=T0(),pm=d.meals.map(()=>({plan:T0(),act:T0()})),dev=[];let logged=0,total=0;
  d.meals.forEach((m,mi)=>m.items.forEach(it=>{
    const f=FOOD(it);if(!f)return;
    const mp=mac(it),e=gE(it),em=Math.min(emOf(it,mi),d.meals.length-1);
    addT(plan,mp);addT(pm[mi].plan,mp);
    if(!it.x)total++;
    if(e!=null){
      if(!it.x)logged++;
      const me=macE(it),dk=me.k-mp.k;addT(eaten,me);addT(pm[em].act,me);
      if(it.x)dev.push({t:'extra',txt:`${f.n} — ${fmtQ(f,e)} (خارج الخطة، ${mealShort(d,em)})`,dk});
      else if(e===0)dev.push({t:'skip',txt:`${f.n} — لم يُؤكل (الخطة ${fmtQ(f,it.g)})`,dk});
      else{
        if(Math.abs(e-it.g)>0.5)dev.push({t:'qty',txt:`${f.n} — الخطة ${fmtQ(f,it.g)} ← الفعلي ${fmtQ(f,e)}`,dk});
        if(em!==mi)dev.push({t:'move',txt:`${f.n} — نُقل من ${mealShort(d,mi)} إلى ${mealShort(d,em)}`,dk:0});
      }
    }else if(!it.x)addT(pend,mp);
  }));
  const exp=addT(addT(T0(),eaten),pend);
  return{plan,eaten,pend,exp,logged,total,pm,dev};
}
