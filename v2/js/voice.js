// ---------- تسجيل الأكل بالصوت/النص (نموذج أولي: محلل بقواعد على الجهاز، بلا نموذج ذكاء اصطناعي) ----------
const V_NUM={'واحد':1,'واحده':1,'اتنين':2,'اثنين':2,'اثنان':2,'تلاته':3,'ثلاثه':3,'ثلاث':3,'تلات':3,'اربعه':4,'اربع':4,'خمسه':5,'خمس':5,'سته':6,'ست':6,'سبعه':7,'سبع':7,'تمانيه':8,'ثمانيه':8,'تسعه':9,'عشره':10,'نص':0.5,'نصف':0.5,'ربع':0.25,'تلت':0.33,'ثلث':0.33};
const V_UNIT={'رغيف':'cnt','ارغفه':'cnt','حبه':'cnt','حبات':'cnt','حبتين':'cnt','قطعه':'cnt','قطع':'cnt','قرص':'cnt','اقراص':'cnt','شريحه':'slice','شرايح':'slice','شرائح':'slice','سكوب':'cnt','علبه':'cnt','حفنه':'hand','كوب':'cup','اكواب':'cup','كوباية':'cup','كباية':'cup','كبايه':'cup','كوبايه':'cup','كاسه':'plate','طبق':'plate','اطباق':'plate','معلقه':'spoon','معالق':'spoon','ملعقه':'spoon','ملاعق':'spoon','جم':'gram','جرام':'gram','غرام':'gram','غ':'gram','جرامات':'gram'};
const V_DUAL={'رغيفين':['رغيف',2],'كوبين':['كوب',2],'معلقتين':['معلقه',2],'ملعقتين':['ملعقه',2],'قطعتين':['قطعه',2],'شريحتين':['شريحه',2],'طبقين':['طبق',2],'سكوبين':['سكوب',2],'حبتين':['حبه',2]};
const V_SKIP=new Set(['من','في','بتاع','بتاعه','شويه','حوالي','تقريبا','اكلت','كلت','فطرت','فطرنا','تغديت','اتغديت','تعشيت','اتعشيت','شربت','فطار','غدا','غداء','عشا','عشاء','سناك','وجبه','مع','على','عليه','معاه','بعدين','ثم','كمان','يعني','انا','النهارده','الصبح','امبارح']);
const V_MEAL={'فطرت':0,'فطرنا':0,'فطار':0,'تغديت':1,'اتغديت':1,'غدا':1,'غداء':1,'سناك':2,'تعشيت':3,'اتعشيت':3,'عشا':3,'عشاء':3};
const V_ZERO=['شاي','قهوه','نسكافيه','ماء','مياه','مايه','ميه','نعناع','ينسون','قرفه'];
const V_DEFG={pro:120,dairy:150,carb:150,fruit:120,fat:10,veg:100};
const V_PIECE={fruit:120,pro:100,carb:100,dairy:100,veg:100,fat:10};
const vNm=f=>AR(f.n||'');
const V_PIECEN=[[/تمر/,12],[/زيتون/,4],[/لوز|كاجو|فستق/,1.2],[/فراوله/,15],[/عنب/,5]];
const V_DEFCNT=[[/فلافل|طعميه/,4],[/تمر/,3],[/لقيمات/,5],[/محشي/,6],[/سمبوس/,3],[/كفت/,3]];
const V_DEFN=[[/قريش/,100],[/جبن/,40],[/زبد/,10],[/حليب/,200],[/لبن|زبادي/,170],[/لوز|كاجو|فستق|عين جمل|سوداني/,25],[/خيار|طماطم|خس|جرجير/,100],[/عسل|مربى|سكر/,15]];
// أطباق مركّبة تُفكَّك إلى مكوّنات من القاعدة (تقدير)
const V_DISH=[[/كبسه|مندي|مظبي|برياني/,'كبسة / مندي',[['ارز مطبوخ',250],['صدر دجاج بالجلد مشوي',150],['زيت نباتي',10]]],[/(^|\s)فته(\s|$)/,'فتة',[['ارز ابيض مطبوخ',150],['عيش بلدي',60],['لحم ضان مطبوخ',120],['سمن',10],['صلصه طماطم',40]]],[/كشري/,'كشري',[['ارز مطبوخ',120],['مكرونه مطبوخه',80],['عدس مطبوخ',60],['حمص مطبوخ',30],['صلصه طماطم',50],['زيت نباتي',10]]]];
const V_WAW=/^(ورق|وسط|ورك|وراك|وافل|وينجز|ونجز|وايت)$/; // كلمات تبدأ بالواو أصلاً فلا تُفصل
let vRec=null;

