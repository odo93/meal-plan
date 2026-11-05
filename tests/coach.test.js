// نتائج المتدربين للمدرب، وبناء خطة الأسبوع من الأصناف المعتادة
const {JSDOM,VirtualConsole}=require('jsdom');
const html=require('./v2html')();
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x===undefined?'':x))};
const R=(j,st)=>({ok:(st||200)<300,status:st||200,text:async()=>j===undefined?'':JSON.stringify(j)});
let SH=[],USERS=[],HIST=[],DAYS=[],log=[];
const mk=ls=>new JSDOM(html,{runScripts:'dangerously',url:'https://odo93.github.io/meal-plan/v2/',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){
  (ls||[]).forEach(([k,v])=>w.localStorage.setItem(k,JSON.stringify(v)));
  w.fetch=async(u,o)=>{o=o||{};const x=new URL(u),p=x.pathname;log.push([o.method||'GET',p+x.search]);
    if(p==='/rest/v1/rpc/mp_shared_with_me')return R(SH);
    if(p==='/rest/v1/rpc/mp_my_grants'||p==='/rest/v1/mp_accounts')return R([]);
    if(p==='/rest/v1/mp_days')return R(DAYS);if(p==='/rest/v1/mp_users')return R(USERS);if(p==='/rest/v1/mp_history')return R(HIST);
    return R(undefined,404)}}});
