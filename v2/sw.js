// عامل الخدمة: يجعل v2 قابلاً للتثبيت ويعمل بدون إنترنت.
// الشبكة أولاً للصفحة (فيصل كل تحديث فور توفر الإنترنت)، والنسخة المحفوظة عند انقطاعه.
// لا يتدخل في طلبات المواقع الأخرى (Supabase وUSDA وOpen Food Facts ومكتبات CDN).
const CACHE = 'mp-v2-5';
const VER = '2.5';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png',
  './css/app.css', './js/core.js', './js/goals.js', './js/store.js', './js/catalog.js', './js/food-search.js',
  './js/views-plan.js', './js/views-me.js', './js/render.js', './js/actions.js', './js/scan.js', './js/cloud.js', './js/boot.js']
  .map(u => /\.(js|css)$/.test(u) ? u + '?v=' + VER : u);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('mp-v2-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  const nav = req.mode === 'navigate';
  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then(res => {
      if (res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(nav ? './index.html' : req, copy));
      }
      return res;
    }).catch(() => caches.match(nav ? './index.html' : req, { ignoreSearch: nav }).then(r => r || (nav ? caches.match('./') : undefined)).then(r => r || Response.error()))
  );
});
