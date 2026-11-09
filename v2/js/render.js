// v2/js/render.js — العرض: التركيز والتحديث الجزئي render()
// سكربت عادي (ليس module): كل الملفات تتشارك نطاقاً عاماً واحداً وتُحمَّل بالترتيب في index.html.
// لا تستدعِ عند التحميل دالة من ملف لاحق؛ الاستدعاء داخل الدوال مسموح.
// التركيز: نحفظ مفتاح العنصر المركَّز ونعيده بعد إعادة البناء، وننقله إلى النافذة عند فتحها ونرجعه لزرّها عند إغلاقها
const cssE=v=>(window.CSS&&CSS.escape)?CSS.escape(String(v)):String(v).replace(/["\\]/g,'\\$&');
const FK=['act','ch','k','v','m','i','id','d','ci','f','g'];
function fkey(el){if(!el||el===document.body||!el.closest)return null;if(!el.closest('#app,#top,#nav,#modal'))return null;
  if(el.id&&el.id!=='app')return '#'+cssE(el.id);
  const a=FK.filter(k=>el.dataset&&el.dataset[k]!=null).map(k=>'[data-'+k+'="'+cssE(el.dataset[k])+'"]');
  return a.length?el.tagName.toLowerCase()+a.join(''):null}
function refocus(sel,root){if(!sel)return false;let el=null;try{el=(root||document).querySelector(sel)}catch(e){}if(!el)return false;el.focus({preventScroll:true});return document.activeElement===el}
let mOpen=null,mBack=null;
function renderModal(fk){
  if(fk===undefined)fk=fkey(document.activeElement);
  const wasOpen=mOpen!=null;
  modalBody();
  const m=$('#modal'),sh=modal&&m.classList.contains('on')?m.querySelector('.sheet'):null;
  ['top','app','nav'].forEach(id=>{const e=$('#'+id);if(!e)return;if(sh)e.setAttribute('inert','');else e.removeAttribute('inert')});
  if(sh){
    sh.setAttribute('role','dialog');sh.setAttribute('aria-modal','true');sh.tabIndex=-1;
    const h=sh.querySelector('h2');if(h&&!sh.hasAttribute('aria-label')){h.id='mttl';sh.setAttribute('aria-labelledby','mttl')}
    if(!wasOpen||mOpen!==modal.type){if(!wasOpen)mBack=fk;mOpen=modal.type;if(!sh.contains(document.activeElement))sh.focus({preventScroll:true})}
    else if(!sh.contains(document.activeElement)&&!refocus(fk,sh))sh.focus({preventScroll:true});
  }else if(wasOpen){mOpen=null;const b=mBack;mBack=null;if(!refocus(b))refocus(fk)}
  else if(document.activeElement===document.body||!document.activeElement)refocus(fk);
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal){e.preventDefault();modal=null;render()}});
// تحديث جزئي: نقارن HTML الجديد بالحالي ونغيّر ما اختلف فقط، فيبقى التركيز والتمرير والأقسام المفتوحة وما يكتبه المستخدم.
// عند تغيّر الصفحة (أو الشخص المعروض) نستبدل المحتوى كاملاً.
// القسم المطوي الذي فتحه المستخدم يبقى مفتوحاً؛ الذي فتحه الكود (_ao) يُغلق إذا لم يعد الكود يطلبه
const markAo=n=>{if(n.nodeType!==1)return;if(n.tagName==='DETAILS'&&n.open)n._ao=true;n.querySelectorAll('details[open]').forEach(d=>d._ao=true)};
function patch(el,html,fresh){if(fresh||!el.firstChild){el.innerHTML=html;markAo(el);return}const t=document.createElement(el.tagName);t.innerHTML=html;mKids(el,t)}
function mSame(a,b){return a.nodeType===b.nodeType&&(a.nodeType!==1||(a.tagName===b.tagName&&a.id===b.id&&(a.getAttribute('type')||'')===(b.getAttribute('type')||'')))}
function mKids(a,b){const A=[...a.childNodes],B=[...b.childNodes];
  B.forEach((y,i)=>{const x=A[i];if(!x){markAo(y);a.appendChild(y)}else if(!mSame(x,y)){markAo(y);a.replaceChild(y,x)}else mNode(x,y)});
  for(let i=B.length;i<A.length;i++)A[i].remove()}
function mNode(x,y){
  if(x.nodeType!==1){if(x.nodeValue!==y.nodeValue)x.nodeValue=y.nodeValue;return}
  for(const at of [...y.attributes])if(x.getAttribute(at.name)!==at.value)x.setAttribute(at.name,at.value);
  for(const at of [...x.attributes])if(!y.hasAttribute(at.name)&&!(at.name==='open'&&x.tagName==='DETAILS'&&!x._ao))x.removeAttribute(at.name);
  if(x.tagName==='DETAILS')x._ao=y.hasAttribute('open');
  const tg=x.tagName;
  if(tg==='TEXTAREA'){if(x.value!==y.value)x.value=y.value;return}
  mKids(x,y);
  if(tg==='INPUT'&&x.type!=='file'){if(x.type==='checkbox'||x.type==='radio'){if(x.checked!==y.checked)x.checked=y.checked}else if(y.hasAttribute('value')&&x.value!==y.value)x.value=y.value}  // حقل بلا value في القالب (كلمة مرور، جوال…) ملك المستخدم: لا نمسحه
  else if(tg==='SELECT'){const v=y.value;if(x.value!==v)x.value=v}}
function render(){
  if(!ui.remote)freezePast(); // يمنع أن يغيّر أي تعديل لاحق ما سُجّل في الأيام الماضية
  const fk=fkey(document.activeElement);
  if(ui.tab==='me'&&!SUBS[ui.sub])ui.sub='';
  const sub=ui.tab==='me'&&ui.sub,u=ui.remote?{name:ui.remote.name}:curUser(),title=sub?SUBS[ui.sub]:(TABS.find(t=>t[0]===ui.tab)||TABS[0])[1];
  patch($('#top'),`<div class="top">${sub?`<button class="bk" data-act="back" aria-label="رجوع إلى حسابي">${ico('back')}</button>`:''}<h1>${title}${ui.tab==='me'?'':`<small>${esc(u.name)}</small>`}</h1>${ui.tab==='me'?'':`<button class="av${curPic()?' ph':''}" data-act="who" aria-haspopup="dialog" aria-label="من تعرض؟ الآن: ${esc(u.name)}" style="${ui.remote?(curPic()?'box-shadow:0 0 0 2px var(--rm)':'background:var(--rm);color:var(--card)'):''}">${avIn(u.name,curPic())}</button>`}</div>`);
  patch($('#nav'),TABS.map(([k,l])=>`<button data-act="tab" data-v="${k}" ${ui.tab===k?'aria-current="page"':''}><span>${ico(k)}</span>${l}</button>`).join(''));
  const pk=[ui.tab,ui.sub,meta.cur,ui.remote?ui.remote.owner+'/'+ui.remote.id:''].join('|');
  patch($('#app'),banners()+(ui.tab==='day'?vDay():ui.tab==='week'?vWeek():ui.tab==='hist'?vHist():ui.tab==='foods'?vFoods():vMeSub()),pk!==render.pk);render.pk=pk;
  syncHash();
  renderModal(fk);
}
