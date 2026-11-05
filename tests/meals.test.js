// هيكل الوجبات الجديد: العدد والأسماء والأوقات والنِّسب، الضبط لكل وجبة، الوجبات الجاهزة (شخصية/مدرب/إدارة/تطبيق)
const {JSDOM,VirtualConsole}=require('jsdom');
const html=require('./v2html')();
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x===undefined?'':x))};
const R=(j,st)=>({ok:(st||200)<300,status:st||200,text:async()=>j===undefined?'':JSON.stringify(j)});
let log=[];
const mk=ls=>new JSDOM(html,{runScripts:'dangerously',url:'https://odo93.github.io/meal-plan/v2/',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){
  (ls||[]).forEach(([k,v])=>w.localStorage.setItem(k,JSON.stringify(v)));
  w.fetch=async(u,o)=>{o=o||{};const x=new URL(u),p=x.pathname;log.push([o.method||'GET',p,o.body?JSON.parse(o.body):null]);
    if(p==='/rest/v1/rpc/is_admin')return R(true);if(/rpc\/mp_(shared_with_me|my_grants)/.test(p)||p==='/rest/v1/mp_accounts')return R([]);
    if(p==='/rest/v1/mp_users'&&(o.method||'GET')==='GET')return R([]);
    return R(undefined,404)}}});
