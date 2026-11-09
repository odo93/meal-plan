// صنف غير معروف في التسجيل الصوتي: بحث أونلاين تلقائي ← أقرب نتيجة بماكروزها ← يُحفظ كصنف ويُعرف في المرة التالية (fetch مُحاكى)
const {JSDOM,VirtualConsole}=require('jsdom');
const html=require('./v2html')();
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x===undefined?'':JSON.stringify(x)))};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const OFFJ={products:[{code:'1',product_name:'Zarbouta pastry',brands:'X',nutriments:{'energy-kcal_100g':320,proteins_100g:6,carbohydrates_100g:45,fat_100g:12}}]};
const mk=mode=>{const d=new JSDOM(html,{runScripts:'dangerously',url:'https://odo93.github.io/meal-plan/v2/',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){
  w.fetch=async u=>{if(mode==='off'&&/openfoodfacts/.test(u))return{ok:true,status:200,json:async()=>OFFJ};return{ok:false,status:503,json:async()=>({})}}}});
  const w=d.window;w.eval("meta.mode='self';ui.day=0;render()");return w};
const click=(w,s)=>(typeof s==='string'?w.document.querySelector(s):s).dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
(async()=>{
  // 1) بحث ناجح
  let w=mk('off'),E=s=>w.eval(s),$=s=>w.document.querySelector(s);
  E("vOpen();ui.vm.txt='اكلت زربوطة 150 جرام';vRun();render()");
  T('pending entry created for unknown',E('ui.vm.pend.length')===1&&E('ui.vm.pend[0].g')===150&&E('ui.vm.pend[0].est')===false);
  T('shows searching state',/أبحث عنه/.test($('#modal').textContent));
  await sleep(80);
  T('top candidate added with macros',E('ui.vm.items.length')===1&&E('ui.vm.items[0].food.k')===320&&E('ui.vm.items[0].g')===150,E('JSON.stringify(ui.vm.items)'));
  T('name keeps the spoken word (so it is found next time)',E('ui.vm.items[0].food.n').includes('زربوطة'));
  T('review warning shown',/سيُحفظ في أصنافك/.test($('#modal').textContent));
  T('candidates listed',!!$('[data-act="vpick"]'));
  const nF=E('state.foods.length');
  click(w,'[data-act="vsave"]');
  T('food saved to foods with macros',E('state.foods.length')===nF+1&&E("state.foods.find(f=>f.n.includes('زربوطة')).k")===320&&E("state.foods.find(f=>f.n.includes('زربوطة')).src")==='off');
  T('logged as eaten',E("state.days[0].meals.flatMap(m=>m.items).some(i=>i.e===150)"));
  // المرة التالية: يُعرف من أصنافي بلا بحث
  const r=E("JSON.stringify(vParse('اكلت زربوطة'))");const j=JSON.parse(r);
  T('second time recognised from my foods',j.pend.length===0&&j.items.length===1&&j.items[0].own===true,j);
  // 2) فشل الاتصال ← إدخال يدوي
  w=mk('none');E=s=>w.eval(s);
  E("vOpen();ui.vm.txt='اكلت كنافة نابلسية';vRun();render()");await sleep(80);E('render()');
  T('failure note and manual form',/تعذّر|لا نتائج/.test(w.document.querySelector('#modal').textContent)&&!!w.document.querySelector('[data-vp="k"]'));
  const set=(v,val)=>{const el=w.document.querySelector(`[data-vp="${v}"]`);el.value=val;el.dispatchEvent(new w.Event('change',{bubbles:true}))};
  click(w,'[data-act="vmansave"]');
  T('manual save blocked without values',E('ui.vm.items.length')===0);
  set('k','400');set('p','8');set('c','50');set('f','18');
  click(w,'[data-act="vmansave"]');
  T('manual item added',E('ui.vm.items.length')===1&&E('ui.vm.items[0].food.k')===400&&E('ui.vm.items[0].food.src')==='manual');
  click(w,'[data-act="vsave"]');
  T('manual food saved',E("state.foods.some(f=>f.n.includes('كنافة')&&f.k===400)"));
  // 3) مع وجود أصناف معروفة بجانب المجهول
  w=mk('off');E=s=>w.eval(s);
  E("vOpen();ui.vm.txt='اكلت ارز و زربوطة';vRun();render()");await sleep(80);
  T('known and unknown together',E('ui.vm.items.length')===2);
  T('no script errors',errs.length===0,errs);
  console.log('PASS',ok,'FAIL',bad);process.exit(bad?1:0);
})();
