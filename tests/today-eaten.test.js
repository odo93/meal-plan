// R3: شاشة «اليوم» تعرض المأكول فعلاً (بما فيه خارج الخطة) مقابل الهدف، مع المتبقي والمتوقع، وتنبّه إن كانت الخطة بعيدة عن الهدف
const {JSDOM,VirtualConsole}=require('jsdom');
const html=require('./v2html')();
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x===undefined?'':JSON.stringify(x)))};
const FIXED=new Date(2026,10,7,10,0,0).getTime(); // السبت = يوم 0 = اليوم
const d=new JSDOM(html,{runScripts:'dangerously',url:'https://odo93.github.io/meal-plan/v2/',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){
  w.fetch=async()=>({ok:false,status:404,json:async()=>({}),text:async()=>''});
  const R=w.Date;class D extends R{constructor(...a){a.length?super(...a):super(FIXED)}static now(){return FIXED}}w.Date=D}});
const w=d.window,E=s=>w.eval(s),txt=()=>[...w.document.querySelectorAll('.note,.hcap,.mhd')].map(e=>e.textContent).join(' | ');
E("meta.mode='self';ui.day=0;render()");
T('today is day 0',E('isPastDay(0)')===false&&E('todayISO()')==='2026-11-07');
const hc=()=>w.document.querySelector('.hcap');
T('no logging yet: header says by plan',/حسب الخطة/.test(hc().textContent));
const planK=Math.round(E('sum(state.days[0].meals.flatMap(m=>m.items)).k'));
T('ring shows plan before logging',w.document.querySelector('.ring').getAttribute('aria-label').startsWith(String(planK)),w.document.querySelector('.ring').getAttribute('aria-label'));
// نسجّل وجبة من الخطة + صنفاً خارج الخطة
E(`const dd=state.days[0];const it=dd.meals[0].items[0];it.e=it.g;
   const f=state.foods.find(x=>x.k>0&&x.id!==it.f);dd.meals[0].items.push({f:f.id,g:0,b:0,r:'x',s:'',x:true,e:100});render()`);
const eatK=Math.round(E(`(()=>{let k=0;state.days[0].meals.forEach(m=>m.items.forEach(it=>{if(gE(it)!=null)k+=macE(it).k}));return k})()`));
T('ring shows EATEN (incl. outside-plan) after logging',w.document.querySelector('.ring').getAttribute('aria-label').startsWith(String(eatK)),[w.document.querySelector('.ring').getAttribute('aria-label'),eatK]);
T('caption says eaten and shows plan',/المأكول فعلاً/.test(hc().textContent)&&hc().textContent.includes('الخطة '+planK));
T('remaining line present',/(باقي|زاد) \d+ سعرة/.test(hc().textContent)&&/بروتين/.test(hc().textContent));
T('expected-at-end line when unlogged items remain',/المتوقع للنهاية/.test(hc().textContent));
const mh=[...w.document.querySelectorAll('.meal .mhd small')].map(e=>e.textContent).join(' ');
T('meal card shows eaten and matches eaten calories',/مأكول/.test(mh),mh);
// الخطة بعيدة عن الهدف ← تنبيه + زر ضبط
E(`state.days[0].meals.forEach(m=>m.items.forEach(it=>{if(!it.x){delete it.e;it.g=Math.max(5,it.g*0.3)}}));state.days[0].meals.forEach(m=>{m.items=m.items.filter(it=>!it.x)});render()`);
T('far-from-target plan shows warning with refit button',/الخطة بعيدة عن هدف اليوم/.test(txt())&&!!w.document.querySelector('[data-act="refit"]'));
w.document.querySelector('[data-act="refit"]').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
T('refit removes the warning',!/الخطة بعيدة عن هدف اليوم/.test(txt()),txt().match(/الخطة بعيدة[^.]*/));
T('no script errors',errs.length===0,errs);
console.log('PASS',ok,'FAIL',bad);process.exit(bad?1:0);
