// v2/js/meals.js — هيكل الوجبات: عددها (3–6) وأسماؤها ونوعها ووقتها ونصيبها من اليوم، ومكتبة الوجبات الجاهزة
// سكربت عادي (ليس module): كل الملفات تتشارك نطاقاً عاماً واحداً وتُحمَّل بالترتيب في index.html.
// لا تستدعِ عند التحميل دالة من ملف لاحق؛ الاستدعاء داخل الدوال مسموح.

// ---------- خطة الوجبات: settings.mplan = [{id, n, slot:'b'|'l'|'d'|'s', t:'HH:MM', pct, tpl?}] ----------
const SLOTS={b:'فطور',l:'غداء',d:'عشاء',s:'سناك'};
const SLOT_T={b:'08:00',l:'14:00',s:'17:00',d:'20:30'},SLOT_W={b:25,l:35,d:30,s:10};
const MP_PRESETS={
  m3:{l:'3 وجبات',m:[['b','فطور','08:00'],['l','غداء','14:00'],['d','عشاء','20:00']]},
  m3s:{l:'3 وجبات + سناك',m:[['b','فطور','08:00'],['l','غداء','14:00'],['s','سناك','17:00'],['d','عشاء','20:30']]},
  m3s2:{l:'3 وجبات + 2 سناك',m:[['b','فطور','08:00'],['s','سناك الصباح','11:00'],['l','غداء','14:00'],['s','سناك العصر','17:00'],['d','عشاء','20:30']]},
  m6:{l:'6 وجبات صغيرة',m:[['b','فطور','07:30'],['s','سناك','10:30'],['l','غداء','13:30'],['s','سناك','16:30'],['d','عشاء','19:30'],['s','سناك المساء','22:00']]}
};
const mpid=()=>'m'+Date.now().toString(36).slice(-4)+Math.random().toString(36).slice(2,6);
const slotOf=n=>/فطور|إفطار|افطار/.test(n||'')?'b':/غداء/.test(n||'')?'l':/عشاء/.test(n||'')?'d':'s';
const isExtraMeal=m=>!!m&&(!!m.extra||/^سناك إضافي/.test(m.n||''));
// نِسب افتراضية من نوع كل وجبة، مجموعها 100
function mpPcts(list){const w=list.map(x=>SLOT_W[x.slot]||10),t=w.reduce((a,b)=>a+b,0);const p=w.map(v=>Math.round(v/t*100));p[p.length-1]+=100-p.reduce((a,b)=>a+b,0);list.forEach((x,i)=>x.pct=p[i]);return list}
function mkPlan(key){return mpPcts(MP_PRESETS[key].m.map(([slot,n,t])=>({id:mpid(),n,slot,t})))}
const validPlan=p=>Array.isArray(p)&&p.length>=3&&p.length<=6&&p.every(x=>x&&SLOTS[x.slot]&&typeof x.n==='string'&&isFinite(+x.pct));
function defPlan(){const a=adminDefaults().mplan;return validPlan(a)?a.map(x=>Object.assign({},x,{id:mpid()})):mkPlan('m3s')}
// للمستخدم الحالي: الخطة تُستنتج من وجبات أيامه الحالية، فلا يتغير شيء حتى يعدّلها
function derivePlan(days){const ms=(days&&days[0]?days[0].meals:[]).filter(m=>!isExtraMeal(m));
  if(ms.length<3||ms.length>6)return defPlan();
  return mpPcts(ms.map(m=>{const slot=slotOf(m.n);return{id:mpid(),n:m.n,slot,t:SLOT_T[slot]}}))}
const mplan=()=>S().mplan;
const pctSum=P=>P.reduce((a,x)=>a+Math.max(0,+x.pct||0),0)||1;
// تعريف الوجبة رقم mi في يوم: بالمعرّف إن وُجد، وإلا بالترتيب (الأيام القديمة)، والوجبات الإضافية بلا تعريف
function mealDef(d,mi){const P=mplan(),m=d&&d.meals[mi];if(!m||isExtraMeal(m))return null;
  if(m.id)return P.find(x=>x.id===m.id)||null;
  const idx=d.meals.slice(0,mi).filter(x=>!isExtraMeal(x)).length;return P[idx]||null}
function mealTarget(d,mi,T){const def=mealDef(d,mi);if(!def)return null;const P=mplan(),sh=Math.max(0,+def.pct||0)/pctSum(P);T=T||targets(d);
  return{k:T.k*sh,p:T.p*sh,c:T.c*sh,f:T.f*sh}}
// هل أيام الأسبوع على الخطة الحالية؟ (نفس العدد والترتيب والنوع)
function dayMatchesPlan(d){const P=mplan(),ms=d.meals.filter(m=>!isExtraMeal(m));
  return ms.length===P.length&&ms.every((m,i)=>(!m.id||m.id===P[i].id)&&(m.slot||slotOf(m.n))===P[i].slot)}
