// v2/js/views-plan.js — الشاشات: اليوم والخطة والمشتريات والتقدم والأصناف
// سكربت عادي (ليس module): كل الملفات تتشارك نطاقاً عاماً واحداً وتُحمَّل بالترتيب في index.html.
// لا تستدعِ عند التحميل دالة من ملف لاحق؛ الاستدعاء داخل الدوال مسموح.
// ---------- views ----------
function bar(l,v,t,u){const p=Math.min(100,v/t*100),dv=v-t,cls=Math.abs(dv)<=t*0.08?'ok':(dv>0?'hi':'lo');
  return `<div class="bar"><div class="bl"><b>${l}</b><span>${rd(v)} / ${rd(t)} ${u} <em class="${cls}">${sg(dv)}</em></span></div><div class="bt"><i class="${cls}" style="width:${p}%"></i></div></div>`}
function row(it,mi,ii){
  const f=F(it.f);if(!f)return'';const m=it.x?macE(it):mac(it),e=gE(it),sk=!it.x&&e===0;
  return `<div class="it"><div class="nm${sk?' sk':''}"><span class="t">${esc(f.n)}</span>${it.s==='prot'?'<span class="tag">بروتين اليوم</span>':''}${stTag(it,mi)}</div>
  <div class="mc">P ${rd(m.p)} · C ${rd(m.c)} · F ${rd(m.f)}</div>
  <div class="qty"><input type="number" inputmode="decimal" min="0" step="${f.u?1:5}" value="${qtyOf(it)}" data-ch="qty" data-m="${mi}" data-i="${ii}"><span>${esc(unitOf(f))}</span></div>
  <div class="kc">${rd(m.k)}<small>سعرة</small></div>
  <div class="acts" style="grid-column:1/-1"><button class="ib${e!=null&&!sk?' on':''}" title="أُكل كما في الخطة" aria-label="أُكل كما في الخطة: ${esc(f.n)}" aria-pressed="${e!=null&&!sk}" data-act="qlog" data-m="${mi}" data-i="${ii}">✓</button><button class="ib" title="تسجيل: كمية / وجبة / لم يُؤكل" aria-label="تسجيل ${esc(f.n)}" data-act="log" data-m="${mi}" data-i="${ii}">📝</button>${it.x?'':`<button class="ib" title="بدائل" aria-label="بدائل ${esc(f.n)}" data-act="swap" data-m="${mi}" data-i="${ii}">⇄</button>`}<button class="ib" title="حذف" aria-label="حذف ${esc(f.n)}" data-act="del" data-m="${mi}" data-i="${ii}">✕</button></div></div>`}
// اكتمال اليوم/الوجبة: كل الأصناف المخططة سُجّلت (أُكلت أو لم تُؤكل)
const mealDone=m=>{const a=m.items.filter(it=>!it.x);return a.length>0&&a.every(it=>gE(it)!=null)};
const dayDone=d=>d.meals.some(m=>m.items.some(it=>!it.x))&&d.meals.every(m=>!m.items.some(it=>!it.x)||mealDone(m));
// قيم اللحوم والدواجن والأسماك مخزّنة بعد الطهي؛ نعرض الوزن النيء التقريبي (يفقد اللحم نحو 25% بالطهي)
const RAWF=1.33,isCooked=f=>f&&f.grp==='pro'&&/مطبوخ|مشوي|مسلوق|مقلي/.test(f.n);
function ring(v,t){const r=31,C=2*Math.PI*r,p=Math.max(0,Math.min(1,t?v/t:0));
  return `<svg class="ring" viewBox="0 0 76 76" role="img" aria-label="${rd(v)} من ${rd(t)} سعرة"><circle cx="38" cy="38" r="${r}" fill="none" stroke="var(--tr)" stroke-width="8"/><circle cx="38" cy="38" r="${r}" fill="none" stroke="var(--ac)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${(C*p).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 38 38)"/><text x="38" y="38" text-anchor="middle" font-size="16" font-weight="700" fill="var(--tx)">${rd(v)}</text><text x="38" y="52" text-anchor="middle" font-size="10" fill="var(--mu)">من ${rd(t)}</text></svg>`}
function openMeal(d){const di=ui.day;if(ui.open&&ui.open.d===di)return ui.open.m;const i=d.meals.findIndex(m=>!mealDone(m)&&m.items.length);return i<0?-1:i}
function row(it,mi,ii){
  const f=F(it.f);if(!f)return'';const m=it.x?macE(it):mac(it),e=gE(it),sk=!it.x&&e===0,on=e!=null&&!sk;
  const raw=isCooked(f)&&!it.x?` · <span class="raw">مطبوخ ≈ ${rd(it.g*RAWF)} جم نيء</span>`:'';
  return `<div class="row2"><button class="chk${on?' on':''}${sk?' sk':''}" aria-label="${it.x?'صنف خارج الخطة':'أُكل كما في الخطة'}: ${esc(f.n)}" aria-pressed="${on}" data-act="qlog" data-m="${mi}" data-i="${ii}" ${it.x?'disabled':''}>${sk?'✗':'✓'}</button>
  <span class="g"><b>${esc(f.n)}</b><small>${rd(m.k)} سعرة${raw}</small>${it.s==='prot'||stTag(it,mi)?`<span style="display:block">${it.s==='prot'?'<span class="tag" style="margin:0">بروتين اليوم</span>':''}${stTag(it,mi)}</span>`:''}</span>
  <span class="q"><input type="number" inputmode="decimal" min="0" step="${f.u?1:5}" value="${qtyOf(it)}" data-ch="qty" data-m="${mi}" data-i="${ii}" aria-label="كمية ${esc(f.n)} بـ${esc(unitOf(f))}">${esc(unitOf(f))}</span>
  <button class="more" data-act="itemopts" data-m="${mi}" data-i="${ii}" aria-label="خيارات ${esc(f.n)}" aria-haspopup="dialog">⋯</button></div>`}
