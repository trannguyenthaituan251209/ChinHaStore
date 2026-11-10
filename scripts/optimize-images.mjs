import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const tasks = [
  {
    input: 'public/assets/image/hero-section-horizontal.png',
    output: 'public/assets/image/hero-section-horizontal.webp',
    width: 1920,
    quality: 85,
  },
  {
    input: 'public/assets/image/hero-section-vertical.png',
    output: 'public/assets/image/hero-section-vertical.webp',
    width: 1080,
    quality: 85,
  },
  {
    input: 'public/assets/image/JOURNEY/X6 introduct.png',
    output: 'public/assets/image/JOURNEY/x6-intro-desktop.webp',
    width: 1920,
    quality: 85,
  },
  {
    input: 'public/assets/image/JOURNEY/X6 introduct (2).png',
    output: 'public/assets/image/JOURNEY/x6-intro-mobile.webp',
    width: 1080,
    quality: 85,
  },
  {
    input: 'public/assets/image/JOURNEY/Luna ultra.png',
    output: 'public/assets/image/JOURNEY/luna-ultra-desktop.webp',
    width: 1920,
    quality: 85,
  },
  {
    input: 'public/assets/image/JOURNEY/Luna ultra (2).png',
    output: 'public/assets/image/JOURNEY/luna-ultra-mobile.webp',
    width: 1080,
    quality: 85,
  },
];

async function run() {
  console.log('🚀 Starting image optimization...\n');

  for (const task of tasks) {
    const inputPath = path.resolve(task.input);
    const outputPath = path.resolve(task.output);

    if (!fs.existsSync(inputPath)) {
      console.warn(`⚠️ File not found: ${task.input}`);
      continue;
    }

    const inputStat = fs.statSync(inputPath);
    const originalSizeKb = (inputStat.size / 1024).toFixed(1);

    const image = sharp(inputPath);
    const metadata = await image.metadata();

    let transform = image;
    if (metadata.width && metadata.width > task.width) {
      transform = transform.resize({ width: task.width, withoutEnlargement: true });
    }

    await transform
      .webp({ quality: task.quality, effort: 6 })
      .toFile(outputPath);

    const outputStat = fs.statSync(outputPath);
    const newSizeKb = (outputStat.size / 1024).toFixed(1);
    const savings = ((1 - outputStat.size / inputStat.size) * 100).toFixed(1);

    const outMeta = await sharp(outputPath).metadata();

    console.log(`✅ ${path.basename(task.input)} -> ${path.basename(task.output)}`);
    console.log(`   Dimensions: ${metadata.width}x${metadata.height} -> ${outMeta.width}x${outMeta.height}`);
    console.log(`   Size: ${originalSizeKb} KB -> ${newSizeKb} KB (${savings}% reduction)\n`);
  }

  console.log('✨ All images optimized successfully!');
}

run().catch((err) => {
  console.error('❌ Optimization failed:', err);
  process.exit(1);
});

