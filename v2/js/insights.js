// v2/js/insights.js — سجل الوزن، الاحتياج الفعلي، والتقرير الأسبوعي (بيانات المستخدم تخدمه هو)
// سكربت عادي (ليس module): كل الملفات تتشارك نطاقاً عاماً واحداً وتُحمَّل بالترتيب في index.html.
// لا تستدعِ عند التحميل دالة من ملف لاحق؛ الاستدعاء داخل الدوال مسموح.

// ---------- سجل الوزن: settings.wlog = [{d:'YYYY-MM-DD', w:كجم}] (وزن واحد لكل تاريخ، يُرفع مع الإعدادات) ----------
function wlog(){const s=state.settings;if(!Array.isArray(s.wlog))s.wlog=[];return s.wlog}
function wAdd(d,w){w=+w;if(!(w>=20&&w<=400))return false;const L=wlog(),i=L.findIndex(x=>x.d===d);
  if(i>=0)L[i].w=w;else L.push({d,w});L.sort((a,b)=>a.d<b.d?-1:1);
  const last=L[L.length-1];state.settings.bw=last.w;return true}  // آخر وزن يصبح وزن الملف فتتحدث الأهداف
function wDel(d){const L=wlog(),i=L.findIndex(x=>x.d===d);if(i>=0)L.splice(i,1);if(L.length)state.settings.bw=L[L.length-1].w}
const daysBetween=(a,b)=>Math.round((parseISO(b)-parseISO(a))/864e5);
// ميل الوزن (كجم/يوم) بالمربعات الصغرى
function wSlope(pts){const n=pts.length;if(n<2)return 0;const x0=pts[0].d;const X=pts.map(p=>daysBetween(x0,p.d)),Y=pts.map(p=>p.w);
  const mx=X.reduce((a,b)=>a+b,0)/n,my=Y.reduce((a,b)=>a+b,0)/n;let num=0,den=0;X.forEach((x,i)=>{num+=(x-mx)*(Y[i]-my);den+=(x-mx)*(x-mx)});return den?num/den:0}
// الوزن المتوقع عند تاريخ (من الاتجاه) — يخفف تذبذب الماء والملح
function wChange(days){const L=wlog(),to=todayISO(),from=iso(addDays(new Date(),-days));const pts=L.filter(x=>x.d>=from&&x.d<=to);
  if(pts.length<2||daysBetween(pts[0].d,pts[pts.length-1].d)<Math.min(5,days-1))return null;return wSlope(pts)*days}

// ---------- الاحتياج الفعلي: متوسط ما أُكل − (تغيّر الوزن × 7700) ----------
const KCAL_KG=7700,TD_WIN=28,TD_MIN_DAYS=7,TD_MIN_W=3,TD_MIN_SPAN=10;
const allRecs=()=>(ui.remote?ui.remote.hist:hAll(meta.cur))||[];
function realTdee(){
  const to=todayISO(),from=iso(addDays(new Date(),-(TD_WIN-1)));
  const recs=allRecs().filter(r=>r&&r.date>=from&&r.date<=to).map(r=>({r,L:dayLog(r)})).filter(x=>x.L.total>0&&x.L.logged===x.L.total);
  const pts=wlog().filter(x=>x.d>=from&&x.d<=to),span=pts.length?daysBetween(pts[0].d,pts[pts.length-1].d):0;
  const need=[];
  if(recs.length<TD_MIN_DAYS)need.push(`أكمل تسجيل ${TD_MIN_DAYS-recs.length} ${TD_MIN_DAYS-recs.length===1?'يوم':'أيام'} أخرى`);
  if(pts.length<TD_MIN_W||span<TD_MIN_SPAN)need.push(pts.length<TD_MIN_W?`سجّل وزنك ${TD_MIN_W-pts.length} ${TD_MIN_W-pts.length===1?'مرة':'مرات'} أخرى`:`استمر في تسجيل الوزن ${TD_MIN_SPAN-span} ${TD_MIN_SPAN-span===1?'يوم':'أيام'} أخرى`);
  if(need.length)return{need,days:recs.length,wn:pts.length};
  const avgK=recs.reduce((a,x)=>a+x.L.eaten.k,0)/recs.length,slope=wSlope(pts),v=avgK-slope*KCAL_KG;
  if(!(v>=1000&&v<=6000))return{need:['الأرقام غير منطقية بعد — راجع تسجيل الأكل والوزن'],days:recs.length,wn:pts.length};
  return{v,avgK,slope,days:recs.length,wn:pts.length,span};
}
const formulaTdee=s=>{const b=bmrCalc(s);return b.v*(+s.act||1.55)};
// تحديث تلقائي مرة كل أسبوع إن فعّله المستخدم
function autoTdee(){const s=S();if(!s.tdeeAuto||s.tdeeWk===weekKey())return false;const r=realTdee();if(!r.v)return false;
  s.tdeeM=rd(r.v);s.tdeeWk=weekKey();return rd(r.v)}

