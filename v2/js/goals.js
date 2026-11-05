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
 {id:'manual',name:'كارب أقل',kind:'manual',sign:0},
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
// الإعدادات الافتراضية من لوحة الإدارة (للقيم غير المضبوطة فقط؛ لا تغيّر ما ضبطه المستخدم)
function adminDefaults(){const d=(typeof pubCfg==='function'?pubCfg().defaults:null)||{};return d&&typeof d==='object'?d:{}}
function gdefOf(id){const b=GDEF[id],o=((adminDefaults().g)||{})[id];if(!b||!o||typeof o!=='object')return b;
  const r=Object.assign({},b);['val','pr','fat'].forEach(k=>{const v=+o[k];if(o[k]!==''&&o[k]!=null&&isFinite(v)&&v>=0&&v<=(k==='val'?100:k==='pr'?5:60))r[k]=v});return r}
function fixSettings(s){
  const D={goal:'manual',sex:'m',age:30,ht:175,bf:0,eq:'mifflin',act:1.55,tdeeM:0};
  Object.keys(D).forEach(k=>{if(s[k]==null)s[k]=D[k]});
  if(!Array.isArray(s.eqs)||!s.eqs.length)s.eqs=clone(DEF_EQS);
  if(!s.eqs.some(e=>e.id===s.eq))s.eq=s.eqs[0].id;
  if(!Array.isArray(s.goals)||!s.goals.length)s.goals=clone(DEF_GOALS);
  // كان «زيادة / بناء» هدفاً واحداً: يُسمّى «زيادة وزن» ويُضاف «بناء عضلات» بجانبه مرة واحدة
  const bi=s.goals.findIndex(g=>g.id==='bulk');if(bi>=0&&s.goals[bi].name==='زيادة / بناء'){s.goals[bi].name='زيادة وزن';if(!s.goals.some(g=>g.id==='lean'))s.goals.splice(bi+1,0,clone(DEF_GOALS.find(g=>g.id==='lean')))}
  // «معادلة الريل» صار اسمها «كارب أقل» (مرة واحدة، ولا يمس اسماً غيّره المستخدم)
  s.goals.forEach(g=>{if(g.id==='manual'&&g.name==='معادلة الريل')g.name='كارب أقل'});
  if(!s.goals.some(g=>g.id===s.goal))s.goal=s.goals[0].id;
  s.g=s.g||{};
  s.goals.forEach(gl=>{if(gl.kind==='manual')return;const b=gdefOf(gl.id)||(gl.sign<0?GDEF.cut:gl.sign>0?GDEF.bulk:GDEF.maint);s.g[gl.id]=Object.assign({},b,s.g[gl.id]||{})});
  s.cyc=Object.assign({on:true,r:0.5},s.cyc||{});
  // نمط الأسبوع: عادي/قليل لكل يوم (0=السبت). للمستخدم الحالي يُؤخذ من أيامه فلا يتغير شيء عنده.
  if(!validPat(s.cyc.pat))s.cyc.pat=(typeof state!=='undefined'&&state&&state.settings===s&&Array.isArray(state.days)&&state.days.length===7)?state.days.map(d=>d.mode==='low'?'low':'high'):defPat();
  // تعديل يوم: ovW = كل أسبوع (حسب اليوم)، ovD = هذا التاريخ فقط (يحمل مفتاح الأسبوع wk)
  // خطة الوجبات ومكتبة الوجبات الجاهزة (meals.js)
  if(!validPlan(s.mplan))s.mplan=(typeof state!=='undefined'&&state&&state.settings===s&&Array.isArray(state.days)&&state.days.length===7)?derivePlan(state.days):defPlan();
  if(!Array.isArray(s.lib))s.lib=[];
  if(!s.ovW||typeof s.ovW!=='object')s.ovW={};if(!s.ovD||typeof s.ovD!=='object')s.ovD={};
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
function baseTargets(d){const s=S();return goalOf(s).kind==='manual'?legacyTargets(d):goalTargets(d)}
function targets(d){const T=baseTargets(d),o=dayOv(dayIdx(d)),t=o&&o.t;if(!t)return T;
  const r={p:t.p!=null?+t.p:T.p,c:t.c!=null?+t.c:T.c,f:t.f!=null?+t.f:T.f};r.k=4*r.p+4*r.c+9*r.f;return r}
// ---- نمط الأسبوع وتعديل الأيام ----
const validPat=p=>Array.isArray(p)&&p.length===7&&p.every(x=>x==='high'||x==='low');
const PATS={alt:['high','low','high','low','high','low','high'],p52:['high','high','low','high','high','low','high'],high:Array(7).fill('high'),low:Array(7).fill('low')};
function defPat(){const c=(adminDefaults().cyc)||{};return validPat(c.pat)?c.pat.slice():PATS.alt.slice()}
function dayIdx(d){const i=state.days.indexOf(d);return i>=0?i:DAYS.indexOf(d&&d.name)}
// التعديل الساري لليوم i: «هذا التاريخ فقط» يتقدّم على «كل أسبوع»
function dayOv(i){if(i<0)return null;const s=state.settings,D=s.ovD&&s.ovD[i];
  if(D&&D.wk===weekKey())return Object.assign({rep:false},D);const W=s.ovW&&s.ovW[i];return W?Object.assign({rep:true},W):null}
function planMode(i){return S().cyc.pat[i]||'high'}
function effMode(i){const o=dayOv(i);return o&&o.mode?o.mode:planMode(i)}
// أيام يختلف نوعها عن الإعدادات (تحتاج إعادة بناء من القالب)
const modeDiffs=()=>state.days.map((d,i)=>d.mode!==effMode(i)?i:-1).filter(i=>i>=0);
function applyModes(){modeDiffs().forEach(i=>{state.days[i]=buildDay(i,effMode(i),state.days[i].prot)})}
function dropStaleOv(){const s=S(),k=weekKey();let ch=false;Object.keys(s.ovD).forEach(i=>{if(!s.ovD[i]||s.ovD[i].wk!==k){delete s.ovD[i];ch=true}});return ch}
const daysWord=n=>n===1?'يوم واحد':n===2?'يومان':n+' أيام';
const ML={high:'كارب عادي',low:'كارب قليل'};
function ovDesc(o){const a=[];if(o.mode)a.push(ML[o.mode]);if(o.t){const t=o.t;a.push('أهداف خاصة'+(t.p!=null?' · بروتين '+rd(t.p):'')+(t.c!=null?' · كارب '+rd(t.c):'')+(t.f!=null?' · دهون '+rd(t.f):''))}return a.join(' · ')}
// يحفظ تعديل اليوم i (ov=null للإزالة). إن تغيّر نوع أيام يُطلب تأكيد لأن وجباتها تُعاد من القالب.
function setDayOv(i,ov,rep,msg){const s=S(),bD=s.ovD[i],bW=s.ovW[i],cur=dayOv(i),tCh=JSON.stringify((cur&&cur.t)||null)!==JSON.stringify((ov&&ov.t)||null);
  const put=()=>{if(rep==='all'){delete s.ovD[i];delete s.ovW[i]}else if(rep){if(ov)s.ovW[i]=ov;else delete s.ovW[i];delete s.ovD[i]}else{if(ov)s.ovD[i]=Object.assign(ov,{wk:weekKey()});else{delete s.ovD[i];if(!cur||cur.rep)delete s.ovW[i]}}};
  const back=()=>{if(bD)s.ovD[i]=bD;else delete s.ovD[i];if(bW)s.ovW[i]=bW;else delete s.ovW[i]};
  put();const n=modeDiffs().length;
  const done=()=>{const reb=modeDiffs();applyModes();if(tCh&&!reb.includes(i))fitDay(state.days[i],true);modal=null;toast(msg)};
  if(!n){done();save();render();return}
  back();ask(`سيتغيّر نوع ${daysWord(n)} وتُعاد ${n===1?'وجباته':'وجباتها'} من القالب (يُفقد أي تعديل يدوي فيها). متابعة؟`,()=>{put();done()});
}
function setPat(np){const s=S(),old=s.cyc.pat;s.cyc.pat=np;const n=modeDiffs().length;
  if(!n){save();render();return}
  s.cyc.pat=old;ask(`سيتغيّر نوع ${daysWord(n)} وتُعاد ${n===1?'وجباته':'وجباتها'} من القالب (يُفقد أي تعديل يدوي فيها). متابعة؟`,()=>{S().cyc.pat=np;applyModes()});
}
function roundG(f,g){if(f.u&&f.ug)return Math.max(1,rd(g/f.ug))*f.ug;const st=g>=20?5:1;return Math.max(st,rd(g/st)*st)}

// ضبط الكميات: أدوار P/C/F تتغير (الثابت x لا)، بمعامل لكل دور محدود 0.25–3
function fitItems(items,T,base){const fac={P:1,C:1,F:1};
  for(let n=0;n<40;n++)for(const [R,m] of [['P','p'],['C','c'],['F','f']]){
    const cur=sum(items)[m],grp=items.filter(i=>i.r===R),contrib=grp.reduce((a,i)=>a+mac(i)[m],0);if(contrib<=0)continue;
    let s=1+(T[m]-cur)/contrib;s=Math.min(1.3,Math.max(0.75,s));fac[R]=Math.min(3,Math.max(0.25,fac[R]*s));grp.forEach(i=>i.g=base.get(i)*fac[R])}}
// (1) كل وجبة على نصيبها من اليوم (خطة الوجبات)، ثم (2) تصحيح مجموع اليوم
function fitDay(d,useCur){
  const items=d.meals.flatMap(m=>m.items),T=targets(d);
  items.forEach(i=>{if(useCur)i.b=i.g;else i.g=i.b});
  d.meals.forEach((m,mi)=>{const MT=mealTarget(d,mi,T);if(MT&&m.items.length)fitItems(m.items,MT,new Map(m.items.map(i=>[i,i.g])))});
  fitItems(items,T,new Map(items.map(i=>[i,i.g])));
  items.forEach(i=>{const f=F(i.f);if(f&&!i.x)i.g=roundG(f,i.g)});
}
// يوم جديد من خطة الوجبات: لكل وجبة وجبتها الجاهزة (المثبّتة، أو قالب الإدارة، أو قالب التطبيق) حسب نوع اليوم
function buildDay(i,mode,prot){
  const meals=mplan().map(def=>({id:def.id,n:def.n,slot:def.slot,items:tplItems(pickTpl(def.slot,mode,def.tpl),prot)}));
  const d={name:DAYS[i],mode,prot,meals};fitDay(d);return d;
}
function defaultState(){
  const AD=adminDefaults(),st={v:1,settings:Object.assign({bw:70,pM:2,cH:2,cL:1,fM:0.8,by:'auto'},DEF_GOALS.some(g=>g.id===AD.goal)?{goal:AD.goal}:{},ACTS.some(a=>a[0]===+AD.act)?{act:+AD.act}:{}),foods:FOODS0.map(a=>({id:a[0],n:a[1],grp:a[2],k:a[3],p:a[4],c:a[5],f:a[6],u:a[7]||'',ug:a[8]||0})),days:[]};
  state=st;
  const C=AD.cyc||{},P=validPat(C.pat)?C.pat.slice():PATS.alt.slice();
  st.settings.cyc={on:C.on!==false,r:+C.r>0&&+C.r<=1?+C.r:0.5,pat:P};
  DAYS.forEach((n,i)=>st.days.push(buildDay(i,P[i],i%2?'beef':'chicken')));
  return st;
}
