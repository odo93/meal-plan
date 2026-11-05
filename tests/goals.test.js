// «أهدافي» و«متقدم»: النتيجة أولاً والأقسام مطوية، والاستعادة في منطقة الخطر
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=require('./v2html')();
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x===undefined?'':x))};
const d=new JSDOM(html,{runScripts:'dangerously',url:'https://odo93.github.io/meal-plan/v2/#/me/goals',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){w.fetch=async()=>({ok:false,status:404,text:async()=>''})}});
const w=d.window,$=s=>w.document.querySelector(s),$$=s=>[...w.document.querySelectorAll(s)],E=s=>w.eval(s);
const click=s=>(typeof s==='string'?$(s):s).dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
E("meta.mode='self';render()");
T('goals page',E('ui.sub')==='goals'&&$$('#app [data-act="goal"]').length>=5);
click('[data-act="goal"][data-v="cut"]');
T('result first',/سعرة يومياً في المتوسط/.test($('#app .card').textContent)&&!!$('#app .card .ring'));
T('day tiles',$$('#app .card .tile').length>=4);
const folds=$$('#app details.fold');
T('sections folded',folds.length>=4&&folds.every(f=>!f.open));
T('fold summaries show current values',/بروتين .* جم\/كجم/.test(folds[0].querySelector('summary').textContent));
T('inputs still wired',!!$('#app [data-ch="gp"][data-k="pr"]')&&!!$('#app [data-ch="sset"][data-k="eq"]')&&!!$('#app [data-ch="cyc"][data-k="on"]')&&!!$('#app [data-ch="by"]'));
const pr=$('#app [data-ch="gp"][data-k="pr"]');pr.value='2.6';pr.dispatchEvent(new w.Event('change',{bubbles:true}));
T('protein change applies',E('S().g.cut.pr')===2.6);
T('refit button',!!$('#app .btn.pri[data-act="refitweek"]')&&!$('#app [data-act="rebuildweek"]'));
click('[data-act="goal"][data-v="manual"]');
T('manual goal shows multipliers open',$$('#app details.fold')[0].open&&!!$('#app [data-ch="set"][data-k="pM"]'));
// advanced
click('[data-act="back"]');click('[data-v="me/advanced"]');
T('goals list',$$('#app [data-ch="gln"][data-k="name"]').length===E('S().goals.length'));
T('equations folded with BMR',$$('#app details.fold').length===E('S().eqs.length')&&/BMR لبياناتك/.test($('#app details.fold summary').textContent));
T('resets in danger zone',!!$('#app .li.dz[data-act="glreset"]')&&!!$('#app .li.dz[data-act="eqreset"]'));
console.log('PASS',ok,'FAIL',bad,errs);process.exit(0);