(async()=>{
 let d=mk(),w=d.window,$=s=>w.document.querySelector(s),$$=s=>[...w.document.querySelectorAll(s)],E=s=>w.eval(s),J=s=>JSON.parse(E('JSON.stringify('+s+')'));
 const A=(a,ds)=>E(`act(${JSON.stringify(a)},${JSON.stringify(ds||{})})`);
 E("meta.mode='self';render()");
 // new person: 4 meals with names, times, shares that sum to 100; days carry ids
 const P=J('mplan()');
 T('default plan: 4 meals',P.length===4&&P.map(x=>x.slot).join()==='b,l,s,d'&&P.reduce((a,x)=>a+x.pct,0)===100&&P.every(x=>/^\d\d:\d\d$/.test(x.t)));
 T('days follow the plan',E('state.days.every(d=>d.meals.length===4&&d.meals.every((m,i)=>m.id===mplan()[i].id))'));
 T('no pending changes',E('planDiffDays().length')===0);
 // per-meal targets add up to the day, and quantities are fitted per meal
 const tg=J('targets(state.days[0])'),mts=J('state.days[0].meals.map((m,i)=>mealTarget(state.days[0],i))');
 T('meal targets add up to the day',Math.abs(mts.reduce((a,x)=>a+x.k,0)-tg.k)<1);
 const kc=J('state.days[0].meals.map(m=>sum(m.items).k)'),tot=kc.reduce((a,b)=>a+b,0);
 T('day total still on target',Math.abs(tot-tg.k)/tg.k<0.08,[tot,tg.k]);
 T('lunch near its share',Math.abs(kc[1]-mts[1].k)/mts[1].k<0.3,[kc[1],mts[1].k]);

 // old data (no plan saved): plan is read from the days, nothing rebuilt
 const old=J(`(()=>{const s=clone(state.settings);delete s.mplan;const ds=clone(state.days);ds.forEach(d=>d.meals.forEach((m,i)=>{delete m.id;delete m.slot;m.n=['الوجبة 1 — فطور','الوجبة 2 — غداء','الوجبة 3 — سناك','الوجبة 4 — عشاء'][i]}));return {s,ds}})()`);
 E(`state.settings=${JSON.stringify(old.s)};state.days=${JSON.stringify(old.ds)}`);
 T('old users: plan derived from their days',E("mplan().map(x=>x.n+':'+x.slot).join()")==='الوجبة 1 — فطور:b,الوجبة 2 — غداء:l,الوجبة 3 — سناك:s,الوجبة 4 — عشاء:d'&&E('planDiffDays().length')===0);

 // editor in «أهدافي»
 E("ui.tab='me';ui.sub='goals';render()");
 T('meals section with 4 rows',$$('#app .mprow').length===4&&!!$('#app [data-act="mpset"][data-v="m3s2"]'));
 const pct=$('#app [data-ch="mp"][data-k="pct"]');pct.value='40';pct.dispatchEvent(new w.Event('change',{bubbles:true}));
 T('share edited',E('mplan()[0].pct')===40&&/مجموع النِّسب 115%/.test($('#app').textContent));
 A('mpeven');T('auto shares back to 100',E('mplan().reduce((a,x)=>a+x.pct,0)')===100);
 const nm=$('#app [data-ch="mp"][data-k="n"]');nm.value='فطور الصباح';nm.dispatchEvent(new w.Event('change',{bubbles:true}));
 E("ui.tab='day';ui.day=2;render()");T('name shown on Today without rebuilding',/فطور الصباح/.test($('#app .meal').textContent)&&!!$('#app .mtime'));
 // structure change → apply rebuilds unlogged days only
 E("state.days[0].meals[0].items[0].e=state.days[0].meals[0].items[0].g;state.days[0].lw=weekKey()");
 E("ui.tab='me';ui.sub='goals';render()");A('mpset',{v:'m3s2'});
 T('5 meals, pending notice',E('mplan().length')===5&&E('planDiffDays().length')===6&&/لم تُطبَّق على 6 أيام/.test($('#app').textContent));
 A('mpapply');T('asks before rebuilding',E('modal.type')==='ask');A('yes');
 T('unlogged days rebuilt to 5 meals',E('state.days.slice(1).every(d=>d.meals.length===5)')&&E("state.days[1].meals[1].n")==='سناك الصباح');
 T('logged day untouched',E('state.days[0].meals.length')===4);
 A('mpadd');A('mpadd');T('at most 6 meals',E('mplan().length')===6);
 E("mplan().splice(0)");E("S().mplan=mkPlan('m3')");A('mpdel',{v:'0'});T('at least 3 meals',E('mplan().length')===3);
 E("S().mplan=mkPlan('m3s');applyPlanToWeek()");

 // time-based «الآن» (all times 00:00 → last meal is current)
 E("mplan().forEach(x=>x.t='00:00');ui.tab='day';ui.day=todayIdx();render()");
 const last=E('state.days[todayIdx()].meals.length-1');
 T('current meal by time',E('nowMeal(state.days[todayIdx()])')===last);

 // save as ready meal → use it in another meal → undo
 E("ui.day=3;render()");A('mopts',{m:'1'});T('meal menu',!!$('#modal [data-act="mtpl"]')&&!!$('#modal [data-act="msave"]')&&!!$('#modal [data-act="musual"]'));
 A('msave');$('#ms_n').value='غدائي المفضل';A('msaved');
 const lib=J('myLib()');T('saved with food copies',lib.length===1&&lib[0].n==='غدائي المفضل'&&lib[0].items.every(x=>x.fd&&x.fd.n)&&lib[0].src==='mine');
 const before=E('JSON.stringify(state.days[4])');
 E("ui.day=4;render()");A('mopts',{m:'0'});A('mtpl');T('library listed',/غدائي المفضل/.test($('#modal').textContent)&&/قوالب التطبيق/.test($('#modal').textContent));
 A('mtplapply',{id:lib[0].id});
 T('meal replaced from library',E('state.days[4].meals[0].items.map(i=>i.f).join()')===lib[0].items.map(x=>x.f).join());
 E('toast.u()');T('undo',E('JSON.stringify(state.days[4])')===before);
 E("state.days[4].meals[0].items[0].e=10");A('mopts',{m:'0'});A('mtpl');A('mtplapply',{id:lib[0].id});
 T('logged meal not replaced',/بدأ تسجيل/.test($('#toast').textContent));E("delete state.days[4].meals[0].items[0].e");
 A('libdel',{id:lib[0].id});T('deleted from library',E('myLib().length')===0);

 // admin template used when building new days; missing food added from its copy
 d=mk([['mp3_pub',{features:{},defaults:{},meal_templates:[{id:'adm1',n:'فطور الإدارة',slot:'b',items:[{f:'zzoat',g:60,r:'C',fd:{n:'شوفان خاص',grp:'carb',k:380,p:13,c:66,f:7}},{f:'egg',g:100,r:'P'}]}]}]]);
 w=d.window;$=s=>w.document.querySelector(s);E=s=>w.eval(s);J=s=>JSON.parse(E('JSON.stringify('+s+')'));
 T('admin template builds breakfast',E("state.days.every(d=>d.meals[0].items.some(i=>i.f==='zzoat'))"));
 T('missing food added from template',E("!!F('zzoat')&&F('zzoat').n")==='شوفان خاص');

 // admin can publish from the app
 E("meta.mode='self';cloud.sess={at:'A',rt:'R',exp:Date.now()+3e6,uid:'ADM'};ui.isAdmin=true;ui.tab='day';ui.day=0;render()");
 E("act('mopts',{m:'0'})");T('publish shown to admin',!!$('#modal [data-act="mpub"]'));
 log=[];E("act('mpub',{})");await sleep(80);
 const pb=log.find(l=>l[0]==='PATCH'&&l[1]==='/rest/v1/app_config');
 T('published to app_config',pb&&pb[2].meal_templates.length===2&&pb[2].meal_templates[1].slot==='b');
 E('ui.isAdmin=false;cloud.sess=null');

 // coach: own ready meals offered when viewing a trainee; applying sends a copy to the trainee
 E(`(()=>{const me=loadUser(meta.cur);me.settings.lib=[{id:'cm1',n:'وجبة المدرب',slot:'l',src:'mine',items:[{f:'rice',g:80,r:'C'},{f:'tuna',g:120,r:'P'}]}];saveUser(meta.cur,me)})()`);
 E("ui.remote={owner:'o',id:'r',name:'متدرب',role:'coach',hist:[]};cloud.email='coach@x.y';ui.day=1;render()");
 E("act('mopts',{m:'1'})");E("act('mtpl',{})");T('coach library listed',/وجباتك كمدرب/.test($('#modal').textContent)&&/وجبة المدرب/.test($('#modal').textContent));
 E("act('mtplapply',{id:'cm1'})");
 T('applied to trainee + copy in trainee library',E("state.days[1].meals[1].items.some(i=>i.f==='tuna')")&&E("myLib().some(t=>t.src==='coach'&&t.by==='coach@x.y'&&t.n==='وجبة المدرب')"));
 E('ui.remote=null');
 console.log('PASS',ok,'FAIL',bad,errs);process.exit(0);
})();