function vDay(){
  const di=ui.day,d=state.days[di],T=targets(d),tot=sum(d.meals.flatMap(m=>m.items)),op=openMeal(d),isT=dateOfDay(di)===todayISO();
  const mb=(l,v,t)=>{const dv=v-t,cls=Math.abs(dv)<=t*0.08?'ok':(dv>0?'hi':'lo');return `<div><div class="bl"><b>${l}</b><span>${rd(v)} / ${rd(t)} جم</span></div><div class="bt"><i class="${cls}" style="width:${Math.min(100,t?v/t*100:0)}%"></i></div></div>`};
  const DL='سحنثرخج';
  let h=`<div class="days wk" role="tablist" aria-label="أيام الأسبوع">${state.days.map((x,i)=>`<button class="${i===di?'on':''}" role="tab" aria-selected="${i===di}" aria-label="${esc(x.name)} ${dateLabel(dateOfDay(i))}${dayDone(x)?'، مكتمل':''}" data-act="day" data-v="${i}">${dayDone(x)?'<span class="ck" aria-hidden="true">✓</span>':''}<b>${DL[i]}</b><small>${+dateOfDay(i).slice(8)}</small>${dateOfDay(i)===todayISO()?'<span class="td" aria-hidden="true"></span>':''}</button>`).join('')}</div>`;
  h+=`<div class="dhead"><b>${esc(d.name)} <small>${dateLabel(dateOfDay(di))}${isT?' · اليوم':''}</small>${dayOv(di)?`<span class="tag" title="${esc(ovDesc(dayOv(di)))}">معدّل</span>`:''}</b><button class="more" data-act="dayopts" aria-label="خيارات اليوم" aria-haspopup="dialog">⋯</button></div>`;
  h+=`<div class="card sum">${ring(tot.k,T.k)}<div class="mcs">${mb('بروتين',tot.p,T.p)}${mb('كارب',tot.c,T.c)}${mb('دهون',tot.f,T.f)}</div></div>`;
  h+=d.meals.map((m,mi)=>{const mt=sum(m.items),open=mi===op,done=mealDone(m),n=m.items.length;
    return `<section class="card meal"><button class="mhd" data-act="mopen" data-m="${mi}" aria-expanded="${open}" aria-controls="mb${mi}"><span class="g"><b>${esc(m.n)}</b><small>${rd(mt.k)} سعرة · ${n} ${n===1?'صنف':'أصناف'}</small></span>${done?'<span class="pill">مكتملة</span>':''}<span class="chev">${ico('chev')}</span></button>
    <div class="mbd" id="mb${mi}" ${open?'':'hidden'}>${m.items.map((it,ii)=>row(it,mi,ii)).join('')}${movedIn(d,mi)}${n?'':`<p class="note">لا أصناف بعد. <button class="lnk" data-act="delmeal" data-m="${mi}">حذف هذه الوجبة</button></p>`}
    <div class="mft"><button class="btn" data-act="add" data-m="${mi}">+ إضافة صنف</button>${m.items.some(it=>!it.x)?`<button class="btn${done?'':' pri'}" data-act="mfinish" data-m="${mi}">${done?'إلغاء الإنهاء':'إنهاء الوجبة'}</button>`:''}</div></div></section>`}).join('');
  h+=`<button class="add" data-act="addmeal">+ إضافة وجبة أو سناك</button>`;
  return h;
}
function shopping(){
  const map={};state.days.forEach(d=>d.meals.forEach(m=>m.items.forEach(i=>{map[i.f]=(map[i.f]||0)+i.g})));
  const out={};Object.keys(map).forEach(id=>{const f=F(id);if(!f||map[id]<=0)return;(out[f.grp]=out[f.grp]||[]).push([f,map[id]])});
  return out;
}
function shopQty(f,g){return f.u&&f.ug?`${rd(g/f.ug)} ${f.u}`:(g>=1000?(g/1000).toFixed(2)+' كجم':rd(g)+' جم')}
// قائمة مشتريات الأسبوع: تُحسب من الخطة، وتعديلات المستخدم (عندي / حذف / كمية / إضافات) تُحفظ لكل أسبوع في الإعدادات
function shopState(){const s=S(),wk=weekKey();if(!s.shop||s.shop.wk!==wk)s.shop={wk,have:{},del:{},q:{},extra:[]};return s.shop}
function shopLines(){const sh=shopping(),st=shopState(),out=[];
  Object.keys(GROUPS).forEach(g=>(sh[g]||[]).sort((a,b)=>b[1]-a[1]).forEach(([f,g2])=>{if(!st.del[f.id])out.push({id:f.id,g,n:f.n,q:st.q[f.id]||shopQty(f,g2),have:!!st.have[f.id]})}));
  st.extra.forEach((x,i)=>out.push({id:'x'+i,g:'extra',n:x.n,q:x.q||'',have:!!x.have}));return out}
