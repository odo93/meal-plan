// الخطة (الأسبوع والتزامه، المشتريات القابلة للتعديل)، التقدم، والأصناف (بحث، تصنيف، تعديل في نافذة)
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(__dirname+'/../v2/index.html','utf8');
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
let ok=0,bad=0;const T=(n,c,x)=>{c?ok++:(bad++,console.log('FAIL',n,x===undefined?'':x))};
const d=new JSDOM(html,{runScripts:'dangerously',url:'https://odo93.github.io/meal-plan/v2/',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){w.fetch=async()=>({ok:false,status:404,text:async()=>''});w.navigator.clipboard={writeText:async t=>{w.__clip=t}}}});
const w=d.window,$=s=>w.document.querySelector(s),$$=s=>[...w.document.querySelectorAll(s)],E=s=>w.eval(s);
const click=s=>(typeof s==='string'?$(s):s).dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 E("meta.mode='self';render()");
 // 1) Plan: week summary and day rows
 click('#nav [data-v="week"]');
 T('7 day rows',$$('#app [data-act="goday"]').length===7);
 T('weekly adherence shown',$('#app').textContent.includes('التزامك هذا الأسبوع'));
 E("state.days[0].meals.forEach(m=>m.items.forEach(i=>{if(!i.x)i.e=i.g}));render()");
 T('done day marked',$$('#app [data-act="goday"]')[0].querySelector('.dl.ok')!=null&&/1 من 7/.test($('#app').textContent));
 click('[data-act="weekopts"]');
 T('week options in sheet',!!$('#modal [data-act="rebuildweek"]')&&!!$('#modal [data-act="refitweek"]'));
 click('#modal [data-act="close"]');
 // 2) Shopping: have / delete+undo / quantity / extra / copy
 click('[data-act="wk"][data-v="shop"]');
 const n0=$$('.shi').length;T('shopping items',n0>5);
 const first=$('[data-act="shave"]').dataset.v;click(`[data-act="shave"][data-v="${first}"]`);
 T('mark as have',E(`S().shop.have['${first}']`)===1&&$('.shi.have')!=null);
 const second=$$('[data-act="shdel"]')[1].dataset.v;click(`[data-act="shdel"][data-v="${second}"]`);
 T('delete item',$$('.shi').length===n0-1&&!!$('[data-act="shrestore"]'));
 click('#toast [data-act="undo"]');
 T('undo delete',$$('.shi').length===n0);
 click(`[data-act="shq"][data-v="${second}"]`);$('#shq_v').value='2 كجم';click('[data-act="shqsave"]');
 T('quantity override',$(`[data-act="shq"][data-v="${second}"]`).textContent==='2 كجم');
 $('#sh_n').value='مناديل';$('#sh_q').value='2';click('[data-act="shadd"]');
 T('extra item',$('#app').textContent.includes('مناديل')&&$('#app').textContent.includes('إضافات'));
 T('edits persist in settings',JSON.parse(w.localStorage.getItem('mp3_u_'+E('meta.cur'))).settings.shop.extra[0].n==='مناديل');
 click('[data-act="copyshop"]');await sleep(10);
 T('copy skips items I have, keeps edits',w.__clip&&w.__clip.includes('مناديل: 2')&&w.__clip.includes('2 كجم')&&!w.__clip.includes('- '+E(`F('${first}').n`)+':'),w.__clip&&w.__clip.slice(0,120));
 E("S().shop.wk='2000-01-01';render()");
 T('new week starts fresh',!$('#app').textContent.includes('مناديل'));
 // 3) Progress
 click('#nav [data-v="hist"]');
 T('progress tiles or empty state',!!$('#app .tiles')||$('#app').textContent.includes('لا سجلات'));
 // 4) Foods: chips filter, edit sheet, new food form hidden until asked
 click('#nav [data-v="foods"]');
 const groups=()=>$$('#foodList .grp').map(g=>g.textContent);
 T('all groups listed',groups().length>=4);
 click('[data-act="fgrp"][data-v="pro"]');
 T('filter by group',groups().length===1&&groups()[0]==='بروتين');
 click('[data-act="fgrp"][data-v=""]');
 T('new food form hidden',$('#nfcard').parentElement.hidden===true);
 click('[data-act="nfopen"]');
 T('new food form opens',$('#nfcard').parentElement.hidden===false);
 const fid=$('#foodList [data-act="fedit"]').dataset.id;click(`[data-act="fedit"][data-id="${fid}"]`);
 T('edit sheet',!!$('#modal [data-ch="food"][data-fld="k"]')&&!!$('#modal [data-act="delfood"]'));
 const k=$('#modal [data-ch="food"][data-fld="k"]');k.value='999';k.dispatchEvent(new w.Event('change',{bubbles:true}));
 T('edit saves',E(`F('${fid}').k`)===999);
 console.log('PASS',ok,'FAIL',bad,errs);process.exit(0)})();
