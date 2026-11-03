// يشغّل كل ملفات *.test.js ويفشل إن فشل أيٌّ منها
const {readdirSync}=require('fs'),{spawnSync}=require('child_process');let bad=0;
for(const f of readdirSync(__dirname).filter(x=>x.endsWith('.test.js'))){
  const r=spawnSync('node',[__dirname+'/'+f],{encoding:'utf8',timeout:120000});
  const out=(r.stdout||'')+(r.stderr||''),m=out.match(/PASS (\d+) FAIL (\d+)/);
  const fail=!m||+m[2]>0||r.status!==0;if(fail)bad++;
  console.log((fail?'✗ ':'✓ ')+f+(m?`  (${m[1]} passed, ${m[2]} failed)`:'  (no summary)'));
  if(fail)console.log(out.split('\n').filter(l=>/FAIL|Error/.test(l)).slice(0,8).join('\n'));
}
process.exit(bad?1:0);
