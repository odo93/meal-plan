// v2/js/scan.js — قراءة الملصق والصورة والباركود
// سكربت عادي (ليس module): كل الملفات تتشارك نطاقاً عاماً واحداً وتُحمَّل بالترتيب في index.html.
// لا تستدعِ عند التحميل دالة من ملف لاحق؛ الاستدعاء داخل الدوال مسموح.
// ---------- قراءة الملصق الغذائي (نص ← حقول) ----------
function parseLabel(raw){
  const T=String(raw||'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٫٬]/g,'.').replace(/(\d),(\d)/g,'$1.$2').replace(/\d+(?:\.\d+)?\s*%/g,' ');
  const lines=T.split(/\n+/).map(x=>x.trim()).filter(Boolean),N=/\d+(?:\.\d+)?/g,warn=[];
  let col=0;for(const l of lines){const a=l.search(/serving|portion|الحصة|الحصه|حصة/i),b=l.search(/100\s*(?:g|gm|ml|جم|غ|غرام|مل)/i);if(a>=0&&b>=0){col=a<b?1:0;break}}
  const pick=(re,skip,after)=>{for(const l of lines){if(skip&&skip.test(l))continue;const m=l.match(re);if(!m)continue;
    const rest=l.slice(m.index+m[0].length),ts=[...rest.matchAll(/(\d+(?:\.\d+)?)(\s*(?:g|gm|ml|جم|غ|غرام|مل)\b)?/gi)].map(x=>{let n=+x[1];
      if(!x[2]&&/^\d+\.\d9$/.test(x[1])){n=+x[1].slice(0,-1);warn.push('صُحّح '+x[1]+' إلى '+n+' (الحرف g قُرئ كـ 9)')}return n});
    if(ts.length)return ts[col]!=null?ts[col]:ts[0]}return null};
  // الطاقة
  let k=null;
  for(const l of lines){if(!/energy|calor|kcal|cal\b|كالور|سعر|طاقة|طاقه/i.test(l))continue;
    const ks=[...l.matchAll(/(\d+(?:\.\d+)?)\s*(?:k\s?c[ae]?[a-z]?l|cal\b|كيلو|كالور|سعر)/gi)].map(m=>+m[1]);
    if(ks.length){k=ks[col]!=null?ks[col]:ks[0];break}
    const kj=[...l.matchAll(/(\d+(?:\.\d+)?)\s*kj/gi)].map(m=>+m[1]);
    if(kj.length){k=Math.round((kj[col]!=null?kj[col]:kj[0])/4.184);warn.push('الطاقة كانت بالكيلوجول وحُوّلت إلى سعرات');break}}
  if(k==null)k=pick(/calor|energy|سعر|كالور|طاقة|طاقه/i);
  const p=pick(/protein|بروتين/i),c=pick(/carbohydrate|carbs?\b|كربوهيدرات|كاربوهيدرات|نشويات/i);
  let f=pick(/total\s*fat|إجمالي\s*الدهون|اجمالي\s*الدهون|الدهون\s*الكلية/i);
  if(f==null)f=pick(/fat|دهون|دهن/i,/saturat|trans|mono|poly|مشبع|متحول|sat\./i);
  // الأساس: لكل 100 جم أو لكل حصة
  let ug=null;
  for(const l of lines){if(!/serving|portion|الحصة|الحصه|حصة|وزن\s*القطعة/i.test(l))continue;const m=l.match(/(\d+(?:\.\d+)?)\s*(?:g|gm|ml|جم|غ|غرام|مل)\b/i);if(m){ug=+m[1];break}}
  const has100=/(?:per|\/|في|لكل|لـ|بـ)?\s*100\s*(?:g|gm|ml|جم|غ|غرام|مل)/i.test(T);
  const fields={};let msg;
  if(k!=null)fields.k=k;if(p!=null)fields.p=p;if(c!=null)fields.c=c;if(f!=null)fields.f=f;
  if(has100||!ug){fields.b='g';if(!has100)warn.push('لم أتعرّف على الأساس (100 جم أم حصة)؛ افترضتُ لكل 100 جم')}
  else{fields.b='u';fields.u='حصة';fields.ug=ug;warn.push('القيم لكل حصة ('+ug+' جم)')}
  const miss=['k','p','c','f'].filter(x=>fields[x]==null).map(x=>({k:'السعرات',p:'البروتين',c:'الكارب',f:'الدهون'}[x]));
  if(miss.length)warn.push('لم أجد: '+miss.join('، '));
  if(fields.k>0&&fields.p!=null&&fields.c!=null&&fields.f!=null){const est=4*fields.p+4*fields.c+9*fields.f;if(Math.abs(est-fields.k)/fields.k>0.25)warn.push('السعرات لا تطابق الماكروز (≈'+Math.round(est)+')؛ تحقق من الأرقام')}
  msg=(Object.keys(fields).length>1?'تمت التعبئة — راجع القيم قبل الإضافة. ':'لم أجد قيماً غذائية في النص. ')+warn.join(' · ');
  return{fields,msg,warn};
}
// ---------- إضافة صنف من صورة: باركود ← Open Food Facts، وإلا قراءة الملصق (OCR) ← بطاقة تأكيد بزر حفظ واحد ----------
const TESS='https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js';
function loadTess(){return new Promise((ok,no)=>{if(window.Tesseract)return ok();const s=document.createElement('script');s.src=TESS;s.onload=ok;s.onerror=()=>no(new Error('تعذّر تحميل محرك القراءة (يحتاج إنترنت أول مرة)'));document.head.appendChild(s)})}
// تجهيز الصورة: تكبير/تصغير إلى ~2000px، تدرّج رمادي، شدّ التباين، (اختياري) عتبة Otsu
async function prepImg(file,mode){
  try{
    const b=await createImageBitmap(file),k=Math.min(2.5,2000/Math.max(b.width,b.height)),cv=document.createElement('canvas');
    cv.width=Math.round(b.width*k);cv.height=Math.round(b.height*k);
    const cx=cv.getContext('2d');cx.drawImage(b,0,0,cv.width,cv.height);
    const im=cx.getImageData(0,0,cv.width,cv.height),d=im.data,n=cv.width*cv.height,g=new Uint8Array(n),h=new Array(256).fill(0);
    for(let i=0;i<n;i++){const v=Math.round(.299*d[i*4]+.587*d[i*4+1]+.114*d[i*4+2]);g[i]=v;h[v]++}
    let a=0,s=0,lo=0,hi=255;for(lo=0;lo<255&&(s+=h[lo])<n*.01;lo++);s=0;for(hi=255;hi>0&&(s+=h[hi])<n*.01;hi--);
    const sp=Math.max(1,hi-lo);
    for(let i=0;i<n;i++)g[i]=Math.max(0,Math.min(255,(g[i]-lo)*255/sp));
    let th=-1;
    if(mode==='bin'){const H=new Array(256).fill(0);for(let i=0;i<n;i++)H[g[i]|0]++;let sum=0;for(let t=0;t<256;t++)sum+=t*H[t];let sB=0,wB=0,best=0;for(let t=0;t<256;t++){wB+=H[t];if(!wB)continue;const wF=n-wB;if(!wF)break;sB+=t*H[t];const mB=sB/wB,mF=(sum-sB)/wF,v=wB*wF*(mB-mF)*(mB-mF);if(v>best){best=v;th=t}}}
    for(let i=0;i<n;i++){const v=th>=0?(g[i]>th?255:0):g[i];d[i*4]=d[i*4+1]=d[i*4+2]=v;d[i*4+3]=255}
    cx.putImageData(im,0,0);
    return await new Promise(r=>cv.toBlob(r,'image/png'));
  }catch(e){return file}
}
async function readBarcode(file){
  try{if(!('BarcodeDetector' in window))return null;
    const det=new BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e']}),bm=await createImageBitmap(file),r=await det.detect(bm);
    return r&&r[0]&&r[0].rawValue?String(r[0].rawValue):null}catch(e){return null}
}
const scanScore=p=>['k','p','c','f'].filter(x=>p.fields[x]!=null).length+(p.warn.some(w=>/لا تطابق/.test(w))?0:1);
function nameGuess(text){
  const bad=/energy|calor|protein|fat|carbo|sugar|sodium|salt|fibre|fiber|serving|per\s*100|nutrition|facts|ingredients|kcal|kj|سعر|طاق|بروتين|دهون|كربو|سكر|صوديوم|الحصة|حصة|مكونات|معلومات|غذائية|القيمة/i;
  return String(text||'').split(/\n+/).map(l=>l.replace(/[^A-Za-z؀-ۿ\s'&-]/g,' ').replace(/\s+/g,' ').trim()).filter(l=>l.length>=3&&l.length<=40&&!bad.test(l)&&/[A-Za-z؀-ۿ]{3}/.test(l))[0]||'';
}
function scanFill(p,text,extra){
  const f=p.fields,d=Object.assign({n:'',g:'carb',b:f.b||'g',k:f.k,p:f.p,c:f.c,f:f.f,u:f.u||'',ug:f.ug||''},extra||{});
  if(!d.n)d.n='';
  d.g=guessGrp(d.n||'',+d.k||0,+d.p||0,+d.c||0,+d.f||0);
  ui.scan=Object.assign(ui.scan||{},{busy:false,d,txt:text||'',warn:p.warn||[],sug:nameGuess(text),msg:''});
}
async function startScan(file,from){
  const say=t=>{ui.scan.msg=t;const e=$('#scmsg');if(e)e.textContent=t};
  let url='';try{url=URL.createObjectURL(file)}catch(e){}
  ui.scan={busy:true,msg:'تجهيز الصورة…',from,url,d:{},warn:[]};modal={type:'scan'};render();
  try{
    say('أبحث عن باركود…');
    const bc=await readBarcode(file);
    if(bc){say('باركود '+bc+' — أبحث في Open Food Facts…');
      try{const r=await offSearch(bc);if(r.items.length){const c=r.items[0];
        ui.scan.busy=false;ui.scan.src='off';ui.scan.warn=['القيم من Open Food Facts للباركود '+bc+' — راجعها'];
        ui.scan.d={n:c.n,g:c.grp,b:'g',k:c.k,p:c.p,c:c.c,f:c.f,u:c.u,ug:c.ug||''};ui.scan.txt='';ui.scan.sug='';render();return}}catch(e){}
      say('الباركود غير موجود في القاعدة — أقرأ الملصق…')}
    say('تحميل محرك القراءة (أول مرة فقط)…');await loadTess();
    const w=await Tesseract.createWorker(['eng','ara'],1,{logger:m=>{if(m&&m.status==='recognizing text')say('قراءة الملصق… '+Math.round(m.progress*100)+'%')}});
    let best=null;
    try{
      for(const [mode,psm] of [['gray','6'],['bin','4'],['gray','11']]){
        await w.setParameters({tessedit_pageseg_mode:psm,preserve_interword_spaces:'1'});
        say('قراءة الملصق ('+(mode==='bin'?'نسخة معالجة':'نسخة عادية')+')…');
        const img=await prepImg(file,mode),r=await w.recognize(img),p=parseLabel(r.data.text),sc=scanScore(p);
        if(!best||sc>best.sc)best={sc,p,text:r.data.text};
        if(sc>=5)break;
      }
    }finally{try{await w.terminate()}catch(e){}}
    scanFill(best.p,best.text);
    if(!best.p.fields.k&&best.p.fields.k!==0)ui.scan.warn.unshift('لم أستطع قراءة الأرقام بوضوح؛ صوّر الجدول من قرب وبإضاءة جيدة أو عدّل القيم يدوياً');
  }catch(e){
    ui.scan.busy=false;ui.scan.d=ui.scan.d||{};ui.scan.warn=['تعذّرت القراءة التلقائية ('+(e.message||e)+') — اكتب القيم أدناه أو الصق نص الملصق.'];
  }
  render();
}
function scanHtml(){
  const S0=ui.scan||{},d=S0.d||{},v=k=>esc(d[k]==null?'':d[k]);
  if(S0.busy)return `<div class="sheet" data-stop><h2>قراءة الصورة</h2>${S0.url?`<img src="${S0.url}" alt="" style="max-width:120px;border-radius:8px">`:''}<p class="note" id="scmsg">${esc(S0.msg||'')}</p><button class="btn" style="width:100%" data-act="scanclose">إلغاء</button></div>`;
  const per=d.b==='u',bad=(+d.k>0&&d.p!=null&&d.c!=null&&d.f!=null)?Math.abs(4*d.p+4*d.c+9*d.f-d.k)/d.k>0.25:false;
  return `<div class="sheet sc" data-stop><h2>تأكيد الصنف</h2>
  ${(S0.warn||[]).map(w=>`<p class="note" style="margin:2px 0">⚠ ${esc(w)}</p>`).join('')}
  <div style="display:flex;gap:8px;align-items:flex-start;margin:6px 0">${S0.url?`<img src="${S0.url}" alt="" style="width:70px;border-radius:8px">`:''}<div style="flex:1"><input id="sc_n" aria-label="اسم الصنف" placeholder="اسم الصنف (مطلوب)…" value="${v('n')}" style="width:100%">${S0.sug&&!d.n?`<button class="btn" style="margin-top:4px;padding:4px 8px;font-size:12px" data-act="scansug">اقتراح: ${esc(S0.sug)}</button>`:''}</div></div>
  <div class="seg" style="margin-bottom:6px"><button class="${!per?'on':''}" data-act="scanb" data-v="g">القيم لكل 100 جم</button><button class="${per?'on':''}" data-act="scanb" data-v="u">القيم لكل حصة / وحدة</button></div>
  <div class="frm"><label>سعرات<input id="sc_k" type="number" step="any" inputmode="decimal" value="${v('k')}"></label><label>بروتين (جم)<input id="sc_p" type="number" step="any" inputmode="decimal" value="${v('p')}"></label><label>كارب (جم)<input id="sc_c" type="number" step="any" inputmode="decimal" value="${v('c')}"></label><label>دهون (جم)<input id="sc_f" type="number" step="any" inputmode="decimal" value="${v('f')}"></label>
  ${per?`<label>اسم الوحدة<input id="sc_u" placeholder="قطعة / حصة" value="${v('u')}"></label><label>وزنها بالجرام<input id="sc_ug" type="number" step="any" inputmode="decimal" value="${v('ug')}"></label>`:''}
  <label style="grid-column:1/-1">المجموعة<select id="sc_g">${Object.keys(GROUPS).map(g=>`<option value="${g}" ${d.g===g?'selected':''}>${GROUPS[g]}</option>`).join('')}<option value="__new">＋ فئة جديدة…</option></select></label>${ui.ngOpen?`<div class="frm" style="grid-column:1/-1;margin-top:4px"><label style="grid-column:1/-1">اسم الفئة الجديدة<input id="ng_n" maxlength="30" placeholder="مثال: حلويات، مكسرات، مشروبات"></label><button class="btn pri" data-act="addgrp">إضافة الفئة</button><button class="btn" data-act="ngcancel">إلغاء</button></div>`:''}</div>
  ${bad?'<p class="note" style="color:var(--act)">السعرات لا تطابق الماكروز (4·P + 4·C + 9·F)؛ راجع الأرقام.</p>':''}
  <button class="btn pri" style="width:100%;margin-top:8px" data-act="scansave">💾 حفظ كصنف</button>
  ${S0.from!=null?'<button class="btn" style="width:100%;margin-top:6px" data-act="scansaveadd">💾 حفظ وإضافته لهذه الوجبة</button>':''}
  <details style="margin-top:8px"><summary class="note">النص المقروء / لصق نص ملصق</summary><textarea id="sc_txt" rows="4" style="width:100%" aria-label="نص الملصق" placeholder="الصق نص الملصق هنا…">${esc(S0.txt||'')}</textarea><button class="btn" style="width:100%;margin-top:4px" data-act="scanreparse">إعادة تحليل النص</button></details>
  <button class="btn" style="width:100%;margin-top:6px" data-act="scanclose">إلغاء</button></div>`;
}
function scanCollect(){
  const d=ui.scan.d,n=(d.n||'').trim();
  if(!n){toast('اكتب اسم الصنف');const e=$('#sc_n');if(e)e.focus();return null}
  let k=+d.k||0,p=+d.p||0,c=+d.c||0,f=+d.f||0,u='',ug=0;
  if(d.b!=='u'&&d.u&&+d.ug>0){u=d.u;ug=+d.ug}
  if(!(k>0||p>0||c>0||f>0)){toast('أدخل القيم الغذائية');return null}
  if(!(k>0))k=4*p+4*c+9*f;
  if(d.b==='u'){ug=+d.ug||0;u=(d.u||'').trim()||'حصة';if(!(ug>0)){toast('اكتب وزن الحصة/الوحدة بالجرام');return null}
    const m=100/ug;k*=m;p*=m;c*=m;f*=m}
  return{n,grp:d.g||'carb',k:+k.toFixed(2),p:+p.toFixed(2),c:+c.toFixed(2),f:+f.toFixed(2),u,ug,src:ui.scan.src==='off'?'off':'label'};
}
