// v2/js/actions.js — الأفعال والأحداث (النقر والتغيير والإدخال)
// سكربت عادي (ليس module): كل الملفات تتشارك نطاقاً عاماً واحداً وتُحمَّل بالترتيب في index.html.
// لا تستدعِ عند التحميل دالة من ملف لاحق؛ الاستدعاء داخل الدوال مسموح.
// ---------- actions ----------
function act(a,ds){
  const blk=remoteBlock(a);if(blk){toast(blk);return}
  const d=state.days[ui.day];
  switch(a){
    case 'skip':{const a=$('#app');a.focus();return}
    case 'theme':{const v=ds.v;if(v==='auto'){try{localStorage.removeItem('mp3_theme')}catch(e){}}else lsSet('mp3_theme',v);applyTheme(v);break}
    case 'tab':{const [t,sb]=String(ds.v).split('/');modal=null;ui.tab=t;ui.sub=sb||'';document.documentElement.scrollTop=0;break}
    case 'back':ui.sub='';document.documentElement.scrollTop=0;break;
    case 'uswitch':if(ui.remote){leaveRemote();meta.cur=ds.v}if(ds.v!==meta.cur||modal){modal=null;switchUser(ds.v);toast('تعرض الآن: «'+curUser().name+'»')}else{modal=null;render()}return;
    case 'who':modal={type:'who'};render();if(cloud.sess&&!ui.shared)loadShared().then(()=>{if(modal&&modal.type==='who')render()});return;
    case 'whoload':cRun(async()=>{await loadShared();render();return 'تم تحديث القائمة'});return;
    case 'whopick':{const x=(ui.shared||[])[+ds.v];if(!x)return;toast('جارٍ تحميل «'+x.name+'»…');
      openRemote(x).then(()=>{toast('تعرض الآن: «'+ui.remote.name+'»');render()},e=>{toast(e.message||String(e));render()});return}
    case 'whome':leaveRemote();modal=null;toast('رجعت إلى ملفك');break;
    case 'umode':meta.mode=ds.v;saveMeta();toast('نوع الاستخدام: '+MODES.find(x=>x[0]===ds.v)[1]);if(isCoach())loadShared().then(render);break;
    case 'annx':{const sn=lsGet('mp3_ann_seen')||[];sn.push(+ds.v);lsSet('mp3_ann_seen',sn);render();return}
    case 'reload':location.reload();return;
    case 'share':modal={type:'share',user:ds.v,role:isCoach()?'coach':'viewer'};render();return;
    case 'srole':modal.role=ds.v;render();return;
    case 'gcreate':{const M=modal;M.busy=true;render();
      cRun(async()=>{await cPush();const code=mkCode();
        await cFetch('/rest/v1/mp_grants',{method:'POST',headers:{Prefer:'return=minimal'},body:{owner:cloud.sess.uid,user_id:M.user,role:M.role,code}});
        M.code=code;M.busy=false;await loadShared();if(modal===M)render();return 'تم إنشاء كود الدعوة'}).then(()=>{if(M.busy){M.busy=false;render()}});return}
    case 'gcopy':{const c=modal&&modal.code;try{navigator.clipboard.writeText(c).then(()=>toast('تم نسخ الكود'),()=>toast('انسخ الكود يدوياً'))}catch(e){toast('انسخ الكود يدوياً')}return}
    case 'grevoke':{const id=ds.v;ask('إيقاف هذه الصلاحية؟ لن يرى الطرف الآخر الملف بعد الآن.',()=>{cRun(async()=>{await cFetch('/rest/v1/mp_grants?id=eq.'+ENC(id),{method:'DELETE'});await loadShared();render();return 'تم إيقاف الصلاحية'})});return}
    case 'gleave':{const x=(ui.shared||[])[+ds.v];if(!x)return;ask('مغادرة «'+x.name+'»؟ لن تراه بعد الآن إلا بكود جديد.',()=>{cRun(async()=>{await cFetch('/rest/v1/mp_grants?'+qs({owner:x.owner,user_id:x.user_id,grantee:cloud.sess.uid}),{method:'DELETE'});if(ui.remote&&ui.remote.owner===x.owner&&ui.remote.id===x.user_id)leaveRemote();await loadShared();render();return 'تمت المغادرة'})});return}
    case 'gaccept':{const c=(($('#inv_code')||{}).value||'').trim().toUpperCase();if(c.length<4){toast('اكتب الكود');return}
      cRun(async()=>{try{const r=await cFetch('/rest/v1/rpc/mp_accept_invite',{method:'POST',body:{p_code:c}});await loadShared();render();toast('أُضيف «'+((r&&r.name)||'')+'» إلى «من تعرض؟»');return 'تم قبول الدعوة'}
        catch(e){const m=String(e.message||e);const t=/invalid_code/.test(m)?'الكود غير صحيح أو استُخدم من قبل':/own_invite/.test(m)?'هذا كود دعوة من حسابك أنت':m;const el=$('#inv_msg');if(el)el.textContent=t;toast(t);return t}});return}
    case 'day':ui.day=+ds.v;ui.open=null;break;
    case 'goday':ui.day=+ds.v;ui.tab='day';window.scrollTo(0,0);break;
    case 'mode':{const v=ds.v,di=ui.day;if(d.mode===v){modal=null;break}ask('تغيير النوع يعيد بناء اليوم من القالب. متابعة؟',()=>{state.days[di]=buildDay(di,v,state.days[di].prot)});return}
    case 'rebuild':{const di=ui.day;ask('إعادة بناء اليوم من القالب؟ سيُفقد أي تعديل يدوي.',()=>{state.days[di]=buildDay(di,state.days[di].mode,state.days[di].prot)});return}
    case 'yes':{const f=modal.fn;modal=null;f();break}
    case 'qlog':{const it=d.meals[+ds.m].items[+ds.i];if(it.x)break;if(gE(it)==null){it.e=it.g;d.lw=weekKey()}else{delete it.e;delete it.em}break}
    case 'log':modal={type:'log',m:+ds.m,i:+ds.i};break;
    case 'logsave':case 'logskip':case 'logclr':{
      const H=modal.type==='hlog',r=H?getRec(modal.date):null,dd=H?r:d,its=dd.meals[modal.m].items,it=its[modal.i],f=FOOD(it),u=f.u&&f.ug?f.ug:1;
      if(a==='logsave'){const q=Math.max(0,+$('#lq').value||0),mm=+$('#lm').value;it.e=q*u;if(mm===modal.m)delete it.em;else it.em=mm}
      else if(a==='logskip'){it.e=0;delete it.em}
      else if(it.x)its.splice(modal.i,1);else{delete it.e;delete it.em}
      if(H){r.ts=Date.now();hPut(meta.cur,r);modal={type:'hdetail',date:r.date}}else{if(a!=='logclr')dd.lw=weekKey();modal=null}
      break}
    case 'hopen':modal={type:'hdetail',date:ds.d};break;
    case 'hlog':modal={type:'hlog',date:ds.d,m:+ds.m,i:+ds.i};break;
    case 'hdel':{const dt=ds.d;ask('حذف سجل '+dateLabel(dt)+' نهائياً؟',()=>hDel(meta.cur,dt));return}
    case 'hr':ui.hr=ds.v;break;
    case 'goal':S().goal=ds.v;break;
    case 'refitweek':ask('ضبط كميات كل الأيام (مع إبقاء الأصناف) على الأهداف الحالية؟',()=>{state.days.forEach(x=>fitDay(x,true))});return;
    case 'cmp':modal={type:'cmp'};break;
    case 'logrest':d.meals.forEach(m=>m.items.forEach(it=>{if(!it.x&&gE(it)==null)it.e=it.g}));d.lw=weekKey();break;
    case 'logclear':{const di=ui.day;ask('مسح تسجيل «'+d.name+'» (المأكول والمنقول والأصناف الإضافية)؟',()=>clearLog(state.days[di]));return}
    case 'uadd':modal={type:'user',mode:'add',name:''};break;
    case 'picdel':setPic('');return;
    case 'uren':modal={type:'user',mode:'ren',name:curUser().name};break;
    case 'usave':{const n=($('#un').value||'').trim();if(!n){toast('اكتب الاسم');return}
      if(modal.mode==='add'){const cp=!!($('#ucopy')&&$('#ucopy').checked),kid=!!($('#ukid')&&$('#ukid').checked);modal=null;addUser(n,cp,kid?'child':'');toast(kid?'تم إنشاء ملف الطفل':'تم إنشاء الملف')}
      else{curUser().name=n;modal=null}
      break}
    case 'udel':{if(meta.users.length<2){toast('لا يمكن حذف المستخدم الوحيد');return}
      const id=meta.cur,nm=curUser().name;ask('حذف المستخدم «'+nm+'» وكل خطته وإعداداته نهائياً؟',()=>delUser(id));return}
    case 'refit':fitDay(d,true);toast('تم ضبط الكميات على الهدف');break;
    case 'swap':modal={type:'swap',m:+ds.m,i:+ds.i};break;
    case 'by':modal.by=ds.v;break;
    case 'applyswap':{const it=d.meals[modal.m].items[modal.i];it.f=ds.f;it.g=+ds.g;it.b=it.g;delete it.e;delete it.em;modal=null;break}
    case 'dayopts':modal={type:'dayopts'};break;
    case 'weekopts':modal={type:'weekopts'};break;
    case 'wk':ui.wk=ds.v;render();return;
    case 'fgrp':ui.fg=ds.v;render();return;
    case 'fedit':modal={type:'food',id:ds.id};render();return;
    case 'nfopen':ui.nfOpen=!ui.nfOpen;render();if(ui.nfOpen){const e=$('#nf_n');if(e)e.focus()}return;
    case 'shave':{const st=shopState(),id=ds.v;if(id[0]==='x'){const x=st.extra[+id.slice(1)];if(x)x.have=!x.have}else{if(st.have[id])delete st.have[id];else st.have[id]=1}break}
    case 'shdel':{const st=shopState(),id=ds.v,n=(shopLines().find(z=>z.id===id)||{}).n||'';if(id[0]==='x'){const i=+id.slice(1),[x]=st.extra.splice(i,1);toast('حُذف «'+n+'»',()=>{shopState().extra.splice(i,0,x)})}else{st.del[id]=1;toast('حُذف «'+n+'»',()=>{delete shopState().del[id]})}break}
    case 'shq':modal={type:'shq',id:ds.v};render();return;
    case 'shqsave':{const st=shopState(),id=modal.id,v=(($('#shq_v')||{}).value||'').trim();if(id[0]==='x'){const x=st.extra[+id.slice(1)];if(x)x.q=v}else{if(v)st.q[id]=v;else delete st.q[id]}modal=null;break}
    case 'shadd':{const n=(($('#sh_n')||{}).value||'').trim();if(!n){toast('اكتب اسم البند');return}shopState().extra.push({n,q:(($('#sh_q')||{}).value||'').trim()});toast('أُضيف «'+n+'»');break}
    case 'shrestore':shopState().del={};break;
    case 'shreset':ask('إعادة القائمة من الخطة؟ تُلغى العلامات والكميات المعدلة والإضافات.',()=>{delete S().shop});return;
    case 'itemopts':modal={type:'item',m:+ds.m,i:+ds.i};break;
    case 'mopen':{const cur=openMeal(d),mi=+ds.m;ui.open={d:ui.day,m:cur===mi?-1:mi};render();return}
    case 'mfinish':{const mi=+ds.m,mm=d.meals[mi];
      if(mealDone(mm)){const prev=mm.items.map(it=>({e:it.e,em:it.em}));mm.items.forEach(it=>{if(!it.x){delete it.e;delete it.em}});ui.open={d:ui.day,m:mi};
        toast('أُلغي إنهاء «'+mm.n+'»',()=>{mm.items.forEach((it,k)=>{if(prev[k].e!=null)it.e=prev[k].e;if(prev[k].em!=null)it.em=prev[k].em})})}
      else{mm.items.forEach(it=>{if(!it.x&&gE(it)==null)it.e=it.g});d.lw=weekKey();const nx=d.meals.findIndex((x,j)=>j>mi&&!mealDone(x)&&x.items.length);ui.open={d:ui.day,m:nx};toast('تم تسجيل «'+mm.n+'»')}
      break}
    case 'addmeal':{const k=d.meals.filter(x=>x.n.startsWith('سناك إضافي')).length,n='سناك إضافي'+(k?' '+(k+1):'');d.meals.push({n,items:[]});ui.open={d:ui.day,m:d.meals.length-1};modal=null;toast('أُضيف «'+n+'» — أضف أصنافه');break}
    case 'delmeal':{const mi=+ds.m;if(d.meals[mi]&&!d.meals[mi].items.length&&d.meals.length>1){d.meals.splice(mi,1);ui.open=null}break}
    case 'del':{modal=null;const di=ui.day,m=+ds.m,i=+ds.i,[rm]=d.meals[m].items.splice(i,1),f=FOOD(rm);toast('حُذف «'+(f?f.n:'الصنف')+'»',()=>{state.days[di].meals[m].items.splice(i,0,rm)});break}
    case 'undo':{const u=toast.u;toast.u=null;clearTimeout(toast.t);$('#toast').style.display='none';if(u)u();break}
    case 'add':ui.aq='';ui.ag='';ui.xt=false;modal={type:'add',m:+ds.m};break;
    case 'agrp':ui.xt=!!($('#xtra')&&$('#xtra').checked);ui.aq=($('#q')||{}).value||'';ui.ag=ds.v;break;
    case 'newfromq':ui.nfd=Object.assign({},ui.nfd,{n:ui.aq||'',g:ui.ag||(ui.nfd||{}).g});ui.tab='foods';ui.nfOpen=true;modal=null;setTimeout(()=>{const e=$('#nfcard');if(e&&e.scrollIntoView)e.scrollIntoView()},60);break;
    case 'pick':{const f=F(ds.id),g=f.u&&f.ug?f.ug:100,xt=!!($('#xtra')&&$('#xtra').checked);
      d.meals[modal.m].items.push(xt?{f:f.id,g:0,b:0,r:'x',s:'',x:true,e:g}:{f:f.id,g,b:g,r:'x',s:''});if(xt)d.lw=weekKey();modal=null;break}
    case 'close':modal=(modal&&modal.type==='hlog')?{type:'hdetail',date:modal.date}:null;break;
    case 'delfood':{modal=null;const used=state.days.some(x=>x.meals.some(m=>m.items.some(i=>i.f===ds.id)));if(used){toast('الصنف مستخدم في الخطة. استبدله أولاً.');return}const fi=state.foods.findIndex(f=>f.id===ds.id);if(fi<0)return;const [rf]=state.foods.splice(fi,1);toast('حُذف الصنف «'+rf.n+'»',()=>{state.foods.splice(fi,0,rf)});break}
    case 'nftxt':ui.scan={busy:false,d:{b:'g'},txt:'',warn:[],from:null,sug:''};modal={type:'scan'};break;
    case 'online':{const q=(modal&&modal.type==='add'?ui.aq:ui.fq)||'';if(!q.trim()){toast('اكتب كلمة البحث أولاً');return}doOnline(q.trim());return}
    case 'addc':{const c=ui.cands[+ds.ci];if(!c)return;candFood(c);toast('أُضيف «'+c.n+'» إلى أصنافي');break}
    case 'pickc':{const c=ui.cands[+ds.ci];if(!c)return;const id=candFood(c),f=F(id),g=f.u&&f.ug?f.ug:100,xt=!!($('#xtra')&&$('#xtra').checked);
      d.meals[modal.m].items.push(xt?{f:id,g:0,b:0,r:'x',s:'',x:true,e:g}:{f:id,g,b:g,r:'x',s:''});if(xt)d.lw=weekKey();modal=null;toast('أُضيف «'+f.n+'» — عدّل الجرامات والماكروز تتبعها');break}
    case 'scanb':ui.scan.d.b=ds.v;break;
    case 'scansug':ui.scan.d.n=ui.scan.sug;break;
    case 'scanclose':modal=null;break;
    case 'scanreparse':{const t=($('#sc_txt')||{}).value||'';if(!t.trim()){toast('الصق النص أولاً');return}scanFill(parseLabel(t),t,{n:ui.scan.d.n||''});break}
    case 'scansave':case 'scansaveadd':{const c=scanCollect();if(!c)return;const id=candFood(c),f=F(id),from=ui.scan.from;
      if(a==='scansaveadd'&&from!=null){const g=f.u&&f.ug?f.ug:100;d.meals[from].items.push({f:id,g,b:g,r:'x',s:''})}
      modal=null;ui.scan=null;ui.fq='';toast('تم حفظ «'+f.n+'» كصنف');break}
    case 'eqadd':{const s=S(),cur=eqOf(s),src=cur.type==='lin'?cur:DEF_EQS[0],e=clone(src);e.id='e'+Date.now();e.name='معادلة جديدة';e.note='';s.eqs.push(e);s.eq=e.id;ui.eqo=e.id;break}
    case 'eqdel':{const s=S();if(s.eqs.length<2){toast('يجب بقاء معادلة واحدة على الأقل');return}const e=s.eqs.find(x=>x.id===ds.id);if(!e)return;ask('حذف المعادلة «'+e.name+'»؟',()=>{const s2=S();s2.eqs=s2.eqs.filter(x=>x.id!==ds.id)});return}
    case 'eqreset':ask('استعادة معادلات BMR الافتراضية؟ تُحذف أي معادلات أو تعديلات خاصة بك.',()=>{S().eqs=clone(DEF_EQS)});return;
    case 'gladd':{const s=S(),n=($('#gl_n')||{}).value.trim();if(!n){toast('اكتب اسم الهدف');return}const sign=+$('#gl_s').value,id='g'+Date.now();s.goals.push({id,name:n,kind:'calc',sign});s.goal=id;break}
    case 'gldel':{const s=S();if(s.goals.length<2){toast('يجب بقاء هدف واحد على الأقل');return}const g=s.goals.find(x=>x.id===ds.id);if(!g)return;ask('حذف الهدف «'+g.name+'»؟ كميات الأيام لن تتغيّر حتى تضغط «ضبط الكميات على الأهداف».',()=>{const s2=S();s2.goals=s2.goals.filter(x=>x.id!==ds.id);delete s2.g[ds.id]});return}
    case 'glreset':ask('استعادة الأهداف الافتراضية؟ تُحذف أي أهداف أو تعديلات خاصة بك على أسمائها وإعداداتها.',()=>{const s=S();s.goals=clone(DEF_GOALS);s.g={};fixSettings(s)});return;
    case 'clogin':cRun(()=>cAuth(false));return;
    case 'csignup':cRun(()=>cAuth(true));return;
    case 'cforgot':cRun(async()=>{const em=(($('#cl_em')||{}).value||cloud.email||'').trim();if(!em)return 'اكتب بريدك أولاً';cloud.email=em;cSave();await cFetch('/auth/v1/recover'+RET(),{method:'POST',anon:true,body:{email:em}});return 'أُرسل رابط الاستعادة إلى '+em+' — افتحه من نفس الجهاز'});return;
    case 'cnewpw':cRun(async()=>{const pw=($('#cl_np')||{}).value||'';if(pw.length<6)return 'كلمة المرور 6 أحرف على الأقل';await cFetch('/auth/v1/user',{method:'PUT',body:{password:pw}});ui.recov=false;setTimeout(render,0);return 'تم تغيير كلمة المرور — يمكنك الرفع الآن'});return;
    case 'clogout':leaveRemote();cloud.sess=null;cloud.auto=false;ui.shared=null;ui.grants=null;cSave();break;
    case 'cpush':cRun(cPush);return;
    case 'cpull':cRun(cPull);return;
    case 'addfood':{const n=$('#nf_n').value.trim();if(!n){toast('اكتب الاسم');return}
      const v=i=>+$('#'+i).value||0,u=$('#nf_u').value.trim(),ug=v('nf_ug'),perUnit=$('#nf_b').value==='u';
      let k=v('nf_k'),p=v('nf_p'),c=v('nf_c'),f=v('nf_f'),U='',UG=0;
      if(perUnit){if(!u){toast('اكتب اسم الوحدة (مثل: قطعة)');return}
        UG=ug>0?ug:10;U=u;const m=100/UG;k*=m;p*=m;c*=m;f*=m}   // تحويل قيم الوحدة إلى لكل 100 جم (وزن مفترض 10 جم إن تُرك فارغاً)
      else if(u&&ug>0){U=u;UG=ug}
      state.foods.push({id:'c'+Date.now(),n,grp:$('#nf_g').value,k,p,c,f,u:U,ug:UG});ui.nfd={};ui.nfT=false;ui.ocr='';ui.fq='';toast('تمت الإضافة');break}
    case 'fu':ui.fu=ds.v;break;
    case 'rebuildweek':ask('إعادة بناء كل الأيام؟ سيُفقد أي تعديل يدوي على الكميات والبدائل.',()=>{state.days=state.days.map((x,i)=>buildDay(i,x.mode,x.prot))});return;
    case 'copyshop':{const L=shopLines().filter(x=>!x.have),gs=Object.keys(GROUPS).concat('extra');const t=gs.filter(g=>L.some(x=>x.g===g)).map(g=>(g==='extra'?'إضافات':GROUPS[g])+':\n'+L.filter(x=>x.g===g).map(x=>'- '+x.n+(x.q?': '+x.q:'')).join('\n')).join('\n\n');
      try{navigator.clipboard.writeText(t).then(()=>toast('تم نسخ '+L.length+' بنداً'),()=>toast('تعذّر النسخ'))}catch(e){toast('تعذّر النسخ')}return}
    case 'print':window.print();return;
    case 'retrysave':{storeErr=null;if(!ui.remote){saveMeta();saveUser(meta.cur,state)}toast(storeErr?'ما زال الحفظ متعذراً — صدّر نسخة احتياطية':'تم الحفظ في هذا الجهاز');break}
    case 'export':{const all={v:2,meta:{cur:meta.cur},users:meta.users.map(u=>({id:u.id,name:u.name,data:u.id===meta.cur?state:loadUser(u.id),hist:hAll(u.id)}))};
      const b=new Blob([JSON.stringify(all,null,1)],{type:'application/json'}),a2=document.createElement('a');a2.href=URL.createObjectURL(b);a2.download='meal-plan-all-users.json';a2.click();return}
    case 'import':$('#file').click();return;
    case 'reset':ask('إعادة ضبط المستخدم «'+curUser().name+'» (الإعدادات والأصناف والخطة) للأصل؟ باقي المستخدمين لا يتأثرون.',()=>{defaultState()});return;
  }
  save();render();
}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-act]');
  if(!t){if(modal&&e.target.id==='modal'){modal=null;render()}return}
  act(t.dataset.act,t.dataset);
});
document.addEventListener('input',e=>{const t=e.target,id=t.id||'';
  if(id==='q')renderAddList(t.value.trim());
  else if(id==='fq'){ui.fq=t.value;const el=$('#foodList');if(el)el.innerHTML=foodsList();const c=$('#fqc');if(c)c.textContent=fqInfo().txt}
  else if(id==='usda_key'){SRC.usda=t.value.trim();lsSet(SK,SRC)}
  else if(id==='sc_txt'){ui.scan.txt=t.value}
  else if(id.startsWith('sc_')&&ui.scan&&ui.scan.d){ui.scan.d[id.slice(3)]=t.value}
  else if(id.startsWith('nf_')&&id!=='nf_img'){ui.nfd=ui.nfd||{};ui.nfd[id.slice(3)]=t.value}
});
document.addEventListener('change',e=>{const t=e.target;if(t.id!=='pic_in'||!t.files||!t.files[0]||ui.remote)return;const f=t.files[0];t.value='';
  picFrom(f).then(setPic).catch(()=>toast('تعذّر قراءة الصورة — جرّب صورة أخرى'))});
