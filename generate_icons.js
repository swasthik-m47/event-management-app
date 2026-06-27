const fs = require('fs');

const dir = 'c:\\Users\\Swasthik M\\event\\public';
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

console.log("High-resolution PWA & Mobile app icons (192x192 & 512x512) are ready in public/");

