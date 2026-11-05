// v2/js/goals.js — معادلات الأهداف (BMR وTDEE والماكروز ودورة الكارب)
// سكربت عادي (ليس module): كل الملفات تتشارك نطاقاً عاماً واحداً وتُحمَّل بالترتيب في index.html.
// لا تستدعِ عند التحميل دالة من ملف لاحق؛ الاستدعاء داخل الدوال مسموح.
// ---------- معادلات الأهداف ----------
const clone=o=>JSON.parse(JSON.stringify(o));
const L5=(w,h,a,l,c)=>({w,h,a,l,c});
const DEF_EQS=[
 {id:'mifflin',name:'Mifflin-St Jeor',note:'الأكثر اعتماداً في المراجعات السريرية؛ دقة جيدة لمعظم الناس',type:'lin',m:L5(10,6.25,-5,0,5),f:L5(10,6.25,-5,0,-161)},
 {id:'hb',name:'Harris-Benedict (معدّلة)',note:'شائعة تاريخياً وتميل لإعطاء رقم أعلى قليلاً من Mifflin',type:'lin',m:L5(13.397,4.799,-5.677,0,88.362),f:L5(9.247,3.098,-4.330,0,447.593)},
 {id:'katch',name:'Katch-McArdle',note:'تعتمد على الكتلة الخالية — تحتاج نسبة دهون موثوقة (DEXA أفضل من الموازين المنزلية)',type:'lin',m:L5(0,0,0,21.6,370),f:L5(0,0,0,21.6,370)},
 {id:'cunn',name:'Cunningham',note:'أعلى من Katch-McArdle ومناسبة للرياضيين المدرَّبين — تحتاج نسبة دهون',type:'lin',m:L5(0,0,0,22,500),f:L5(0,0,0,22,500)},
 {id:'schof',name:'Schofield / WHO',note:'حسب الفئة العمرية؛ مناسبة لكبار السن والاستخدام الدولي',type:'schof'},
 {id:'owen',name:'Owen',note:'تحتاج الوزن فقط؛ تُستخدم للمقارنة',type:'lin',m:L5(10.2,0,0,0,879),f:L5(7.18,0,0,0,795)}
];
const DEF_GOALS=[
 {id:'manual',name:'معادلة الريل',kind:'manual',sign:0},
 {id:'cut',name:'تنحيف',kind:'calc',sign:-1},
 {id:'maint',name:'تثبيت',kind:'calc',sign:0},
 {id:'recomp',name:'إظهار العضلات',kind:'calc',sign:-1},
 {id:'bulk',name:'زيادة وزن',kind:'calc',sign:1},
 {id:'lean',name:'بناء عضلات',kind:'calc',sign:1}
];
const ACTS=[[1.2,'خامل (مكتبي بلا تمرين)'],[1.375,'خفيف (1–3 تمارين أسبوعياً)'],[1.55,'متوسط (3–5 تمارين)'],[1.725,'عالٍ (6–7 تمارين)'],[1.9,'شديد (تمرين مكثف + عمل بدني)']];
const GDEF={
 cut:{mode:'rate',val:0.75,pr:2.2,prB:'bw',fat:25,fatM:'pct'},
 maint:{mode:'pct',val:0,pr:1.8,prB:'bw',fat:25,fatM:'pct'},
 recomp:{mode:'pct',val:10,pr:2.2,prB:'bw',fat:25,fatM:'pct'},
 bulk:{mode:'pct',val:15,pr:1.6,prB:'bw',fat:25,fatM:'pct'},   // زيادة وزن: فائض 15–20%
 lean:{mode:'pct',val:7,pr:2.2,prB:'bw',fat:25,fatM:'pct'}     // بناء عضلات: فائض 5–10% وبروتين أعلى
};
function fixSettings(s){
  const D={goal:'manual',sex:'m',age:30,ht:175,bf:0,eq:'mifflin',act:1.55,tdeeM:0};
  Object.keys(D).forEach(k=>{if(s[k]==null)s[k]=D[k]});
  if(!Array.isArray(s.eqs)||!s.eqs.length)s.eqs=clone(DEF_EQS);
  if(!s.eqs.some(e=>e.id===s.eq))s.eq=s.eqs[0].id;
  if(!Array.isArray(s.goals)||!s.goals.length)s.goals=clone(DEF_GOALS);
  // كان «زيادة / بناء» هدفاً واحداً: يُسمّى «زيادة وزن» ويُضاف «بناء عضلات» بجانبه مرة واحدة
  const bi=s.goals.findIndex(g=>g.id==='bulk');if(bi>=0&&s.goals[bi].name==='زيادة / بناء'){s.goals[bi].name='زيادة وزن';if(!s.goals.some(g=>g.id==='lean'))s.goals.splice(bi+1,0,clone(DEF_GOALS.find(g=>g.id==='lean')))}
  if(!s.goals.some(g=>g.id===s.goal))s.goal=s.goals[0].id;
  s.g=s.g||{};
  s.goals.forEach(gl=>{if(gl.kind==='manual')return;const b=GDEF[gl.id]||(gl.sign<0?GDEF.cut:gl.sign>0?GDEF.bulk:GDEF.maint);s.g[gl.id]=Object.assign({},b,s.g[gl.id]||{})});
  s.cyc=Object.assign({on:true,r:0.5},s.cyc||{});
  return s;
}
const S=()=>fixSettings(state.settings);
const goalOf=s=>s.goals.find(g=>g.id===s.goal)||s.goals[0];
const eqOf=s=>s.eqs.find(e=>e.id===s.eq)||s.eqs[0];
const SCH=[null,[17.686,658.2,13.384,692.6],[15.057,692.2,14.818,486.6],[11.472,873.1,8.126,845.6],[11.711,587.7,9.082,658.5]];
function bodyOf(s){const w=+s.bw||70,bf=+s.bf>0&&+s.bf<60?+s.bf:0;return{w,h:+s.ht||175,a:+s.age||30,m:s.sex!=='f',lbm:bf?w*(1-bf/100):0}}
function bmrWith(e,s){ // يرجع الرقم، أو null إن تعذّر (كتلة خالية مفقودة / عمر خارج النطاق)
  const b=bodyOf(s);
  if(e.type==='schof'){const t=b.a<10?null:b.a<18?SCH[1]:b.a<30?SCH[2]:b.a<60?SCH[3]:SCH[4];return t?(b.m?t[0]*b.w+t[1]:t[2]*b.w+t[3]):null}
  const k=b.m?e.m:e.f;if(!k)return null;
  if(+k.l&&!b.lbm)return null;
  return (+k.w||0)*b.w+(+k.h||0)*b.h+(+k.a||0)*b.a+(+k.l||0)*b.lbm+(+k.c||0);
}
function bmrCalc(s){
  const e=eqOf(s),v=bmrWith(e,s);if(v!=null)return{v};
  const mif=bmrWith(DEF_EQS[0],s),b=bodyOf(s);
  return{v:mif,fb:e.type==='schof'?(e.name+' لا تغطي هذا العمر — استُخدمت Mifflin-St Jeor'):(b.lbm?'تعذّر حساب '+e.name+' — استُخدمت Mifflin-St Jeor':'لا توجد نسبة دهون — استُخدمت Mifflin-St Jeor بدلاً من '+e.name)};
}
function goalCore(s){
  const w=+s.bw||70,b=bmrCalc(s),tdee=+s.tdeeM>0?+s.tdeeM:b.v*(+s.act||1.55);
  const gl=goalOf(s),g=s.g[gl.id],sign=gl.sign;
  let adj=0;
  if(sign){
    if(g.mode==='kcal')adj=sign*g.val;
    else if(g.mode==='rate')adj=sign*w*g.val/100*(sign<0?1100:7700/30); // 7700 سعرة ≈ 1 كجم؛ التنحيف %/أسبوع والزيادة %/شهر
    else adj=sign*tdee*g.val/100;
  }
  const k=Math.max(1000,tdee+adj),bf=+s.bf>0&&+s.bf<60?+s.bf:0,lbm=bf?w*(1-bf/100):0,flags=[];
  const p=g.pr*(g.prB==='lbm'&&lbm?lbm:w),f=g.fatM==='kg'?g.fat*w:k*g.fat/100/9;
  let c=(k-4*p-9*f)/4;
  if(c<0){c=0;flags.push('البروتين + الدهون يتجاوزان سعرات الهدف — خفّض أحدهما')}
  if(adj<0&&k<b.v)flags.push('سعرات الهدف أقل من BMR');
  if(f/w<0.5)flags.push('الدهون أقل من 0.5 جم/كجم');
  if(g.prB==='lbm'&&!lbm)flags.push('لا توجد نسبة دهون — حُسب البروتين على وزن الجسم');
  if(b.fb)flags.push(b.fb);
  return{bmr:b.v,tdee,adj,k,p,f,c,flags,rate:adj*7/7700};
}
function goalTargets(d){
  const s=S(),G=goalCore(s),nH=state.days.filter(x=>x.mode==='high').length,nL=7-nH;let c=G.c;
  if(s.cyc.on&&nH>0&&nL>0){const r=Math.min(1,Math.max(0,+s.cyc.r)),ch=G.c*7/(nH+r*nL);c=d.mode==='high'?ch:r*ch}
  return{p:G.p,c,f:G.f,k:4*G.p+4*c+9*G.f};
}
function legacyTargets(d){const s=state.settings,w=+s.bw||70;const p=w*s.pM,c=w*(d.mode==='high'?s.cH:s.cL),f=w*s.fM;return{p,c,f,k:4*p+4*c+9*f}}
function targets(d){const s=S();return goalOf(s).kind==='manual'?legacyTargets(d):goalTargets(d)}
function roundG(f,g){if(f.u&&f.ug)return Math.max(1,rd(g/f.ug))*f.ug;const st=g>=20?5:1;return Math.max(st,rd(g/st)*st)}

