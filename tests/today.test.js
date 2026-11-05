// شاشة اليوم: شريط الأيام (يوم وتاريخ فقط)، خيارات اليوم في ⋯، الوجبات المطوية، إنهاء الوجبة، السناك، ووزن اللحم النيء
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=require('./v2html')();
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x===undefined?'':x))};
const d=new JSDOM(html,{runScripts:'dangerously',url:'https://odo93.github.io/meal-plan/v2/',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){w.fetch=async()=>({ok:false,status:404,text:async()=>''})}});
const w=d.window,$=s=>w.document.querySelector(s),$$=s=>[...w.document.querySelectorAll(s)],E=s=>w.eval(s);
const click=s=>(typeof s==='string'?$(s):s).dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
E("meta.mode='self';ui.day=0;render()");
// 1) day strip: day + date only
const days=$$('#app .days button');
T('7 days',days.length===7);
T('no carb/protein labels on the day screen',!/كارب|لحم|دجاج|سمك/.test($('.days').textContent)&&!$('#app [data-act="mode"]')&&!$('#app [data-ch="prot"]'));
T('day has accessible full name',/السبت/.test(days[0].getAttribute('aria-label')));
// 2) day options sheet
click('[data-act="dayopts"]');
T('options sheet has day type and protein',!!$('#modal [data-act="mode"][data-v="low"]')&&!!$('#modal [data-ch="prot"]')&&!!$('#modal [data-act="rebuild"]'));
click('#modal [data-act="close"]');
// 3) one meal open at a time
const exp=()=>$$('.mhd').map(b=>b.getAttribute('aria-expanded'));
T('first meal open only',exp()[0]==='true'&&exp().slice(1).every(x=>x==='false'));
T('collapsed meals keep items hidden',$('#mb1').hidden===true&&!$('#mb0').hidden);
click('.mhd[data-m="2"]');
T('tap opens another meal',exp()[2]==='true'&&exp()[0]==='false');
click('.mhd[data-m="2"]');
T('tap again closes it',exp().every(x=>x==='false'));
// 4) finish meal logs all planned items and moves on
click('.mhd[data-m="0"]');click('[data-act="mfinish"][data-m="0"]');
T('meal logged',E('state.days[0].meals[0].items.filter(i=>!i.x).every(i=>gE(i)===i.g)'));
T('next meal opens',exp()[1]==='true'&&$$('.meal')[0].textContent.includes('مكتملة'));
click('.mhd[data-m="0"]');click('[data-act="mfinish"][data-m="0"]');
T('undo finish clears log',E('state.days[0].meals[0].items.every(i=>gE(i)==null)'));
// 5) day completion check in the strip
E("state.days[0].meals.forEach(m=>m.items.forEach(i=>{if(!i.x)i.e=i.g}));render()");
T('completed day shows check',!!$$('#app .days button')[0].querySelector('.ck'));
// 6) snack
const nm=E('state.days[0].meals.length');click('[data-act="addmeal"]');
T('snack added and opened',E('state.days[0].meals.length')===nm+1&&E('state.days[0].meals[state.days[0].meals.length-1].n')==='سناك إضافي'&&exp()[nm]==='true');
click(`[data-act="delmeal"][data-m="${nm}"]`);
T('empty snack can be removed',E('state.days[0].meals.length')===nm);
// 7) item options sheet
click('.mhd[data-m="1"]');const n1=E('state.days[0].meals[1].items.length');
click('[data-act="itemopts"][data-m="1"][data-i="0"]');
T('item sheet',!!$('#modal [data-act="swap"]')&&!!$('#modal [data-act="log"]'));
click('#modal [data-act="del"]');
T('delete from sheet closes it',E('state.days[0].meals[1].items.length')===n1-1&&!$('#modal.on'));
// 8) cooked meat shows raw weight
E("state.days[0].meals[1].items.push({f:'chk_b',g:150,b:150,r:'x',s:''});ui.open={d:0,m:1};render()");
T('raw weight note',$('#mb1').textContent.includes('مطبوخ ≈ 200 جم نيء'),$('#mb1').textContent.slice(-80));
console.log('PASS',ok,'FAIL',bad,errs);process.exit(0);
