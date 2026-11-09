// تعديل الأصناف أو الإعدادات يسري من اليوم فصاعداً ولا يغيّر الأيام الماضية (المسجَّلة) من الأسبوع الحالي ولا السجل
const {JSDOM,VirtualConsole}=require('jsdom');
const html=require('./v2html')();
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x===undefined?'':x))};
const FIXED=new Date(2026,10,11,10,0,0).getTime(); // الأربعاء 11 نوفمبر 2026؛ الأسبوع يبدأ السبت 7
const d=new JSDOM(html,{runScripts:'dangerously',url:'https://odo93.github.io/meal-plan/v2/',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){
  w.fetch=async()=>({ok:false,status:404,text:async()=>'',json:async()=>({})});
  const R=w.Date;class D extends R{constructor(...a){a.length?super(...a):super(FIXED)}static now(){return FIXED}}w.Date=D}});
const w=d.window,E=s=>w.eval(s);
E("meta.mode='self';render()");
T('today is Wednesday (index 4)',E('todayISO()')==='2026-11-11'&&E('isPastDay(1)')&&!E('isPastDay(4)'));
// يوم ماضٍ (الأحد = 1) مسجَّل كاملاً، ويوم اليوم (4) مسجَّل أيضاً
E("[1,4].forEach(i=>{const dd=state.days[i];dd.lw=weekKey();dd.meals.forEach(m=>m.items.forEach(it=>{if(!it.x)it.e=it.g}))});save();");
const it0=E('state.days[1].meals[0].items[0]'),fid=it0.f;
const kcal=di=>Math.round(E(`sum(state.days[${di}].meals.flatMap(m=>m.items.map(i=>Object.assign({},i,{g:i.e}))) ).k`));
const k1=kcal(1),k4=kcal(4),tg1=E('targets(state.days[1]).k'),rec1=JSON.stringify(E("hGet(meta.cur,'2026-11-08')").meals);
T('past day frozen after save',E('!!state.days[1].tg')&&E('state.days[1].meals[0].items[0].fd.fz')===fid);
T('today is not frozen',!E('state.days[4].tg')&&!E('state.days[4].meals[0].items[0].fd'));
// تعديل الصنف + الإعدادات (وزن/هدف)
E(`const f=F('${fid}');f.k*=2;f.p*=2;f.c*=2;f.f*=2;state.settings.bw=120;save();render()`);
T('past day calories unchanged after food edit',kcal(1)===k1,[kcal(1),k1]);
T('past day targets unchanged after settings edit',E('targets(state.days[1]).k')===tg1);
T('history record of past day unchanged',JSON.stringify(E("hGet(meta.cur,'2026-11-08')").meals)===rec1);
T('today uses the new food values',kcal(4)>k4,[kcal(4),k4]);
T('today uses the new targets',E('targets(state.days[4]).k')!==tg1);
// استبدال صنف في يوم ماضٍ لا يترك قيم الصنف القديم
E(`const other=state.foods.find(x=>x.id!=='${fid}');const t=state.days[1].meals[0].items[0];t.f=other.id`);
T('swapped item reads the new food, not stale frozen copy',E('FOOD(state.days[1].meals[0].items[0]).n')===E(`F(state.foods.find(x=>x.id!=='${fid}').id).n`));
// تغيير نمط الأسبوع لا يعيد بناء يوم ماضٍ مسجَّل
E(`state.days[1].meals[0].items[0].f='${fid}'`);
const before=E('JSON.stringify(state.days[1].meals)');
E("const np=PATS.alt.map((x,i)=>x==='high'?'low':'high');state.settings.cyc=Object.assign({},state.settings.cyc,{pat:np});");
E('applyModes()');
T('past logged day not rebuilt by pattern change',E('JSON.stringify(state.days[1].meals)')===before);
// أسبوع جديد: يُمسح التجميد ولا يُكتب فوق السجل المحفوظ
const recBefore=JSON.stringify(E("hGet(meta.cur,'2026-11-08')"));
E("clearLog(state.days[1])");
T('clearLog drops frozen copies',!E('state.days[1].tg')&&E('state.days[1].meals.every(m=>m.items.every(i=>!i.fd))'));
T('no script errors',errs.length===0,errs);
console.log('PASS',ok,'FAIL',bad,errs.slice(0,3));process.exit(bad?1:0);