function fitDay(d,useCur){
  const items=d.meals.flatMap(m=>m.items),T=targets(d),fac={P:1,C:1,F:1};
  items.forEach(i=>{if(useCur)i.b=i.g;else i.g=i.b});
  for(let n=0;n<40;n++){
    for(const [R,m] of [['P','p'],['C','c'],['F','f']]){
      const cur=sum(items)[m];
      const grp=items.filter(i=>i.r===R);
      const contrib=grp.reduce((a,i)=>a+mac(i)[m],0);
      if(contrib<=0)continue;
      let s=1+(T[m]-cur)/contrib;s=Math.min(1.3,Math.max(0.75,s));
      fac[R]=Math.min(3,Math.max(0.25,fac[R]*s));
      grp.forEach(i=>i.g=i.b*fac[R]);
    }
  }
  items.forEach(i=>{const f=F(i.f);if(f&&!i.x)i.g=roundG(f,i.g)});
}
function buildDay(i,mode,prot){
  const meals=TPL[mode].map(m=>({n:m.n,items:m.it.map(([id,g,r,s])=>({f:id==='@prot'?PROT[prot]:id,g,b:g,r,s:s||''}))}));
  const d={name:DAYS[i],mode,prot,meals};fitDay(d);return d;
}
function defaultState(){
  const st={v:1,settings:{bw:70,pM:2,cH:2,cL:1,fM:0.8,by:'auto'},foods:FOODS0.map(a=>({id:a[0],n:a[1],grp:a[2],k:a[3],p:a[4],c:a[5],f:a[6],u:a[7]||'',ug:a[8]||0})),days:[]};
  state=st;
  DAYS.forEach((n,i)=>st.days.push(buildDay(i,i%2?'low':'high',i%2?'beef':'chicken')));
  return st;
}