const dayLogged=d=>d.meals.some(m=>m.items.some(it=>gE(it)!=null));
// الوجبة الحالية حسب الوقت (لليوم الحالي فقط)
function nowMeal(d){const P=mplan(),now=new Date(),mins=now.getHours()*60+now.getMinutes(),tm=t=>{const a=String(t||'').split(':');return (+a[0]||0)*60+(+a[1]||0)};
  let cur=-1;d.meals.forEach((m,mi)=>{const def=mealDef(d,mi);if(def&&def.t&&tm(def.t)<=mins+30)cur=mi});return cur}

// ---------- الوجبات الجاهزة: {id, n, slot, mode?, items:[{f,g,r,s?,fd?}], src, by?} ----------
const validTpl=t=>!!t&&typeof t.id==='string'&&typeof t.n==='string'&&!!SLOTS[t.slot]&&Array.isArray(t.items)&&t.items.length>0&&t.items.length<=20;
function sysTpls(){return ['high','low'].flatMap(mode=>TPL[mode].map(m=>{const slot=slotOf(m.n);
  return{id:'sys_'+mode+'_'+slot,n:SLOTS[slot]+(mode==='low'?' — كارب قليل':' — يوم عادي'),slot,mode,src:'sys',items:m.it.map(([f,g,r,s])=>({f,g,r,s:s||''}))}}))}
const adminTpls=()=>(pubCfg().meal_templates||[]).filter(validTpl).map(t=>Object.assign({},t,{src:'admin'}));
function myLib(){const s=S();if(!Array.isArray(s.lib))s.lib=[];return s.lib}
// وجبات المدرب نفسه (من ملفه على جهازه) عند عرض متدرب
function coachLib(){if(!ui.remote)return[];const me=loadUser(meta.cur);return me&&me.settings&&Array.isArray(me.settings.lib)?me.settings.lib.filter(t=>validTpl(t)&&t.src!=='coach').map(t=>Object.assign({},t,{src:'coachown'})):[]}
function findTpl(id){return [...myLib(),...coachLib(),...adminTpls(),...sysTpls()].find(t=>t.id===id)||null}
function pickTpl(slot,mode,pin){
  const p=pin&&findTpl(pin);if(p)return p;
  return adminTpls().find(t=>t.slot===slot&&(!t.mode||t.mode===mode))||sysTpls().find(t=>t.slot===slot&&t.mode===mode)||sysTpls().find(t=>t.slot===slot)}
// صنف في قالب غير موجود عند هذا الشخص يُضاف من نسخته المحفوظة (fd)
function ensureFood(x){if(F(x.f))return x.f;const v=x.fd;if(!v||!GROUPS[v.grp]||!isFinite(+v.k))return null;
  state.foods.push({id:x.f,n:String(v.n||'صنف').slice(0,80),grp:v.grp,k:+v.k,p:+v.p||0,c:+v.c||0,f:+v.f||0,u:v.u||'',ug:+v.ug||0});return x.f}
function tplItems(t,prot){return (t?t.items:[]).map(x=>{const f=x.f==='@prot'?PROT[prot]:ensureFood(x);return f?{f,g:+x.g||0,b:+x.g||0,r:x.r||'x',s:x.s||''}:null}).filter(Boolean)}
const tplKcal=t=>rd(t.items.reduce((a,x)=>{const f=x.f==='@prot'?F(PROT.chicken):(F(x.f)||x.fd);return a+(f?f.k*(+x.g||0)/100:0)},0));
// حفظ وجبة من اليوم كوجبة جاهزة (مع نسخة قيم كل صنف حتى تعمل عند غيره)
function mealToTpl(d,mi,name){const m=d.meals[mi],def=mealDef(d,mi);
  const items=m.items.filter(it=>!it.x&&F(it.f)).map(it=>{const f=F(it.f);return{f:it.f,g:rd(it.g),r:it.r||'x',fd:{n:f.n,grp:f.grp,k:f.k,p:f.p,c:f.c,f:f.f,u:f.u||'',ug:f.ug||0}}});
  return{id:'t'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),n:String(name||m.n).slice(0,60),slot:def?def.slot:slotOf(m.n),items}}
// تطبيق وجبة جاهزة على وجبة في يوم ثم ضبط الكميات
function applyTpl(d,mi,t){const m=d.meals[mi];m.items=tplItems(t,d.prot);fitDay(d,true)}