function vNorm(s){
  return AR(String(s||'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/بيضتين/g,' 2 بيض ').replace(/بيضه/g,' 1 بيض ')
    .replace(/(مشوي|مقلي|مسلوق|مطبوخ|محمر|مسبك|مدخن|مشكل)ه(?=\s|$)/g,'$1')
    .replace(/(\d)\s*(جم|جرام|غرام|غ)\b/g,'$1 جم')
    .replace(/[،,؛;\n\.]+/g,' | ').replace(/\s+/g,' ').trim();
}
function vCooked(ph,r){
  if(!r||!r.own||!/نيء|نيئه/.test(vNm(r.food))||/نيء|نيئ|خام/.test(ph))return r;
  const c=catSearch(ph+' مطبوخ','',true).filter(x=>/مطبوخ/.test(AR(x.n)));
  return c.length?{food:c[0],own:false}:r;
}
const vRawLast=(ph,c)=>/نيء|نيئ|خام/.test(ph)?c:c.filter(x=>!/نيء|نيئ|نيي|خام/.test(AR(x.n))).concat(c.filter(x=>/نيء|نيئ|نيي|خام/.test(AR(x.n))));
function vFind(ph){
  if(!ph)return null;
  const u=searchFoods(ph);if(u.length)return vCooked(ph,{food:u[0],own:true});
  const c=vRawLast(ph,catSearch(ph,'',true));if(c.length)return{food:c[0],own:false};
  const ph2=ph.replace(/ه(?=\s|$)/g,'');
  if(ph2!==ph&&ph2.length>=2){const u3=searchFoods(ph2);if(u3.length)return{food:u3[0],own:true};const c3=catSearch(ph2,'',true);if(c3.length)return{food:c3[0],own:false}}
  const ws=ph.split(' ').filter(w=>w.length>=3);
  for(const w of ws){const u2=searchFoods(w);if(u2.length)return{food:u2[0],own:true};const c2=catSearch(w,'',true);if(c2.length)return{food:c2[0],own:false}}
  return null;
}
function vGrams(food,q,unit,small,rawUnit){
  const ug=food.ug>0?food.ug:0,nm=vNm(food),g=food.grp;
  if(q==null)q=1;
  if(unit==='gram')return q;
  if(unit==='cup')return q*(g==='carb'?160:g==='dairy'?240:g==='fruit'?150:200);
  if(unit==='plate')return q*(g==='carb'?250:g==='veg'?200:g==='pro'?200:250);
  if(unit==='spoon'){
    const per=small?5:/سكر/.test(nm)?12:/عسل/.test(nm)?21:g==='fat'||/زيت|سمن|زبد/.test(nm)?13:15;
    return q*per;
  }
  if(unit==='hand')return q*30;
  if(unit==='slice'){return q*(ug||(/خبز|توست|عيش/.test(nm)?28:/جبن/.test(nm)?20:30))}
  if(unit==='cnt'||unit==null){
    if(ug)return q*ug;
    if(/خبز|عيش/.test(nm))return q*90;
    const pn=V_PIECEN.find(x=>x[0].test(nm));if(pn)return q*pn[1];
    return q*(V_PIECE[g]||100);
  }
  return q*100;
}
function vParse(raw){
  const T0=Date.now(),norm=vNorm(raw),res={items:[],unknown:[],meal:null,flags:{sugarMention:false,noSugar:false,oilGiven:false},ms:0};
  // تلميح الوجبة
  norm.split(' ').forEach(w=>{if(res.meal==null&&V_MEAL[w]!=null)res.meal=V_MEAL[w]});
  // فصل الأصناف: "|" و"و" الملتصقة بالكلمة التالية
  let toks=[];
  norm.split(' ').forEach(w=>{
    if(w==='|'||w==='و'||w==='مع'||w==='ثم'||w==='بعدين'){toks.push('|');return}
    if(/^و\d/.test(w)){toks.push('|');toks.push(w.slice(1));return}
    if(w.length>=3&&w[0]==='و'&&!V_WAW.test(w)&&V_NUM[w]==null&&!V_UNIT[w]&&!V_DUAL[w]){
      const s=w.slice(1);
      if(V_NUM[s]!=null||V_UNIT[s]||V_DUAL[s]||vFind(s)||V_ZERO.includes(s)||V_SKIP.has(s)){toks.push('|');toks.push(s);return}
    }
    toks.push(w);
  });
  const segs=[];let cur=[];toks.forEach(w=>{if(w==='|'){if(cur.length)segs.push(cur);cur=[]}else cur.push(w)});if(cur.length)segs.push(cur);
  let key=0;
  segs.forEach(sg=>{
    let q=null,unit=null,small=false,rawU=null;const rest=[];let sugarWord=false,noSug=false;
    for(let i=0;i<sg.length;i++){
      let w=sg[i];
      if(w.length>2&&w[0]==='ب'&&(V_DUAL[w.slice(1)]||V_UNIT[w.slice(1)]||V_NUM[w.slice(1)]!=null))w=w.slice(1);
      if(V_DUAL[w]){q=V_DUAL[w][1];unit=V_UNIT[V_DUAL[w][0]];rawU=V_DUAL[w][0];continue}
      if(/^\d+(\.\d+)?$/.test(w)){q=+w;continue}
      if(V_NUM[w]!=null){q=(q!=null&&q<1&&V_NUM[w]>=1)?V_NUM[w]+q:V_NUM[w];continue}
      if(V_UNIT[w]){unit=V_UNIT[w];rawU=w;if(unit==='spoon'&&(sg[i+1]==='صغيره'||sg[i+1]==='شاي'||sg[i+1]==='صغيرة')){small=true;i++}continue}
      if(w==='صغيره'||w==='كبيره'||w==='متوسطه')continue;
      if(w==='بدون'||w==='من'&&sg[i+1]==='غير'){if(sg[i+1]==='سكر'||sg[i+2]==='سكر'){res.flags.noSugar=true;noSug=true;i+=(sg[i+1]==='سكر'?1:2)}continue}
      if(w==='ساده'||w==='سادة'){res.flags.noSugar=true;continue}
      if(w==='بسكر'||w==='سكر'){sugarWord=true;continue}
      if(V_SKIP.has(w)||V_MEAL[w]!=null)continue;
      rest.push(w);
    }
    if(!rest.length&&sugarWord){ // "معلقتين سكر" كجزء مستقل
      const sf=vFind('سكر');if(sf){const gs=q!=null||unit?vGrams(sf.food,q,unit||'spoon',small,rawU):0;if(gs>0){res.items.push({key:key++,name:sf.food.n,food:sf.food,own:sf.own,g:Math.round(gs),est:false,tag:'sugar'});res.flags.sugarMention=true}}
      return;
    }
    if(!rest.length)return;
    const ph=rest.join(' ');
    // مشروبات صفرية
    if(V_ZERO.some(z=>rest.includes(z))){
      const nm=rest.find(z=>V_ZERO.includes(z))||rest[0];
      const sg0=sugarWord&&!noSug;
      res.items.push({key:key++,name:nm,zero:true,g:200,est:false,tag:'drink',sugarWord:sg0&&!(q&&unit==='spoon')});
      if(sg0&&q&&unit==='spoon'){const sf=vFind('سكر ابيض');if(sf)res.items.push({key:key++,name:sf.food.n,food:sf.food,own:sf.own,g:Math.round(vGrams(sf.food,q,'spoon',true,rawU)),est:false,tag:'sugar'})}
      return;
    }
    const dish=V_DISH.find(x=>x[0].test(ph));
    if(dish){const id='d'+key;dish[2].forEach(([n,gm])=>{const mm=vFind(n);if(mm)res.items.push({key:key++,name:mm.food.n,food:mm.food,own:mm.own,g:gm,est:true,tag:'',dish:id,dishName:dish[1],base:gm})});return}
    const m=vFind(ph);
    if(!m){res.unknown.push(ph);return}
    const f=m.food;let g,est=false;
    if(unit&&unit!=='gram'||(unit==='gram'))g=vGrams(f,q,unit,small,rawU);
    else if(q!=null){g=q>=20?q:vGrams(f,q,'cnt',false,null)}
    else{ // لا كمية: وحدة واحدة إن وُجدت وإلا حصة افتراضية
      if(f.ug>0){const dc=V_DEFCNT.find(x=>x[0].test(vNm(f)));g=f.ug*(dc?dc[1]:1)}else if(/خبز|عيش/.test(vNm(f)))g=90;else{const dn=V_DEFN.find(x=>x[0].test(vNm(f)));g=dn?dn[1]:(V_DEFG[f.grp]||100)}
      est=true;
    }
    const tag=/خبز|عيش|توست/.test(vNm(f))?'bread':/ارز|مكرون|معكرون|برغل|كسكس|شوفان/.test(vNm(f))?'rice':f.grp==='pro'&&!(f.ug>0)?'meat':'';
    if(/زيت|سمن|زبد/.test(vNm(f)))res.flags.oilGiven=true;
    const warn=/مقلي/.test(ph)&&!/مقلي/.test(vNm(f))?'القيمة لصنف غير مقلي — المقلي أعلى سعرات':'';
    res.items.push({key:key++,name:f.n,food:f,own:m.own,g:Math.round(g),est,tag,warn});
  });
  res.ms=Date.now()-T0;
  res.qs=vQuestions(res);
  return res;
}
// أسئلة توضيحية: فقط ما يغيّر الوجبة كثيراً، وبحد أقصى سؤالين
function vQuestions(r){
  const qs=[],its=r.items;
  const oilish=its.some(i=>!i.zero&&/فول|سوتيه|خضار|محمر|باذنجان|كوسه|فاصوليا|بامي/.test(AR(i.name)));
  if(oilish&&!r.flags.oilGiven)qs.push({k:'oil',p:5,t:'الأكل فيه زيت أو سمن؟ كام معلقة تقريباً؟',opts:[['من غير',0],['معلقة',13],['معلقتين',27]]});
  [...new Set(its.filter(i=>i.dish).map(i=>i.dish))].forEach(d=>{const nm=its.find(i=>i.dish===d).dishName;qs.push({k:'dish',p:4,t:'حجم طبق «'+nm+'»؟',opts:[['صغير',0.7],['متوسط',1],['كبير',1.4]],dish:d})});
  its.filter(i=>i.tag==='rice'&&i.est).forEach(i=>qs.push({k:'size',p:4,t:'كمية «'+i.name+'»؟',opts:[['صغير',100],['متوسط',150],['كبير',250]],key:i.key}));
  its.filter(i=>i.tag==='meat'&&i.est).forEach(i=>qs.push({k:'size',p:3,t:'حجم «'+i.name+'»؟',opts:[['صغير',100],['متوسط',150],['كبير',220]],key:i.key}));
  its.filter(i=>i.tag==='bread'&&i.est).forEach(i=>qs.push({k:'bread',p:2,t:'كام «'+i.name+'»؟',opts:[['½',0.5],['1',1],['2',2],['3',3]],key:i.key}));
  if(its.some(i=>i.tag==='drink'&&i.sugarWord)&&!its.some(i=>i.tag==='sugar'))qs.push({k:'sugar',p:1,t:'كام معلقة سكر في الشاي/القهوة؟',opts:[['بدون',0],['1',6],['2',12],['3',18]]});
  return qs.sort((a,b)=>b.p-a.p).slice(0,2);
}
function vApply(q,val){
  const vm=ui.vm,its=vm.items;
  if(q.k==='oil'&&val>0){const m=vFind('زيت نباتي');if(m)its.push({key:Date.now(),name:m.food.n,food:m.food,own:m.own,g:val,est:false,tag:'oil'})}
  else if(q.k==='sugar'&&val>0){const m=vFind('سكر ابيض');if(m)its.push({key:Date.now(),name:m.food.n,food:m.food,own:m.own,g:val,est:false,tag:'sugar'})}
  else if(q.k==='dish'){its.filter(x=>x.dish===q.dish).forEach(x=>{x.g=Math.round(x.base*val)})}
  else if(q.k==='size'){const it=its.find(x=>x.key===q.key);if(it){it.g=val;it.est=false}}
  else if(q.k==='bread'){const it=its.find(x=>x.key===q.key);if(it){const per=it.food.ug>0?it.food.ug:90;it.g=Math.round(val*per);it.est=false}}
}
const vMac=i=>{if(i.zero)return{k:0,p:0,c:0,f:0};const f=i.food,q=i.g/100;return{k:f.k*q,p:f.p*q,c:f.c*q,f:f.f*q}};
function vSlotIdx(d,slot){return d.meals.findIndex(m=>m.slot===slot&&!isExtraMeal(m))}
function vDefaultMeal(){
  const d=state.days[ui.day];
  if(dateOfDay(ui.day)===todayISO()){const n=nowMeal(d);if(n>=0)return n}
  const h=new Date().getHours(),i=vSlotIdx(d,h<11?'b':h<15?'l':h<18?'s':'d');
  return i>=0?i:0;
}
function vOpen(){
  ui.vm={stage:'in',txt:'',lang:'ar-EG',items:[],qs:[],qi:0,meal:vDefaultMeal(),unknown:[],listening:false};
  modal={type:'voice'};
}
function vRun(){
  const vm=ui.vm,txt=(vm.txt||'').trim();
  if(!txt){toast('قل أو اكتب ما أكلته أولاً');return}
  const r=vParse(txt);
  vm.items=r.items;vm.unknown=r.unknown;vm.qs=r.qs;vm.qi=0;vm.ms=r.ms;
  if(r.meal!=null){const i=vSlotIdx(state.days[ui.day],['b','l','s','d'][r.meal]);if(i>=0)vm.meal=i}
  vm.stage=!r.items.length?'in':(r.qs.length?'ask':'res');
  if(!r.items.length)toast('لم أتعرف على أصناف — جرّب صياغة أبسط');
}
function voiceHtml(){
  const vm=ui.vm||{};
  if(vm.stage==='in'||!vm.stage){
    const ex=['فطرت فول وطعمية وعيش بلدي وشاي بسكر','تغديت ارز وصدر دجاج وسلطة','عشا 2 بيض وجبنة قريش وخبز توست','سناك موزة وحفنة لوز'];
    return `<div class="sheet vo" data-stop><h2>🎤 سجّل أكلك</h2>
    <label for="v_txt" class="note" style="display:block;margin-bottom:4px">ما الذي أكلته؟</label><textarea id="v_txt" rows="3" style="width:100%" placeholder="قل أو اكتب: فطرت فول وعيش وشاي…">${esc(vm.txt||'')}</textarea>
    <div class="btns" style="margin:6px 0"><button class="btn ${vm.listening?'pri':''}" data-act="vmic">${vm.listening?'⏹ إيقاف':'🎤 تحدّث'}</button><select data-vlang aria-label="اللهجة" style="flex:0 0 auto"><option value="ar-EG" ${vm.lang==='ar-EG'?'selected':''}>مصري</option><option value="ar-SA" ${vm.lang==='ar-SA'?'selected':''}>سعودي</option></select></div>
    <p class="note" style="margin:0 0 4px">أمثلة (اضغط لتجربتها):</p>
    <div class="gch sm" style="flex-wrap:wrap">${ex.map(x=>`<button data-act="vex" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>
    <button class="btn pri" style="width:100%;margin-top:8px" data-act="vgo">حلّل</button>
    <button class="btn" style="width:100%;margin-top:6px" data-act="vclose">إغلاق</button>
    <p class="note">نموذج أولي: التحليل بقواعد على جهازك، بلا إنترنت وبلا تكلفة. لا يُحفظ الصوت.</p></div>`;
  }
  if(vm.stage==='ask'){
    const q=vm.qs[vm.qi];
    return `<div class="sheet vo" data-stop><h2>سؤال ${vm.qi+1} من ${vm.qs.length}</h2>
    <p style="font-weight:700;margin:4px 0 8px">${esc(q.t)}</p>
    <div class="gch" style="flex-wrap:wrap">${q.opts.map(([l,v])=>`<button data-act="vans" data-v="${v}">${esc(l)}</button>`).join('')}</div>
    <button class="btn" style="width:100%;margin-top:10px" data-act="vskip">تخطي (أستخدم تقديراً ✱)</button>
    <button class="btn" style="width:100%;margin-top:6px" data-act="vback">رجوع للنص</button></div>`;
  }
  // النتيجة
  const d=state.days[ui.day],m=d.meals[vm.meal],tot=vm.items.reduce((a,i)=>{const x=vMac(i);a.k+=x.k;a.p+=x.p;a.c+=x.c;a.f+=x.f;return a},{k:0,p:0,c:0,f:0}),plan=sum(m.items);
  const diff=tot.k-plan.k;
  return `<div class="sheet vo" data-stop><h2>تأكيد الوجبة</h2>
  <label class="lbl">احفظ في <select data-vmeal>${d.meals.map((mm,j)=>{const df=mealDef(d,j);return `<option value="${j}" ${j===vm.meal?'selected':''}>${esc(df?df.n:mm.n)}</option>`}).join('')}</select></label>
  <div class="vlist">${vm.items.map((i,ix)=>{const x=vMac(i);return `<div class="vit"><span class="g"><b>${esc(i.name)}${i.est?' <span class="vest" title="كمية افتراضية">✱</span>':''}</b>${i.own||i.zero?'':' <span class="tag">من القاعدة</span>'}<small>P ${r1(x.p)} · C ${r1(x.c)} · F ${r1(x.f)}</small>${i.warn?`<small class="vwarn">⚠ ${esc(i.warn)}</small>`:''}</span><label class="vq"><input type="number" inputmode="decimal" min="0" step="5" value="${i.g}" data-vi="${ix}" aria-label="جرامات ${esc(i.name)}"><span>جم</span></label><span class="vk"><b>${rd(x.k)}</b><small>سعرة</small></span><button class="ib" data-act="vdel" data-i="${ix}" aria-label="حذف ${esc(i.name)}">✕</button></div>`}).join('')}</div>
  ${vm.unknown.length?`<p class="note" style="color:#b87500">لم أتعرف على: ${vm.unknown.map(esc).join('، ')} — أضفها من «+ إضافة صنف».</p>`:''}
  <div class="card" style="margin:8px 0;padding:8px"><b>${rd(tot.k)} سعرة</b> · P ${rd(tot.p)} · C ${rd(tot.c)} · F ${rd(tot.f)}<br><small class="note">الخطة لهذه الوجبة ${rd(plan.k)} · الفرق <b class="${Math.abs(diff)<=plan.k*0.08?'ok':diff>0?'hi':'lo'}">${sg(diff)}</b></small></div>
  ${vm.items.some(i=>i.est)?'<p class="note">✱ كمية افتراضية لأنك لم تذكرها؛ عدّل الجرام إن لزم.</p>':''}
  <button class="btn pri" style="width:100%" data-act="vsave">💾 حفظ كمأكول</button>
  <button class="btn" style="width:100%;margin-top:6px" data-act="vback">تعديل النص</button>
  <p class="note" style="margin:6px 0 0">زمن التحليل ${vm.ms||0} ms</p></div>`;
}
function vMic(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition,vm=ui.vm;
  if(!SR){toast('هذا المتصفح لا يدعم التعرف على الصوت — اكتب النص أو استخدم ميكروفون لوحة المفاتيح');return}
  if(vRec){try{vRec.stop()}catch(e){}return}
  const r=new SR();r.lang=vm.lang||'ar-EG';r.interimResults=true;r.continuous=false;
  r.onresult=e=>{let s='';for(let i=0;i<e.results.length;i++)s+=e.results[i][0].transcript+' ';vm.txt=s.trim();const t=$('#v_txt');if(t)t.value=vm.txt};
  r.onerror=ev=>{toast('تعذّر الميكروفون: '+(ev.error||''))};
  r.onend=()=>{vRec=null;vm.listening=false;if(modal&&modal.type==='voice')render()};
  vRec=r;vm.listening=true;try{r.start()}catch(e){vRec=null;vm.listening=false}render();
}
function vSave(){
  const vm=ui.vm,d=state.days[ui.day],m=d.meals[vm.meal];let n=0;
  vm.items.filter(i=>!i.zero&&i.g>0).forEach(i=>{
    const id=i.food.id?i.food.id:candFood(i.food),pl=m.items.find(x=>x.f===id&&!x.x&&gE(x)==null);
    if(pl)pl.e=i.g;else m.items.push({f:id,g:0,b:0,r:'x',s:'',x:true,e:i.g});
    n++;
  });
  d.lw=weekKey();modal=null;ui.vm=null;toast('سُجّل '+n+' صنف في '+mealShort(d,vm.meal));
}
