const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(__dirname+'/../v2/index.html','utf8');
const OCR=fs.readFileSync(__dirname+'/fixtures/label-ocr.txt','utf8');
const errs=[],urls=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x===undefined?'':x))};
const R=j=>({ok:true,status:200,text:async()=>JSON.stringify(j),json:async()=>j});
const USDA={foods:[{fdcId:171477,description:'Chicken, broilers or fryers, breast, meat only, cooked, roasted',foodNutrients:[{nutrientNumber:'203',unitName:'G',value:31.02},{nutrientNumber:'204',unitName:'G',value:3.57},{nutrientNumber:'205',unitName:'G',value:0},{nutrientNumber:'208',unitName:'KCAL',value:165}]},{fdcId:1,description:'no nutrients',foodNutrients:[]}]};
const OFFS={products:[{code:'123',product_name:'Oat Cookies',brands:'Acme,Other',nutriments:{'energy-kcal_100g':452,proteins_100g:7.4,carbohydrates_100g:62,fat_100g:18.5},serving_quantity:'30'},{code:'9',product_name:'',nutriments:{}}]};
const OFFP={status:1,product:{code:'6281000000000',product_name:'بسكويت اختبار',brands:'X',nutriments:{'energy-kcal_100g':480,proteins_100g:6,carbohydrates_100g:70,fat_100g:20},serving_quantity:25}};
const mk=(seed,fail)=>new JSDOM(html,{runScripts:'dangerously',url:'https://odo93.github.io/meal-plan/v2/',virtualConsole:vc,pretendToBeVisual:true,beforeParse(win){
 if(seed)for(const k in seed)win.localStorage.setItem(k,seed[k]);
 win.fetch=async(u)=>{urls.push(u);if(fail)throw new Error('offline');
  if(u.includes('api.nal.usda.gov'))return R(USDA);
  if(u.includes('/api/v2/product/'))return R(OFFP);
  if(u.includes('openfoodfacts'))return R(OFFS);
  return R({})}}});
