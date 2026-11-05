// المجموعة ج: التحديث الجزئي يحفظ العناصر والتركيز والأقسام المفتوحة داخل الصفحة نفسها
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=require('./v2html')();
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x===undefined?'':x))};
const d=new JSDOM(html,{runScripts:'dangerously',url:'https://odo93.github.io/meal-plan/v2/#/today',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){w.fetch=async()=>({ok:false,status:404,text:async()=>''})}});
const w=d.window,doc=w.document,$=s=>doc.querySelector(s),$$=s=>[...doc.querySelectorAll(s)],E=s=>w.eval(s);
const click=s=>(typeof s==='string'?$(s):s).dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
const chg=(el,v)=>{el.value=v;el.dispatchEvent(new w.Event('change',{bubbles:true}))};
E("meta.mode='self';render()");

// unit: patch()
const box=doc.createElement('div');box.id='tbox';doc.body.appendChild(box);
const P=(h,fresh)=>E(`patch(document.getElementById('tbox'),${JSON.stringify(h)},${!!fresh})`);
P('<p id=a>1</p><input value=x><details><summary>s</summary>z</details>',true);
const pa=box.querySelector('#a'),inp=box.querySelector('input'),det=box.querySelector('details');det.open=true;inp.value='typed';
P('<p id=a>2</p><input value=y><details><summary>s2</summary>z</details>');
T('node kept, text updated',box.querySelector('#a')===pa&&pa.textContent==='2');
T('input value synced from state',box.querySelector('input')===inp&&inp.value==='y');
T('user-opened fold stays open',box.querySelector('details')===det&&det.open);
P('<details open><summary>s</summary></details>',true);const d2=box.querySelector('details');
P('<details><summary>s</summary></details>');T('code-opened fold closes when code stops asking',box.querySelector('details')===d2&&!d2.open);
P('<b>x</b><i>y</i>');T('extra nodes removed, new appended',box.innerHTML==='<b>x</b><i>y</i>');
P('<input type=checkbox checked>');const cb=box.querySelector('input');P('<input type=checkbox>');T('checkbox synced',box.querySelector('input')===cb&&!cb.checked);
P('<input id=pw type=password>',true);const pw=box.querySelector('#pw');pw.value='secret';P('<input id=pw type=password>');
T('typed field without value attr survives re-render',box.querySelector('#pw')===pw&&pw.value==='secret');
P('',true);

// Today: qty change keeps the same row nodes and the day strip
const strip=$('#app .days'),q=$('#app input[data-ch="qty"]'),m=q.dataset.m,i=q.dataset.i;
q.focus();chg(q,'123');
T('day strip node preserved',$('#app .days')===strip);
T('qty input node preserved & focused',$(`#app input[data-ch="qty"][data-m="${m}"][data-i="${i}"]`)===q&&doc.activeElement===q);
T('state updated',Math.round(E(`qtyOf(state.days[ui.day].meals[${m}].items[${i}])`))===123);

// Goals: a fold opened by the user survives a change made inside it
E("ui.tab='me';ui.sub='goals';render()");click('[data-act="goal"][data-v="cut"]');
const f0=$$('#app details.fold')[0];f0.open=true;
const pr=$('#app [data-ch="gp"][data-k="pr"]');chg(pr,'2.4');
T('fold stays open after edit inside it',$$('#app details.fold')[0]===f0&&f0.open);
T('fold summary updated',/2\.4/.test(f0.querySelector('summary').textContent));

// page change replaces content (fresh page)
click('[data-act="tab"][data-v="week"]');click('[data-act="tab"][data-v="me"]');click('[data-v="me/goals"]');
T('fresh page after navigation',$$('#app details.fold')[0]!==f0&&!$$('#app details.fold')[0].open);
console.log('PASS',ok,'FAIL',bad,errs);process.exit(0);