// ---------- ملء وجبة من الأصناف المعتادة ----------
function usualizeMeal(m,by,seed){let n=0;const used=new Set(m.items.map(it=>it.f));
  m.items.forEach(it=>{if(it.x)return;const f=F(it.f),pool=f&&by[f.grp];if(!pool||!pool.length||pool.some(p=>p.id===f.id))return;
    const key=KEYM[f.grp],ov=f[key]*it.g/100;
    const c=pool.map((p,k)=>pool[(k+seed)%pool.length]).find(p=>!used.has(p.id)&&p[key]>0);if(!c)return;
    const g=roundG(c,ov/c[key]*100);used.delete(it.f);used.add(c.id);it.f=c.id;it.g=g;it.b=g;n++});
  return n}

// ---------- تطبيق خطة الوجبات على أيام الأسبوع ----------
// الأيام غير المسجّلة التي تختلف عن الخطة تُبنى من جديد؛ المطابقة تأخذ الأسماء والمعرّفات وتُضبط كمياتها؛ المسجّلة لا تُمس
function planDiffDays(){return state.days.map((d,i)=>!dayLogged(d)&&!dayMatchesPlan(d)?i:-1).filter(i=>i>=0)}
function applyPlanToWeek(){const P=mplan();let rebuilt=0;
  state.days.forEach((d,i)=>{if(dayLogged(d))return;
    if(!dayMatchesPlan(d)){const ex=d.meals.filter(isExtraMeal);state.days[i]=buildDay(i,d.mode,d.prot);state.days[i].meals.push(...ex);rebuilt++;return}
    let k=0;d.meals.forEach(m=>{if(isExtraMeal(m))return;const def=P[k++];m.id=def.id;m.n=def.n;m.slot=def.slot});fitDay(d,true)});
  return rebuilt}