document.addEventListener('change',e=>{const t=e.target;if((t.id==='nf_img'||t.id==='am_img')&&t.files&&t.files[0]){const f=t.files[0],from=t.id==='am_img'&&modal&&modal.type==='add'?modal.m:null;t.value='';startScan(f,from)}});
document.addEventListener('change',e=>{
  const t=e.target,c=t.dataset&&t.dataset.ch;if(!c)return;
  if(ui.remote&&!canWrite()&&c!=='cl'){toast('لديك صلاحية مشاهدة فقط');render();return}
  if(c==='user'){switchUser(t.value);return}
  if(c==='hf'||c==='ht'){ui[c]=t.value;render();return}
  const d=state.days[ui.day];
  if(c==='qty'){const it=d.meals[+t.dataset.m].items[+t.dataset.i],f=F(it.f),g=Math.max(0,+t.value||0)*(f.u&&f.ug?f.ug:1);if(it.x)it.e=g;else{it.g=g;it.b=g}}
  else if(c==='prot'){const v=t.value;d.meals.flatMap(m=>m.items).filter(i=>i.s==='prot').forEach(it=>{const o=F(it.f),n=F(PROT[v]);it.g=roundG(n,o.p*it.g/100/n.p*100);it.f=n.id;it.b=it.g;delete it.e;delete it.em});d.prot=v;fitDay(d,true)}
  else if(c==='set'){state.settings[t.dataset.k]=+t.value}
  else if(c==='by'){state.settings.by=t.value}
  else if(c==='sset'){const ss=S();ss[t.dataset.k]=t.value}
  else if(c==='eqn'){const e=S().eqs.find(x=>x.id===t.dataset.id);if(e){const k=t.dataset.k;e[k]=t.value.trim()||(k==='name'?e.name:'');ui.eqo=e.id}}
  else if(c==='eqc'){const e=S().eqs.find(x=>x.id===t.dataset.id);if(e&&e[t.dataset.sx]){e[t.dataset.sx][t.dataset.k]=+t.value||0;ui.eqo=e.id}}
  else if(c==='gln'){const g=S().goals.find(x=>x.id===t.dataset.id);if(g){if(t.dataset.k==='name')g.name=t.value.trim()||g.name;else g.sign=+t.value}}
  else if(c==='cl'){const k=t.dataset.k;cloud[k]=k==='auto'?t.checked:t.value.trim();cSave();return}
  else if(c==='gp'){const ss=S(),k=t.dataset.k;ss.g[ss.goal][k]=(k==='mode'||k==='prB'||k==='fatM')?t.value:(+t.value||0)}
  else if(c==='cyc'){const ss=S(),k=t.dataset.k;ss.cyc[k]=k==='on'?t.checked:Math.min(100,Math.max(0,+t.value||0))/100}
  else if(c==='food'){const f=F(t.dataset.id),k=t.dataset.fld;
    if(k==='n'||k==='u')f[k]=t.value;
    else if(k==='ug'){ // تغيير وزن الوحدة: تبقى قيم الوحدة الواحدة وعدد الوحدات في الخطة كما هي
      const old=+f.ug||0,nv=+t.value||0;f.ug=nv;
      if(old>0&&nv>0&&old!==nv){['k','p','c','f'].forEach(m=>f[m]=f[m]*old/nv);
        state.days.forEach(dd=>dd.meals.forEach(mm=>mm.items.forEach(it=>{if(it.f===f.id){const r=nv/old;it.g*=r;it.b*=r;if(typeof it.e==='number')it.e*=r}})))}
    }else{const v=+t.value||0;f[k]=(ui.fu==='unit'&&f.u&&f.ug)?v*100/f.ug:v}}
  save((c==='qty'||c==='prot')?ui.day:undefined);render();
});
