# تجهيز الإنتاج — قائمة المالك

## ✅ منجز
| البند | التفاصيل |
|---|---|
| الحسابات المؤقتة | مفعّلة في Supabase ← Sign In / Providers. |
| روابط العودة | أُضيف `https://odo93.github.io/meal-plan/**` في Supabase ← URL Configuration، فتعود روابط التفعيل والاستعادة إلى v2 (كانت تعود إلى v1). |
| أخطاء التطبيق | تُسجَّل تلقائياً في `app_errors` وتظهر في لوحة الإدارة ← «الأخطاء». |
| CAPTCHA | جاهز في الكود ولوحة الإدارة، ينتظر المفاتيح (البند 4). |
| فحص دوري | `.github/workflows/keepalive.yml` كل 3 أيام: يفحص الموقع وقاعدة البيانات ويمنع إيقاف المشروع المجاني. إن فشل يصلك بريد من GitHub. |
| الصفحات القانونية | `v2/privacy.html` و`v2/terms.html` (مع تنبيه صحي)، و«حذف حسابي» داخل التطبيق. |
| قوالب البريد العربية | جاهزة في `docs/email-templates/` (تُلصق بعد البند 2). |

## ⏳ مطلوب منك (بالترتيب)

### 1) ترقية Supabase إلى Pro (حوالي 25$ شهرياً)
Supabase ← اسم المؤسسة ← Billing ← Upgrade to Pro.
- يمنع الإيقاف بعد أسبوع بلا نشاط، ويضيف نسخاً احتياطية يومية و8 GB.
- بعدها فعّل من Authentication ← Attack Protection: **Leaked password protection**.

### 2) بريد الإرسال (SMTP) — مثال: Resend (مجاني حتى 3,000 رسالة/شهر)
1. أنشئ حساباً في resend.com، وأضف نطاقك (البند 3) وأكّد سجلات DNS.
2. أنشئ API key.
3. Supabase ← Authentication ← Emails ← SMTP Settings ← Enable custom SMTP:
   - Host: `smtp.resend.com` · Port: `465` · Username: `resend` · Password: مفتاح API.
   - Sender email: `no-reply@نطاقك` · Sender name: `نظام الوجبات`.
4. بعدها تُفتح القوالب: Authentication ← Emails ← Templates. الصق محتوى:
   - Confirm sign up ← `docs/email-templates/confirm-signup.html`
   - Change email address ← `change-email.html`
   - Reset password ← `reset-password.html`
   (الموضوع مكتوب في أول سطر من كل ملف.)

### 3) نطاق خاص (Domain)
- اشترِ نطاقاً (Cloudflare Registrar أرخص الخيارات عادة).
- GitHub ← Settings ← Pages ← Custom domain، أو انقل الاستضافة إلى Cloudflare Pages.
- بعد ربطه حدّث في Supabase ← URL Configuration: Site URL، وأضف `https://نطاقك/**` في Redirect URLs.

### 4) CAPTCHA — Cloudflare Turnstile (مجاني)
1. Cloudflare ← Turnstile ← Add widget ← النطاق: `odo93.github.io` (ونطاقك لاحقاً) ← الوضع: Managed.
2. **أولاً** ضع **Site key** في لوحة الإدارة ← إعدادات التطبيق ← «الحماية من الحسابات الوهمية» ← حفظ.
3. **ثم** Supabase ← Authentication ← Attack Protection ← Enable CAPTCHA ← Turnstile ← ضع **Secret key**.
> لو عكست الترتيب يتعطل تسجيل الدخول حتى تضع المفتاح العام.

### 5) بريد تواصل في سياسة الخصوصية
أرسل لي البريد الذي تريد ظهوره للمستخدمين لأضيفه في `privacy.html` و`terms.html`.

### 6) قانوني (قبل الإطلاق التجاري)
- مراجعة نظام حماية البيانات الشخصية (السعودية) لبيانات الصحة: هل يلزم حفظها داخل المملكة؟ مكان مشروع Supabase الحالي يظهر في Project Settings ← General.
- مراجعة نصوص الخصوصية والشروط من مختص.

## لاحقاً
- OTP على الجوال: Supabase ← Sign In / Providers ← Phone ← مزوّد SMS (Twilio وغيره، مدفوع).
- إزالة `keepalive.yml` بعد Pro اختيارية (يبقى مفيداً كمراقبة).
