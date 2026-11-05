// نمط الأسبوع (عادي/قليل)، تعديل يوم لهذا التاريخ أو كل أسبوع، اسم «كارب أقل»، وافتراضيات الإدارة
const {JSDOM,VirtualConsole}=require('jsdom');
const html=require('./v2html')();
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x===undefined?'':x))};
const mk=ls=>new JSDOM(html,{runScripts:'dangerously',url:'https://odo93.github.io/meal-plan/v2/',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){
  (ls||[]).forEach(([k,v])=>w.localStorage.setItem(k,JSON.stringify(v)));w.fetch=async()=>({ok:false,status:404,text:async()=>''})}});
let d=mk(),w=d.window,$=s=>w.document.querySelector(s),E=s=>w.eval(s);
const A=(a,ds)=>E(`act(${JSON.stringify(a)},${JSON.stringify(ds||{})})`);
const yes=()=>A('yes');
E("meta.mode='self';render()");

// rename
T('goal renamed',E("S().goals.find(g=>g.id==='manual').name")==='كارب أقل');
T('old name migrated',E("fixSettings({goals:[{id:'manual',name:'معادلة الريل',kind:'manual',sign:0}]}).goals[0].name")==='كارب أقل');
T('custom name kept',E("fixSettings({goals:[{id:'manual',name:'خطتي',kind:'manual',sign:0}]}).goals[0].name")==='خطتي');

// pattern exists and matches the days (nothing changes for existing users)
const modes=()=>JSON.parse(E('JSON.stringify(state.days.map(x=>x.mode))'));
T('pattern = current days',E('JSON.stringify(S().cyc.pat)')===JSON.stringify(modes()));
T('no diffs at start',E('modeDiffs().length')===0);

// pattern UI on goals page
E("ui.tab='me';ui.sub='goals';render()");
T('pattern buttons',w.document.querySelectorAll('#app [data-act="patday"]').length===7&&!!$('#app [data-act="patset"][data-v="p52"]'));
// toggle Saturday → asks, cancel keeps
const sat=modes()[0];A('patday',{v:'0'});
T('toggle asks before rebuilding',E('modal&&modal.type')==='ask'&&/يوم واحد/.test(E('modal.msg')));
E('modal=null');T('cancel keeps day + pattern',modes()[0]===sat&&E('S().cyc.pat[0]')===sat);
A('patday',{v:'0'});yes();
T('confirm flips day + pattern',modes()[0]!==sat&&E('S().cyc.pat[0]')===modes()[0]);
A('patset',{v:'p52'});yes();
T('preset 5+2',JSON.stringify(modes())===JSON.stringify(['high','high','low','high','high','low','high']));
T('persisted',JSON.parse(w.localStorage.getItem(E("'mp3_u_'+meta.cur"))).settings.cyc.pat[2]==='low');

// one-off change for a high day (Sunday idx 1 is high now)
E("ui.tab='day';ui.day=1;render()");A('dayopts');
T('options show «حسب الإعدادات»',/حسب الإعدادات: كارب عادي/.test($('#modal').textContent));
A('dayov');T('editor open',E('modal.type')==='dayov'&&!!$('#ov_p')&&$('#ov_p').placeholder!=='');
A('ovmode',{v:'low'});T('mode chosen, stays in editor',E('modal.mode')==='low'&&E('modal.type')==='dayov');
A('dayovsave');T('mode change asks',E('modal&&modal.type')==='ask');yes();
T('day 1 now low, pattern unchanged',modes()[1]==='low'&&E('S().cyc.pat[1]')==='high');
T('stored as one-off with week key',E('S().ovD[1].wk')===E('weekKey()')&&!E('S().ovW[1]'));
T('badge on day',/معدّل/.test($('#app .dhead').textContent));

// next week: one-off ends, day returns to pattern
E("S().ovD[1].wk='2000-01-01'");E('rollWeek()');
T('one-off gone next week',!E('S().ovD[1]')&&modes()[1]==='high');

// weekly change with special targets (no type change → no rebuild, quantities refit)
const preP=E('sum(state.days[1].meals.flatMap(m=>m.items)).p');
A('dayov');$('#ov_p').value='210';A('ovrep',{v:'1'});T('typed value kept when toggling',$('#ov_p').value==='210');
A('dayovsave');
T('weekly saved without asking',E('modal')===null&&E('S().ovW[1].t.p')===210&&!E('S().ovW[1].mode'));
const tg=JSON.parse(E('JSON.stringify(targets(state.days[1]))'));
T('targets use override',Math.round(tg.p)===210&&Math.round(tg.k)===Math.round(4*tg.p+4*tg.c+9*tg.f));
const planP=E('sum(state.days[1].meals.flatMap(m=>m.items)).p');
T('quantities refit toward new protein',planP>preP+15&&Math.abs(planP-210)<Math.abs(preP-210),preP+' -> '+planP);
E("S().ovD={};rollWeek()");T('weekly survives new week',E('S().ovW[1].t.p')===210);

// one-off on top of weekly wins this week
A('dayov');A('ovrep',{v:'0'});A('ovmode',{v:'low'});A('dayovsave');yes();
T('one-off wins over weekly',E('dayOv(1).rep')===false&&modes()[1]==='low'&&E('S().ovW[1].t.p')===210);

// reset (cancel keeps both)
A('dayovreset');E('modal=null');T('reset cancel keeps both',!!E('S().ovD[1]')&&!!E('S().ovW[1]'));
A('dayovreset');yes();
T('reset clears both, back to pattern',!E('S().ovD[1]')&&!E('S().ovW[1]')&&modes()[1]==='high');

// legacy 'mode' action becomes a one-off change
A('mode',{v:'low'});yes();T('old type buttons → one-off',E('S().ovD[1].mode')==='low'&&modes()[1]==='low');
E('rollWeek()');T('…and survive restart',modes()[1]==='low');
A('dayovreset');yes();

// coach editing a shared person: stored with who did it
E("ui.remote={owner:'o',id:'r',name:'متدرب',role:'coach',hist:[]};cloud.email='coach@x.y'");
A('dayov');A('ovmode',{v:'low'});A('dayovsave');yes();
T('coach change carries «by»',E('S().ovD[1].by')==='coach@x.y');
A('dayopts');T('shown in options',/بواسطة coach@x.y/.test($('#modal').textContent));
E('ui.remote=null;modal=null');

// admin defaults: new person gets admin pattern + ratio
d=mk([['mp3_pub',{features:{},defaults:{cyc:{on:false,r:0.4,pat:['low','high','high','high','high','high','low']}}}]]);w=d.window;E=s=>w.eval(s);
const st=JSON.parse(E('JSON.stringify((()=>{const s=defaultState();return {cyc:s.settings.cyc,modes:s.days.map(x=>x.mode)}})())'));
T('new person uses admin pattern',st.modes.join()==='low,high,high,high,high,high,low'&&st.cyc.pat[0]==='low');
T('new person uses admin ratio + switch',st.cyc.r===0.4&&st.cyc.on===false);
console.log('PASS',ok,'FAIL',bad,errs);process.exit(0);
