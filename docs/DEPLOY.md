# النشر على أي استضافة

## ما في مجلد `dist/` (يُبنى بـ `npm run build`)
| المسار | الاستخدام |
|---|---|
| `site/` | **الموقع كاملاً** — ارفع محتواه كما هو. الجذر = النسخة 1، `v2/` = التطبيق، `admin/` = لوحة الإدارة |
| `meal-plan-site.zip` | نفس `site/` مضغوطاً (للرفع بالسحب والإفلات) |
| `database/` | ملفات قاعدة البيانات **بالترتيب** (00 ثم 01 …) لإنشاء مشروع Supabase جديد |

الموقع ملفات ثابتة فقط (HTML/CSS/JS) بلا خادم ولا بناء، وكل الروابط داخله نسبية، فيعمل على أي نطاق وأي مسار.
الكود المصدري الكامل (مع الاختبارات والوثائق) هو المجلد الرئيسي للمشروع، ونسخته على GitHub: `https://github.com/odo93/meal-plan`.

## خيارات النشر
| الأداة | الطريقة |
|---|---|
| **GitHub Pages** (الحالي) | الرفع إلى فرع `main` يكفي؛ ينشر خلال دقيقة. |
| **Netlify** | app.netlify.com ← Add new site ← **Deploy manually** ← اسحب مجلد `site` أو ملف الـzip. |
| **Cloudflare Pages** | dash.cloudflare.com ← Workers & Pages ← Create ← Pages ← **Upload assets** ← ارفع مجلد `site`. |
| **Vercel** | من سطر الأوامر داخل `dist/site`: `npx vercel --prod`، أو اربط مستودع GitHub واجعل مجلد الإخراج `dist/site` وأمر البناء `npm run build`. |
| **أي خادم** (Nginx/Apache/استضافة مشتركة) | انسخ محتوى `site/` إلى مجلد الموقع العام (مثل `public_html`). يلزم HTTPS ليعمل التثبيت ووضع بدون إنترنت. |

ملفات `_headers` (Netlify/Cloudflare) و`vercel.json` (Vercel) تجعل الصفحات وعامل الخدمة يُعاد التحقق منها دائماً فتصل التحديثات فوراً؛ تتجاهلها الاستضافات الأخرى بلا ضرر.

## بعد النشر على نطاق جديد (مهم)
1. **Supabase ← Authentication ← URL Configuration:** أضف `https://نطاقك/**` في Redirect URLs (وغيّر Site URL إن أردت). بدونها تعود روابط التفعيل والاستعادة إلى العنوان القديم.
2. **CAPTCHA (إن فعّلته):** أضف النطاق الجديد في إعدادات Turnstile.
3. **الفحص الدوري:** حدّث رابط الموقع في `.github/workflows/keepalive.yml`.
4. افتح `https://نطاقك/v2/` وجرّب: إنشاء حساب، ورابط التفعيل، والعمل بدون إنترنت.

## مشروع Supabase جديد (اختياري، بدل الحالي)
1. أنشئ مشروعاً، ثم من SQL Editor نفّذ ملفات `database/` بالترتيب من `00` إلى آخر ملف.
2. فعّل Authentication ← Sign In / Providers: **Email** و**Allow anonymous sign-ins**، وأضف Redirect URLs كما بالأعلى.
3. ضع رابط المشروع الجديد ومفتاحه العام (anon) في:
   - `v2/js/cloud.js` ← `SB_URL` و`SB_KEY`
   - `admin/index.html` ← الكائن `SB`
   - `.github/workflows/keepalive.yml`
4. سجّل حسابك من التطبيق، ثم اجعله مديراً من SQL Editor:
   `insert into public.app_admins (user_id) select id from auth.users where email = 'بريدك';`
5. ارفع الإصدار (`APP_VER`، و`?v=` في `v2/index.html`، و`VER` و`CACHE` في `v2/sw.js`) ثم `npm run build` وانشر.
> المفتاح العام وحده يوضع في الصفحات. **لا تضع مفتاح service_role في أي ملف.**

## تحديث النسخة المنشورة لاحقاً
`npm test` ← `npm run build` ← ارفع `dist/site` من جديد (أو ادفع إلى `main` لـ GitHub Pages).