// ---------- التقرير الأسبوعي (الأسبوع الماضي: السبت–الجمعة) ----------
function weekReport(){
  const s=S(),ws=weekStart(),from=iso(addDays(ws,-7)),to=iso(addDays(ws,-1));
  const A=allRecs().filter(r=>r&&r.date>=from&&r.date<=to).map(r=>({r,L:dayLog(r)}));
  if(!A.length)return null;
  const done=A.filter(x=>x.L.total>0&&x.L.logged===x.L.total),mean=(a,f)=>a.length?a.reduce((t,x)=>t+f(x),0)/a.length:0;
  const adh=mean(done,x=>x.L.plan.k?Math.min(150,x.L.eaten.k/x.L.plan.k*100):0);
  const ph=done.filter(x=>x.L.eaten.p>=x.r.tg.p*0.95).length;
  const avgK=mean(done,x=>x.L.eaten.k),avgT=mean(done,x=>x.r.tg.k);
  // الوزن: اتجاه الأسبوع إن وُجد وزنان على الأقل حوله
  const pts=wlog().filter(x=>x.d>=iso(addDays(ws,-10))&&x.d<=iso(addDays(ws,2)));
  const wch=pts.length>=2&&daysBetween(pts[0].d,pts[pts.length-1].d)>=4?wSlope(pts)*7:null;
  const goalRate=goalOf(s).kind==='manual'?null:goalCore(s).rate;
  // أضعف يوم في الأسبوع على آخر 4 أسابيع
  const f4=iso(addDays(ws,-28)),by={};
  allRecs().filter(r=>r&&r.date>=f4&&r.date<=to).forEach(r=>{const L=dayLog(r);if(!L.plan.k||!L.logged)return;const k=r.dow!=null?r.dow:DAYS.indexOf(r.name);if(k<0)return;(by[k]=by[k]||[]).push(Math.min(150,L.eaten.k/L.plan.k*100))});
  const dows=Object.entries(by).filter(([,v])=>v.length>=2).map(([k,v])=>[+k,v.reduce((a,b)=>a+b,0)/v.length]);
  const weak=dows.length>=3?dows.sort((a,b)=>Math.abs(100-b[1])-Math.abs(100-a[1]))[0]:null;
  return{from,to,n:A.length,done:done.length,adh,ph,avgK,avgT,wch,goalRate,weak};
}
const repKey=()=>'mp3_rep_'+meta.cur;

