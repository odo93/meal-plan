// إمكانية الوصول: النوافذ (Esc، aria-modal، inert، التركيز)، أزرار بدل div، عناوين الحقول، رابط التخطي
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(__dirname+'/../v2/index.html','utf8');
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x===undefined?'':x))};
const d=new JSDOM(html,{runScripts:'dangerously',url:'https://odo93.github.io/meal-plan/v2/#/today',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){w.fetch=async()=>({ok:false,status:404,text:async()=>''})}});
const w=d.window,doc=w.document,$=s=>doc.querySelector(s),$$=s=>[...doc.querySelectorAll(s)],E=s=>w.eval(s);
const click=s=>(typeof s==='string'?$(s):s).dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
const key=k=>doc.dispatchEvent(new w.KeyboardEvent('keydown',{key:k,bubbles:true}));
E("meta.mode='self';render()");

// skip link
T('skip link first',doc.body.firstElementChild.classList.contains('skip')&&doc.body.firstElementChild.tagName==='BUTTON');
click('.skip');T('skip focuses main',doc.activeElement===$('#app'));

// dialog semantics + focus in/out + Esc
const opener=$('#app [data-act="dayopts"]');opener.focus();click(opener);
const sh=$('#modal .sheet');
T('dialog role + aria-modal',sh&&sh.getAttribute('role')==='dialog'&&sh.getAttribute('aria-modal')==='true');
T('dialog named',!!(sh.getAttribute('aria-label')||sh.getAttribute('aria-labelledby')));
T('background inert',['top','app','nav'].every(id=>$('#'+id).hasAttribute('inert')));
T('focus moved into dialog',sh.contains(doc.activeElement));
T('sheet title is h2',!!sh.querySelector('h2')&&!sh.querySelector('h3'));
key('Escape');
T('Esc closes',!$('#modal').classList.contains('on')&&E('modal')===null);
T('background restored',['top','app','nav'].every(id=>!$('#'+id).hasAttribute('inert')));
T('focus returns to opener',doc.activeElement&&doc.activeElement.dataset.act==='dayopts',doc.activeElement&&doc.activeElement.outerHTML.slice(0,80));

// backdrop click still closes
click('#app [data-act="dayopts"]');$('#modal').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
T('backdrop closes',E('modal')===null);

// focus kept on an input after a change re-renders the page
const q=$('#app input[data-ch="qty"]');
if(q){q.focus();q.value='77';q.dispatchEvent(new w.Event('change',{bubbles:true}));
  const a=doc.activeElement;T('focus kept after change',a&&a.dataset.ch==='qty'&&a.dataset.m===q.dataset.m&&a.dataset.i===q.dataset.i)}
else T('qty input exists',false);

// clickable rows are buttons (add-item list)
E("modal={type:'add',m:0};render()");const inp=$('#q');inp.value='';inp.dispatchEvent(new w.Event('input',{bubbles:true}));
T('no clickable divs',$$('div[data-act],span[data-act]').length===0,$$('div[data-act],span[data-act]').map(e=>e.dataset.act).join());
T('add list rows are buttons',$$('#addList [data-act="pick"]').length>0&&$$('#addList [data-act="pick"]').every(e=>e.tagName==='BUTTON'));
key('Escape');

// new-food form has visible labels
E("ui.tab='foods';ui.nfOpen=true;render()");
const ids=['nf_n','nf_g','nf_b','nf_k','nf_p','nf_c','nf_f','nf_u','nf_ug'];
T('new-food fields labelled',ids.every(id=>{const e=$('#'+id);return e&&e.closest('label')&&e.closest('label').textContent.trim().length>1}),ids.filter(id=>!($('#'+id)&&$('#'+id).closest('label'))).join());

// every text control has an accessible name
const unnamed=$$('#app input:not([type=hidden]):not([type=file]),#app select,#app textarea').filter(e=>!e.closest('label')&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby'));
T('foods controls named',unnamed.length===0,unnamed.map(e=>e.id||e.outerHTML.slice(0,60)).join(' | '));
E("ui.tab='me';ui.sub='data';render()");
const un2=$$('#app input:not([type=hidden]):not([type=file]),#app select,#app textarea').filter(e=>!e.closest('label')&&!e.getAttribute('aria-label'));
T('data page controls named',un2.length===0,un2.map(e=>e.id||e.outerHTML.slice(0,60)).join(' | '));

console.log('PASS',ok,'FAIL',bad,errs);process.exit(0);
