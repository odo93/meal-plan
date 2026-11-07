// التسجيل بالصوت/الكتابة: المحلل (قواعد على الجهاز) + تدفق الواجهة (زر ← تحليل ← أسئلة ← تأكيد ← حفظ)
const {JSDOM,VirtualConsole}=require('jsdom');
const html=require('./v2html')();
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x===undefined?'':JSON.stringify(x)))};
const mk=()=>{const d=new JSDOM(html,{runScripts:'dangerously',url:'https://odo93.github.io/meal-plan/v2/',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){w.fetch=async()=>({ok:false,status:404,text:async()=>'',json:async()=>({})})}});
  const w=d.window;w.eval("meta.mode='self';ui.day=0;render()");return w};
const click=(w,el)=>el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
// [العبارة, [[جزء من اسم الصنف المتوقع, جرامات متوقعة أو null]...], أصناف غير معروفة متوقعة]
const TUNED=[
['فطرت فول وطعمية وعيش بلدي وشاي بسكر',[['فول',null],['فلافل',null],['عيش بلدي',90],['شاي',null]]],
['تغديت ارز وصدر دجاج وسلطة',[['أرز أبيض مطبوخ',null],['صدر دجاج',null],['سلطة',null]]],
['عشا 2 بيض وجبنة قريش وخبز توست',[['بيض',100],['قريش',100],['توست',28]]],
['سناك موزة وحفنة لوز',[['موز',null],['لوز',30]]],
['اكلت رغيفين عيش و3 بيض',[['عيش بلدي',180],['بيض',150]]],
['تغديت 200 جم صدر دجاج وكوب ارز',[['صدر دجاج',200],['أرز أبيض مطبوخ',160]]],
['فطار شوفان وحليب ومعلقة عسل',[['شوفان',null],['حليب',null],['عسل',21]]],
['فطرت نص رغيف عيش وجبنة وشاي بدون سكر',[['عيش بلدي',45],['جبن',null],['شاي',null]]],
['شربت قهوة بمعلقتين سكر',[['قهوه',null],['سكر',10]]],
['تغديت كبسة دجاج',[['أرز أبيض مطبوخ',250],['دجاج',150],['زيت',10]]],
['اكلت كشري',[['أرز',120],['مكرونة',80],['عدس',60],['حمص',30],['صلصة',50],['زيت',10]]],
['تغديت لحم مشوي 150 جم وبطاطس مقلية',[['لحم',150],['بطاطس مقلية',null]]],
];
// عبارات لم أضبط عليها المحلل (لقياس التعميم بصدق)؛ لا تُفرض عليها نسبة نجاح
const HOLD=[
['اكلت اتنين تفاح وكوباية لبن',[['تفاح',240],['لبن',240]]],
['فطرت خبز اسمر وزبادي وعسل',[['أسمر',null],['زبادي',null],['عسل',null]]],
['اكلت تلات حبات تمر',[['تمر',null]]],
['تغديت فراخ مشوية ورز وملوخية',[['دجاج',null],['أرز',null],['ملوخية',null]]],
['عشاء تونة وخيار وطماطم',[['تونة',null],['خيار',null],['طماطم',null]]],
['اكلت سمك مقلي وارز',[['سمك',null],['أرز',null]]],
['شربت عصير برتقال',[['عصير',null]]],
['تغديت مكرونة وصدر دجاج',[['مكرونة',null],['صدر دجاج',null]]],
['فطرت بيضتين وجبنة وخبز',[['بيض',100],['جبن',null],['خبز',null]]],
['اتعشيت زبادي وتفاحة وحفنة لوز',[['زبادي',null],['تفاح',null],['لوز',30]]],
['تغديت كفتة ورز',[['كفتة',null],['أرز',null]]],
['اكلت بيتزا',[['بيتزا',null]]],
];
// مجموعة تعميم ثانية: أطباق مصرية وسعودية شائعة، كُتبت وقيست قبل إضافة أصنافها إلى المحلل
const HOLD2=[
['تغديت كفتة مشوية ورز وسلطة',[['كفتة',null],['أرز',null],['سلطة',null]]],
['اكلت حواوشي',[['حواوشي',null]]],
['تغديت ملوخية وفراخ ورز',[['ملوخية مطبوخة',null],['دجاج',null],['أرز',null]]],
['تغديت مندي دجاج',[['أرز',null],['دجاج',null]]],
['فطرت مطبق',[['مطبق',null]]],
['تغديت فتة',[['أرز',null],['عيش',null],['لحم',null]]],
['اكلت 2 شريحة بيتزا',[['بيتزا',214]]],
['اكلت شاورما فراخ',[['شاورما',null]]],
['فطرت عيش وجبنة بيضاء ولبنة',[['عيش',null],['جبنة',null],['لبنة',null]]],
['تعشيت مكرونة بشاميل',[['بشاميل',null]]],
['اكلت محشي ورق عنب',[['محشي',null]]],
['شربت شاي وبسبوسة',[['شاي',null],['بسبوسة',null]]],
['تغديت سمبوسة وجريش',[['سمبوسة',null],['جريش',null]]],
['اكلت 5 لقيمات',[['لقيمات',75]]],
['تغديت برجر وبطاطس محمرة',[['برجر',null],['بطاطس مقلية',null]]],
['تعشيت مسقعة وعيش',[['مسقعة',null],['عيش',null]]],
];

