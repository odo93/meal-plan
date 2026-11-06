// v2/js/boot.js — التشغيل: تحميل الحالة وأول رسم وتسجيل عامل الخدمة
// سكربت عادي (ليس module): كل الملفات تتشارك نطاقاً عاماً واحداً وتُحمَّل بالترتيب في index.html.
// لا تستدعِ عند التحميل دالة من ملف لاحق؛ الاستدعاء داخل الدوال مسموح.
state=load();
if(!state){state=defaultState();const id=uid();meta={users:[{id,name:'المستخدم 1'}],cur:id};save()}
// إصلاح تلقائي لأصناف الوحدات المضافة بالخطأ (قيمة القطعة كُتبت كأنها لكل 100 جم)
(function(){const fx=[];state.foods.forEach(f=>{
  if(String(f.id).startsWith('c')&&f.u&&+f.ug>0&&!f.fixed&&f.k*f.ug/100<8&&f.k>0){
    const m=100/f.ug;f.k*=m;f.p*=m;f.c*=m;f.f*=m;f.fixed=1;fx.push(f.n)}
  });
  if(fx.length){save();setTimeout(()=>toast('تم تصحيح سعرات: '+fx.join('، ')),400)}})();
if(rollWeek())save();
{const at=autoTdee();if(at){save();setTimeout(()=>toast('حُدّث احتياجك الفعلي: '+at+' سعرة'),600)}}
fromHash();
addShared(lsGet('mp3_sfoods'));
window.addEventListener('popstate',()=>{if(location.hash&&!location.hash.startsWith('#/'))return;if(!fromHash()){ui.tab='day';ui.sub=''}modal=null;render()});
render();
loadPublic();if(cloud.sess)loadShared().then(()=>cSyncIn().catch(()=>0)).then(render);else anonSignIn().then(ok=>{if(ok)render()});
if(/access_token=/.test(location.hash))cHash().then(r=>{if(r||ui.sub==='sync')render()});
applyTheme(themeNow());
// فحص التحديثات
setTimeout(checkUpdate,3000);setInterval(()=>{if(document.visibilityState==='visible')checkUpdate()},30*60e3);
setInterval(()=>{if(document.visibilityState==='visible'&&cloud.sess)cSyncIn().catch(()=>0)},2*60e3);   // تعديلات المدرب تصل والتطبيق مفتوح
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){checkUpdate(10*60e3);if(Date.now()-syncInAt>30e3)cSyncIn().catch(()=>0);track('open');flushEvents()}});
track('open');setTimeout(flushEvents,8000);
window.addEventListener("online",()=>{render();if(cloud.sess&&!ui.remote)cSched()});window.addEventListener("offline",()=>render());
// تثبيت التطبيق والعمل بدون إنترنت (PWA)
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1'))
  window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