(async()=>{
 let d=mk(),w=d.window,$=s=>w.document.querySelector(s),E=s=>w.eval(s);
 E("meta.mode='coach';render()");
 // helpers inside the page: a logged history record for N days ago, and a weight series
 E(`window.mkRec=(k,frac)=>{const dt=iso(addDays(new Date(),-k)),di=(new Date(dt).getDay()+1)%7,dd=clone(state.days[di]);dd.meals.forEach(m=>m.items.forEach(it=>{it.e=Math.round(it.g*(frac||1))}));return snapDay(dd,dt,di)};
   window.mkW=(perWeek,startAgo)=>{const a=[];for(let k=startAgo||21;k>=0;k-=3)a.push({d:iso(addDays(new Date(),-k)),w:+(80+((startAgo||21)-k)*perWeek/7).toFixed(2)});return a}`);
 const cut={goal:'cut',bw:80};
 const res=(s,h)=>JSON.parse(E(`JSON.stringify(coachRes(${JSON.stringify(s)},${h}))`));
 // goal rate of «تنحيف» for this person
 const gr=res(Object.assign({},cut,{wlog:[]}),'[]').goalRate;
 T('cut has a negative goal rate',gr<0,gr);
 let r=res(Object.assign({},cut),`[mkRec(1),mkRec(2)]`).st;T('no weights → not enough data',r==='nodata',r);
 E(`window.__w=mkW(${gr})`);r=res(Object.assign({},cut,{wlog:E('__w')}),'[mkRec(1),mkRec(2),mkRec(3)]');
 T('losing at goal pace → on track',r.st==='ok'&&Math.abs(r.rate-gr)<0.05,JSON.stringify(r));
 T('4-week adherence from complete days',Math.round(r.adh)===100&&r.done===3);
 E(`window.__w=mkW(0)`);r=res(Object.assign({},cut,{wlog:E('__w')}),'[mkRec(1)]');T('not losing on a cut → slower',r.st==='slow',r.st);
 E(`window.__w=mkW(${gr*3})`);r=res(Object.assign({},cut,{wlog:E('__w')}),'[mkRec(1)]');T('losing much faster → faster',r.st==='fast',r.st);
 E(`window.__w=mkW(0.6,21).filter(x=>x.d<=iso(addDays(new Date(),-6)))`);r=res({goal:'maint',bw:80,wlog:E('__w')},'[mkRec(7)]');
 T('nothing logged for 6 days → needs follow-up',r.st==='idle'&&r.idle>=6,JSON.stringify(r));
 E(`window.__w=mkW(0.6)`);r=res({goal:'maint',bw:80,wlog:E('__w')},'[mkRec(1)]');T('gaining on maintenance → drifting',r.st==='drift',r.st);
 r=res({goal:'manual',bw:80,wlog:E('mkW(-0.5)')},'[mkRec(1)]');T('«كارب أقل» has no goal rate',r.goalRate==null&&r.st==='nodata',JSON.stringify(r));

 // loadShared fetches settings + last 4 weeks and fills the clients page
 SH=[{owner:'o1',user_id:'a',name:'علي',role:'coach',owner_email:'a@x'},{owner:'o2',user_id:'b',name:'بدر',role:'coach',owner_email:'b@x'}];
 const recA=JSON.parse(E('JSON.stringify([mkRec(1),mkRec(2)])')),recB=JSON.parse(E('JSON.stringify([mkRec(9)])'));
 HIST=[...recA.map(x=>({owner:'o1',user_id:'a',date:x.date,data:x})),...recB.map(x=>({owner:'o2',user_id:'b',date:x.date,data:x}))];
 USERS=[{owner:'o1',id:'a',settings:Object.assign({},cut,{wlog:JSON.parse(E(`JSON.stringify(mkW(${gr}))`))})},{owner:'o2',id:'b',settings:{goal:'cut',bw:90}}];
 DAYS=[];
 d=mk([['mp3_cloud',{email:'c@x',sess:{at:'AT',rt:'RT',exp:Date.now()+3600e3,uid:'C1'}}],['mp3_meta',{users:[{id:'u1',name:'مدرب'}],cur:'u1',mode:'coach'}]]);
 w=d.window;$=s=>w.document.querySelector(s);E=s=>w.eval(s);await sleep(150);
 T('history requested for last 4 weeks',log.some(l=>l[1].startsWith('/rest/v1/mp_history?')&&/date=gte\./.test(l[1]))&&log.some(l=>l[1].startsWith('/rest/v1/mp_users?select=owner,id,settings')));
 T('results computed',E("ui.cres['o1/a'].st")==='ok'&&E("ui.cres['o2/b'].st")==='idle',E("JSON.stringify(ui.cres)"));
 E("ui.tab='me';ui.sub='clients';render()");
 const rows=[...w.document.querySelectorAll('#app [data-act="whopick"]')];
 T('needs-attention first',rows.length===2&&/بدر/.test(rows[0].textContent)&&/يحتاج متابعة/.test(rows[0].textContent));
 T('on-track trainee shows weight vs goal',/على المسار/.test(rows[1].textContent)&&/كجم\/أسبوع/.test(rows[1].textContent)&&/الهدف \(تنحيف\)/.test(rows[1].textContent));
 T('summary line',/1 يحتاج انتباهك/.test($('#app').textContent));

 // --- week from usual foods ---
 d=mk();w=d.window;$=s=>w.document.querySelector(s);E=s=>w.eval(s);E("meta.mode='self';render()");
 const used=E("JSON.stringify([...new Set(state.days.flatMap(d=>d.meals.flatMap(m=>m.items.map(i=>i.f))))])");
 const fav=E(`(()=>{const u=${used};return state.foods.find(f=>f.grp==='pro'&&!u.includes(f.id)&&f.p>10).id})()`);
 // eat «fav» instead of every protein item for 10 days
 E(`for(let k=1;k<=10;k++){const dt=iso(addDays(new Date(),-k-7)),di=k%7,dd=clone(state.days[di]);
    dd.meals.forEach(m=>m.items.forEach(it=>{const f=F(it.f);if(f&&f.grp==='pro')it.f='${fav}';it.e=it.g}));hPut(meta.cur,snapDay(dd,dt,di))}`);
 T('favourite food detected',E("usualByGroup().pro[0].id")==='${fav}'.replace('${fav}',fav));
 E("state.days[0].meals[0].items[0].e=state.days[0].meals[0].items[0].g;state.days[0].lw=weekKey()");  // day 0 already logged
 const day0=E("JSON.stringify(state.days[0].meals)"),before=E("JSON.stringify(state.days)");
 E("ui.tab='week';render();act('weekopts',{})");T('option in week menu',!!$('#modal [data-act="usualweek"]'));
 E("act('usualweek',{})");T('asks first',E('modal.type')==='ask');E("act('yes',{})");
 const cnt=E(`state.days.slice(1).filter(d=>d.meals.some(m=>m.items.some(i=>i.f==='${fav}'))).length`);
 T('usual food placed in un-logged days',cnt>=5,cnt);
 T('logged day untouched',E("JSON.stringify(state.days[0].meals)")===day0);
 T('quantities fitted to targets',E("Math.abs(sum(state.days[1].meals.flatMap(m=>m.items)).p-targets(state.days[1]).p)")<25);
 T('one food once per meal',E(`state.days.every(d=>d.meals.every(m=>m.items.filter(i=>i.f==='${fav}').length<=1))`));
 E("toast.u&&toast.u()");T('undo restores the week',E("JSON.stringify(state.days)")===before);
 // no history yet → explains instead of changing anything
 d=mk();w=d.window;E=s=>w.eval(s);E("meta.mode='self';act('usualweek',{})");
 T('without history: explains',/سجّل ما تأكله/.test(w.document.querySelector('#toast').textContent)&&E('modal')===null);
 console.log('PASS',ok,'FAIL',bad,errs);process.exit(0);
})();
