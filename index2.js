/*
Express redirector with persistent choice per visitor using cookies
- كل زائر يتم توجيهه إلى رابط واحد ثابت بناءً على أول زيارة له
- لتشغيل:
  1. npm init -y
  2. npm install express cookie-parser
  3. node redirect-server.js
*/

const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const app = express();

app.use(cookieParser());

// الروابط الخمسة
const links = [
  'https://youtube.com/shorts/PxU48dh-Qlc',
  'https://youtube.com/shorts/WBh5mNcP6bg',
  'https://youtube.com/shorts/glVS1fLopHc',
  'https://youtube.com/shorts/AoucqvZgGGU',
  'https://youtube.com/shorts/h21xRQnTqOo',
  'https://youtube.com/shorts/4gnxaiQqDxE',
  'https://youtube.com/shorts/OTenaEmFqSU',
];

app.get('/qr', (req, res) => {
  let idx;
  // إذا الزائر عنده كوكي محفوظة، استخدمها
  if (req.cookies.redirectIndex !== undefined) {
    idx = parseInt(req.cookies.redirectIndex, 10);
  } else {
    // اختيار عشوائي وتخزينه في الكوكي
    idx = crypto.randomInt(0, links.length);
    res.cookie('redirectIndex', idx, {
      maxAge: 1000 * 60 * 60 * 24 * 30, // شهر
      httpOnly: true
    });
  }

  const target = links[idx];
  res.set('X-Redirect-Index', String(idx));
  res.redirect(target);
});
app.get('/qr/links', (req, res) => {
  res.json({ count: links.length, links });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Redirect server running on http://localhost:${PORT}`));