function weekStats(){const days=state.days,a=adh(days),T=days.reduce((x,d)=>x+targets(d).k,0)/7,K=days.reduce((x,d)=>x+sum(d.meals.flatMap(m=>m.items)).k,0)/7;
  let streak=0;for(let i=todayIdx();i>=0;i--){if(dayDone(days[i]))streak++;else if(i!==todayIdx())break}
  return{pct:a.pct,done:a.done,streak,k:K,t:T}}
const todayIdx=()=>{for(let i=0;i<7;i++)if(dateOfDay(i)===todayISO())return i;return 6};
function vWeek(){
  if(!feat('shop')&&ui.wk==='shop')ui.wk='week';
  const seg=!feat('shop')?'':`<div class="seg" role="tablist"><button role="tab" aria-selected="${ui.wk!=='shop'}" class="${ui.wk!=='shop'?'on':''}" data-act="wk" data-v="week">الأسبوع</button><button role="tab" aria-selected="${ui.wk==='shop'}" class="${ui.wk==='shop'?'on':''}" data-act="wk" data-v="shop">المشتريات</button></div>`;
  if(ui.wk==='shop')return seg+vShop();
  const W=weekStats(),msg=W.pct>=90?'ممتاز، استمر على هذا!':W.pct>=70?'أداء جيد هذا الأسبوع':W.pct>0?'كل وجبة تسجّلها تقرّبك من هدفك':'ابدأ بتسجيل أول وجبة اليوم';
  let h=seg+`<div class="dhead"><b>الأسبوع <small>${rangeLabel(dateOfDay(0),dateOfDay(6))}</small></b><button class="more" data-act="weekopts" aria-label="خيارات الأسبوع" aria-haspopup="dialog">⋯</button></div>
  <div class="card sum" style="position:static">${ring(W.pct,100).replace('من 100</text>','%</text>').replace(/aria-label="[^"]*"/,'aria-label="التزام الأسبوع '+W.pct+'%"')}<div class="mcs"><p class="motiv">${msg}</p><span class="note" style="margin:0">التزامك هذا الأسبوع ${W.pct}% · ${W.done} من 7 أيام مكتملة${W.streak>1?' · '+W.streak+' أيام متتالية':''}</span><span class="note" style="margin:0">متوسط الخطة ${rd(W.k)} من ${rd(W.t)} سعرة يومياً</span></div></div>
  <div class="list">${state.days.map((d,i)=>{const a=adh([d]),t=sum(d.meals.flatMap(m=>m.items)),isT=dateOfDay(i)===todayISO(),dn=dayDone(d);
    return `<button class="li" data-act="goday" data-v="${i}"><span class="dl ${dn?'ok':isT?'td':''}" aria-hidden="true">${dn?'✓':'سحنثرخج'[i]}</span><span class="g"><b>${esc(d.name)} <small style="display:inline;font-weight:400">${dateLabel(dateOfDay(i))}${isT?' · اليوم':''}</small></b><small>${d.mode==='high'?'كارب عادي':'كارب قليل'} · ${PL[d.prot]}${dayOv(i)?' · معدّل':''}</small><span class="hbar" aria-label="التزام ${a.pct}%"><i class="${a.pct>=80?'':a.pct>=40?'mid':a.pct?'low':''}" style="width:${a.pct}%"></i></span></span><span class="num">${rd(t.k)}<br><small>سعرة</small></span></button>`}).join('')}</div>`;
  const rows=state.days.map(d=>sum(d.meals.flatMap(m=>m.items))),av=k=>rd(rows.reduce((a,r)=>a+r[k],0)/7);
  h+=`<details class="fold"><summary>متوسط الماكروز في الخطة</summary><div><div class="tiles"><div class="tile"><b>${av('p')}</b><small>بروتين جم</small></div><div class="tile"><b>${av('c')}</b><small>كارب جم</small></div><div class="tile"><b>${av('f')}</b><small>دهون جم</small></div></div></div></details>`;
  return h;
}
function vShop(){
  const L=shopLines(),st=shopState(),left=L.filter(x=>!x.have).length,nd=Object.keys(st.del).length;
  const grp=g=>{const xs=L.filter(x=>x.g===g);return xs.length?`<div class="grp">${g==='extra'?'إضافات':GROUPS[g]}</div><div class="list">${xs.map(x=>`<div class="shi${x.have?' have':''}"><button class="chk${x.have?' on':''}" data-act="shave" data-v="${x.id}" aria-pressed="${x.have}" aria-label="${x.have?'موجود عندي':'تعليم كموجود عندي'}: ${esc(x.n)}">✓</button><span class="g"><b>${esc(x.n)}</b></span><button class="qb" data-act="shq" data-v="${x.id}" aria-label="تعديل كمية ${esc(x.n)}">${esc(x.q||'كمية')}</button><button class="more" data-act="shdel" data-v="${x.id}" aria-label="حذف ${esc(x.n)} من القائمة">✕</button></div>`).join('')}</div>`:''};
  return `<div class="dhead"><b>المشتريات <small>${left} متبقٍ من ${L.length}</small></b></div>
  <p class="note" style="margin:0 2px">من خطة الأسبوع: الأرز والمكرونة نيئة، واللحوم بوزنها مطبوخة. علّم ما عندك، عدّل الكمية، أو احذف وأضف.</p>
  ${Object.keys(GROUPS).map(grp).join('')}${grp('extra')}
  <div class="card"><div class="fr2"><input id="sh_n" placeholder="أضف بنداً: مناديل، توابل…" aria-label="اسم البند"><input id="sh_q" placeholder="الكمية" style="max-width:90px" aria-label="الكمية"><button class="btn pri" style="flex:0 0 auto" data-act="shadd">إضافة</button></div></div>
  <div class="btns"><button class="btn pri" data-act="copyshop">نسخ القائمة</button>${nd?`<button data-act="shrestore">استعادة المحذوف (${nd})</button>`:''}<button data-act="shreset">إعادة من الخطة</button></div>`;
}
function foodRows(list,g){const f0=ui.fu==='unit';
  return `<div class="grp">${GROUPS[g]}</div><div class="list">${list.map(f=>{const pu=f0&&f.u&&f.ug,m=k=>rd(pu?f[k]*f.ug/100:f[k]);
    return `<button class="li" data-act="fedit" data-id="${f.id}"><span class="g"><b>${esc(f.n)}</b><small>${m('k')} سعرة · P ${m('p')} · C ${m('c')} · F ${m('f')} / ${pu?esc(f.u):'100 جم'}${f.u&&!pu?' · '+esc(f.u)+' = '+rd(f.ug)+' جم':''}</small></span><span class="chev">${ico('chev')}</span></button>`}).join('')}</div>`;
}
function fqInfo(){const q=(ui.fq||'').trim(),L=q?searchFoods(q):state.foods;return{q,L,txt:q?(L.length?L.length+' نتيجة':'لا توجد نتائج لـ «'+q+'» — يمكنك إضافته من النموذج أسفل'):''}}
function foodsList(){
  const L=fqInfo().L;
  const q=(ui.fq||'').trim();
  return Object.keys(GROUPS).filter(g=>!ui.fg||ui.fg===g).map(g=>{const list=L.filter(f=>f.grp===g);return list.length?foodRows(list,g):''}).join('')
    +(q?`<div class="card">${extraHtml(q,'','addc')}</div>`:'');
}
function nfForm(){
  const d=ui.nfd||{},v=k=>esc(d[k]==null?'':d[k]);
  return `<div class="card" id="nfcard"><h2 style="margin:0 0 6px">إضافة صنف جديد</h2>
  <div class="frm sc"><label style="grid-column:1/-1"><span>الاسم</span><input id="nf_n" placeholder="مثال: لبنة قليلة الدسم…" value="${v('n')}"></label><label><span>التصنيف</span><select id="nf_g">${Object.keys(GROUPS).map(g=>`<option value="${g}" ${d.g===g?'selected':''}>${GROUPS[g]}</option>`).join('')}</select></label><label><span>القيم</span><select id="nf_b"><option value="g">لكل 100 جم</option><option value="u" ${d.b==='u'?'selected':''}>لكل وحدة واحدة</option></select></label><label><span>سعرات</span><input id="nf_k" type="number" step="any" inputmode="decimal" value="${v('k')}"></label><label><span>بروتين (جم)</span><input id="nf_p" type="number" step="any" inputmode="decimal" value="${v('p')}"></label><label><span>كارب (جم)</span><input id="nf_c" type="number" step="any" inputmode="decimal" value="${v('c')}"></label><label><span>دهون (جم)</span><input id="nf_f" type="number" step="any" inputmode="decimal" value="${v('f')}"></label><label><span>اسم الوحدة (اختياري)</span><input id="nf_u" placeholder="حبة، قطعة…" value="${v('u')}"></label><label><span>وزن الوحدة بالجرام</span><input id="nf_ug" type="number" step="any" inputmode="decimal" value="${v('ug')}"></label></div>
  <p class="note" style="margin:6px 0 0">القراءة من الصورة تقريبية دائماً: راجع الأرقام قبل الإضافة. مثال بسكويت: «لكل وحدة»، الوحدة «قطعة»، السعرات 35. إن لم تعرف وزن القطعة اتركه فارغاً (السعرات تبقى صحيحة).</p>
  <button class="btn pri" style="width:100%;margin-top:8px" data-act="addfood">إضافة</button></div>`;
}
function vFoods(){
  const ch=(v,l)=>`<button class="${(ui.fg||'')===v?'on':''}" data-act="fgrp" data-v="${v}" aria-pressed="${(ui.fg||'')===v}">${l}</button>`;
  return `<div class="srch"><input id="fq" type="search" placeholder="ابحث: لبنة، شوفان، تونة…" aria-label="بحث في الأصناف" value="${esc(ui.fq||'')}">${feat('scan')?`<label class="scanb" aria-label="مسح باركود أو صورة ملصق" title="مسح باركود أو ملصق">${'⌗'}<input type="file" id="nf_img" accept="image/*" style="display:none"></label>`:''}</div>
  <p class="note" id="fqc" style="margin:4px 2px 0">${esc(fqInfo().txt)}</p>
  <div class="chips">${ch('','الكل')}${Object.keys(GROUPS).map(g=>ch(g,GROUPS[g])).join('')}<button class="${ui.fu==='unit'?'on':''}" data-act="fu" data-v="${ui.fu==='unit'?'g':'unit'}" aria-pressed="${ui.fu==='unit'}">لكل وحدة</button></div>
  <div id="foodList">${foodsList()}</div>
  <div class="btns"><button class="btn pri" data-act="nfopen">+ صنف جديد</button><button data-act="nftxt">لصق نص ملصق</button></div>
  <div ${ui.nfOpen?'':'hidden'}>${nfForm()}</div>`;
}
function goalUI(s,hi,lo){
  const gl=goalOf(s),isM=gl.kind==='manual',g=s.g[gl.id]||{};
  const inp=(l,k,st)=>`<label>${l}<input type="number" step="${st||0.1}" value="${s[k]}" data-ch="set" data-k="${k}"></label>`;
  const sel=(l,ch,k,arr,cur)=>`<label>${l}<select data-ch="${ch}" data-k="${k}">${arr.map(([v,t])=>`<option value="${v}" ${String(v)===String(cur)?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`;
  const num=(l,ch,k,val,st,unit)=>`<label>${l}<span><input type="number" step="${st||0.1}" value="${val}" data-ch="${ch}" data-k="${k}"> ${unit||''}</span></label>`;
  const fold=(t,sub,body,open)=>`<details class="fold"${open?' open':''}><summary><span style="flex:1">${t}${sub?`<small style="display:block;font-weight:400;color:var(--mu);font-size:12px">${sub}</small>`:''}</span></summary><div class="set">${body}</div></details>`;
  const chips=`<div class="chips" role="radiogroup" aria-label="الهدف">${s.goals.map(x=>`<button class="${s.goal===x.id?'on':''}" role="radio" aria-checked="${s.goal===x.id}" data-act="goal" data-v="${x.id}">${esc(x.name)}</button>`).join('')}</div>`;
  const dayTiles=(l,t)=>`<div class="grp" style="margin-top:10px">${l}</div><div class="tiles" style="grid-template-columns:repeat(4,1fr)"><div class="tile"><b>${rd(t.k)}</b><small>سعرة</small></div><div class="tile"><b>${rd(t.p)}</b><small>بروتين</small></div><div class="tile"><b>${rd(t.c)}</b><small>كارب</small></div><div class="tile"><b>${rd(t.f)}</b><small>دهون</small></div></div>`;
  const cycOn=!!s.cyc.on,nH=state.days.filter(x=>x.mode==='high').length;
  let head,secs='';
  if(isM){
    head=`<p class="note" style="margin:0">«${esc(gl.name)}»: البروتين والكارب والدهون مضاعفات ثابتة لوزن الجسم.</p>`;
    secs+=fold('المضاعفات',`وزن ${s.bw} كجم`,`<p class="note">الافتراضي: بروتين = الوزن × 2 · دهون = الوزن × 0.8 · كارب = ×2 (عادي) أو ×1 (قليل).</p>${inp('وزن الجسم (كجم)','bw',0.5)}${inp('بروتين × الوزن','pM')}${inp('كارب (يوم عادي) × الوزن','cH')}${inp('كارب (يوم قليل) × الوزن','cL')}${inp('دهون × الوزن','fM')}`,true);
  }else{
    const G=goalCore(s),w=+s.bw||70,adjL=gl.sign>0?'الفائض':'العجز',unit=g.mode==='kcal'?'سعرة/يوم':g.mode==='rate'?(gl.sign>0?'% من الوزن/شهر':'% من الوزن/أسبوع'):'% من TDEE';
    head=`<div class="sum" style="position:static">${ring(G.k,G.tdee).replace(/aria-label="[^"]*"/,`aria-label="سعرات الهدف ${rd(G.k)} من احتياجك ${rd(G.tdee)}"`).replace(/من (\d+)<\/text>/,'من $1</text>')}<div class="mcs"><p class="motiv">${rd(G.k)} سعرة يومياً في المتوسط</p><span class="note" style="margin:0">احتياجك ${rd(G.tdee)}${gl.sign===0?'':' · '+adjL+' '+sg(G.adj)}</span><span class="note" style="margin:0">تغيّر الوزن المتوقع ${G.rate>0?'+':''}${G.rate.toFixed(2)} كجم أسبوعياً</span></div></div>${G.flags.map(f=>`<p class="note" style="color:var(--hi);margin:6px 0 0">⚠ ${esc(f)}</p>`).join('')}`;
    secs+=fold(gl.sign===0?'البروتين والدهون':adjL+' والماكروز',`بروتين ${g.pr} جم/كجم · دهون ${g.fat}${g.fatM==='kg'?' جم/كجم':'%'}`,
      `${gl.sign===0?'':sel('طريقة تحديد '+adjL,'gp','mode',[['pct','نسبة % من TDEE'],['kcal','سعرات ثابتة يومياً'],['rate','معدل تغيّر الوزن']],g.mode)+num(adjL,'gp','val',g.val,0.05,unit)}
      ${num('البروتين','gp','pr',g.pr,0.1,'جم/كجم')}${sel('أساس البروتين','gp','prB',[['bw','وزن الجسم'],['lbm','الكتلة الخالية (تحتاج نسبة دهون)']],g.prB)}
      ${num('الدهون','gp','fat',g.fat,1,g.fatM==='kg'?'جم/كجم':'% من السعرات')}${sel('أساس الدهون','gp','fatM',[['pct','% من السعرات'],['kg','جم لكل كجم']],g.fatM)}
      <p class="note" style="margin:4px 0 0">الكارب = المتبقي من السعرات بعد البروتين والدهون.</p>`);
    secs+=fold('طريقة الحساب',`${esc(eqOf(s).name)} · BMR ${rd(G.bmr)} · ${+s.tdeeM>0?'احتياج يدوي':'نشاط × '+s.act}`,
      `<p class="note">بياناتك: ${profLine(s)} · <button class="lnk" data-act="tab" data-v="me/profile">تعديل</button></p>
      ${sel('معادلة BMR','sset','eq',s.eqs.map(e=>[e.id,e.name]),s.eq)}<p class="note" style="margin:0">${esc(eqOf(s).note||'')} (المعاملات وإضافة معادلة: من حسابي › متقدم)</p>
      ${inp('احتياج يومي يدوي TDEE (اختياري، يتجاوز المعادلة)','tdeeM',10)}`);
  }
  const pat=s.cyc.pat,nLo=pat.filter(x=>x==='low').length,ovl=DAYS.map((n,i)=>{const o=dayOv(i);return o?`${n} (${o.rep?'كل أسبوع':'هذا الأسبوع'}: ${ovDesc(o)})`:''}).filter(Boolean);
  const patUI=`<div class="grp" style="margin-top:4px">نمط الأسبوع</div><div class="pat" role="group" aria-label="نمط الأسبوع">${DAYS.map((n,i)=>`<button type="button" data-act="patday" data-v="${i}" class="${pat[i]}" aria-pressed="${pat[i]==='low'}" aria-label="${n}: ${ML[pat[i]]}"><b>${'سحنثرخج'[i]}</b><small>${pat[i]==='low'?'قليل':'عادي'}</small></button>`).join('')}</div>
    <div class="chips" style="margin:6px 0">${[['alt','يوم ويوم'],['p52','5 عادي + 2 قليل'],['high','كل الأيام عادي'],['low','كل الأيام قليل']].map(([v,l])=>`<button type="button" data-act="patset" data-v="${v}">${l}</button>`).join('')}</div>
    <p class="note" style="margin:0">اضغط اليوم للتبديل بين عادي وقليل. يُطبَّق على كل أسبوع.${ovl.length?'<br>أيام معدّلة (تتقدّم على النمط): '+esc(ovl.join('، ')):''} لتعديل يوم بعينه: «اليوم» ← ⋯ ← «تعديل هذا اليوم».</p>`;
  secs+=fold('دورة الكارب',`${7-nLo} عادي · ${nLo} قليل${goalOf(s).kind==='manual'?'':cycOn?` · القليل ${rd(s.cyc.r*100)}% من العادي`:' · النسبة معطّلة'}`,
    `${goalOf(s).kind==='manual'?'<p class="note" style="margin:0 0 4px">في «كارب أقل» كارب كل نوع يوم من «المضاعفات» أعلاه.</p>':`<label><span><input type="checkbox" data-ch="cyc" data-k="on" ${cycOn?'checked':''} style="width:auto"> تفعيل (المتوسط الأسبوعي ثابت)</span></label>
    ${num('كارب اليوم القليل = ٪ من اليوم العادي','cyc','r',rd(s.cyc.r*100),5,'%')}`}
    ${patUI}`);
  secs+=fold('البدائل','مطابقة البدائل: '+(s.by==='kcal'?'السعرات':'الماكرو الرئيسي'),`<label>مطابقة البدائل افتراضياً<select data-ch="by"><option value="auto" ${s.by==='auto'?'selected':''}>الماكرو الرئيسي للصنف</option><option value="kcal" ${s.by==='kcal'?'selected':''}>السعرات</option></select></label>`);
  secs+=fold('النطاقات المرجعية','مصادر الأرقام الافتراضية',`<ul class="note" style="padding-inline-start:18px;margin:0">
  <li>BMR: Mifflin-St Jeor الأكثر اعتماداً (≈82% من غير المصابين بالسمنة ضمن ±10% من القياس في إحدى المراجعات). Katch-McArdle وCunningham تعتمدان على الكتلة الخالية فتحتاجان نسبة دهون دقيقة.</li>
  <li>التنحيف: فقد 0.5–1% من وزن الجسم أسبوعياً للحفاظ على العضلات؛ بروتين 2.3–3.1 جم/كجم كتلة خالية؛ دهون 15–30% من السعرات (Helms وآخرون 2014، تحضير المسابقات).</li>
  <li>البروتين عموماً: 1.4–2.0 جم/كجم من وزن الجسم لمعظم الرياضيين، وأكثر عند تقييد السعرات (ISSN 2017).</li>
  <li>زيادة الوزن: فائض 5–20% من التثبيت (≈250–500 سعرة)، والمتقدمون عند الطرف الأدنى؛ وزيادة وزن الجسم نحو 0.25–0.5% أسبوعياً. تقديرات بحسب الخبرة (شهرياً): مبتدئ 1–1.5%، متوسط 0.5–1%، متقدم 0.25–0.5%.</li>
  <li>بناء العضلات: فائض أصغر (5–10%) مع بروتين 1.6–2.2 جم/كجم لتقليل الدهون المكتسبة.</li>
  <li>إظهار العضلات: الإعداد الافتراضي (عجز 10% وبروتين مرتفع) اجتهاد مقترح وليس رقماً منصوصاً في المصادر؛ عدّله حسب استجابتك.</li>
  <li>تحويل التغيّر إلى وزن يعتمد التقريب 7700 سعرة ≈ 1 كجم؛ وهو تقدير، والمرجع هو اتجاه وزنك الفعلي.</li></ul>`);
  return `${chips}<div class="card">${head}${dayTiles(cycOn?'يوم كارب عادي':'كل يوم',hi)}${cycOn?dayTiles('يوم كارب قليل',lo):''}</div>
  ${secs}
  <button class="btn pri" style="width:100%;margin-top:4px" data-act="refitweek">ضبط كميات الأسبوع على هذه الأهداف</button>
  <p class="note" style="margin:6px 2px">تغيير الهدف لا يغيّر كميات الأيام حتى تضغط الزر أعلاه.</p>`;
}
const SIGNS=[[-1,'عجز'],[0,'ثبات'],[1,'فائض']];
function vEqMgmt(s){
  const goals=s.goals.map(gl=>`<div class="shi"><input value="${esc(gl.name)}" data-ch="gln" data-id="${gl.id}" data-k="name" aria-label="اسم الهدف" style="flex:1;min-width:0">${gl.kind==='manual'?'<span class="tag">مضاعفات ثابتة</span>':`<select data-ch="gln" data-id="${gl.id}" data-k="sign" aria-label="اتجاه الهدف ${esc(gl.name)}">${SIGNS.map(([v,t])=>`<option value="${v}" ${gl.sign===v?'selected':''}>${t}</option>`).join('')}</select>`}<button class="more" aria-label="حذف الهدف ${esc(gl.name)}" data-act="gldel" data-id="${gl.id}">✕</button></div>`).join('');
  const eqs=s.eqs.map(e=>{const pv=bmrWith(e,s),cur=s.eq===e.id;
    const co=e.type==='lin'?`<div style="overflow-x:auto"><table class="coef"><tr><th></th><th>الوزن</th><th>الطول</th><th>العمر</th><th>كتلة خالية</th><th>ثابت</th></tr>${['m','f'].map(sx=>`<tr><td>${sx==='m'?'ذكر':'أنثى'}</td>${['w','h','a','l','c'].map(k=>`<td><input type="number" step="any" value="${e[sx][k]}" data-ch="eqc" data-id="${e.id}" data-sx="${sx}" data-k="${k}" aria-label="معامل ${k} ${sx==='m'?'ذكر':'أنثى'}"></td>`).join('')}</tr>`).join('')}</table></div><p class="note">BMR = الوزن×م + الطول×م + العمر×م + الكتلة الخالية×م + الثابت. أي معامل للكتلة الخالية يتطلب نسبة دهون.</p>`:'<p class="note">معادلة بحسب الفئة العمرية (جدول WHO)؛ معاملاتها ثابتة ويمكن تغيير اسمها وحذفها.</p>';
    return `<details class="fold"${ui.eqo===e.id?' open':''}><summary><span style="flex:1">${esc(e.name)}${cur?' <span class="pill">المستخدمة</span>':''}<small style="display:block;font-weight:400;color:var(--mu);font-size:12px">BMR لبياناتك: ${pv==null?'غير متاح (تحتاج نسبة دهون أو عمر ضمن النطاق)':rd(pv)}</small></span></summary><div class="set">
    <label>الاسم<input value="${esc(e.name)}" data-ch="eqn" data-id="${e.id}" data-k="name"></label><label style="display:block">ملاحظة<input value="${esc(e.note||'')}" data-ch="eqn" data-id="${e.id}" data-k="note" style="width:100%"></label>${co}
    <button class="btn dan" style="margin-top:8px" data-act="eqdel" data-id="${e.id}">حذف المعادلة</button></div></details>`}).join('');
  return `<div class="grp">الأهداف</div><div class="list">${goals}</div>
  <div class="card"><div class="fr2"><input id="gl_n" placeholder="اسم هدف جديد" aria-label="اسم هدف جديد"><select id="gl_s" aria-label="اتجاه الهدف الجديد">${SIGNS.map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select><button class="btn pri" style="flex:0 0 auto" data-act="gladd">إضافة</button></div></div>
  <div class="grp">معادلات BMR</div>${eqs}
  <button class="add" data-act="eqadd">+ معادلة جديدة (نسخة من المستخدمة)</button>
  <div class="grp">منطقة الخطر</div><div class="list"><button class="li dz" data-act="glreset"><span class="g"><b>استعادة الأهداف الافتراضية</b><small>تُحذف الأهداف المخصصة وتعديلاتها</small></span></button><button class="li dz" data-act="eqreset"><span class="g"><b>استعادة المعادلات الافتراضية</b><small>تُحذف المعادلات المخصصة وتعديلاتها</small></span></button></div>
  <p class="note">الاستعادة تعيد القوائم فقط ولا تمس بياناتك. بعد أي تغيير استخدم «ضبط كميات الأسبوع» من «أهدافي».</p>`;
}
function vCloud(){const c=cloud,on=!!c.sess,up=ui.authM==='up';
  if(on)return `<div class="card set"><h2 style="margin:0 0 6px">حسابك</h2>
  ${ui.recov?`<label>كلمة مرور جديدة (6 أحرف فأكثر)<input id="cl_np" type="password" dir="ltr" autocomplete="new-password" style="width:100%"></label><div class="btns" style="margin:6px 0"><button class="btn pri" data-act="cnewpw">حفظ كلمة المرور الجديدة</button></div>`:''}
  <p style="margin:0 0 6px">البريد: <b dir="ltr">${esc(c.email||'')}</b></p>
  <label>رقم الجوال${c.phone?'':' <span class="tag">مطلوب</span>'}<span><input id="cl_ph" type="tel" dir="ltr" inputmode="tel" autocomplete="tel" spellcheck="false" placeholder="+9665xxxxxxxx" value="${esc(c.phone||'')}" style="flex:1"> <button class="btn" style="flex:0 0 auto" data-act="cphone">حفظ</button></span></label>
  <p class="note" style="margin:8px 0 0">✓ كل تعديل يُحفظ في حسابك تلقائياً${navigator.onLine===false?' عند عودة الاتصال':''}، فتجد بياناتك على أي جهاز تسجّل منه.</p>
  <p class="note" id="cst">${esc(c.last||'')}</p>
  <div class="btns"><button data-act="cpush">حفظ الآن</button><button data-act="cpull">استرجاع بياناتي من الحساب</button><button data-act="clogout">تسجيل الخروج</button></div></div>`;
  return `<div class="card set"><h2 style="margin:0 0 6px">حسابك</h2>
  <p class="note" style="margin:0 0 8px">أنشئ حساباً ليُحفظ كل شيء تلقائياً، وتجد بياناتك على أي جهاز وتشاركها مع مدربك أو عائلتك. بدون حساب تبقى البيانات على هذا الجهاز فقط.</p>
  <div class="seg" role="tablist" style="margin-bottom:8px"><button role="tab" aria-selected="${!up}" class="${up?'':'on'}" data-act="cauthm" data-v="in">تسجيل الدخول</button><button role="tab" aria-selected="${up}" class="${up?'on':''}" data-act="cauthm" data-v="up">حساب جديد</button></div>
  <label>البريد<input id="cl_em" dir="ltr" type="email" name="email" autocomplete="email" spellcheck="false" value="${esc(c.email||'')}" data-ch="cl" data-k="email" style="width:100%"></label>
  ${up?`<label>رقم الجوال<input id="cl_ph" type="tel" name="tel" dir="ltr" inputmode="tel" autocomplete="tel" spellcheck="false" placeholder="+9665xxxxxxxx" style="width:100%"></label>`:''}
  <label>كلمة المرور${up?' (6 أحرف فأكثر)':''}<input id="cl_pw" type="password" name="password" dir="ltr" autocomplete="${up?'new-password':'current-password'}" style="width:100%"></label>
  <div class="btns">${up?'<button class="btn pri" data-act="csignup">إنشاء الحساب</button>':'<button class="btn pri" data-act="clogin">تسجيل الدخول</button>'}</div>
  ${up?'<p class="note">سنرسل رابط تفعيل إلى بريدك. التفعيل برمز على الجوال قريباً.</p>':'<div class="btns" style="margin-top:6px"><button data-act="cforgot">نسيت كلمة المرور؟ أرسل رابط استعادة</button></div>'}
  <p class="note" id="cst">${esc(c.last||'')}</p></div>`;
}
