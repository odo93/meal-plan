// المجموعة ب: فشل الحفظ لا يمر بصمت، والتواريخ عبر Intl
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=require('./v2html')();
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x===undefined?'':x))};
const d=new JSDOM(html,{runScripts:'dangerously',url:'https://odo93.github.io/meal-plan/v2/#/today',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){w.fetch=async()=>({ok:false,status:404,text:async()=>''})}});
const w=d.window,$=s=>w.document.querySelector(s),E=s=>w.eval(s);
const click=s=>$(s).dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
E("meta.mode='self';render()");
T('no banner normally',!$('#app [data-act="retrysave"]'));
// simulate full storage
const st=w.Storage.prototype,orig=st.setItem;
st.setItem=function(){const e=new w.DOMException('full','QuotaExceededError');throw e};
const q=$('#app input[data-ch="qty"]');q.value='99';q.dispatchEvent(new w.Event('change',{bubbles:true}));
T('error flagged',!!E('storeErr')&&E('storeErr.quota')===true);
T('alert banner shown',!!$('#app .bnr.warn[role="alert"] [data-act="export"]')&&!!$('#app [data-act="retrysave"]'));
T('toast shown',/تعذّر الحفظ/.test($('#toast').textContent));
E("ui.tab='foods';render()");T('banner on other pages',!!$('#app [data-act="retrysave"]'));
click('#app [data-act="retrysave"]');T('retry still failing keeps banner',!!$('#app [data-act="retrysave"]')&&/ما زال/.test($('#toast').textContent));
st.setItem=orig;
click('#app [data-act="retrysave"]');
T('retry success clears banner',!E('storeErr')&&!$('#app [data-act="retrysave"]')&&/تم الحفظ/.test($('#toast').textContent));
T('data persisted after retry',JSON.stringify(E('state.days[ui.day]')).length>0&&w.localStorage.getItem(E('DK(meta.cur,ui.day)'))!==null);
// dates
T('dateLabel Arabic month, latin digits',E("dateLabel('2026-11-05')")==='5 نوفمبر 2026',E("dateLabel('2026-11-05')"));
T('week range compact',/^5\s*[–-]\s*11 نوفمبر 2026$/.test(E("rangeLabel('2026-11-05','2026-11-11')")),E("rangeLabel('2026-11-05','2026-11-11')"));
T('range across months',/نوفمبر.*ديسمبر 2026/.test(E("rangeLabel('2026-11-30','2026-12-06')")));
T('short date',E("dateShort('2026-03-09')")==='9 مارس');
console.log('PASS',ok,'FAIL',bad,errs);process.exit(0);
