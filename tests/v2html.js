// يبني صفحة v2 للاختبار: يضمّن css/app.css وكل js/*.js من index.html كوسوم منفصلة وبنفس الترتيب،
// فيعمل jsdom دون خادم وبنفس قواعد المتصفح (كل سكربت يُرفَع داخله فقط، والنطاق العام مشترك).
const fs = require('fs'), path = require('path');
const V2 = path.join(__dirname, '..', 'v2');
const local = u => path.join(V2, u.split('?')[0]);
module.exports = function v2html() {
  let html = fs.readFileSync(path.join(V2, 'index.html'), 'utf8');
  html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, u) => '<style>\n' + fs.readFileSync(local(u), 'utf8') + '</style>');
  html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, u) => {
    const js = fs.readFileSync(local(u), 'utf8');
    if (/<\/script/i.test(js)) throw new Error(u + ' contains </script');
    return '<script>\n' + js + '</script>';
  });
  return html;
};
module.exports.V2 = V2;
