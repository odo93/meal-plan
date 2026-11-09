// النسخة الأولى: بانر «نسخة جديدة متاحة» يقرأ v2/version.json ويفتح v2، بلا أي تغيير آخر في v1
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x===undefined?'':x))};
const mk=(ver,ls)=>new JSDOM(html,{runScripts:'dangerously',url:'https://odo93.github.io/meal-plan/',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){
  (ls||[]).forEach(([k,v])=>w.localStorage.setItem(k,v));
  w.fetch=async(u,o)=>{const p=new URL(u,'https://odo93.github.io/meal-plan/').pathname;
    if(p==='/meal-plan/v2/version.json')return ver?{ok:true,status:200,json:async()=>ver}:{ok:false,status:404,json:async()=>null};
    return {ok:false,status:404,text:async()=>'',json:async()=>null}}}});
(async()=>{
 let d=mk({v:'2.12',notes:['الوجبات من 3 إلى 6','<b>x</b>']}),w=d.window,$=s=>w.document.querySelector(s);await sleep(60);
 const b=$('#v2upd');
 T('banner shown on v1',b&&b.style.display==='block'&&/نسخة جديدة من التطبيق متاحة \(2\.12\)/.test(b.textContent));
 T('notes listed and escaped',/الوجبات من 3 إلى 6/.test(b.textContent)&&!b.querySelector('ul b'));
 T('button opens v2',b.querySelector('a').getAttribute('href')==='v2/'&&/الانتقال للنسخة الجديدة/.test(b.querySelector('a').textContent));
 T('explains data moves on first open',/تنتقل بياناتك/.test(b.textContent));
 $('#v2upd_x').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
 T('«later» hides until the next version',b.style.display==='none'&&w.localStorage.getItem('v2upd_hide')==='2.12');
 d=mk({v:'2.12',notes:[]},[['mp3_imported','v1:3:2026-11-04']]);w=d.window;$=s=>w.document.querySelector(s);await sleep(60);
 T('already moved: says the data is in the new version',/وبياناتك فيها/.test($('#v2upd').textContent));
 d=mk(null);w=d.window;$=s=>w.document.querySelector(s);await sleep(60);
 T('no version file → nothing shown',$('#v2upd').style.display==='none');
 console.log('PASS',ok,'FAIL',bad,errs);process.exit(0);
})();
