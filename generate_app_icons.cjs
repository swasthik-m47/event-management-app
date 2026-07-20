const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

const inputImagePath = 'C:\\Users\\Swasthik M\\.gemini\\antigravity\\brain\\be95ca86-f5d7-49ee-a22c-e1f22dfad627\\media__1783746529063.png';
const publicDir = path.join(__dirname, 'public');
const resDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

const androidMipmaps = [
  { folder: 'mipmap-mdpi', launcherSize: 48, foregroundSize: 108 },
  { folder: 'mipmap-hdpi', launcherSize: 72, foregroundSize: 162 },
  { folder: 'mipmap-xhdpi', launcherSize: 96, foregroundSize: 216 },
  { folder: 'mipmap-xxhdpi', launcherSize: 144, foregroundSize: 324 },
  { folder: 'mipmap-xxxhdpi', launcherSize: 192, foregroundSize: 432 }
];

async function generateAllIcons() {
  console.log('Loading uploaded logo from:', inputImagePath);
  if (!fs.existsSync(inputImagePath)) {
    console.error('Input image not found!');
    process.exit(1);
  }

  const sourceImage = await Jimp.read(inputImagePath);
  console.log(`Loaded image: ${sourceImage.bitmap.width}x${sourceImage.bitmap.height}`);

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Save original to public/swasthik_logo.png
  await sourceImage.writeAsync(path.join(publicDir, 'swasthik_logo.png'));
  console.log('Saved public/swasthik_logo.png');

  // 2. Web PWA & App Store Assets
  const icon192 = sourceImage.clone().resize(192, 192, Jimp.RESIZE_BICUBIC);
  await icon192.writeAsync(path.join(publicDir, 'icon-192.png'));
  console.log('Saved public/icon-192.png');

  const icon512 = sourceImage.clone().resize(512, 512, Jimp.RESIZE_BICUBIC);
  await icon512.writeAsync(path.join(publicDir, 'icon-512.png'));
  console.log('Saved public/icon-512.png');

  // 3. Android Mipmap Icons
  for (const mipmap of androidMipmaps) {
    const targetFolder = path.join(resDir, mipmap.folder);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    // A. Standard ic_launcher.png (Full size)
    const launcher = sourceImage.clone().resize(mipmap.launcherSize, mipmap.launcherSize, Jimp.RESIZE_BICUBIC);
    await launcher.writeAsync(path.join(targetFolder, 'ic_launcher.png'));

    // B. Round ic_launcher_round.png (Circular Mask)
    const roundImage = launcher.clone();
    // Create a circle mask
    const size = mipmap.launcherSize;
    roundImage.scan(0, 0, size, size, function (x, y, idx) {
      const cx = size / 2;
      const cy = size / 2;
      const radius = size / 2;
      const dist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
      if (dist > radius) {
        this.bitmap.data[idx + 3] = 0; // Transparent outside circle
      } else if (dist > radius - 1) {
        // Antialiasing edge
        const alpha = Math.max(0, Math.min(1, radius - dist));
        this.bitmap.data[idx + 3] = Math.round(this.bitmap.data[idx + 3] * alpha);
      }
    });
    await roundImage.writeAsync(path.join(targetFolder, 'ic_launcher_round.png'));

    // C. Adaptive Icon Foreground ic_launcher_foreground.png
    // Safe zone in adaptive icon is ~66% of the foreground size
    const foreground = new Jimp(mipmap.foregroundSize, mipmap.foregroundSize, 0x00000000); // Transparent canvas
    const safeLogoSize = Math.round(mipmap.foregroundSize * 0.66);
    const scaledLogo = sourceImage.clone().resize(safeLogoSize, safeLogoSize, Jimp.RESIZE_BICUBIC);
    const offsetX = Math.round((mipmap.foregroundSize - safeLogoSize) / 2);
    const offsetY = Math.round((mipmap.foregroundSize - safeLogoSize) / 2);
    foreground.composite(scaledLogo, offsetX, offsetY);
    await foreground.writeAsync(path.join(targetFolder, 'ic_launcher_foreground.png'));

    console.log(`Generated Android icons in ${mipmap.folder} (${mipmap.launcherSize}px & ${mipmap.foregroundSize}px)`);
  }

  console.log('SUCCESS: All app icons and branding assets have been updated across Android and Web!');
}

generateAllIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
