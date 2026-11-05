// يبني نسخة النشر في dist/:
//   dist/site/                 ← ارفع محتواه إلى أي استضافة ملفات ثابتة (Netlify, Vercel, Cloudflare Pages, GitHub Pages, أي خادم)
//   dist/meal-plan-site.zip    ← نفس الموقع مضغوطاً (للرفع بالسحب والإفلات)
//   dist/database/             ← ملفات قاعدة البيانات بالترتيب لإنشاء مشروع Supabase جديد
// التشغيل: npm run build
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'dist'), SITE = path.join(OUT, 'site'), DB = path.join(OUT, 'database');

function copy(src, dst) {
  const st = fs.statSync(src);
  if (st.isDirectory()) { fs.mkdirSync(dst, { recursive: true }); for (const f of fs.readdirSync(src)) copy(path.join(src, f), path.join(dst, f)); }
  else fs.copyFileSync(src, dst);
}
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(SITE, { recursive: true });

// 1) الموقع: v1 في الجذر، v2، لوحة الإدارة
for (const f of ['index.html', '.nojekyll', 'v2', 'admin']) copy(path.join(ROOT, f), path.join(SITE, f));
// ترويسات اختيارية تفهمها بعض الاستضافات: عامل الخدمة والصفحات تُعاد التحقق دائماً حتى تصل التحديثات فوراً
fs.writeFileSync(path.join(SITE, '_headers'),
  '/v2/sw.js\n  Cache-Control: no-cache\n/v2/index.html\n  Cache-Control: no-cache\n/admin/index.html\n  Cache-Control: no-cache\n');
fs.writeFileSync(path.join(SITE, 'vercel.json'), JSON.stringify({
  headers: ['/v2/sw.js', '/v2/index.html', '/admin/index.html'].map(source => ({ source, headers: [{ key: 'Cache-Control', value: 'no-cache' }] }))
}, null, 2));

// 2) قاعدة البيانات بالترتيب
fs.mkdirSync(DB, { recursive: true });
fs.copyFileSync(path.join(ROOT, 'schema.sql'), path.join(DB, '00_schema.sql'));
fs.readdirSync(path.join(ROOT, 'supabase', 'migrations')).sort().forEach((f, i) =>
  fs.copyFileSync(path.join(ROOT, 'supabase', 'migrations', f), path.join(DB, String(i + 1).padStart(2, '0') + '_' + f)));

// دليل النشر بجانب الملفات
fs.copyFileSync(path.join(ROOT, 'docs', 'DEPLOY.md'), path.join(OUT, 'اقرأني-النشر.md'));

// 3) الضغط: كاتب ZIP صغير بـ Node فقط (بلا أدوات خارجية) — ضغط deflate وأسماء UTF-8
const zlib = require('zlib');
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 } return t })();
const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0 };
function zipDir(dir, out) {
  const files = [], walk = (d, rel) => fs.readdirSync(d, { withFileTypes: true }).forEach(e => { const p = path.join(d, e.name), r = rel ? rel + '/' + e.name : e.name; e.isDirectory() ? walk(p, r) : files.push([p, r]) });
  walk(dir, ''); const parts = [], cen = []; let off = 0;
  for (const [p, r] of files) {
    const data = fs.readFileSync(p), comp = zlib.deflateRawSync(data, { level: 9 }), name = Buffer.from(r, 'utf8'), crc = crc32(data);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(8, 8);
    h.writeUInt32LE(crc, 14); h.writeUInt32LE(comp.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(name.length, 26);
    parts.push(h, name, comp);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(8, 10);
    c.writeUInt32LE(crc, 16); c.writeUInt32LE(comp.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(name.length, 28); c.writeUInt32LE(off, 42);
    cen.push(c, name); off += 30 + name.length + comp.length;
  }
  const cd = Buffer.concat(cen), e = Buffer.alloc(22); e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(files.length, 8); e.writeUInt16LE(files.length, 10);
  e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(off, 16);
  fs.writeFileSync(out, Buffer.concat([...parts, cd, e])); return files.length;
}
const zip = path.join(OUT, 'meal-plan-site.zip'), zn = zipDir(SITE, zip), r = { status: zn ? 0 : 1 };
const ver = (fs.readFileSync(path.join(ROOT, 'v2', 'js', 'views-me.js'), 'utf8').match(/APP_VER='([^']+)'/) || [])[1];
const count = d => fs.readdirSync(d, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? count(path.join(d, e.name)) : 1), 0);
console.log(`v${ver}: dist/site (${count(SITE)} ملفاً)${r.status === 0 && fs.existsSync(zip) ? ' + dist/meal-plan-site.zip' : ' (تعذّر الضغط — اضغط dist/site يدوياً)'} + dist/database (${fs.readdirSync(DB).length} ملفات)`);