const click=(w,el)=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
const typ=(w,el,v)=>{el.value=v;el.dispatchEvent(new w.Event('input',{bubbles:true}))};
(async()=>{
 // 1) import from v1 (non destructive)
 let d=mk({mealplan_v2_meta:JSON.stringify({users:[{id:'u1',name:'قديم'}],cur:'u1'}),mealplan_v2_u_u1:'{"x":1}'});let w=d.window;
 T('v1 key untouched',w.localStorage.getItem('mealplan_v2_u_u1')==='{"x":1}');
 T('copied to mp3',w.localStorage.getItem('mp3_u_u1')==='{"x":1}'&&!!w.localStorage.getItem('mp3_meta'),Object.keys(w.localStorage).join());
 T('imported flag',/^v1:/.test(w.localStorage.getItem('mp3_imported')||''));
 // 2) fresh
 d=mk();w=d.window;const $=s=>w.document.querySelector(s);await sleep(100);
 T('catalog size',w.eval('CAT.length')>130);
 T('arabic regex ok',w.eval("/[؀-ۿ]/.test('دجاج')"));
 T('toEn chicken breast',w.eval("toEn('صدر دجاج')")==='breast chicken',w.eval("toEn('صدر دجاج')"));
 T('toEn fallback catalog',w.eval("toEn('كاجو')")==='cashew',w.eval("toEn('كاجو')"));
 const s1=w.eval("catSearch('صدر دجاج').map(c=>c.n)");T('catSearch صدر دجاج',s1.some(n=>n==='صدر دجاج نيء')&&s1.length>=3,s1);
 T('catSearch alias فراخ',w.eval("catSearch('فراخ').length")>3);
 T('catSearch hamza',w.eval("catSearch('ارز').some(c=>c.n.includes('أرز'))"));
 T('dedupe existing',!w.eval("catSearch('عدس').some(c=>c.n==='عدس مطبوخ')"));
 // 3) add modal
 click(w,$('[data-act="add"][data-m="0"]'));T('add modal',!!$('#q'));
 typ(w,$('#q'),'صدر دجاج');
 T('list has أصنافي + ready',$('#addList').textContent.includes('أصنافي')&&$('#addList').textContent.includes('قاعدة جاهزة')&&$('#addList').textContent.includes('صدر دجاج نيء'));
 const idx=w.eval("ui.cands.findIndex(c=>c.n==='صدر دجاج نيء')");
 const before=w.eval('state.days[ui.day].meals[0].items.length');
 click(w,$(`#addList [data-act="pickc"][data-ci="${idx}"]`));
 T('item added',w.eval('state.days[ui.day].meals[0].items.length')===before+1);
 const it=w.eval('state.days[ui.day].meals[0].items.slice(-1)[0]');
 const fd=w.eval(`state.foods.find(f=>f.id==='${it.f}')`);
 T('food saved per100',fd.k===120&&fd.p===22.5&&fd.src==='cat',fd);
 // grams recalc
 const inp=[...w.document.querySelectorAll('input[data-ch="qty"][data-m="0"]')].pop();
 inp.value='200';inp.dispatchEvent(new w.Event('change',{bubbles:true}));
 const it2=w.eval('state.days[ui.day].meals[0].items.slice(-1)[0]');
 T('200g -> 240kcal',w.eval(`Math.round(mac(state.days[ui.day].meals[0].items.slice(-1)[0]).k)`)===240,it2);
 // 4) online
 click(w,$('[data-act="add"][data-m="1"]'));typ(w,$('#q'),'صدر دجاج');
 click(w,$('#addList [data-act="online"]'));await sleep(60);
 T('usda url',urls.some(u=>u.includes('api.nal.usda.gov/fdc/v1/foods/search')&&u.includes('api_key=DEMO_KEY')&&u.includes('query=breast%20chicken')&&u.includes('Foundation')),urls);
 T('off url',urls.some(u=>u.includes('openfoodfacts.org/cgi/search.pl')&&u.includes('search_terms=')));
 const txt=$('#addList').textContent;
 T('usda row',txt.includes('USDA')&&txt.includes('165 kcal'),txt.slice(0,300));
 T('off row',txt.includes('Oat Cookies — Acme'));
 T('empty usda skipped',!txt.includes('no nutrients'));
 const ui2=w.eval("ui.cands.findIndex(c=>c.src==='usda')"),oi=w.eval("ui.cands.findIndex(c=>c.src==='off')");
 T('usda name arabic prefix',w.eval(`ui.cands[${ui2}].n`).startsWith('صدر دجاج — Chicken'),w.eval(`ui.cands[${ui2}].n`));
 T('usda grp pro',w.eval(`ui.cands[${ui2}].grp`)==='pro');
 T('off serving',w.eval(`ui.cands[${oi}].u`)==='حصة'&&w.eval(`ui.cands[${oi}].ug`)===30);
 click(w,$(`#addList [data-act="pickc"][data-ci="${oi}"]`));
 const it3=w.eval('state.days[ui.day].meals[1].items.slice(-1)[0]');
 T('off item uses unit grams',it3.g===30,it3);
 // 5) foods tab search
 click(w,$('[data-act="tab"][data-v="foods"]'));typ(w,$('#fq'),'كاجو');
 T('foods tab cat',$('#foodList').textContent.includes('كاجو'));
 const ci=w.eval("ui.cands.findIndex(c=>c.n==='كاجو')");click(w,$(`#foodList [data-act="addc"][data-ci="${ci}"]`));
 T('addc adds food',w.eval("state.foods.some(f=>f.n==='كاجو'&&f.k===553)"));
 click(w,$('#foodList [data-act="online"]'));await sleep(60);T('foods tab online shows',$('#foodList').textContent.includes('Open Food Facts')||$('#foodList').textContent.includes('USDA'));
 // 6) usda key
 w.eval("ui.tab='me';ui.sub='data';render()");typ(w,$('#usda_key'),'MYKEY123');w.eval("ui.tab='foods';ui.sub='';render()");T('key saved',JSON.parse(w.localStorage.getItem('mp3_src')).usda==='MYKEY123');
 urls.length=0;click(w,$('#foodList [data-act="online"]'));await sleep(60);T('custom key used',urls.some(u=>u.includes('api_key=MYKEY123')),urls);
 // 7) scan via OCR
 w.Tesseract={createWorker:async()=>({setParameters:async()=>{},recognize:async()=>({data:{text:OCR}}),terminate:async()=>{}})};
 click(w,$('[data-act="tab"][data-v="day"]'));click(w,$('[data-act="add"][data-m="2"]'));
 const m2=w.eval('state.days[ui.day].meals[2].items.length');
 await w.startScan(new w.Blob(['x']),2);
 T('scan card shown',!!$('#sc_k')&&$('#modal').textContent.includes('حفظ كصنف'),$('#modal').textContent.slice(0,200));
 T('values per serving? basis 100g',w.eval('ui.scan.d.b')==='g'&&+$('#sc_k').value===452&&+$('#sc_p').value===7.4&&+$('#sc_c').value===62&&+$('#sc_f').value===18.5,w.eval('JSON.stringify(ui.scan.d)'));
 click(w,$('[data-act="scansaveadd"]'));T('needs name',!!$('#sc_n')&&w.eval('state.foods.every(f=>f.src!=="label")'));
 typ(w,$('#sc_n'),'بسكويت شوفان');
 click(w,$('[data-act="scansaveadd"]'));
 const lf=w.eval('state.foods.find(f=>f.src==="label")');
 T('label food saved',lf&&lf.n==='بسكويت شوفان'&&lf.k===452,lf);
 T('added to meal 2',w.eval('state.days[ui.day].meals[2].items.length')===m2+1);
 T('modal closed',!$('#sc_k'));
 // 8) per serving
 await w.startScan(new w.Blob(['x']),null);
 click(w,$('[data-act="scanb"][data-v="u"]'));typ(w,$('#sc_k'),'136');typ(w,$('#sc_p'),'2.2');typ(w,$('#sc_c'),'18.6');typ(w,$('#sc_f'),'5.6');typ(w,$('#sc_n'),'قطعة تجربة');typ(w,$('#sc_u'),'قطعة');typ(w,$('#sc_ug'),'30');
 click(w,$('[data-act="scansave"]'));
 const pf=w.eval('state.foods.find(f=>f.n==="قطعة تجربة")');
 T('per-serving converted to 100g',pf&&Math.abs(pf.k-453.33)<0.1&&pf.u==='قطعة'&&pf.ug===30,pf);
 // 9) barcode path
 w.BarcodeDetector=class{constructor(){}async detect(){return[{rawValue:'6281000000000'}]}};w.createImageBitmap=async()=>({width:100,height:100});
 urls.length=0;await w.startScan(new w.Blob(['x']),null);
 T('barcode off lookup',urls.some(u=>u.includes('/api/v2/product/6281000000000')),urls);
 T('barcode prefilled',$('#sc_n').value.includes('بسكويت اختبار')&&+$('#sc_k').value===480);
 click(w,$('[data-act="scansave"]'));T('barcode food saved src off',w.eval('state.foods.some(f=>f.src==="off"&&f.k===480&&f.ug===25)'));
 // 10) offline failure messaging
 d=mk(null,true);w=d.window;const $b=s=>w.document.querySelector(s);await sleep(80);
 click(w,$b('[data-act="add"][data-m="0"]'));typ(w,$b('#q'),'ارز');click(w,$b('#addList [data-act="online"]'));await sleep(60);
 T('offline note',$b('#addList').textContent.includes('تعذّر الاتصال'));
 console.log('PASS',ok,'FAIL',bad,errs);process.exit(0)})();
