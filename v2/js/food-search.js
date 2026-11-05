// v2/js/food-search.js — بحث الأصناف: القاعدة الجاهزة وUSDA وOpen Food Facts
// سكربت عادي (ليس module): كل الملفات تتشارك نطاقاً عاماً واحداً وتُحمَّل بالترتيب في index.html.
// لا تستدعِ عند التحميل دالة من ملف لاحق؛ الاستدعاء داخل الدوال مسموح.
// ---------- بحث الأصناف: قاعدة جاهزة + USDA + Open Food Facts ----------
const SK='mp3_src';
let SRC=Object.assign({usda:''},lsGet(SK)||{});
const SRCL={cat:'قاعدة جاهزة',usda:'USDA',off:'Open Food Facts',label:'من ملصق'};
const r1=x=>+(+x||0).toFixed(1);
const normN=s=>AR(s).replace(/\s+/g,' ').trim();
const AREN={'دجاج':'chicken','فراخ':'chicken','فرخة':'chicken','صدر':'breast','صدور':'breast','فخذ':'thigh','افخاذ':'thigh','جناح':'wing','اجنحه':'wings','لحم':'beef','بقري':'beef','بقر':'beef','عجل':'veal','ضاني':'lamb','ضان':'lamb','غنم':'lamb','خروف':'lamb','مفروم':'ground','كبده':'liver','كبد':'liver','سمك':'fish','تونه':'tuna','سلمون':'salmon','جمبري':'shrimp','روبيان':'shrimp','بيض':'egg','بيضه':'egg','حليب':'milk','لبن':'yogurt','زبادي':'yogurt','جبن':'cheese','جبنه':'cheese','ارز':'rice','رز':'rice','مكرونه':'pasta','معكرونه':'pasta','خبز':'bread','عيش':'bread','شوفان':'oats','بطاطس':'potato','بطاطا':'sweet potato','طماطم':'tomato','خيار':'cucumber','جزر':'carrot','تفاح':'apple','موز':'banana','برتقال':'orange','عنب':'grapes','فراوله':'strawberries','مانجو':'mango','تمر':'dates','زيت':'oil','زيتون':'olive','لوز':'almonds','سوداني':'peanuts','حمص':'chickpeas','عدس':'lentils','فاصوليا':'beans','ذره':'corn','عسل':'honey','سكر':'sugar','زبده':'butter','قشطه':'cream','مشوي':'grilled','مسلوق':'boiled','مطبوخ':'cooked','نيء':'raw','نيئ':'raw','خام':'raw','مقلي':'fried','محمص':'roasted','بالجلد':'with skin','بدون':'without','جلد':'skin','ديك':'turkey','رومي':'turkey','سبانخ':'spinach','بروكلي':'broccoli','كوسه':'zucchini','باذنجان':'eggplant','فلفل':'pepper','بصل':'onion','ثوم':'garlic','فطر':'mushrooms','افوكادو':'avocado','طحينه':'tahini','جوز':'walnuts','كاجو':'cashew','فستق':'pistachio','كينوا':'quinoa','برغل':'bulgur','فول':'fava beans','لوبيا':'cowpeas','بازلاء':'peas','ملفوف':'cabbage','قرنبيط':'cauliflower'};
function toEn(q){
  if(!/[؀-ۿ]/.test(q))return q.trim();
  const ws=AR(q).split(/\s+/).filter(Boolean),tr=ws.map(w=>AREN[w]||AREN[w.replace(/^و/,'')]);
  if(tr.length&&tr.every(Boolean))return tr.join(' ');
  const b=catSearch(q,'',true)[0];
  if(b&&b.en)return b.en;
  return tr.filter(Boolean).join(' ');
}
function guessGrp(n,k,p,c,f){
  const s=String(n).toLowerCase();
  if(/milk|yog[h]?urt|cheese|kefir|cream|لبن|حليب|جبن|زبادي/.test(s))return 'dairy';
  const e=Math.max(1,4*p+4*c+9*f);
  if(f*9/e>=0.55)return 'fat';
  if(p*4/e>=0.4)return 'pro';
  if(/fruit|apple|banana|orange|grape|berry|berries|mango|melon|peach|pear|date|فاكه|تفاح|موز|برتقال/.test(s)&&c*4/e>=0.7)return 'fruit';
  if(k<=45&&p<4)return 'veg';
  return 'carb';
}
function catCand(r){return{n:r[0],en:r[2],grp:r[3],k:r[4],p:r[5],c:r[6],f:r[7],u:r[8]||'',ug:r[9]||0,src:'cat'}}
function catSearch(q,grp,all){
  const t=AR(q).split(/\s+/).filter(Boolean);if(!t.length)return[];
  const have=new Set(state.foods.map(f=>normN(f.n)));
  const out=[];
  CAT.forEach((r,ix)=>{
    if(grp&&r[3]!==grp)return;
    if(!all&&have.has(normN(r[0])))return;
    const n=AR(r[0]),ws=n.split(/\s+/),h=AR(r[0]+' '+r[1]+' '+r[2]),hw=h.split(/\s+/);let sc=0;
    for(const w of t){
      if(n.startsWith(w))sc+=3;else if(ws.some(x=>x.startsWith(w)))sc+=2.5;else if(n.includes(w))sc+=2;else if(hw.some(x=>x.startsWith(w)))sc+=1.5;else if(h.includes(w))sc+=1;else return;
    }
    out.push({c:catCand(r),sc,ix});
  });
  return out.sort((a,b)=>b.sc-a.sc||a.ix-b.ix).map(x=>x.c);
}
async function jget(url){const r=await fetch(url);if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}
async function usdaSearch(q){
  const en=toEn(q);
  if(!en)return{items:[],note:'USDA: لم أستطع ترجمة «'+q+'» للإنجليزية — جرّب كتابتها بالإنجليزية (مثل chicken breast)'};
  const key=SRC.usda||'DEMO_KEY';
  const j=await jget('https://api.nal.usda.gov/fdc/v1/foods/search?api_key='+encodeURIComponent(key)+'&query='+encodeURIComponent(en)+'&dataType='+encodeURIComponent('Foundation,SR Legacy')+'&pageSize=15');
  const ar=/[؀-ۿ]/.test(q),items=[];
  (j.foods||[]).forEach(x=>{
    const nu={};
    (x.foodNutrients||[]).forEach(n=>{const id=String(n.nutrientNumber||n.number||''),v=n.value!=null?n.value:n.amount;
      if(id==='208'&&(!n.unitName||/kcal/i.test(n.unitName)))nu.k=v;
      else if((id==='957'||id==='958')&&nu.k2==null)nu.k2=v;
      else if(id==='203')nu.p=v;else if(id==='205')nu.c=v;else if(id==='204')nu.f=v});
    const k=nu.k!=null?nu.k:nu.k2;
    if(k==null||(nu.p==null&&nu.c==null&&nu.f==null))return;
    const p=nu.p||0,c=nu.c||0,f=nu.f||0,d=String(x.description||'');
    items.push({n:ar?(q.trim()+' — '+d.slice(0,60)):d.slice(0,80),en:d,grp:guessGrp(d,k,p,c,f),k:r1(k),p:r1(p),c:r1(c),f:r1(f),u:'',ug:0,src:'usda'});
  });
  return{items,en};
}
const OFF_F='code,product_name,product_name_ar,product_name_en,brands,nutriments,serving_quantity';
function offMap(x){
  const nm=x.nutriments||{},name=(x.product_name_ar||x.product_name||x.product_name_en||'').trim();
  if(!name)return null;
  let k=nm['energy-kcal_100g'];if(k==null&&nm['energy_100g']!=null)k=nm['energy_100g']/4.184;
  if(k==null||isNaN(+k))return null;
  const p=+nm.proteins_100g||0,c=+nm.carbohydrates_100g||0,f=+nm.fat_100g||0,br=String(x.brands||'').split(',')[0].trim(),sq=+x.serving_quantity||0;
  return{n:(name+(br?' — '+br:'')).slice(0,80),en:name,grp:guessGrp(name,+k,p,c,f),k:r1(k),p:r1(p),c:r1(c),f:r1(f),u:sq>0?'حصة':'',ug:sq>0?sq:0,src:'off',code:x.code};
}
async function offSearch(q){
  if(/^\d{8,14}$/.test(q.trim())){const j=await jget('https://world.openfoodfacts.org/api/v2/product/'+q.trim()+'.json?fields='+OFF_F);return{items:(j.status===1&&j.product?[offMap(j.product)]:[]).filter(Boolean)}}
  const j=await jget('https://world.openfoodfacts.org/cgi/search.pl?search_terms='+encodeURIComponent(q)+'&search_simple=1&action=process&json=1&page_size=15&fields='+OFF_F);
  return{items:(j.products||[]).map(offMap).filter(Boolean)};
}
async function doOnline(q){
  ui.online={q,busy:true,items:[],notes:[]};refreshLists();
  const res=await Promise.allSettled([usdaSearch(q),offSearch(q)]);
  const o={q,busy:false,items:[],notes:[]};
  if(res[0].status==='fulfilled'){o.items=o.items.concat(res[0].value.items);if(res[0].value.note)o.notes.push(res[0].value.note);if(!res[0].value.items.length&&!res[0].value.note)o.notes.push('USDA: لا نتائج')}
  else o.notes.push('USDA: تعذّر الاتصال ('+(res[0].reason&&res[0].reason.message||'')+')'+(/429|403/.test(String(res[0].reason&&res[0].reason.message))?' — تجاوزت حد المفتاح التجريبي، سجّل مفتاحاً مجانياً في الأسفل':''));
  if(res[1].status==='fulfilled'){o.items=o.items.concat(res[1].value.items);if(!res[1].value.items.length)o.notes.push('Open Food Facts: لا نتائج')}
  else o.notes.push('Open Food Facts: تعذّر الاتصال ('+(res[1].reason&&res[1].reason.message||'')+')');
  ui.online=o;refreshLists();
}
function candRow(c,i,act){
  return `<button type="button" class="cand" data-act="${act}" data-ci="${i}"><span><b>${esc(c.n)}</b><small>${SRCL[c.src]||''}${c.u&&c.ug?' · '+rd(c.k*c.ug/100)+' kcal/'+esc(c.u):''} · ${GROUPS[c.grp]}</small></span><span class="dl">${rd(c.k)} kcal · P ${r1(c.p)} · C ${r1(c.c)} · F ${r1(c.f)}</span></button>`;
}
function extraHtml(q,grp,act){
  ui.cands=[];if(!q)return'';
  const cat=catSearch(q,grp).slice(0,25),on=(ui.online&&ui.online.q===q)?ui.online:null;let h='';
  if(cat.length){h+=`<p class="note" style="margin:8px 0 2px"><b>من قاعدة الأصناف الجاهزة (${cat.length})</b> — اضغط للإضافة، والقيم لكل 100 جم وتتبع الجرامات تلقائياً</p>`;cat.forEach(c=>{h+=candRow(c,ui.cands.push(c)-1,act)})}
  if(on&&!on.busy){
    const by=s=>on.items.filter(x=>x.src===s);
    [['usda','🌐 USDA — أغذية عامة'],['off','🌐 Open Food Facts — منتجات معبأة']].forEach(([s,t])=>{const L=by(s);if(L.length){h+=`<p class="note" style="margin:8px 0 2px"><b>${t} (${L.length})</b></p>`;L.forEach(c=>{h+=candRow(c,ui.cands.push(c)-1,act)})}});
    on.notes.forEach(n=>{h+=`<p class="note" style="margin:6px 0 0">⚠ ${esc(n)}</p>`});
  }
  if(on&&on.busy)h+='<p class="note" style="margin:8px 0 0">⏳ جارٍ البحث في USDA وOpen Food Facts…</p>';
  else if(feat('online'))h+=`<button class="btn" data-act="online" style="width:100%;margin-top:8px">🌐 ابحث عن «${esc(q)}» أونلاين (USDA + Open Food Facts)</button>`;
  return h;
}
function refreshLists(){
  if(modal&&modal.type==='add')renderAddList(ui.aq||'');
  else if(ui.tab==='foods'&&!modal){const el=$('#foodList');if(el)el.innerHTML=foodsList()}
}
function candFood(c){
  const nn=normN(c.n),ex=state.foods.find(f=>normN(f.n)===nn);if(ex)return ex.id;
  const id='c'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
  state.foods.push({id,n:c.n,grp:c.grp,k:+c.k,p:+c.p,c:+c.c,f:+c.f,u:c.u||'',ug:c.ug||0,src:c.src});
  return id;
}
function srcCard(){
  return `<div class="card"><h2 style="margin:0 0 4px">مصادر البحث الأونلاين</h2><p class="note" style="margin:0 0 6px">يعمل البحث بمفتاح USDA التجريبي مباشرة، لكنه محدود (≈30 طلباً في الساعة). للاستخدام المريح سجّل مفتاحاً مجانياً (دقيقتان) من <b>fdc.nal.usda.gov/api-key-signup</b> ثم الصقه هنا. Open Food Facts لا يحتاج مفتاحاً. يمكنك أيضاً كتابة رقم الباركود في البحث.</p><input id="usda_key" aria-label="مفتاح USDA" autocomplete="off" spellcheck="false" translate="no" placeholder="مفتاح USDA (اختياري)…" value="${esc(SRC.usda||'')}" style="width:100%;direction:ltr"></div>`;
}
function qtyOf(it){const f=F(it.f),g=it.x?(gE(it)||0):it.g;return f&&f.u&&f.ug?+(g/f.ug).toFixed(1):rd(g)}
function unitOf(f){return f&&f.u?f.u:'جم'}
