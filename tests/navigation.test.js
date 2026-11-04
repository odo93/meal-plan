// الشريط السفلي، صفحة «حسابي» وصفحاتها الفرعية، العناوين في الرابط، وفصل هدف «زيادة / بناء»
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(__dirname+'/../v2/index.html','utf8');
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x===undefined?'':x))};
const mk=url=>new JSDOM(html,{runScripts:'dangerously',url,virtualConsole:vc,pretendToBeVisual:true});
(async()=>{
 let d=mk('https://odo93.github.io/meal-plan/v2/'),w=d.window,$=s=>w.document.querySelector(s),$$=s=>[...w.document.querySelectorAll(s)];
 const click=s=>$(s).dispatchEvent(new w.MouseEvent('click',{bubbles:true})),E=s=>w.eval(s);
 // 1) bottom nav
 const nav=$$('#nav button').map(b=>b.textContent.trim());
 T('5 nav items',nav.join('|')==='اليوم|الخطة|التقدم|الأصناف|حسابي',nav);
 T('day is current',$('#nav [aria-current="page"]').dataset.v==='day');
 T('no hash on start',w.location.hash==='');
 T('avatar opens who sheet',!!$('#top .av[data-act="who"]'));
 // 2) hub
 click('#nav [data-v="me"]');
 T('hash #/me',w.location.hash==='#/me',w.location.hash);
 const subs=$$('#app .li[data-act="tab"]').map(b=>b.dataset.v);
 T('hub links all sub-pages',['me/profile','me/goals','me/family','me/sync','me/data','me/advanced'].every(v=>subs.includes(v)),subs);
 T('danger zone has reset and delete',!!$('#app [data-act="reset"]')&&!!$('#app [data-act="udel"]'));
 T('no back on hub',!$('#top [data-act="back"]'));
 // 3) sub-page + back
 click('[data-v="me/goals"]');
 T('goals page',w.location.hash==='#/me/goals'&&$('#top h1').textContent==='أهدافي');
 T('goals has refit',!!$('#app [data-act="refitweek"]'));
 T('profile fields not on goals',!$('#app [data-k="age"]'));
 click('#top [data-act="back"]');
 T('back to hub',w.location.hash==='#/me'&&!!$('#app .prof'));
 click('[data-v="me/profile"]');
 T('profile has age',!!$('#app [data-ch="set"][data-k="age"]'));
 click('[data-v="me"]');click('[data-v="me/advanced"]');
 T('advanced has equations',!!$('#app [data-act="eqadd"]'));
 // 4) browser back/forward
 w.history.pushState(null,'','#/plan');w.dispatchEvent(new w.PopStateEvent('popstate'));
 T('popstate to plan',E('ui.tab')==='week'&&$('#nav [aria-current="page"]').dataset.v==='week');
 w.history.pushState(null,'','#/nothing');w.dispatchEvent(new w.PopStateEvent('popstate'));
 T('unknown route falls back to day',E('ui.tab')==='day');
 // 5) family
 click('#nav [data-v="me"]');click('[data-v="me/family"]');
 T('family lists user',$$('#app .list')[0].querySelectorAll('.li').length===1);
 T('sharing needs sign-in',$('#app').textContent.includes('المشاركة تحتاج تسجيل الدخول')&&!$('#app [data-act="share"]'));
 click('[data-act="uadd"]');$('#un').value='سارة';$('#ukid').checked=true;click('[data-act="usave"]');
 T('child profile created',E('curUser().kind')==='child'&&E('meta.users.length')===2);
 click('#nav [data-v="me"]');click('[data-v="me/family"]');
 T('family lists two',$$('#app .list')[0].querySelectorAll('.li').length===2&&$('#app').textContent.includes('ملف طفل'));
 // 6) «من تعرض؟» from the avatar
 click('#nav [data-v="day"]');click('#top [data-act="who"]');
 T('who sheet lists profiles',$$('#modal [data-act="uswitch"]').length===2);
 const first=E('meta.users[0].id');click(`#modal [data-act="uswitch"][data-v="${first}"]`);
 T('switched user',E('meta.cur')===first&&!$('#modal.on'));
 click('#top [data-act="who"]');click('#modal [data-v="me/family"]');
 T('sheet closes on navigation',!$('#modal.on')&&E('ui.sub')==='family');
 click('#nav [data-v="day"]');
 // 7) usage type
 T('onboarding asks usage type',!!$('#app [data-act="umode"]'));
 click('#app [data-act="umode"][data-v="coach"]');
 T('mode saved',E('meta.mode')==='coach'&&JSON.parse(w.localStorage.getItem('mp3_meta')).mode==='coach'&&!$('#app [data-act="umode"]'));
 click('#nav [data-v="me"]');
 T('coach sees trainees',!!$('#app [data-v="me/clients"]'));
 click('[data-v="me/mode"]');click('[data-act="umode"][data-v="self"]');click('[data-act="back"]');
 T('self hides trainees',!$('#app [data-v="me/clients"]'));
 // 6) goals: weight gain and muscle gain are separate
 const ids=E('S().goals.map(g=>g.id+":"+g.name).join(",")');
 T('bulk renamed and lean added',ids.includes('bulk:زيادة وزن')&&ids.includes('lean:بناء عضلات'),ids);
 T('lean has higher protein',E('S().g.lean.pr')>E('S().g.bulk.pr'));
 E("state.settings.goals=state.settings.goals.filter(g=>g.id!=='lean');state.settings.goals.find(g=>g.id==='bulk').name='زيادة / بناء';state.settings.goal='bulk'");
 T('old saved goals migrate once',E('S().goals.filter(g=>g.id==="lean").length')===1&&E('S().goals.find(g=>g.id==="bulk").name')==='زيادة وزن'&&E('S().goal')==='bulk');
 // 7) deep link
 d=mk('https://odo93.github.io/meal-plan/v2/#/me/advanced');w=d.window;await sleep(50);
 T('deep link opens advanced',w.eval('ui.tab')==='me'&&w.eval('ui.sub')==='advanced'&&!!w.document.querySelector('#app [data-act="eqadd"]'));
 console.log('PASS',ok,'FAIL',bad,errs);process.exit(0)})();