// ---------- الواجهة: «أهدافي ← الوجبات وتوزيعها» ----------
const tplLine=t=>`${SLOTS[t.slot]} · ${t.items.length} ${t.items.length===1?'صنف':'أصناف'} · ~${tplKcal(t)} سعرة${t.src==='coach'||t.src==='coachown'?' · '+(t.by?esc(t.by):'من المدرب'):''}`;
function vMealsSec(fold){
  const P=mplan(),sumP=P.reduce((a,x)=>a+(+x.pct||0),0),diff=planDiffDays().length,L=myLib();
  const rows=P.map((x,i)=>`<div class="mprow"><input class="mpn" value="${esc(x.n)}" maxlength="30" data-ch="mp" data-i="${i}" data-k="n" aria-label="اسم الوجبة ${i+1}">
    <select data-ch="mp" data-i="${i}" data-k="slot" aria-label="نوع الوجبة ${i+1}">${Object.keys(SLOTS).map(k=>`<option value="${k}" ${x.slot===k?'selected':''}>${SLOTS[k]}</option>`).join('')}</select>
    <input type="time" value="${esc(x.t||'')}" data-ch="mp" data-i="${i}" data-k="t" aria-label="وقت الوجبة ${i+1}">
    <span class="mpp"><input type="number" min="0" max="100" step="5" inputmode="numeric" value="${+x.pct||0}" data-ch="mp" data-i="${i}" data-k="pct" aria-label="نصيب الوجبة ${i+1} من اليوم">%</span>
    ${P.length>3?`<button type="button" class="ib" data-act="mpdel" data-v="${i}" aria-label="حذف ${esc(x.n)}">✕</button>`:'<span></span>'}</div>`).join('');
  return fold('الوجبات وتوزيعها',`${P.length} وجبات · ${P.map(x=>(+x.pct||0)+'%').join(' / ')}`,
  `<div class="chips" style="margin:0 0 4px">${Object.entries(MP_PRESETS).map(([k,v])=>`<button type="button" data-act="mpset" data-v="${k}">${v.l}</button>`).join('')}</div>
  ${rows}
  <div class="btns" style="margin:6px 0">${P.length<6?'<button data-act="mpadd">＋ إضافة وجبة</button>':''}<button data-act="mpeven">توزيع تلقائي للنِّسب</button></div>
  <p class="note" style="margin:0">${sumP===100?'مجموع النِّسب 100%.':`مجموع النِّسب ${sumP}% — تُحسب كل نسبة من المجموع.`} كل وجبة تأخذ نصيبها من سعرات اليوم وماكروزه، والوقت يظهر في «اليوم».</p>
  ${diff?`<div class="bnr info" style="margin-top:8px"><span class="g"><b>لم تُطبَّق على ${daysWord(diff)} بعد</b>أيام لم يبدأ تسجيلها وتختلف عن هذه الوجبات.</span><button class="btn pri" data-act="mpapply">تطبيق</button></div>`:'<div class="btns" style="margin-top:6px"><button data-act="mpapply">ضبط كميات الأسبوع على النِّسب</button></div>'}
  <div class="grp" style="margin-top:10px">وجباتك الجاهزة (${L.length})</div>
  ${L.length?`<div class="list" style="box-shadow:none;border:1px solid var(--ln)">${L.map(t=>`<div class="li" style="cursor:default"><span class="g"><b>${esc(t.n)}</b><small>${tplLine(t)}</small></span><button class="btn" data-act="libdel" data-id="${esc(t.id)}" aria-label="حذف ${esc(t.n)}">حذف</button></div>`).join('')}</div>`
  :'<p class="note">احفظ أي وجبة من «اليوم» ← ⋯ الوجبة ← «حفظ كوجبة جاهزة»، ثم استخدمها في أي يوم.</p>'}`);
}
// ---------- النوافذ ----------
function vMealModal(m){
  const d=state.days[ui.day],mm=d.meals[modal.m];if(!mm){modal=null;return false}
  const def=mealDef(d,modal.m),nm=def?def.n:mm.n,slot=def?def.slot:slotOf(mm.n);
  if(modal.type==='mopts'){
    m.innerHTML=`<div class="sheet" role="dialog" aria-label="خيارات ${esc(nm)}"><h2>${esc(nm)}${def&&def.t?` <small class="mtime">${esc(def.t)}</small>`:''}</h2><div class="list" style="box-shadow:none;border:1px solid var(--ln)">
    <button class="li" data-act="mtpl"><span class="g"><b>استبدال بوجبة جاهزة</b><small>من وجباتك${ui.remote?'، وجباتك كمدرب':'، مدربك'}، وقوالب التطبيق</small></span></button>
    <button class="li" data-act="msave"><span class="g"><b>حفظ كوجبة جاهزة</b><small>${ui.remote?'تُحفظ في وجبات المتدرب':'لاستخدامها في أي يوم'}</small></span></button>
    <button class="li" data-act="musual"><span class="g"><b>ملء من أصنافي المعتادة</b><small>نفس النوع بنفس الماكرو</small></span></button>
    <button class="li" data-act="mrefit"><span class="g"><b>ضبط كميات الوجبة</b><small>${def?'على نصيبها '+(+def.pct||0)+'% من اليوم':'على هدف اليوم'}</small></span></button>
    ${ui.isAdmin&&!ui.remote?'<button class="li" data-act="mpub"><span class="g"><b>نشر كقالب لكل المستخدمين</b><small>يظهر في «قوالب التطبيق» ويُستخدم في بناء الأيام</small></span></button>':''}
    ${isExtraMeal(mm)&&!mm.items.length?`<button class="li dz" data-act="delmeal" data-m="${modal.m}"><span class="g"><b>حذف هذه الوجبة</b></span></button>`:''}</div>
    <div class="btns" style="margin-top:8px"><button data-act="close">إغلاق</button></div></div>`;
  }else if(modal.type==='mtpl'){
    const ord=L=>L.slice().sort((a,b)=>(b.slot===slot)-(a.slot===slot));
    const sec=(t,L)=>L.length?`<div class="grp">${t}</div><div class="list" style="box-shadow:none;border:1px solid var(--ln)">${ord(L).map(x=>`<button class="li" data-act="mtplapply" data-id="${esc(x.id)}"><span class="g"><b>${esc(x.n)}</b><small>${tplLine(x)}</small></span></button>`).join('')}</div>`:'';
    const lib=myLib().filter(validTpl),mine=lib.filter(t=>t.src!=='coach'),fromC=lib.filter(t=>t.src==='coach');
    const body=sec(ui.remote?'وجبات المتدرب':'وجباتك',mine)+sec(ui.remote?'وجبات أرسلتها له':'من مدربك',fromC)+sec('وجباتك كمدرب',coachLib())+sec('قوالب عامة',adminTpls())+sec('قوالب التطبيق',sysTpls().filter(t=>t.mode===d.mode));
    m.innerHTML=`<div class="sheet" role="dialog" aria-label="استبدال ${esc(nm)}"><h2>استبدال «${esc(nm)}»</h2><p class="note" style="margin:0 0 6px">تحلّ محل أصناف الوجبة، ثم تُضبط الكميات على نصيبها. يمكنك التراجع.</p>${body}
    <div class="btns" style="margin-top:8px"><button data-act="close">إغلاق</button></div></div>`;
  }else if(modal.type==='msave'){
    m.innerHTML=`<div class="sheet" role="dialog" aria-label="حفظ كوجبة جاهزة"><h2>حفظ كوجبة جاهزة</h2><label class="lbl">الاسم<input id="ms_n" maxlength="60" value="${esc(nm)}"></label>
    <p class="note">تُحفظ الأصناف بكمياتها الحالية (${mm.items.filter(it=>!it.x).length} ${mm.items.filter(it=>!it.x).length===1?'صنف':'أصناف'}).</p>
    <div class="btns"><button class="btn pri" data-act="msaved">حفظ</button><button data-act="close">إلغاء</button></div></div>`;
  }else return false;
  return true;
}
