// المجموعة د: التثبيت (manifest + عامل الخدمة) والوضع الليلي
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');const path=require('path');
const V2=path.join(__dirname,'..','v2');
const html=require('./v2html')();
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x===undefined?'':x))};

// manifest + icons + service worker files
const man=JSON.parse(fs.readFileSync(path.join(V2,'manifest.webmanifest'),'utf8'));
T('manifest basics',man.name&&man.short_name&&man.display==='standalone'&&man.lang==='ar'&&man.dir==='rtl'&&man.start_url&&man.scope==='./');
T('manifest icons 192/512/maskable exist',['192x192','512x512'].every(s=>man.icons.some(i=>i.sizes===s))&&man.icons.some(i=>i.purpose==='maskable')&&man.icons.every(i=>fs.existsSync(path.join(V2,i.src))));
T('apple-touch-icon exists',/rel="apple-touch-icon" href="icons\/icon-180.png"/.test(html)&&fs.existsSync(path.join(V2,'icons','icon-180.png')));
T('manifest linked',/<link rel="manifest" href="manifest.webmanifest">/.test(html));
T('theme-color light+dark',/name="theme-color"[^>]*prefers-color-scheme: light/.test(html)&&/name="theme-color"[^>]*prefers-color-scheme: dark/.test(html));
const sw=fs.readFileSync(path.join(V2,'sw.js'),'utf8');
T('sw caches core and is network-first',/addAll\(CORE\.map/.test(sw)&&/fetch\(req, \{ cache: 'no-cache' \}\)\.then/.test(sw)&&/caches\.match/.test(sw));
T('sw ignores other origins and non-GET',/url\.origin !== location\.origin/.test(sw)&&/req\.method !== 'GET'/.test(sw));
const core=(sw.match(/CORE = \[([\s\S]*?)\]/)[1].match(/'\.\/[^']*'/g)||[]).map(x=>x.slice(3,-1));
T('sw core files exist',core.filter(Boolean).every(f=>fs.existsSync(path.join(V2,f))),core.filter(f=>f&&!fs.existsSync(path.join(V2,f))).join());
// split files: every css/js that index.html loads is cached by the SW, and all version stamps match APP_VER
const raw=fs.readFileSync(path.join(V2,'index.html'),'utf8');
const refs=[...raw.matchAll(/(?:src|href)="((?:js|css)\/[^"?]+)\?v=([^"]+)"/g)];
const appVer=(fs.readFileSync(path.join(V2,'js','views-me.js'),'utf8').match(/APP_VER='([^']+)'/)||[])[1];
T('index loads css + js files',refs.length>=10&&refs.some(r=>r[1]==='css/app.css'),refs.length);
T('all ?v= stamps equal APP_VER and sw VER',appVer&&refs.every(r=>r[2]===appVer)&&(sw.match(/const VER = '([^']+)'/)||[])[1]===appVer,appVer+' '+refs.map(r=>r[2]).join());
T('sw caches every split file',refs.every(r=>core.includes(r[1])),refs.filter(r=>!core.includes(r[1])).map(r=>r[1]).join());
const vj=JSON.parse(fs.readFileSync(path.join(V2,'version.json'),'utf8'));
T('version.json matches APP_VER (update banner)',vj.v===appVer&&Array.isArray(vj.notes),vj.v+' vs '+appVer);
T('no inline app script left in index.html',(raw.match(/<script>/g)||[]).length===1);
const js=fs.readdirSync(path.join(V2,'js')).filter(f=>f.endsWith('.js'));
T('every js file is loaded',js.every(f=>refs.some(r=>r[1]==='js/'+f)),js.filter(f=>!refs.some(r=>r[1]==='js/'+f)).join());

// no hard-coded light surfaces left in CSS outside the token blocks
const css=html.slice(html.indexOf('<style>'),html.indexOf('</style>')).split('\n').filter(l=>!/^(:root|@media \(prefers-color-scheme)/.test(l)).join('\n');
const left=(css.match(/background:#(fff|eee|f0f0f2|fde8e8|e3f5ea|e8eefc)\b/g)||[]);
T('no hard-coded light backgrounds',left.length===0,left.join());
T('dark palette defined twice (system + manual)',/@media \(prefers-color-scheme:dark\)\{:root:not\(\[data-theme="light"\]\)\{--bg:/.test(html)&&/:root\[data-theme="dark"\]\{--bg:/.test(html));

// every token block defines literal values (a token that points to itself is invalid and silently empty)
const blocks=html.match(/^(:root\{|@media \(prefers-color-scheme:dark\)\{:root[^{]*\{|:root\[data-theme="dark"\]\{).*$/gm)||[];
T('three token blocks',blocks.length===3,blocks.length);
const defs=b=>Object.fromEntries((b.match(/--[a-z0-9-]+:[^;}]+/g)||[]).map(x=>{const i=x.indexOf(':');return [x.slice(0,i),x.slice(i+1)]}));
const D=blocks.map(defs);
T('no var() inside token blocks',D.every(d=>Object.values(d).every(v=>!/var\(/.test(v))),JSON.stringify(D.map(d=>Object.entries(d).filter(([,v])=>/var\(/.test(v)))));
T('dark blocks define every light token',D.slice(1).every(d=>Object.keys(D[0]).every(k=>k in d)),Object.keys(D[0]).filter(k=>!(k in D[1])).join());
const used=[...new Set((html.match(/var\(--[a-z0-9-]+/g)||[]).map(x=>x.slice(4)))];
T('every used token is defined',used.every(k=>k in D[0]),used.filter(k=>!(k in D[0])).join());

function boot(theme){
  const d=new JSDOM(html,{runScripts:'dangerously',url:'https://odo93.github.io/meal-plan/v2/#/today',virtualConsole:vc,pretendToBeVisual:true,
    beforeParse(w){w.fetch=async()=>({ok:false,status:404,text:async()=>''});if(theme)w.localStorage.setItem('mp3_theme',JSON.stringify(theme))}});
  return d.window;
}
// early theme script applies a saved choice before first paint
let w=boot('dark');T('saved dark applied on load',w.document.documentElement.dataset.theme==='dark');
T('theme-color follows manual dark',[...w.document.querySelectorAll('meta[name="theme-color"]')].every(m=>m.content==='#1c1c1f'));
w=boot();T('auto has no data-theme',!('theme' in w.document.documentElement.dataset));

// theme switch in «حسابي»
const doc=w.document,$=s=>doc.querySelector(s),E=s=>w.eval(s);
const click=s=>$(s).dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
E("meta.mode='self';ui.tab='me';ui.sub='';render()");
T('theme control present',!!$('#app [data-act="theme"][data-v="dark"]')&&$('#app [data-act="theme"][data-v="auto"]').getAttribute('aria-pressed')==='true');
click('#app [data-act="theme"][data-v="dark"]');
T('dark chosen',doc.documentElement.dataset.theme==='dark'&&JSON.parse(w.localStorage.getItem('mp3_theme'))==='dark'&&$('#app [data-act="theme"][data-v="dark"]').getAttribute('aria-pressed')==='true');
click('#app [data-act="theme"][data-v="light"]');T('light chosen',doc.documentElement.dataset.theme==='light');
click('#app [data-act="theme"][data-v="auto"]');T('auto clears',!('theme' in doc.documentElement.dataset)&&w.localStorage.getItem('mp3_theme')===null);

// offline notice
E("ui.tab='day';render()");
Object.defineProperty(w.navigator,'onLine',{configurable:true,get:()=>false});w.dispatchEvent(new w.Event('offline'));
T('offline banner shown',/لا يوجد اتصال بالإنترنت/.test($('#app').textContent));
Object.defineProperty(w.navigator,'onLine',{configurable:true,get:()=>true});w.dispatchEvent(new w.Event('online'));
T('offline banner gone',!/لا يوجد اتصال بالإنترنت/.test($('#app').textContent));

console.log('PASS',ok,'FAIL',bad,errs);process.exit(0);