// مجموعة ثالثة كُتبت بعد التحسين ولم يُضبط عليها المحلل (القياس الصادق للتعميم)
const HOLD3=[
['فطرت عيش شامي وحمص وزيتون',[['عربي',null],['حمص',null],['زيتون',null]]],
['تغديت سمك بلطي مشوي ورز بسمتي',[['بلطي',null],['بسمتي',null]]],
['اتعشيت تلات صوابع كفتة وسلطة خضرا',[['كفتة',120],['سلطة',null]]],
['شربت كوباية حليب بالشوكولاتة',[['حليب',null]]],
['اكلت ربع بطيخة',[['بطيخ',null]]],
['فطرت شوفان بالموز والعسل',[['شوفان',null],['موز',null],['عسل',null]]],
['تغديت كبدة وعيش بلدي',[['كبدة',null],['عيش بلدي',null]]],
['اكلت حتة بسبوسة وشاي',[['بسبوسة',null],['شاي',null]]],
['تعشيت جبنة رومي وخيار',[['جبن',null],['خيار',null]]],
['سناك تمرتين ولبن',[['تمر',48],['لبن',null]]],
['تغديت مقلوبة',[['أرز',null]]],
['فطرت فول بالطحينة وبيضة مسلوقة',[['فول',null],['طحينة',null],['بيض مسلوق',50]]],
];
const score=(w,set)=>{let exp=0,hit=0,gOK=0,gN=0;const AR=w.eval('AR');for(const [p,E] of set){const r=w.eval('vParse')(p);for(const [nm,g] of E){exp++;const it=r.items.find(i=>AR(i.name).includes(AR(nm)));if(!it)console.log('  miss:',p,'→',nm);if(it){hit++;if(g!=null){gN++;if(Math.abs(it.g-g)<=Math.max(5,g*0.1))gOK++}}}}return{exp,hit,gOK,gN}};
const parse=(w,p)=>w.eval('vParse')(p);
(async()=>{
 const w=mk(),$=s=>w.document.querySelector(s);
 const a=score(w,TUNED),b=score(w,HOLD);
 console.log(`tuned set: items ${a.hit}/${a.exp}, grams ${a.gOK}/${a.gN}`);
 console.log(`holdout set: items ${b.hit}/${b.exp} (${Math.round(b.hit/b.exp*100)}%), grams ${b.gOK}/${b.gN}`);
 const c=score(w,HOLD2);const e=score(w,HOLD3);console.log(`holdout-3 (written after tuning): items ${e.hit}/${e.exp} (${Math.round(e.hit/e.exp*100)}%), grams ${e.gOK}/${e.gN}`);console.log(`holdout-2 (Egyptian/Saudi dishes): items ${c.hit}/${c.exp} (${Math.round(c.hit/c.exp*100)}%), grams ${c.gOK}/${c.gN}`);
 T('tuned recall 100%',a.hit===a.exp,a);T('tuned grams',a.gOK===a.gN,a);
 let t0=Date.now();for(let i=0;i<200;i++)parse(w,'فطرت فول وطعمية وعيش بلدي وشاي بسكر');const per=(Date.now()-t0)/200;T('parse < 20ms',per<20,per);console.log('avg parse ms',per.toFixed(2));
 T('max 2 questions',TUNED.every(([p])=>parse(w,p).qs.length<=2));
 T('no oil q when fried CAT food',!parse(w,'اكلت بطاطس مقلية').qs.some(q=>q.k==='oil'));
 T('unknown reported',parse(w,'اكلت زربوطة').unknown.length===1);
 T('sugar q',parse(w,'شربت شاي بسكر').qs.some(q=>q.k==='sugar'));
 T('no sugar q for plain',!parse(w,'شربت شاي بدون سكر').qs.some(q=>q.k==='sugar'));
 T('meal hint',parse(w,'تغديت ارز').meal===1&&parse(w,'فطرت فول').meal===0);
 T('date piece weight',parse(w,'اكلت تلات حبات تمر').items[0].g<=60);
 T('fried warning',parse(w,'اكلت سمك مقلي').items[0].warn.length>0);
 // الواجهة
 T('voice button on day screen',!!$('[data-act="voice"]'));
 click(w,$('[data-act="voice"]'));
 const sh=$('#modal .sheet');
 T('dialog semantics',sh&&sh.getAttribute('role')==='dialog'&&sh.getAttribute('aria-modal')==='true'&&!!sh.querySelector('h2'));
 T('textarea labelled',!!$('label[for="v_txt"]')&&!!$('#v_txt'));
 click(w,$('[data-act="vex"][data-v="تغديت ارز وصدر دجاج وسلطة"]'));T('example fills text',$('#v_txt').value==='تغديت ارز وصدر دجاج وسلطة');
 $('#v_txt').value='تغديت كبسة دجاج';$('#v_txt').dispatchEvent(new w.Event('input',{bubbles:true}));
 click(w,$('[data-act="vgo"]'));T('asks dish size',$('#modal').textContent.includes('حجم طبق'),$('#modal').textContent.slice(0,100));
 click(w,$('[data-act="vans"][data-v="1.4"]'));
 T('result stage',$('#modal').textContent.includes('تأكيد الوجبة'));
 T('meal defaults to lunch (hint)',w.eval("d=state.days[ui.day];d.meals[ui.vm.meal].slot")==='l');
 T('scaled x1.4',w.eval("ui.vm.items[0].g")===350,w.eval("ui.vm.items.map(i=>i.g)"));
 const inp=$('input[data-vi="0"]');T('grams input labelled',!!inp.getAttribute('aria-label'));
 inp.value='300';inp.dispatchEvent(new w.Event('change',{bubbles:true}));
 T('edit grams',w.eval("ui.vm.items[0].g")===300&&w.eval("ui.vm.items[0].est")===false);
 const mi=w.eval("ui.vm.meal"),n0=w.eval(`state.days[ui.day].meals[${mi}].items.length`);
 click(w,$('[data-act="vsave"]'));
 T('saved 3 items',w.eval(`state.days[ui.day].meals[${mi}].items.length`)===n0+3,w.eval(`state.days[ui.day].meals[${mi}].items.length`));
 const last=w.eval(`state.days[ui.day].meals[${mi}].items.slice(-3)`);
 T('saved as eaten extras',last.every(i=>i.x&&i.e>0),last);
 T('foods stored per 100g',w.eval("state.foods.some(f=>f.n==='أرز أبيض مطبوخ'&&f.k===130)"));
 T('modal closed',!$('#modal').classList.contains('on'));
 // صنف من الخطة يُعلَّم مأكولاً بدل التكرار
 const w2=mk(),$2=s=>w2.document.querySelector(s);
 const pl=w2.eval("(()=>{const d=state.days[0];for(let mi=0;mi<d.meals.length;mi++){const it=d.meals[mi].items.find(x=>/دجاج/.test(F(x.f).n));if(it)return {mi,f:it.f,name:F(it.f).n}}return null})()");
 if(pl){click(w2,$2('[data-act="voice"]'));$2('#v_txt').value='تغديت 180 جم '+pl.name;click(w2,$2('[data-act="vgo"]'));
  if(w2.eval("ui.vm.stage")==='ask')w2.eval("ui.vm.stage='res'");
  w2.eval("ui.vm.meal="+pl.mi);const c0=w2.eval(`state.days[0].meals[${pl.mi}].items.length`);click(w2,$2('[data-act="vsave"]'));
  T('plan item marked eaten, no duplicate',w2.eval(`state.days[0].meals[${pl.mi}].items.length`)===c0&&w2.eval(`state.days[0].meals[${pl.mi}].items.find(x=>x.f==='${pl.f}').e`)===180)}
 else T('plan has chicken item',false);
 // مفتاح الميزة من الإدارة
 const w3=mk();w3.eval("lsSet('mp3_acct',{features:{voice:false}});render()");
 T('feature off hides button',!w3.document.querySelector('[data-act="voice"]'));
 console.log('PASS',ok,'FAIL',bad,errs);process.exit(0)})();
