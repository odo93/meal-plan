// سجل الوزن، الاحتياج الفعلي من الوزن والأكل، والتقرير الأسبوعي
const {JSDOM,VirtualConsole}=require('jsdom');
const html=require('./v2html')();
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x===undefined?'':x))};
const d=new JSDOM(html,{runScripts:'dangerously',url:'https://odo93.github.io/meal-plan/v2/',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){w.fetch=async()=>({ok:false,status:404,text:async()=>''})}});
const w=d.window,$=s=>w.document.querySelector(s),E=s=>w.eval(s);
const A=(a,ds)=>E(`act(${JSON.stringify(a)},${JSON.stringify(ds||{})})`);
E("meta.mode='self';meta.consent='yes';render()");

// --- weight log ---
E("ui.tab='hist';render()");
T('weight card on progress',!!$('#w_in')&&!!$('#app [data-act="wsave"]'));
$('#w_in').value='abc';A('wsave');T('invalid weight rejected',E('wlog().length')===0);
$('#w_in').value='82.4';A('wsave');
T('weight saved for today',E('wlog().length')===1&&E('wlog()[0].w')===82.4&&E('wlog()[0].d')===E('todayISO()'));
T('profile weight follows',E('S().bw')===82.4);
$('#w_in').value='82.1';A('wsave');T('same day replaced',E('wlog().length')===1&&E('wlog()[0].w')===82.1);
A('wdel',{d:E('todayISO()')});T('deleted',E('wlog().length')===0);

// --- actual TDEE: not enough data → tells what is missing ---
let r=JSON.parse(E('JSON.stringify(realTdee())'));
T('needs data first',!r.v&&r.need.length===2,JSON.stringify(r));
E("ui.tab='hist';render()");T('card explains what is missing',/أكمل تسجيل 7 أيام/.test($('#app').textContent));

// build 21 complete days (eaten = plan) and weights falling 0.5 kg/week
E(`(()=>{for(let k=20;k>=0;k--){const dt=iso(addDays(new Date(),-k)),di=(k%7);const dd=clone(state.days[di]);
  dd.meals.forEach(m=>m.items.forEach(it=>{it.e=it.g}));hPut(meta.cur,snapDay(dd,dt,di))}
  for(let k=21;k>=0;k-=3)wlog().push({d:iso(addDays(new Date(),-k)),w:+(85-(21-k)*0.5/7).toFixed(2)});})()`);
r=JSON.parse(E('JSON.stringify(realTdee())'));
const avgK=E(`(()=>{const f=iso(addDays(new Date(),-27));const a=hAll(meta.cur).filter(x=>x.date>=f).map(x=>dayLog(x).eaten.k);return a.reduce((s,v)=>s+v,0)/a.length})()`);
T('actual TDEE computed',r.v&&r.days>=7&&r.wn>=3,JSON.stringify(r));
T('= intake + loss energy',Math.abs(r.v-(avgK+0.5/7*7700))<40,[r.v,avgK]);
T('slope ≈ -0.5 kg/week',Math.abs(r.slope*7+0.5)<0.02,r.slope*7);
E("ui.tab='hist';render()");
T('manual goal: explains instead of a useless button',E("goalOf(S()).kind")==='manual'&&!$('#app [data-act="tdeeuse"]')&&/لا يعتمد على الاحتياج/.test($('#app').textContent));
E("S().goal='cut';ui.tab='hist';render()");
T('card shows actual vs formula',/احتياجك الفعلي/.test($('#app').textContent)&&!!$('#app [data-act="tdeeuse"]'));
A('tdeeuse');T('used in goals',Math.abs(E('S().tdeeM')-r.v)<1&&/مُستخدم في أهدافك/.test($('#app').textContent));
T('goals now follow it',Math.round(E('goalCore(S()).tdee'))===Math.round(E('S().tdeeM')));
// weekly automatic update
E("S().tdeeM=2000;S().tdeeWk='2000-01-01'");const cb=$('#app [data-ch="tdeeauto"]');cb.checked=true;cb.dispatchEvent(new w.Event('change',{bubbles:true}));
T('auto update on enable',E('S().tdeeAuto')===true&&E('S().tdeeM')===Math.round(E('realTdee().v'))&&E('S().tdeeWk')===E('weekKey()'));
E("S().tdeeM=2000");T('runs once per week',E('autoTdee()')===false&&E('S().tdeeM')===2000);

// --- weekly report ---
const R=JSON.parse(E('JSON.stringify(weekReport())'));
T('report for last week',R&&R.n===7&&R.done===7&&Math.abs(R.adh-100)<1,JSON.stringify(R));
T('weight change in report',R.wch!=null&&Math.abs(R.wch+0.5)<0.15,R.wch);
E("ui.tab='hist';render()");T('report card',/أسبوعك الماضي/.test($('#app').textContent));
E("ui.tab='day';render()");T('notice on Today',!!$('#app [data-act="repopen"]'));
A('repopen');T('opens progress, notice gone',E('ui.tab')==='hist'&&(E("ui.tab='day';render()"),!$('#app [data-act="repopen"]')));
// weakest weekday: make one weekday consistently under-eaten over 4 weeks
E(`(()=>{const ws=weekStart();for(let wk=1;wk<=4;wk++)for(let di=0;di<7;di++){const dt=iso(addDays(ws,-7*wk+di));const dd=clone(state.days[di]);
  dd.meals.forEach(m=>m.items.forEach(it=>{it.e=di===6?Math.round(it.g*0.5):it.g}));hPut(meta.cur,snapDay(dd,dt,di))}})()`);
const R2=JSON.parse(E('JSON.stringify(weekReport())'));
T('weakest weekday found',R2.weak&&R2.weak[0]===6&&R2.weak[1]<60,JSON.stringify(R2.weak));

// --- coach view: no weight logging for someone else ---
E("ui.remote={owner:'o',id:'r',name:'متدرب',role:'coach',hist:[]};ui.tab='hist';render()");
T('coach sees no weight input',!$('#w_in'));
E("act('wsave',{})");T('weight logging blocked for coach',/التسجيل لصاحب الخطة/.test($('#toast').textContent));
console.log('PASS',ok,'FAIL',bad,errs);process.exit(0);