// ---------- البطاقات في «التقدم» ----------
function vWeightCard(){
  const L=wlog(),last=L[L.length-1],tday=L.find(x=>x.d===todayISO()),c7=wChange(7),c30=wChange(30);
  const pts=L.filter(x=>x.d>=iso(addDays(new Date(),-59)));let spark='';
  if(pts.length>=2){const ws=pts.map(p=>p.w),mn=Math.min(...ws),mx=Math.max(...ws),rg=mx-mn||1,x0=pts[0].d,tot=Math.max(1,daysBetween(x0,pts[pts.length-1].d));
    const P=pts.map(p=>`${(daysBetween(x0,p.d)/tot*296+2).toFixed(1)},${(38-(p.w-mn)/rg*34).toFixed(1)}`).join(' ');
    spark=`<svg viewBox="0 0 300 40" width="100%" height="40" role="img" aria-label="الوزن آخر 60 يوماً من ${mn} إلى ${mx} كجم" style="margin-top:6px"><polyline points="${P}" fill="none" stroke="var(--act)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`}
  const ch=(v,l)=>v==null?'':`<div class="tile"><b dir="ltr">${v>0?'+':''}${v.toFixed(1)}</b><small>كجم ${l}</small></div>`;
  return `<div class="card"><h2 style="margin:0 0 6px">الوزن</h2>
  <div class="fr2"><input id="w_in" type="number" step="0.1" min="20" max="400" inputmode="decimal" aria-label="وزن اليوم بالكجم" placeholder="${last?last.w:'كجم'}" value="${tday?tday.w:''}"><button class="btn pri" style="flex:0 0 auto" data-act="wsave">${tday?'تعديل وزن اليوم':'حفظ وزن اليوم'}</button></div>
  ${last?`<p class="note" style="margin:6px 0 0">آخر وزن: <b>${last.w}</b> كجم · ${esc(dateShort(last.d))}</p>`:'<p class="note" style="margin:6px 0 0">سجّل وزنك صباحاً بعد الاستيقاظ، مرتين أو أكثر في الأسبوع.</p>'}
  ${c7!=null||c30!=null?`<div class="tiles" style="margin-top:6px">${ch(c7,'آخر 7 أيام')}${ch(c30,'آخر 30 يوماً')}</div>`:''}${spark}
  ${L.length?`<details class="fold" style="box-shadow:none;margin:6px 0 0"><summary>سجل الوزن (${L.length})</summary><div>${L.slice().reverse().slice(0,30).map(x=>`<div class="dv"><span>${esc(dateShort(x.d))}</span><b>${x.w} كجم <button class="lnk" data-act="wdel" data-d="${x.d}" aria-label="حذف وزن ${esc(dateShort(x.d))}">حذف</button></b></div>`).join('')}</div></details>`:''}</div>`;
}
function vTdeeCard(){
  const s=S(),r=realTdee(),f=formulaTdee(s);
  if(!r.v)return `<div class="card"><h2 style="margin:0 0 4px">احتياجك الفعلي</h2><p class="note" style="margin:0">نحسبه من وزنك وما أكلته فعلاً خلال آخر 4 أسابيع، فيكون أدق من أي معادلة. ينقصنا: ${esc(r.need.join('، '))}.</p>
    <p class="note" style="margin:4px 0 0">حتى الآن: ${r.days} ${r.days===1?'يوم مكتمل':'أيام مكتملة'} · ${r.wn} ${r.wn===1?'وزن':'أوزان'}.</p></div>`;
  const used=+s.tdeeM>0&&Math.abs(+s.tdeeM-r.v)<15;
  return `<div class="card"><h2 style="margin:0 0 4px">احتياجك الفعلي</h2>
  <div class="tiles"><div class="tile"><b>${rd(r.v)}</b><small>سعرة/يوم (الفعلي)</small></div><div class="tile"><b>${rd(f)}</b><small>حسب المعادلة</small></div></div>
  <p class="note" style="margin:6px 0 0">من ${r.days} أيام مكتملة (متوسط ${rd(r.avgK)} سعرة) و${r.wn} أوزان على ${r.span} يوماً: الوزن ${r.slope*7>0?'يزيد':'ينقص'} ${Math.abs(r.slope*7).toFixed(2)} كجم/أسبوع.</p>
  ${goalOf(s).kind==='manual'?`<p class="note" style="margin:6px 0 0">هدفك «${esc(goalOf(s).name)}» مضاعفات ثابتة للوزن ولا يعتمد على الاحتياج. لتُبنى سعراتك على احتياجك الفعلي اختر هدفاً محسوباً (تنحيف، تثبيت…).</p><div class="btns" style="margin-top:6px"><button class="btn" data-act="tab" data-v="me/goals">إلى أهدافي</button></div>`
  :`<div class="btns" style="margin-top:6px">${used?'<span class="pill">مُستخدم في أهدافك</span>':'<button class="btn pri" data-act="tdeeuse">استخدامه في أهدافي</button>'}</div>
  <label style="margin-top:6px"><span><input type="checkbox" data-ch="tdeeauto" ${s.tdeeAuto?'checked':''} style="width:auto"> حدّثه تلقائياً كل أسبوع</span></label>`}</div>`;
}
function vReportCard(){
  const R=weekReport();if(!R)return '';
  const pct=x=>rd(x)+'%',wl=R.wch==null?'—':(R.wch>0?'+':'')+R.wch.toFixed(1)+' كجم';
  const tips=[];
  if(R.done&&R.ph<R.done)tips.push(`البروتين تحقق في ${R.ph} من ${R.done} أيام — أضف مصدر بروتين للوجبة الأضعف.`);
  if(R.weak)tips.push(`أضعف أيامك آخر 4 أسابيع: ${DAYS[R.weak[0]]} (${pct(R.weak[1])} من الخطة). جهّز له مسبقاً أو عدّل خطته من «تعديل هذا اليوم».`);
  if(R.wch!=null&&R.goalRate){const d=R.wch-R.goalRate;if(Math.abs(d)>0.25)tips.push(R.goalRate<0?(d>0?'نزولك أبطأ من هدفك: راجع الالتزام قبل خفض السعرات.':'نزولك أسرع من المتوقع: انتبه للعضلات، وقد ترفع السعرات قليلاً.'):(d<0?'زيادتك أبطأ من هدفك.':'زيادتك أسرع من هدفك: قد يزيد الدهون.'))}
  if(R.n-R.done>0)tips.push(`${R.n-R.done} ${R.n-R.done===1?'يوم':'أيام'} بتسجيل ناقص — إكمالها يجعل حساباتك أدق.`);
  return `<div class="card"><h2 style="margin:0 0 6px">أسبوعك الماضي <small style="font-weight:400;color:var(--mu);font-size:12px">${esc(rangeLabel(R.from,R.to))}</small></h2>
  <div class="tiles"><div class="tile"><b>${R.done}/7</b><small>أيام مكتملة</small></div><div class="tile"><b>${R.done?pct(R.adh):'—'}</b><small>الالتزام بالسعرات</small></div><div class="tile"><b dir="ltr">${wl}</b><small>الوزن${R.goalRate!=null?` (الهدف ${R.goalRate>0?'+':''}${R.goalRate.toFixed(1)})`:''}</small></div></div>
  ${R.done?`<p class="note" style="margin:6px 0 0">المتوسط ${rd(R.avgK)} سعرة مقابل هدف ${rd(R.avgT)}.</p>`:''}
  ${tips.length?`<ul class="note" style="padding-inline-start:18px;margin:6px 0 0">${tips.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:''}</div>`;
}
