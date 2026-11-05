// v2/js/views-me.js — الشاشات: حسابي والعناوين والشخص المشارك والنوافذ
// سكربت عادي (ليس module): كل الملفات تتشارك نطاقاً عاماً واحداً وتُحمَّل بالترتيب في index.html.
// لا تستدعِ عند التحميل دالة من ملف لاحق؛ الاستدعاء داخل الدوال مسموح.
// ---------- حسابي ----------
const ICON={
 day:'<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/><circle cx="12" cy="15.5" r="1.8" fill="currentColor" stroke="none"/>',
 week:'<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18M7.5 14h2M14.5 14h2M7.5 17.5h2M14.5 17.5h2"/>',
 hist:'<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
 foods:'<path d="M12 7.5c-1.6-1.4-5-1.6-6.4 1C4.2 11 5 15.2 7 18c1.2 1.7 2.6 2.9 4 2.3.6-.3 1.4-.3 2 0 1.4.6 2.8-.6 4-2.3 2-2.8 2.8-7 1.4-9.5-1.4-2.6-4.8-2.4-6.4-1z"/><path d="M12 7.5c0-2 1-3.6 3-4.5"/>',
 me:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
 chev:'<path d="M15 6l-6 6 6 6"/>',back:'<path d="M9 6l6 6-6 6"/>',
 profile:'<rect x="4" y="3" width="16" height="18" rx="3"/><circle cx="12" cy="10" r="3"/><path d="M7.5 17c1-2 2.6-3 4.5-3s3.5 1 4.5 3"/>',
 goals:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".8" fill="currentColor"/>',
 family:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.5c2.5 0 4.2 1.4 5 4"/>',
 sync:'<path d="M7 18h10a4 4 0 00.6-7.95A6 6 0 006.2 9.1 4.5 4.5 0 007 18z"/><path d="M12 11v5M9.5 13.5L12 11l2.5 2.5"/>',
 data:'<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
 advanced:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
 reset:'<path d="M4 12a8 8 0 108-8H8"/><path d="M8 1l-3 3 3 3"/>',
 trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
 logout:'<path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 16l-4-4 4-4M6 12h10"/>'
};
const ico=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;
const TABS=[['day','اليوم'],['week','الخطة'],['hist','التقدم'],['foods','الأصناف'],['me','حسابي']];
const SUBS={profile:'ملفي الشخصي',goals:'أهدافي',family:'الأشخاص والمشاركة',clients:'متدربيني',mode:'نوع الاستخدام',sync:'حسابي',data:'بياناتي',advanced:'متقدم'};
const APP_VER='2.12';
// نوع الاستخدام: يحدد ما يظهر في «حسابي»، ويمكن تغييره في أي وقت
const MODES=[['self','لنفسي','خطتي وحدي'],['family','لي ولعائلتي','أفراد وأطفال تديرهم'],['coach','مدرب مستقل','متابعة متدربين'],['org','مؤسسة','مدربون وأخصائيو تغذية']];
const isCoach=()=>meta.mode==='coach'||meta.mode==='org';
// ميزات تتحكم بها لوحة الإدارة (للعرض فقط؛ حماية البيانات في RLS). القاعدة: استثناء الحساب ← إعداد نوع الاستخدام ← مفعّلة.
// الإعدادات الأخيرة محفوظة في الجهاز (mp3_pub / mp3_acct) فتسري بلا إنترنت أيضاً. تسجيل الدخول والمزامنة لا تُغلق أبداً.
const FEATS=[['scan','المسح بالصورة والباركود'],['online','البحث أونلاين (USDA وOpen Food Facts)'],['shop','قائمة المشتريات'],['multi','أكثر من ملف (أفراد وأطفال)'],['share','المشاركة بكود'],['clients','متدربيني']];
const pubCfg=()=>(ui.pub&&ui.pub.cfg)||lsGet('mp3_pub')||{};
const acct=()=>lsGet('mp3_acct')||{};
function feat(k){
  const o=acct().features;if(o&&typeof o[k]==='boolean')return o[k];
  const g=(pubCfg().features||{})[k];if(g&&typeof g==='object'&&meta.mode&&typeof g[meta.mode]==='boolean')return g[meta.mode];
  return true;
}
// نوع الاستخدام في السحابة هو المرجع بعد تسجيل الدخول؛ تغيير محلي لم يُرفع بعد (modePending) يُرفع أولاً.
async function syncAcct(){if(!cloud.sess||!cloud.sess.uid)return;
  try{
    if(meta.modePending&&meta.mode){const r=await cFetch('/rest/v1/rpc/mp_set_mode',{method:'POST',body:{p_mode:meta.mode}});delete meta.modePending;saveMeta();if(r)lsSet('mp3_acct',{mode:r.mode,features:r.features||{}});return}
    const rows=await cFetch('/rest/v1/mp_accounts?select=mode,features&owner=eq.'+ENC(cloud.sess.uid));const r=Array.isArray(rows)&&rows[0];
    if(r){lsSet('mp3_acct',{mode:r.mode,features:r.features||{}});if(r.mode&&r.mode!==meta.mode){meta.mode=r.mode;saveMeta()}}
    else{lsSet('mp3_acct',{});if(meta.mode){const x=await cFetch('/rest/v1/rpc/mp_set_mode',{method:'POST',body:{p_mode:meta.mode}});if(x)lsSet('mp3_acct',{mode:x.mode,features:x.features||{}})}}
  }catch(e){}
}
const ROLES={viewer:'مشاهد',editor:'محرر',coach:'مدرب / أخصائي'};
const ROLE_NOTE={viewer:'يرى الخطة والتقدم فقط',editor:'يرى ويعدّل الخطة والأهداف',coach:'يرى ويعدّل الخطة والأهداف ويتابع الالتزام'};
// عناوين الرابط: #/plan، #/me/goals … (اليوم بلا عنوان)
const RT={day:'today',week:'plan',hist:'progress',foods:'foods',me:'me'};
function routeHash(){const r=RT[ui.tab]||'today';return r==='today'?'':'#/'+r+(ui.tab==='me'&&ui.sub?'/'+ui.sub:'')}
function fromHash(){const m=location.hash.match(/^#\/([a-z]+)(?:\/([a-z]+))?$/);if(!m)return false;
  const t=Object.keys(RT).find(k=>RT[k]===m[1]);if(!t)return false;ui.tab=t;ui.sub=t==='me'&&SUBS[m[2]]?m[2]:'';return true}
function syncHash(){const h=routeHash(),cur=location.hash;
  if(cur&&!cur.startsWith('#/'))return;   // رابط تأكيد/استعادة Supabase: يعالجه cHash
  if(h===cur)return;try{history.pushState(null,'',h||location.pathname+location.search)}catch(e){}}
const li=(ic,t,sub,v,act,cls)=>`<button class="li ${cls||''}" data-act="${act||'tab'}" ${v?`data-v="${v}"`:''}><span class="ic">${ico(ic)}</span><span class="g"><b>${t}</b>${sub?`<small>${sub}</small>`:''}</span>${act?'':`<span class="chev">${ico('chev')}</span>`}</button>`;
const verLt=(a,b)=>{const x=String(a).split('.').map(Number),y=String(b).split('.').map(Number);for(let i=0;i<Math.max(x.length,y.length);i++){if((x[i]||0)!==(y[i]||0))return (x[i]||0)<(y[i]||0)}return false};
function banners(){
  const P=ui.pub||{},cfg=P.cfg,seen=lsGet('mp3_ann_seen')||[];let h='';
  if(storeErr)h+=`<div class="bnr warn" role="alert"><span class="g"><b>آخر تعديلاتك لم تُحفظ في هذا الجهاز</b>${storeErr.quota?'مساحة التخزين في المتصفح ممتلئة.':'المتصفح منع الحفظ (ربما وضع التصفح الخاص).'} صدّر نسخة احتياطية الآن حتى لا تضيع بياناتك عند إغلاق الصفحة.</span><span class="btns" style="display:flex;flex-direction:column;gap:6px;margin:0"><button class="btn pri" data-act="export">تصدير نسخة</button><button class="btn" data-act="retrysave">حاول مرة أخرى</button></span></div>`;
  if(!cloud.sess&&!ui.remote&&meta.consent!=='yes'&&!(meta.consentAsk&&Date.now()<meta.consentAsk))h+=`<div class="bnr info" role="status"><span class="g"><b>احفظ بياناتك في حسابك تلقائياً</b>تُحفظ خطتك وتسجيلك على خوادمنا لتجدها على أي جهاز وتشاركها مع مدربك، وتُستخدم مجمّعة بلا أسماء لتحسين الخدمة. <a href="privacy.html" target="_blank" rel="noopener">سياسة الخصوصية</a></span><span class="btns" style="display:flex;flex-direction:column;gap:6px;margin:0"><button class="btn pri" data-act="consent" data-v="yes">موافق</button><button class="btn" data-act="consent" data-v="later">ليس الآن</button></span></div>`;
  if(!ui.remote&&ui.tab==='day'&&lsGet(repKey())!==weekKey()){const R=weekReport();if(R&&R.n>=3)h+=`<div class="bnr info" role="status"><span class="g"><b>تقرير أسبوعك الماضي جاهز</b>${R.done} أيام مكتملة${R.done?' · التزام '+rd(R.adh)+'%':''}${R.wch!=null?' · الوزن '+(R.wch>0?'+':'')+R.wch.toFixed(1)+' كجم':''}</span><button class="btn pri" data-act="repopen">عرض التقرير</button></div>`}
  if(navigator.onLine===false)h+=`<div class="bnr info" role="status"><span class="g"><b>لا يوجد اتصال بالإنترنت</b>${ui.remote?'ملف المشارك يحتاج اتصالاً لحفظ التعديلات.':'التطبيق يعمل وتعديلاتك تُحفظ في هذا الجهاز.'}${cloud.sess&&!ui.remote?' تُحفظ في حسابك تلقائياً عند عودة الاتصال.':''}</span></div>`;
  const U=ui.upd;if(U&&!(cfg&&verLt(APP_VER,cfg.min_version))&&ui.updLater!==U.v)h+=`<div class="bnr info upd" role="status"><span class="g"><b>تحديث جديد جاهز (${esc(U.v)})</b>${U.notes.length?`<ul>${U.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul>`:''}بياناتك تبقى كما هي.</span><span class="btns" style="display:flex;flex-direction:column;gap:6px;margin:0"><button class="btn pri" data-act="updnow" ${ui.updBusy?'disabled':''}>${ui.updBusy?'جارٍ التحديث…':'تحديث الآن'}</button><button class="btn" data-act="updlater">لاحقاً</button></span></div>`;
  if(cfg&&verLt(APP_VER,cfg.min_version))h+=`<div class="bnr warn" role="alert"><span class="g"><b>تحديث مطلوب</b>هذه النسخة (${APP_VER}) أقدم من المسموح. أعد تحميل الصفحة للحصول على ${esc(cfg.latest_version)}.</span><button class="btn pri" data-act="reload">إعادة التحميل</button></div>`;
  (P.ann||[]).filter(a=>!seen.includes(a.id)).forEach(a=>{h+=`<div class="bnr ${a.level==='warn'?'warn':'info'}" role="status"><span class="g"><b>${esc(a.title)}</b>${esc(a.body||'')}</span><button class="btn" data-act="annx" data-v="${a.id}" aria-label="إخفاء الإعلان">إخفاء</button></div>`});
  if(ui.remote)h+=`<div class="bnr rm" role="status"><span class="g"><b>تعرض الآن: ${esc(ui.remote.name)}</b>${ROLES[ui.remote.role]} · ${canWrite()?'تعديلاتك على الخطة تُحفظ في حسابه، والتسجيل يبقى له':'مشاهدة فقط'}${ui.remote.busy?' · جارٍ الحفظ…':''}</span><button class="btn" data-act="whome">رجوع لملفي</button></div>`;
  if(!meta.mode&&ui.tab==='day'&&!ui.remote)h+=`<div class="card"><b>كيف ستستخدم التطبيق؟</b><p class="note" style="margin:2px 0 8px">نعرض لك ما تحتاجه فقط. يمكنك التغيير لاحقاً من حسابي.</p><div class="modes">${MODES.map(([k,t,d])=>`<button data-act="umode" data-v="${k}"><b>${t}</b><small>${d}</small></button>`).join('')}</div></div>`;
  return h;
}
// ---------- الشخص المشارك: يُحمَّل من السحابة ولا يُكتب في هذا الجهاز ----------
const canWrite=()=>!!ui.remote&&ui.remote.role!=='viewer';
const NAV_ACTS=new Set(['weekopts','wk','fgrp','fedit','nfopen','dayopts','itemopts','mopen','tab','back','day','goday','close','hopen','hr','cmp','who','whopick','whome','whoload','yes','undo','annx','reload','umode','copyshop','print','fu','by','agrp','gaccept','gleave','share','grevoke','gcreate','gcopy','scanclose','eqo']);
const LOG_ACTS=new Set(['wsave','wdel','tdeeuse','mfinish','qlog','log','logsave','logskip','logclr','hlog','hdel','logrest','logclear']);
const LOCAL_ACTS=new Set(['mpub','cdelacct','picdel','uadd','uren','usave','udel','uswitch','reset','import','export','cpush','cpull','rebuildweek']);
function remoteBlock(a){if(!ui.remote||NAV_ACTS.has(a))return '';
  if(LOG_ACTS.has(a))return 'التسجيل لصاحب الخطة فقط';
  if(LOCAL_ACTS.has(a))return 'ارجع لملفك أولاً';
  return canWrite()?'':'لديك صلاحية مشاهدة فقط'}
const qs=o=>Object.keys(o).map(k=>k+'=eq.'+ENC(o[k])).join('&');
async function openRemote(x){
  const k={owner:x.owner,id:x.user_id},kd={owner:x.owner,user_id:x.user_id};
  const [U,D,H]=await Promise.all([cFetch('/rest/v1/mp_users?select=*&'+qs(k)),cFetch('/rest/v1/mp_days?select=idx,data&order=idx&'+qs(kd)),cFetch('/rest/v1/mp_history?select=data&order=date.desc&limit=90&'+qs(kd))]);
  if(!U||!U[0])throw new Error('لم يعد لديك وصول إلى هذا الملف');
  const days=Array(7).fill(null);(D||[]).forEach(r=>days[r.idx]=r.data);
  const st={settings:U[0].settings,foods:U[0].foods,days};
  if(!validUser(st))throw new Error('خطة هذا الشخص غير مكتملة في السحابة');
  ui.remote={owner:x.owner,id:x.user_id,name:U[0].name,role:x.role,hist:(H||[]).map(r=>r.data)};
  state=st;modal=null;if(ui.tab==='me')ui.tab='day',ui.sub='';
}
function leaveRemote(){if(!ui.remote)return;clearTimeout(rT);ui.remote=null;state=loadUser(meta.cur)||defaultState()}
// يدمج تسجيل صاحب الخطة الأحدث في يوم عدّله المدرب، حتى لا يضيع ما سجّله أثناء التعديل
function mergeLog(mine,fresh){if(!fresh||!fresh.meals)return mine;
  mine.meals.forEach((m,mi)=>{const fm=fresh.meals[mi];if(!fm)return;
    m.items=m.items.filter(it=>!it.x);
    m.items.forEach((it,ii)=>{const fi=fm.items.filter(z=>!z.x)[ii];if(fi&&fi.f===it.f){if(fi.e!=null)it.e=fi.e;else delete it.e;if(fi.em!=null)it.em=fi.em;else delete it.em}});
    fm.items.filter(z=>z.x).forEach(z=>m.items.push(z))});
  if(fresh.lw)mine.lw=fresh.lw;return mine}
let rT=null;function rSched(){clearTimeout(rT);rT=setTimeout(()=>rPush().catch(e=>{ui.remote&&(ui.remote.busy=false);toast('تعذّر الحفظ: '+(e.message||e));render()}),1500)}
async function rPush(){const R=ui.remote;if(!R||!canWrite())return;R.busy=true;
  const now=new Date().toISOString(),k={owner:R.owner,id:R.id},kd={owner:R.owner,user_id:R.id};
  await cFetch('/rest/v1/mp_users?'+qs(k),{method:'PATCH',headers:{Prefer:'return=minimal'},body:{settings:state.settings,foods:state.foods,updated_at:now}});
  const F=await cFetch('/rest/v1/mp_days?select=idx,data&'+qs(kd))||[];
  for(let i=0;i<7;i++){const fr=F.find(r=>r.idx===i);const d=mergeLog(clone(state.days[i]),fr&&fr.data);state.days[i]=d;
    await cFetch('/rest/v1/mp_days?'+qs(Object.assign({idx:i},kd)),{method:'PATCH',headers:{Prefer:'return=minimal'},body:{data:d,updated_at:now}})}
  if(ui.remote===R){R.busy=false;render()}
}
async function loadShared(){if(!cloud.sess)return;
  await syncAcct();
  try{ui.isAdmin=!!(await cFetch('/rest/v1/rpc/is_admin',{method:'POST',body:{}}))}catch(e){}
  try{const arr=x=>Array.isArray(x)?x:[];ui.shared=arr(await cFetch('/rest/v1/rpc/mp_shared_with_me',{method:'POST',body:{}}));
    ui.grants=arr(await cFetch('/rest/v1/rpc/mp_my_grants',{method:'POST',body:{}}));
    if(isCoach()&&ui.shared.length){const or=ui.shared.map(x=>'and(owner.eq.'+x.owner+',user_id.eq.'+ENC(x.user_id)+')').join(',');
      const D=await cFetch('/rest/v1/mp_days?select=owner,user_id,idx,data&or=('+or+')')||[];ui.adh={};
      ui.shared.forEach(x=>{ui.adh[x.owner+'/'+x.user_id]=adh(D.filter(r=>r.owner===x.owner&&r.user_id===x.user_id).map(r=>r.data))});
      // نتائج آخر 4 أسابيع: الإعدادات (الوزن والهدف) والسجل
      try{const orU=ui.shared.map(x=>'and(owner.eq.'+x.owner+',id.eq.'+ENC(x.user_id)+')').join(','),from=iso(addDays(new Date(),-27));
        const U=await cFetch('/rest/v1/mp_users?select=owner,id,settings&or=('+orU+')')||[],H=await cFetch('/rest/v1/mp_history?select=owner,user_id,date,data&date=gte.'+from+'&or=('+or+')')||[];ui.cres={};
        ui.shared.forEach(x=>{const u=U.find(r=>r.owner===x.owner&&r.id===x.user_id);ui.cres[x.owner+'/'+x.user_id]=coachRes(u&&u.settings,H.filter(r=>r.owner===x.owner&&r.user_id===x.user_id).map(r=>Object.assign({date:r.date},r.data)))})}catch(e){}}
  }catch(e){ui.shared=ui.shared||[];ui.grants=ui.grants||[]}
}
const CODE_AB='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const mkCode=()=>{const a=new Uint32Array(6);(window.crypto||{getRandomValues:x=>x.map(()=>Math.random()*4e9)}).getRandomValues(a);return [...a].map(n=>CODE_AB[n%CODE_AB.length]).join('')};
async function loadPublic(){ // إعدادات التطبيق والإعلانات والأصناف المشتركة (بدون تسجيل دخول)
  try{const [C,A,F]=await Promise.all([cFetch('/rest/v1/app_config?select=latest_version,min_version,features,defaults,captcha_site_key,meal_templates',{anon:true}),cFetch('/rest/v1/announcements?select=id,title,body,level&order=id.desc&limit=5',{anon:true}),cFetch('/rest/v1/shared_foods?select=id,n,grp,k,p,c,f,u,ug&active=eq.true',{anon:true})]);
    ui.pub={cfg:Array.isArray(C)?C[0]:null,ann:Array.isArray(A)?A.filter(x=>x&&x.title):[]};if(ui.pub.cfg)lsSet('mp3_pub',{features:ui.pub.cfg.features||{},defaults:ui.pub.cfg.defaults||{},captcha_site_key:ui.pub.cfg.captcha_site_key||'',meal_templates:ui.pub.cfg.meal_templates||[]});if(Array.isArray(F)){lsSet('mp3_sfoods',F);addShared(F)}render();
  }catch(e){}
}
function addShared(F){(F||[]).forEach(x=>{if(!CAT.some(r=>r.sid===x.id)){const r=[x.n,'','',x.grp,+x.k,+x.p,+x.c,+x.f,x.u||'',+x.ug||0];r.sid=x.id;CAT.push(r)}})}
function profLine(s){return `${s.sex==='f'?'أنثى':'ذكر'} · ${s.age} سنة · ${s.ht} سم · ${s.bw} كجم`}
const THEMES=[['auto','تلقائي'],['light','فاتح'],['dark','داكن']];
function themeNow(){const t=lsGet('mp3_theme');return t==='light'||t==='dark'?t:'auto'}
function applyTheme(t){const r=document.documentElement;if(t==='light'||t==='dark')r.dataset.theme=t;else delete r.dataset.theme;
  const dark=t==='dark'||(t!=='light'&&window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelectorAll('meta[name="theme-color"]').forEach(m=>{if(t==='auto')m.content=(m.getAttribute('media')||'').includes('dark')?'#1c1c1f':'#ffffff';else m.content=dark?'#1c1c1f':'#ffffff'})}
function themeSeg(){const c=themeNow();return `<div class="seg" role="group" aria-label="المظهر">${THEMES.map(([v,t])=>`<button type="button" data-act="theme" data-v="${v}" aria-pressed="${c===v}" class="${c===v?'on':''}">${t}</button>`).join('')}</div><div class="note" style="margin-top:6px">«تلقائي» يتبع إعداد الهاتف.</div>`}
function vMe(){
  const s=S(),u=curUser(),on=!!cloud.sess,k=rd(targets(state.days[ui.day]).k),nU=meta.users.length;
  return `<div class="card prof"><span class="av${curPic()?' ph':''}" aria-hidden="true">${avIn(u.name,curPic())}</span><div style="flex:1;min-width:0"><b style="font-size:17px">${esc(u.name)}</b><div class="note">${esc(goalOf(s).name)} · هدف اليوم ${k} سعرة</div></div><span class="pill ${on?'':'off'}">${on?(cloud.anon?'محفوظ (حساب مؤقت)':'محفوظ في حسابك'):'على هذا الجهاز فقط'}</span></div>
  <div class="grp">أنا</div><div class="list">${li('profile','ملفي الشخصي',profLine(s),'me/profile')}${li('goals','أهدافي',esc(goalOf(s).name)+' · السعرات والماكروز ودورة الكارب','me/goals')}</div>
  <div class="grp">الحساب</div><div class="list">${li('advanced','نوع الاستخدام',(MODES.find(x=>x[0]===meta.mode)||[0,'لم يُحدَّد بعد'])[1],'me/mode')}${isCoach()&&feat('clients')?li('family','متدربيني',(ui.shared||[]).length+' مشارك معك','me/clients'):''}${li('family','الأشخاص والمشاركة',nU+(nU>1?' ملفات':' ملف')+' على هذا الجهاز'+(on?'':' · المشاركة تحتاج تسجيل الدخول'),'me/family')}${li('sync','حسابي',on?(cloud.anon?'حساب مؤقت — أضف بريدك وجوالك':esc(cloud.email||'مسجّل الدخول')):'لم تسجّل بعد — بياناتك على هذا الجهاز فقط','me/sync')}</div>
  <div class="grp">المظهر</div><div class="card">${themeSeg()}</div>
  <div class="grp">البيانات</div><div class="list">${li('data','بياناتي','تصدير واستيراد','me/data')}${li('advanced','متقدم','معادلات BMR والأهداف المخصصة','me/advanced')}</div>
  <p class="note" style="text-align:center;margin:12px 0 0"><a href="terms.html" target="_blank" rel="noopener">شروط الاستخدام</a> · <a href="privacy.html" target="_blank" rel="noopener">سياسة الخصوصية</a> · التطبيق ليس بديلاً عن استشارة طبية</p>
  <div class="grp">منطقة الخطر</div><div class="list">${li('reset','إعادة ضبط «'+esc(u.name)+'»','الإعدادات والأصناف والخطة','','reset','dz')}${li('trash','حذف «'+esc(u.name)+'»','مع كل خطته وسجله','','udel','dz')}${on&&!cloud.anon?li('logout','تسجيل الخروج','','','clogout','dz'):''}${on?li('trash','حذف حسابي نهائياً','بريدك وجوالك وكل ملفاتك','','cdelacct','dz'):''}</div>`;
}
function vProfile(){
  const s=S(),inp=(l,k,st)=>`<label>${l}<input type="number" step="${st||0.1}" value="${s[k]}" data-ch="set" data-k="${k}"></label>`,
    sel=(l,ch,k,arr,cur)=>`<label>${l}<select data-ch="${ch}" data-k="${k}">${arr.map(([v,t])=>`<option value="${v}" ${String(v)===String(cur)?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`;
  const p=curPic(),nm=ui.remote?ui.remote.name:curUser().name;
  const photo=`<div class="card prof"><span class="av${p?' ph':''}" aria-hidden="true">${avIn(nm,p)}</span><div style="flex:1;min-width:0"><b>الصورة</b><div class="note">${ui.remote?'يضيفها صاحب الملف.':'تظهر في الدائرة أعلى الشاشة وفي قائمة الأشخاص.'}</div>
    ${ui.remote?'':`<div class="btns" style="margin:8px 0 0"><label class="btn" style="display:grid;place-items:center">${p?'تغيير الصورة':'إضافة صورة'}<input id="pic_in" type="file" accept="image/*" style="position:absolute;width:1px;height:1px;opacity:0" aria-label="${p?'تغيير الصورة':'إضافة صورة'}"></label>${p?'<button class="btn" data-act="picdel">إزالة</button>':''}</div>`}</div></div>`;
  return photo+`<div class="card set"><p class="note" style="margin:0 0 4px">تُستخدم لحساب سعرات الهدف في «أهدافي».</p>
  ${sel('الجنس','sset','sex',[['m','ذكر'],['f','أنثى']],s.sex)}${inp('العمر (سنة)','age',1)}${inp('الطول (سم)','ht',1)}${inp('الوزن (كجم)','bw',0.5)}${inp('نسبة الدهون % (اختياري)','bf',0.5)}
  ${sel('مستوى النشاط','set','act',ACTS.some(a=>a[0]===+s.act)?ACTS:ACTS.concat([[+s.act,'مخصص ×'+s.act]]),+s.act)}</div>`;
}
// صورة الشخص: data URL صغيرة (160×160 JPEG) في settings.pic فتُرفع مع المزامنة، ونسخة في meta.users[].pic لقوائم الأشخاص.
// نقبل صيغ الصور فقط لأن بيانات الأشخاص المشاركين تأتي من السحابة.
const PIC_RE=/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const picOk=p=>typeof p==='string'&&p.length<200000&&PIC_RE.test(p)?p:'';
const curPic=()=>picOk(state&&state.settings&&state.settings.pic);
const userPic=u=>u&&u.id===meta.cur&&!ui.remote?curPic():picOk(u&&u.pic);
const avIn=(n,pic)=>{pic=picOk(pic);return pic?`<img src="${pic}" alt="" decoding="async">`:esc(String(n||'').trim().charAt(0)||'؟')};
const avS=(n,on,pic)=>`<span class="av${picOk(pic)?' ph':''}" style="width:36px;height:36px;font-size:14px;${on||picOk(pic)?'':'background:var(--sf2);color:var(--tx)'}" aria-hidden="true">${avIn(n,pic)}</span>`;
async function picFrom(file){
  if(!file||!/^image\//.test(file.type||''))throw new Error('type');
  const url=URL.createObjectURL(file);
  try{
    const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('decode'));i.src=url});
    const Z=160,c=document.createElement('canvas');c.width=c.height=Z;const x=c.getContext('2d'),w=img.naturalWidth,h=img.naturalHeight,m=Math.min(w,h);
    x.drawImage(img,(w-m)/2,(h-m)/2,m,m,0,0,Z,Z);
    return c.toDataURL('image/jpeg',.82);
  }finally{URL.revokeObjectURL(url)}
}
function setPic(p){p=picOk(p);const u=curUser();
  if(p){state.settings.pic=p;u.pic=p}else{delete state.settings.pic;delete u.pic}
  save();render();toast(p?'تم حفظ الصورة':'أُزيلت الصورة')}
function vFamily(){
  const on=!!cloud.sess&&!cloud.anon,G=ui.grants||[];
  const mine=meta.users.map(u=>{const gs=G.filter(g=>g.user_id===u.id);
    return `<div class="li" style="cursor:default">${avS(u.name,u.id===meta.cur&&!ui.remote,userPic(u))}<span class="g"><b>${esc(u.name)}</b><small>${u.kind==='child'?'ملف طفل تديره أنت · ':''}${gs.length?gs.map(g=>g.status==='pending'?'دعوة '+ROLES[g.role]+' بانتظار القبول':esc(g.grantee_email||'')+' ('+ROLES[g.role]+')').join('، '):'غير مشارك'}</small></span>${on&&u.kind!=='child'?`<button class="btn" style="flex:0 0 auto" data-act="share" data-v="${u.id}">مشاركة</button>`:''}</div>`}).join('');
  const grants=G.length?`<div class="grp">الدعوات والصلاحيات</div><div class="list">${G.map(g=>{const u=meta.users.find(x=>x.id===g.user_id);
    return `<div class="li" style="cursor:default"><span class="g"><b>${esc(u?u.name:g.user_id)} → ${g.status==='pending'?'كود '+esc(g.code||''):esc(g.grantee_email||'')}</b><small>${ROLES[g.role]} · ${g.status==='pending'?'لم تُقبل بعد':'مفعّلة'}</small></span><button class="btn dan" style="flex:0 0 auto" data-act="grevoke" data-v="${g.id}">${g.status==='pending'?'إلغاء':'إيقاف'}</button></div>`}).join('')}</div>`:'';
  const shared=(ui.shared||[]).length?`<div class="grp">مشاركون معي</div><div class="list">${ui.shared.map((x,i)=>`<div class="li" style="cursor:default">${avS(x.name)}<span class="g"><b>${esc(x.name)}</b><small>من ${esc(x.owner_email||'')} · ${ROLES[x.role]}</small></span><button class="btn" style="flex:0 0 auto" data-act="whopick" data-v="${i}">عرض</button><button class="btn dan" style="flex:0 0 auto" data-act="gleave" data-v="${i}">مغادرة</button></div>`).join('')}</div>`:'';
  return `<div class="grp">ملفاتي على هذا الجهاز</div><div class="list">${mine}</div>
  <div class="btns">${feat('multi')?'<button data-act="uadd">＋ إضافة فرد أو طفل</button>':''}<button data-act="uren">تعديل اسم «${esc(curUser().name)}»</button></div>
  ${!feat('share')?'':on?grants+shared+`<div class="grp">لديك كود من شخص آخر؟</div><div class="card"><div class="fr2"><input id="inv_code" dir="ltr" autocomplete="off" spellcheck="false" autocapitalize="characters" placeholder="مثال: K7Q2MX" style="text-transform:uppercase;letter-spacing:.1em" aria-label="كود الدعوة"><button class="btn pri" style="flex:0 0 auto" data-act="gaccept">قبول</button></div><p class="note" id="inv_msg">أدخل الكود الذي أرسله لك صاحب الخطة. بعدها يظهر في «من تعرض؟».</p></div>`
  :`<div class="bnr info"><span class="g"><b>المشاركة تحتاج حساباً ببريدك</b>لمشاركة ملف مع فرد بالغ أو مدرب، أو لقبول كود، ${cloud.anon?'أضف بريدك وجوالك إلى حسابك':'سجّل الدخول أولاً'}.</span><button class="btn" data-act="tab" data-v="me/sync">تسجيل الدخول</button></div>`}
  <p class="note">ملف الطفل لا يحتاج بريداً ويُدار بالكامل من حسابك. البالغ أو المدرب يحصل على صلاحية بكود تُرسله له، ويمكنك إيقافها في أي وقت. الحذف من «منطقة الخطر» في حسابي.</p>`;
}
function vMode(){
  return `<div class="card"><p class="note" style="margin:0 0 8px">يحدد ما يظهر لك في «حسابي». يمكن تغييره في أي وقت ولا يمس بياناتك.</p><div class="modes">${MODES.map(([k,t,d])=>`<button class="${meta.mode===k?'on':''}" data-act="umode" data-v="${k}" aria-pressed="${meta.mode===k}"><b>${t}</b><small>${d}</small></button>`).join('')}</div></div>`;
}
function adh(days){ // التزام الأسبوع: نسبة الأصناف المخططة التي سُجّلت
  let pl=0,lg=0,dn=0;(days||[]).forEach(d=>{if(!d)return;let a=0,b=0;d.meals.forEach(m=>m.items.forEach(it=>{if(it.x)return;a++;if(gE(it)!=null)b++}));pl+=a;lg+=b;if(a&&b===a)dn++});
  return{pct:pl?Math.round(lg/pl*100):0,done:dn};
}
function vClients(){
  const L=ui.shared||[];
  if(!cloud.sess)return `<div class="bnr info"><span class="g"><b>سجّل الدخول أولاً</b>المتدربون يظهرون هنا بعد أن يشاركوا ملفاتهم معك.</span><button class="btn" data-act="tab" data-v="me/sync">تسجيل الدخول</button></div>`;
  return `<div class="btns"><button data-act="whoload">تحديث القائمة</button></div>
  ${L.length?(()=>{const C=ui.cres||{},key=x=>x.owner+'/'+x.user_id,ord={idle:0,slow:1,fast:1,drift:1,nodata:2,ok:3};
    const S2=L.map((x,i)=>({x,i,r:C[key(x)],a:ui.adh&&ui.adh[key(x)]})).sort((p,q)=>(p.r?ord[p.r.st]:2)-(q.r?ord[q.r.st]:2));
    const need=S2.filter(o=>o.r&&['idle','slow','fast','drift'].includes(o.r.st)).length;
    return `<p class="note" style="margin:0 0 6px">${L.length} ${L.length===1?'متدرب':'متدربين'}${need?` · <b>${need} ${need===1?'يحتاج':'يحتاجون'} انتباهك</b>`:''} · آخر 4 أسابيع</p><div class="list">${S2.map(({x,i,r,a})=>{const st=r&&CR_ST[r.st];
      return `<button class="li" data-act="whopick" data-v="${i}">${avS(x.name)}<span class="g"><b>${esc(x.name)} ${st?`<span class="tag ${st[1]}">${st[0]}</span>`:''}</b><small>${ROLES[x.role]}${a?' · التزام الأسبوع '+a.pct+'%':''}${r&&r.adh!=null?' · 4 أسابيع '+rd(r.adh)+'%':''}</small>
      ${r?`<small>${r.rate!=null?'الوزن '+kgw(r.rate)+(r.goalRate!=null?' · الهدف ('+esc(r.goal)+') '+kgw(r.goalRate):''):'الوزن: يحتاج وزنين على أسبوع على الأقل'}${r.idle!=null&&r.idle>=2?' · آخر تسجيل قبل '+r.idle+' أيام':''}</small>`:''}</span><span class="chev">${ico('chev')}</span></button>`}).join('')}</div>`})()
  :`<div class="card"><b>لا يوجد متدربون بعد</b><p class="note">اطلب من المتدرب: حسابي › الأشخاص والمشاركة › مشاركة، ويختار «مدرب / أخصائي» ثم يرسل لك الكود. أدخل الكود في «الأشخاص والمشاركة».</p><button class="btn" data-act="tab" data-v="me/family">إدخال كود</button></div>`}`;
}
function vData(){return `
  <div class="card"><h2 style="margin:0 0 6px">النسخ الاحتياطي</h2><p class="note">لكل مستخدم إعداداته وأصنافه وخطته، ويُحفظ كل يوم بأصنافه في مفتاح مستقل داخل هذا المتصفح، ويُحفظ الفعلي لكل تاريخ في «التقدم» ويدخل في التصدير. المستخدم الحالي: <b>${esc(curUser().name)}</b>. صدّر نسخة احتياطية قبل تغيير الجهاز.</p><div class="btns"><button data-act="export">تصدير كل المستخدمين</button><button data-act="import">استيراد</button></div></div>`;
}
function vMeSubData(){return vData()+(feat('online')?srcCard():'')}
function vMeSub(){const s=S();
  switch(ui.sub){
    case 'profile':return vProfile();
    case 'goals':return goalUI(s,targets({mode:'high'}),targets({mode:'low'}));
    case 'family':return vFamily();
    case 'clients':return vClients();
    case 'mode':return vMode();
    case 'sync':return vCloud();
    case 'data':return vMeSubData();
    case 'advanced':return vEqMgmt(s);
  }
  return vMe();
}
function hFoot(r){
  const past=r.date<weekKey();
  const rows=r.meals.map((mm,mi)=>`<div class="mh" style="margin-top:8px"><h3 style="font-size:14px">${esc(mm.n)}</h3></div>`+mm.items.map((it,ii)=>{
    const f=it.fd,e=gE(it),em=emOf(it,mi);
    return `<div class="dv"><span>${esc(f.n)} · ${it.x?'خارج الخطة':'الخطة '+fmtQ(f,it.g)} · ${e==null?'لم يُسجَّل':'الفعلي '+fmtQ(f,e)}${e>0&&em!==mi?' ↪ '+esc(mealShort(r,em)):''}</span>${past?`<button class="ib" title="تعديل التسجيل" aria-label="تعديل تسجيل ${esc(f.n)}" data-act="hlog" data-d="${r.date}" data-m="${mi}" data-i="${ii}">📝</button>`:''}</div>`}).join('')).join('');
  return `<h4>أصناف اليوم</h4>${rows}${past?'':'<p class="note">هذا اليوم من الأسبوع الحالي: عدّله من تبويب «اليوم».</p>'}
  <div class="btns" style="margin-top:10px">${past?`<button class="btn dan" data-act="hdel" data-d="${r.date}">حذف السجل</button>`:''}<button data-act="close">إغلاق</button></div>`;
}
function histRecs(){
  const t=new Date(),r=ui.hr||'7';let from='0000-00-00',to='9999-99-99';
  if(r==='7')from=iso(addDays(t,-6));else if(r==='30')from=iso(addDays(t,-29));
  else if(r==='custom'){if(ui.hf)from=ui.hf;if(ui.ht)to=ui.ht}
  return (ui.remote?ui.remote.hist:hAll(meta.cur)).filter(x=>x.date>=from&&x.date<=to).sort((a,b)=>a.date<b.date?1:-1);
}
function vHist(){
  const rs=histRecs(),A=rs.map(r=>({r,L:dayLog(r)})),done=A.filter(x=>x.L.total>0&&x.L.logged===x.L.total),n=done.length;
  const mean=(arr,fn)=>arr.length?arr.reduce((a,x)=>a+fn(x),0)/arr.length:0;
  const av=src=>({k:mean(done,x=>src(x).k),p:mean(done,x=>src(x).p),c:mean(done,x=>src(x).c),f:mean(done,x=>src(x).f)});
  const aE=av(x=>x.L.eaten),aP=av(x=>x.L.plan),aT=av(x=>x.r.tg);
  const adh=mean(done,x=>x.L.plan.k?x.L.eaten.k/x.L.plan.k*100:0);
  const ph=done.filter(x=>x.L.eaten.p>=x.r.tg.p*0.95).length,ov=done.filter(x=>x.L.eaten.k>x.r.tg.k*1.05).length;
  const sk={},ex={n:0,k:0};let mv=0;
  A.forEach(({r})=>r.meals.forEach((mm,mi)=>mm.items.forEach(it=>{const e=gE(it);if(e==null)return;
    if(it.x){ex.n++;ex.k+=macE(it).k}else if(e===0)sk[it.fd.n]=(sk[it.fd.n]||0)+1;
    if(e>0&&emOf(it,mi)!==mi)mv++;})));
  const topSk=Object.entries(sk).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([nm,c])=>`${esc(nm)} (${c})`).join('، ')||'—';
  const dc=(x,ref)=>{const th=Math.max(5,Math.abs(ref)*0.05);return `<span class="${Math.abs(x)<=th?'d-ok':(x>0?'d-hi':'d-lo')}">${sg(x)}</span>`};
  const r4=(l,t,cls)=>`<tr${cls?` class="${cls}"`:''}><td>${l}</td><td>${rd(t.k)}</td><td>${rd(t.p)}</td><td>${rd(t.c)}</td><td>${rd(t.f)}</td></tr>`;
  const max=Math.max(1,...A.map(x=>Math.max(x.L.eaten.k,x.L.plan.k,x.r.tg.k)));
  const cur=ui.hr||'7',chip=(v,l)=>`<button class="${cur===v?'on':''}" data-act="hr" data-v="${v}">${l}</button>`;
  let h=(ui.remote?'':vWeightCard())+vReportCard()+vTdeeCard()+`<div class="grp">سجل الأكل</div><div class="seg">${chip('7','7 أيام')}${chip('30','30 يوماً')}${chip('all','الكل')}${chip('custom','فترة')}</div>
  ${cur==='custom'?`<div class="lbl"><span>من</span><input type="date" data-ch="hf" value="${esc(ui.hf||'')}"><span>إلى</span><input type="date" data-ch="ht" value="${esc(ui.ht||'')}"></div>`:''}`;
  if(!rs.length)return h+`<div class="card"><b>لا سجلات في هذه الفترة</b><p class="note">سجّل ما تأكله من «اليوم» بزر ✓ أو «إنهاء الوجبة»، وسيظهر هنا بتاريخه.</p><button class="btn pri" data-act="tab" data-v="day">إلى اليوم</button></div>`;
  h+=`<div class="card"><div class="tiles"><div class="tile"><b>${rs.length}</b><small>أيام مسجّلة</small></div><div class="tile"><b>${n?rd(adh)+'%':'—'}</b><small>الالتزام بالسعرات</small></div><div class="tile"><b>${n?ph+'/'+n:'—'}</b><small>أيام البروتين</small></div></div>
  ${n?`<p class="note" style="margin:8px 0 0">متوسط اليوم المكتمل: ${rd(aE.k)} سعرة فعلياً مقابل هدف ${rd(aT.k)}.</p>`:`<p class="note" style="margin:8px 0 0">لا يوجد يوم مكتمل التسجيل بعد؛ الأيام الجزئية معلَّمة بـ *.</p>`}</div>
  <details class="fold"><summary>التفاصيل والمتوسطات</summary><div>`;
  if(n){
    h+=`<table style="margin:6px 0"><tr><th>متوسط يوم مكتمل</th><th>سعرات</th><th>P</th><th>C</th><th>F</th></tr>${r4('الفعلي',aE,'avg')}${r4('الخطة',aP)}${r4('الهدف',aT)}<tr><td>الفعلي − الهدف</td><td>${dc(aE.k-aT.k,aT.k)}</td><td>${dc(aE.p-aT.p,aT.p)}</td><td>${dc(aE.c-aT.c,aT.c)}</td><td>${dc(aE.f-aT.f,aT.f)}</td></tr></table>
    <div class="dv"><span>الالتزام بسعرات الخطة</span><b>${rd(adh)}%</b></div>
    <div class="dv"><span>أيام حقق فيها البروتين (≥95%)</span><b>${ph}/${n}</b></div>
    <div class="dv"><span>أيام تجاوز فيها السعرات الهدف (>5%)</span><b>${ov}/${n}</b></div>`;
  }else h+=`<p class="note">لا يوجد يوم مكتمل التسجيل بعد، فلا متوسطات (الأيام الجزئية تظهر في القائمة بعلامة *).</p>`;
  h+=`<div class="dv"><span>أكثر الأصناف تركاً</span><b style="direction:rtl">${topSk}</b></div>
  <div class="dv"><span>خارج الخطة</span><b>${ex.n} مرة · ${rd(ex.k)} kcal</b></div>
  <div class="dv"><span>أصناف نُقلت بين الوجبات</span><b>${mv}</b></div></div></details>
  <div class="dhead"><b>الأيام <small>الشريط = الفعلي، الخط = الخطة</small></b></div><div class="card" style="padding:4px 12px">`;
  h+=A.map(({r,L})=>{const pc=Math.min(100,L.eaten.k/max*100),pp=Math.min(100,L.plan.k/max*100),part=!(L.total>0&&L.logged===L.total);
    return `<button type="button" class="hr" data-act="hopen" data-d="${r.date}"><span>${dateShort(r.date)} ${esc(r.name)}</span><span class="hb" aria-hidden="true"><i class="${part?'part':''}" style="width:${pc}%"></i><u style="inset-inline-start:${pp}%"></u></span><b>${rd(L.eaten.k)}${part?'*':''}</b></button>`}).join('')+`</div>`;
  return h;
}
function modalBody(){
  const m=$('#modal');
  if(!modal){m.className='';m.innerHTML='';return}
  m.className='on';
  if(modal.type==='ask'){
    m.innerHTML=`<div class="sheet"><h2>تأكيد</h2><p>${esc(modal.msg)}</p><div class="btns"><button class="btn pri" data-act="yes">متابعة</button><button class="btn" data-act="close">إلغاء</button></div></div>`;
  }else if(modal.type==='user'){
    m.innerHTML=`<div class="sheet"><h2>${modal.mode==='add'?'مستخدم جديد':'تعديل الاسم'}</h2><input id="un" value="${esc(modal.name||'')}" aria-label="الاسم" autocomplete="off" placeholder="الاسم…" style="width:100%">${modal.mode==='add'?'<label style="display:flex;gap:8px;align-items:center;margin:10px 0"><input type="checkbox" id="ucopy" style="width:auto"> نسخ إعدادات وأصناف وخطة المستخدم الحالي</label><label style="display:flex;gap:8px;align-items:center;margin:0 0 10px"><input type="checkbox" id="ukid" style="width:auto"> ملف طفل (بلا بريد، تديره أنت بالكامل)</label><p class="note" style="margin:0 0 6px">بدون النسخ يبدأ بالخطة والإعدادات الافتراضية.</p>':'<div style="height:10px"></div>'}<div class="btns"><button class="btn pri" data-act="usave">حفظ</button><button class="btn" data-act="close">إلغاء</button></div></div>`;
  }else if(modal.type==='log'||modal.type==='hlog'){
    const hr=modal.type==='hlog'?getRec(modal.date):null,d=hr||state.days[ui.day],it=d.meals[modal.m].items[modal.i],f=FOOD(it),e=gE(it),em=emOf(it,modal.m);
    const u=f.u&&f.ug?f.ug:1,dq=+(((e!=null?e:(it.x?0:it.g)))/u).toFixed(1);
    m.innerHTML=`<div class="sheet"><h2>تسجيل: ${esc(f.n)}</h2><p class="note">${it.x?'صنف خارج الخطة':`الخطة: ${fmtQ(f,it.g)} في ${esc(mealShort(d,modal.m))}`}</p>
    <label class="lbl">الكمية المأكولة (${esc(unitOf(f))})<input id="lq" type="number" inputmode="decimal" step="any" min="0" value="${dq}" style="width:100px;text-align:center"></label>
    <label class="lbl">أُكل في<select id="lm">${d.meals.map((mm,j)=>`<option value="${j}" ${j===em?'selected':''}>${esc(mm.n)}</option>`).join('')}</select></label>
    <div class="btns"><button class="btn pri" data-act="logsave">حفظ كمأكول</button>${it.x?'':'<button data-act="logskip">لم يُؤكل</button>'}</div>
    <div class="btns" style="margin-top:6px"><button data-act="logclr">${it.x?'حذف الصنف':'مسح التسجيل'}</button><button data-act="close">إغلاق</button></div></div>`;
  }else if(modal.type==='cmp'||modal.type==='hdetail'){
    const hr=modal.type==='hdetail'?getRec(modal.date):null;
    if(modal.type==='hdetail'&&!hr){modal=null;m.className='';m.innerHTML='';return}
    const d=hr||state.days[ui.day],L=dayLog(d),Tg=hr?hr.tg:targets(d);
    const dc=(x,ref)=>{const th=Math.max(5,Math.abs(ref)*0.05);return `<span class="${Math.abs(x)<=th?'d-ok':(x>0?'d-hi':'d-lo')}">${sg(x)}</span>`};
    const r4=(l,t,cls)=>`<tr${cls?` class="${cls}"`:''}><td>${l}</td><td>${rd(t.k)}</td><td>${rd(t.p)}</td><td>${rd(t.c)}</td><td>${rd(t.f)}</td></tr>`;
    const dr=(l,a,b)=>`<tr><td>${l}</td><td>${dc(a.k-b.k,b.k)}</td><td>${dc(a.p-b.p,b.p)}</td><td>${dc(a.c-b.c,b.c)}</td><td>${dc(a.f-b.f,b.f)}</td></tr>`;
    const ic={skip:'✗',qty:'≠',move:'↪',extra:'＋'};
    m.innerHTML=`<div class="sheet"><h2>${hr?esc(d.name)+' — '+dateLabel(hr.date):'مقارنة '+esc(d.name)+' — '+dateLabel(dateOfDay(ui.day))}</h2>
    <p class="note">سُجّل ${L.logged} من ${L.total} صنف. المتوقع للنهاية = المأكول + ما لم يُسجَّل بعد (محسوب كما في الخطة).</p>
    <table><tr><th></th><th>سعرات</th><th>P</th><th>C</th><th>F</th></tr>${r4('الخطة',L.plan)}${r4('المأكول فعلاً',L.eaten)}${r4('لم يُسجَّل بعد',L.pend)}${r4('المتوقع للنهاية',L.exp,'avg')}${dr('الفرق عن الخطة',L.exp,L.plan)}${dr('الفرق عن الهدف',L.exp,Tg)}</table>
    <h4>حسب الوجبة (سعرات)</h4>
    <table><tr><th>الوجبة</th><th>الخطة</th><th>الفعلي</th><th>الفرق</th></tr>${L.pm.map((x,i)=>`<tr><td>${esc(mealShort(d,i))}</td><td>${rd(x.plan.k)}</td><td>${rd(x.act.k)}</td><td>${dc(x.act.k-x.plan.k,x.plan.k)}</td></tr>`).join('')}</table>
    <p class="note">الفعلي يُحسب في الوجبة التي أُكل فيها الصنف (بعد النقل)، وما لم يُسجَّل لا يظهر فيه.</p>
    <h4>الانحرافات عن الخطة</h4>${L.dev.length?L.dev.map(v=>`<div class="dv"><span>${ic[v.t]} ${esc(v.txt)}</span>${v.dk?`<b class="${v.dk>0?'d-hi':'d-lo'}">${sg(v.dk)} kcal</b>`:''}</div>`).join(''):'<p class="note">لا انحرافات مسجلة.</p>'}
    ${hr?hFoot(hr):`<div class="btns" style="margin-top:10px"><button data-act="logrest">تسجيل الباقي كما في الخطة</button><button data-act="logclear">مسح تسجيل اليوم</button></div>
    <button class="btn" style="width:100%;margin-top:6px" data-act="close">إغلاق</button>
    <p class="note">يُحفظ سجل كل يوم بتاريخه تلقائياً، ويبقى في «التقدم» بعد انتهاء الأسبوع.</p>`}</div>`;
  }else if(modal.type==='food'){
    const f=F(modal.id);if(!f){modal=null;m.className='';m.innerHTML='';return}
    const pu=ui.fu==='unit'&&f.u&&f.ug,val=k=>pu?+(f[k]*f.ug/100).toFixed(2):f[k];
    m.innerHTML=`<div class="sheet" role="dialog" aria-label="تعديل ${esc(f.n)}"><h2>تعديل الصنف</h2>
    <label class="lbl" style="flex-direction:column;align-items:stretch">الاسم<input value="${esc(f.n)}" data-ch="food" data-id="${f.id}" data-fld="n"></label>
    <p class="note">القيم ${pu?'لكل '+esc(f.u):'لكل 100 جم'} — أي تعديل يتحدّث في كل الخطة فوراً.</p>
    <div class="tiles" style="grid-template-columns:repeat(4,1fr)">${[['k','سعرات'],['p','بروتين'],['c','كارب'],['f','دهون']].map(([k,l])=>`<label class="sc"><span>${l}</span><input type="number" step="any" inputmode="decimal" value="${val(k)}" data-ch="food" data-id="${f.id}" data-fld="${k}"></label>`).join('')}</div>
    <div class="tiles" style="grid-template-columns:1fr 1fr;margin-top:8px"><label class="sc"><span>الوحدة (اختياري)</span><input value="${esc(f.u||'')}" placeholder="حبة" data-ch="food" data-id="${f.id}" data-fld="u"></label><label class="sc"><span>وزن الوحدة جم</span><input type="number" step="any" value="${f.ug||''}" data-ch="food" data-id="${f.id}" data-fld="ug"></label></div>
    <div class="btns" style="margin-top:10px"><button class="btn pri" data-act="close">تم</button><button class="btn dan" data-act="delfood" data-id="${f.id}">حذف الصنف</button></div></div>`;
  }else if(modal.type==='weekopts'){
    m.innerHTML=`<div class="sheet" role="dialog" aria-label="خيارات الأسبوع"><h2>خيارات الأسبوع</h2><div class="list" style="box-shadow:none;border:1px solid var(--ln)">
    <button class="li" data-act="usualweek"><span class="g"><b>بناء الأسبوع من أصنافك المعتادة</b><small>يستبدل الأصناف بما تأكله فعلاً من نفس النوع ويضبط الكميات</small></span></button>
    <button class="li" data-act="refitweek"><span class="g"><b>ضبط كميات الأسبوع على الأهداف</b><small>يُبقي الأصناف</small></span></button>
    <button class="li" data-act="print"><span class="g"><b>طباعة الأسبوع</b></span></button>
    <button class="li dz" data-act="rebuildweek"><span class="g"><b>إعادة بناء الأسبوع من القوالب</b><small>يُفقد أي تعديل يدوي</small></span></button></div>
    <div class="btns" style="margin-top:8px"><button data-act="close">إغلاق</button></div></div>`;
  }else if(modal.type==='shq'){
    const x=shopLines().find(z=>z.id===modal.id)||{n:'',q:''};
    m.innerHTML=`<div class="sheet" role="dialog" aria-label="كمية ${esc(x.n)}"><h2>${esc(x.n)}</h2><label class="lbl">الكمية<input id="shq_v" value="${esc(x.q)}" style="max-width:60%"></label><div class="btns"><button class="btn pri" data-act="shqsave">حفظ</button><button data-act="close">إلغاء</button></div></div>`;
  }else if(['mopts','mtpl','msave'].includes(modal.type)&&vMealModal(m)){
  }else if(modal.type==='acctdata'){
    m.innerHTML=`<div class="sheet" role="dialog"><h2>في حسابك بيانات محفوظة</h2><p class="note">اختر ما تريد الاحتفاظ به على هذا الجهاز.</p>
    <div class="list" style="box-shadow:none;border:1px solid var(--ln)"><button class="li" data-act="acctpull"><span class="g"><b>استخدام بيانات الحساب</b><small>تحلّ محل بيانات هذا الجهاز (مناسب لجهاز جديد)</small></span></button>
    <button class="li" data-act="acctpush"><span class="g"><b>الاحتفاظ ببيانات هذا الجهاز</b><small>تُحفظ في الحساب بدل المحفوظ فيه</small></span></button></div>
    <div class="btns" style="margin-top:8px"><button data-act="close">لاحقاً</button></div></div>`;
  }else if(modal.type==='dayov'){
    const d=state.days[ui.day],pm=planMode(ui.day),B=baseTargets({mode:modal.mode||pm,name:d.name}),t=modal.t||{},v=k=>t[k]!=null?esc(t[k]):'';
    const sb=(act,val,cur,l)=>`<button type="button" class="${cur?'on':''}" aria-pressed="${cur}" data-act="${act}" data-v="${val}">${l}</button>`;
    m.innerHTML=`<div class="sheet" role="dialog"><h2>تعديل ${esc(d.name)}</h2>
    <h4>نوع اليوم</h4><div class="seg">${sb('ovmode','',!modal.mode,'حسب النمط ('+ML[pm]+')')}${sb('ovmode','high',modal.mode==='high','عادي')}${sb('ovmode','low',modal.mode==='low','قليل')}</div>
    <h4>أهداف خاصة لهذا اليوم (اختياري)</h4><p class="note" style="margin:0 0 4px">اتركها فارغة لتُحسب من الهدف. الأرقام الباهتة هي المحسوبة الآن.</p>
    <div class="fr2">${[['p','بروتين'],['c','كارب'],['f','دهون']].map(([k,l])=>`<label style="flex:1;min-width:0">${l} (جم)<input id="ov_${k}" type="number" min="0" step="1" inputmode="numeric" placeholder="${rd(B[k])}" value="${v(k)}"></label>`).join('')}</div>
    <h4>التكرار</h4><div class="seg">${sb('ovrep','0',!modal.rep,'هذا التاريخ فقط ('+esc(dateShort(dateOfDay(ui.day)))+')')}${sb('ovrep','1',!!modal.rep,'كل '+esc(d.name))}</div>
    <div class="btns" style="margin-top:10px"><button class="btn pri" data-act="dayovsave">حفظ</button><button data-act="close">إلغاء</button></div></div>`;
  }else if(modal.type==='dayopts'){
    const d=state.days[ui.day],L=dayLog(d);
    m.innerHTML=`<div class="sheet" role="dialog" aria-label="خيارات اليوم"><h2>خيارات ${esc(d.name)}</h2>
    ${(()=>{const o=dayOv(ui.day);return `<h4>هذا اليوم</h4><p class="note" style="margin:0 0 6px">${o?`<b>معدّل ${o.rep?'كل '+esc(d.name):'لهذا التاريخ فقط'}</b>${o.by?' · بواسطة '+esc(o.by):''}: ${esc(ovDesc(o))}`:`حسب الإعدادات: ${ML[planMode(ui.day)]}`}</p><div class="btns" style="margin:0 0 8px"><button class="btn" data-act="dayov">تعديل هذا اليوم</button>${o?'<button class="btn" data-act="dayovreset">إرجاع للإعدادات</button>':''}</div>`})()}
    <label class="lbl">بروتين اليوم <select data-ch="prot">${Object.keys(PL).map(k=>`<option value="${k}" ${d.prot===k?'selected':''}>${PL[k]}</option>`).join('')}</select></label>
    <div class="list" style="box-shadow:none;border:1px solid var(--ln)">
    <button class="li" data-act="cmp"><span class="g"><b>مقارنة الفعلي بالخطة</b><small>سُجّل ${L.logged} من ${L.total}</small></span></button>
    <button class="li" data-act="logrest"><span class="g"><b>تسجيل كل المتبقي كما في الخطة</b></span></button>
    <button class="li" data-act="refit"><span class="g"><b>ضبط الكميات على الهدف</b><small>يُبقي الأصناف ويغيّر الكميات</small></span></button>
    <button class="li" data-act="addmeal"><span class="g"><b>إضافة وجبة أو سناك</b></span></button>
    <button class="li dz" data-act="rebuild"><span class="g"><b>إعادة بناء اليوم من القالب</b><small>يُفقد أي تعديل يدوي</small></span></button>
    <button class="li dz" data-act="logclear"><span class="g"><b>مسح تسجيل اليوم</b></span></button></div>
    <div class="btns" style="margin-top:8px"><button data-act="close">إغلاق</button></div></div>`;
  }else if(modal.type==='item'){
    const d=state.days[ui.day],it=d.meals[modal.m]&&d.meals[modal.m].items[modal.i],f=it&&F(it.f);
    if(!f){modal=null;m.className='';m.innerHTML='';return}
    const a=`data-m="${modal.m}" data-i="${modal.i}"`;
    m.innerHTML=`<div class="sheet" role="dialog" aria-label="خيارات ${esc(f.n)}"><h2>${esc(f.n)}</h2><p class="note">${it.x?'خارج الخطة':'الخطة: '+fmtQ(f,it.g)}${isCooked(f)&&!it.x?' مطبوخ (≈ '+rd(it.g*RAWF)+' جم نيء)':''}</p>
    <div class="list" style="box-shadow:none;border:1px solid var(--ln)">
    <button class="li" data-act="log" ${a}><span class="g"><b>تسجيل كمية مختلفة أو وجبة أخرى</b><small>أو «لم يُؤكل»</small></span></button>
    ${it.x?'':`<button class="li" data-act="swap" ${a}><span class="g"><b>بدائل</b><small>صنف بنفس القيمة الغذائية</small></span></button>`}
    <button class="li dz" data-act="del" ${a}><span class="g"><b>حذف من الوجبة</b></span></button></div>
    <div class="btns" style="margin-top:8px"><button data-act="close">إغلاق</button></div></div>`;
  }else if(modal.type==='who'){
    const L=feat('share')?ui.shared||[]:[];
    m.innerHTML=`<div class="sheet" role="dialog" aria-label="من تعرض؟"><h2>من تعرض؟</h2><div class="list" style="box-shadow:none;border:1px solid var(--ln)">${meta.users.map(u=>`<button class="li" data-act="uswitch" data-v="${u.id}" aria-pressed="${!ui.remote&&u.id===meta.cur}">${avS(u.name,!ui.remote&&u.id===meta.cur,userPic(u))}<span class="g"><b>${esc(u.name)}</b><small>${u.kind==='child'?'ملف طفل':'على هذا الجهاز'}${!ui.remote&&u.id===meta.cur?' · المعروض الآن':''}</small></span></button>`).join('')}
    ${L.map((x,i)=>`<button class="li" data-act="whopick" data-v="${i}" aria-pressed="${!!ui.remote&&ui.remote.owner===x.owner&&ui.remote.id===x.user_id}">${avS(x.name,!!ui.remote&&ui.remote.id===x.user_id)}<span class="g"><b>${esc(x.name)}</b><small>${ROLES[x.role]} · من ${esc(x.owner_email||'')}</small></span></button>`).join('')}</div>
    ${cloud.sess||!feat('share')?'':'<p class="note">سجّل الدخول لترى الأشخاص المشاركين معك.</p>'}
    <div class="btns" style="margin-top:8px"><button data-act="tab" data-v="me/family">إدارة الأشخاص</button><button data-act="tab" data-v="me">حسابي</button><button data-act="close">إغلاق</button></div></div>`;
  }else if(modal.type==='share'){
    const u=meta.users.find(x=>x.id===modal.user)||{name:''};
    m.innerHTML=`<div class="sheet" role="dialog" aria-label="مشاركة ${esc(u.name)}"><h2>مشاركة «${esc(u.name)}»</h2>${modal.code?`<p>أرسل هذا الكود للشخص. يدخله من: حسابي › الأشخاص والمشاركة.</p><div class="code" id="sh_code">${esc(modal.code)}</div><p class="note">الصلاحية: ${ROLES[modal.role]} (${ROLE_NOTE[modal.role]}). الكود يُستخدم مرة واحدة.</p><div class="btns"><button class="btn pri" data-act="gcopy">نسخ الكود</button><button data-act="close">تم</button></div>`
    :`<p class="note">اختر ما يستطيع الشخص الآخر فعله. التسجيل (ما أكلت) يبقى لك دائماً.</p><div class="modes" style="grid-template-columns:1fr">${Object.keys(ROLES).map(r=>`<button class="${modal.role===r?'on':''}" data-act="srole" data-v="${r}" aria-pressed="${modal.role===r}"><b>${ROLES[r]}</b><small>${ROLE_NOTE[r]}</small></button>`).join('')}</div><div class="btns" style="margin-top:8px"><button class="btn pri" data-act="gcreate" ${modal.busy?'disabled':''}>${modal.busy?'جارٍ إنشاء الكود…':'إنشاء كود دعوة'}</button><button data-act="close">إلغاء</button></div>`}</div>`;
  }else if(modal.type==='scan'){
    m.innerHTML=scanHtml();
  }else if(modal.type==='swap'){
    const d=state.days[ui.day],it=d.meals[modal.m].items[modal.i],o=F(it.f),by=modal.by||state.settings.by;
    const c=swapCands(it,by),key=by==='kcal'?'k':KEYM[o.grp];
    m.innerHTML=`<div class="sheet" data-stop><h2>بدائل: ${esc(o.n)} (${qtyOf(it)} ${esc(unitOf(o))})</h2>
    <div class="seg" style="margin-bottom:6px"><button class="${by!=='kcal'?'on':''}" data-act="by" data-v="auto">مطابقة ${KEYL[KEYM[o.grp]]}</button><button class="${by==='kcal'?'on':''}" data-act="by" data-v="kcal">مطابقة السعرات</button></div>
    <p class="note">الكمية البديلة محسوبة لتساوي ${KEYL[key]} الصنف الحالي، والأرقام تبيّن فرق الميزان عن الأصل.</p>
    ${c.map(x=>`<button type="button" class="cand" data-act="applyswap" data-f="${x.c.id}" data-g="${x.g}"><span><b>${esc(x.c.n)}</b><small>${rd(x.g/(x.c.ug||1)*(x.c.ug?1:1))} ${esc(unitOf(x.c))}</small></span><span class="dl"><span class="${Math.abs(x.d.k)>50?'w':''}">${sg(x.d.k)} kcal</span><br>P ${sg(x.d.p)} · C ${sg(x.d.c)} · F ${sg(x.d.f)}</span></button>`).join('')||'<p class="note">لا توجد بدائل.</p>'}
    <button class="btn" style="width:100%;margin-top:8px" data-act="close">إغلاق</button></div>`;
  }else{
    m.innerHTML=`<div class="sheet" data-stop><h2>إضافة صنف</h2><input id="q" type="search" placeholder="🔍 ابحث (يتجاهل التشكيل والهمزات)" value="${esc(ui.aq||'')}" style="margin-bottom:6px"><div class="gch sm" style="margin:0 0 6px"><button class="${!ui.ag?'on':''}" data-act="agrp" data-v="">الكل</button>${Object.keys(GROUPS).map(g=>`<button class="${ui.ag===g?'on':''}" data-act="agrp" data-v="${g}">${GROUPS[g]}</button>`).join('')}</div><label style="display:flex;gap:8px;align-items:center;margin:4px 0 8px;font-weight:600"><input type="checkbox" id="xtra" style="width:auto" ${ui.xt?'checked':''}> خارج الخطة (أكلته فعلاً)</label><div id="addList"></div>${feat('scan')?'<label class="btn" style="display:block;text-align:center;margin-top:8px">📷 إضافة من صورة ملصق / باركود<input type="file" id="am_img" accept="image/*" style="display:none"></label>':''}<button class="btn" style="width:100%;margin-top:6px" data-act="close">إغلاق</button></div>`;
    renderAddList(ui.aq||'');
  }
}
function renderAddList(q){
  const el=$('#addList');if(!el)return;ui.aq=q;
  const L=searchFoods(q,ui.ag);
  const top=q?[]:myTopFoods(5,ui.ag);
  el.innerHTML=(top.length?`<p class="note" style="margin:0 0 4px"><b>أصنافك المعتادة</b> · من سجلك آخر 60 يوماً</p>${top.map(({f,c})=>`<button type="button" class="cand" data-act="pick" data-id="${f.id}"><span><b>${esc(f.n)}</b><small>${GROUPS[f.grp]} · أكلته ${c===1?'مرة':c===2?'مرتين':c+(c<11?' مرات':' مرة')}</small></span><span class="dl">${rd(f.k)} kcal · P ${f.p} · C ${f.c} · F ${f.f}</span></button>`).join('')}<p class="note" style="margin:8px 0 4px"><b>كل أصنافي</b></p>`:'')
    +(q?`<p class="note" style="margin:0 0 4px">${L.length?'<b>أصنافي ('+L.length+')</b>':'لا توجد نتائج في أصنافي لـ «'+esc(q)+'»'}</p>`:'')
    +L.map(f=>`<button type="button" class="cand" data-act="pick" data-id="${f.id}"><span><b>${esc(f.n)}</b><small>${GROUPS[f.grp]}${f.u&&f.ug?' · '+rd(f.k*f.ug/100)+' kcal/'+esc(f.u):''}</small></span><span class="dl">${rd(f.k)} kcal · P ${f.p} · C ${f.c} · F ${f.f}</span></button>`).join('')
    +extraHtml(q,ui.ag,'pickc')
    +(q?`<button class="btn" style="width:100%;margin-top:6px" data-act="newfromq">＋ إضافة «${esc(q)}» يدوياً</button>`:'');
}
