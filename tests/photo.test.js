// صورة المستخدم في الدائرة: الحفظ والعرض والإزالة، ورفض أي محتوى غير صورة
const {JSDOM,VirtualConsole}=require('jsdom');
const html=require('./v2html')();
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x===undefined?'':x))};
const d=new JSDOM(html,{runScripts:'dangerously',url:'https://odo93.github.io/meal-plan/v2/#/today',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){w.fetch=async()=>({ok:false,status:404,text:async()=>''})}});
const w=d.window,doc=w.document,$=s=>doc.querySelector(s),$$=s=>[...doc.querySelectorAll(s)],E=s=>w.eval(s);
const click=s=>(typeof s==='string'?$(s):s).dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
E("meta.mode='family';render()");
const PIC='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP'+'A'.repeat(40)+'==';

// sanitizer
T('accepts jpeg data url',E(`picOk(${JSON.stringify(PIC)})`)===PIC);
T('rejects svg / script / http',['data:image/svg+xml;base64,PHN2Zz4=','javascript:alert(1)','https://x.y/a.jpg','data:image/png;base64,AA" onerror="x','data:text/html;base64,AA=='].every(p=>E(`picOk(${JSON.stringify(p)})`)===''));

// no photo: letter in header
T('header shows letter by default',$('#top .av')&&!$('#top .av img')&&$('#top .av').textContent.trim().length===1);

// profile page has add-photo control
E("ui.tab='me';ui.sub='profile';render()");
T('profile has photo input',!!$('#pic_in')&&$('#pic_in').getAttribute('accept')==='image/*'&&!!$('#pic_in').closest('label'));
T('no remove button without photo',!$('#app [data-act="picdel"]'));

// set photo
E(`setPic(${JSON.stringify(PIC)})`);
T('saved in settings and meta',E('state.settings.pic')===PIC&&E('curUser().pic')===PIC);
T('persisted to device',JSON.stringify(JSON.parse(w.localStorage.getItem('mp3_meta'))).includes('/9j/')&&Object.keys(w.localStorage).some(k=>/^mp3_u_[^_]+$/.test(k)&&w.localStorage.getItem(k).includes('/9j/')));
T('profile shows photo + remove',$('#app .prof .av img')&&$('#app .prof .av img').getAttribute('src')===PIC&&!!$('#app [data-act="picdel"]'));
E("ui.tab='day';ui.sub='';render()");
T('header shows photo',$('#top .av img')&&$('#top .av img').getAttribute('src')===PIC&&$('#top .av').classList.contains('ph'));
T('photo is decorative (button keeps its name)',$('#top .av img').getAttribute('alt')===''&&/من تعرض/.test($('#top .av').getAttribute('aria-label')));
E("ui.tab='me';ui.sub='';render()");
T('account card shows photo',!!$('#app .card.prof .av img'));

// second person: own letter; who-dialog lists both correctly
E("meta.users.push({id:'u2',name:'سارة'});saveMeta();ui.tab='day';render()");
click('#top .av');
const rows=$$('#modal [data-act="uswitch"]');
T('who dialog: photo for first, letter for second',rows.length===2&&!!rows[0].querySelector('.av img')&&!rows[1].querySelector('.av img')&&/س/.test(rows[1].querySelector('.av').textContent));
E('modal=null;render()');

// a bad pic coming from elsewhere (e.g. cloud) is never rendered
E("state.settings.pic='data:image/svg+xml;base64,PHN2Zz4=';render()");
T('unsafe pic not rendered',!$('#top .av img'));
E(`state.settings.pic=${JSON.stringify(PIC)};render()`);

// non-image file is rejected with a message
E("ui.tab='me';ui.sub='profile';render()");
const inp=$('#pic_in');const f=new w.File(['hello'],'a.txt',{type:'text/plain'});
Object.defineProperty(inp,'files',{value:[f],configurable:true});inp.dispatchEvent(new w.Event('change',{bubbles:true}));
setTimeout(()=>{
  T('non-image rejected',/تعذّر قراءة الصورة/.test($('#toast').textContent)&&E('state.settings.pic')===PIC);
  // remove
  click('#app [data-act="picdel"]');
  T('removed',E('state.settings.pic')===undefined&&E('curUser().pic')===undefined&&!$('#app .prof .av img'));
  E("ui.tab='day';ui.sub='';render()");T('header back to letter',!$('#top .av img'));
  // remote person: photo shown from their settings, no edit controls
  E(`ui.remote={owner:'o1',id:'r1',name:'متدرب',role:'editor',hist:[]};state.settings.pic=${JSON.stringify(PIC)};ui.tab='me';ui.sub='profile';render()`);
  T('remote: photo shown, no controls',!!$('#app .prof .av img')&&!$('#pic_in')&&!$('#app [data-act="picdel"]'));
  console.log('PASS',ok,'FAIL',bad,errs);process.exit(0);
},50);
