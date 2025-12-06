/**
 * 智编助手 - 构建脚本
 * 用于生成图标和打包扩展
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const ICONS_DIR = path.join(ROOT_DIR, 'assets', 'icons');

// 需要打包的文件和目录
const INCLUDE_FILES = [
  'manifest.json',
  'background',
  'content',
  'popup',
  'options',
  'assets'
];

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 复制文件或目录
function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  
  if (stat.isDirectory()) {
    ensureDir(dest);
    fs.readdirSync(src).forEach(child => {
      copyRecursive(path.join(src, child), path.join(dest, child));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// 生成图标
async function generateIcons() {
  console.log('📦 生成图标...');
  
  const sizes = [16, 32, 48, 128];
  ensureDir(ICONS_DIR);
  
  try {
    const sharp = require('sharp');
    
    // SVG 图标内容
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="20" fill="#07C160"/>
      <g transform="translate(15, 15)" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M35 5 L5 20 L35 35 L65 20 Z"/>
        <path d="M5 40 L35 55 L65 40"/>
        <path d="M5 55 L35 70 L65 55"/>
      </g>
    </svg>`;
    
    for (const size of sizes) {
      const outputPath = path.join(ICONS_DIR, `icon${size}.png`);
      await sharp(Buffer.from(svgContent))
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`  ✓ icon${size}.png`);
    }
    
    console.log('✅ 图标生成完成\n');
    return true;
  } catch (error) {
    console.log('⚠️  sharp 未安装，使用备用方案生成图标...');
    
    // 创建简单的占位图标（1x1 绿色像素的 PNG）
    // 这是一个最小的有效 PNG 文件
    const minimalPng = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
      0x54, 0x08, 0xD7, 0x63, 0x10, 0x60, 0xD8, 0x00,
      0x00, 0x00, 0x14, 0x00, 0x01, 0x27, 0x34, 0x0F,
      0xDF, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
      0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    for (const size of sizes) {
      const outputPath = path.join(ICONS_DIR, `icon${size}.png`);
      fs.writeFileSync(outputPath, minimalPng);
      console.log(`  ✓ icon${size}.png (占位符)`);
    }
    
    console.log('\n💡 提示: 运行 "npm install" 后重新构建可生成高质量图标');
    console.log('   或打开 scripts/icon-generator.html 手动生成图标\n');
    return true;
  }
}

// 构建扩展
async function build() {
  console.log('🚀 开始构建智编助手...\n');
  
  // 1. 生成图标
  await generateIcons();
  
  // 2. 创建 dist 目录
  console.log('📁 准备构建目录...');
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
  }
  ensureDir(DIST_DIR);
  
  // 3. 复制文件
  console.log('📋 复制文件...');
  for (const item of INCLUDE_FILES) {
    const src = path.join(ROOT_DIR, item);
    const dest = path.join(DIST_DIR, item);
    
    if (fs.existsSync(src)) {
      copyRecursive(src, dest);
      console.log(`  ✓ ${item}`);
    }
  }
  
  console.log('\n✅ 构建完成！');
  console.log(`📂 输出目录: ${DIST_DIR}\n`);
  
  // 4. 如果需要打包成 zip
  if (process.argv.includes('--zip')) {
    await createZip();
  }
  
  console.log('📌 安装说明:');
  console.log('   1. 打开 Chrome，访问 chrome://extensions/');
  console.log('   2. 开启「开发者模式」');
  console.log('   3. 点击「加载已解压的扩展程序」');
  console.log('   4. 选择 dist 文件夹');
}

// 创建 ZIP 包
async function createZip() {
  console.log('📦 创建 ZIP 包...');
  
  try {
    const archiver = require('archiver');
    const zipPath = path.join(ROOT_DIR, 'smartedit-ai-v1.0.0.zip');
    
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    return new Promise((resolve, reject) => {
      output.on('close', () => {
        console.log(`  ✓ ${path.basename(zipPath)} (${(archive.pointer() / 1024).toFixed(1)} KB)`);
        console.log('\n✅ ZIP 包创建完成！');
        console.log(`📂 文件位置: ${zipPath}\n`);
        resolve();
      });
      
      archive.on('error', reject);
      archive.pipe(output);
      archive.directory(DIST_DIR, false);
      archive.finalize();
    });
  } catch (error) {
    console.log('⚠️  archiver 未安装，跳过 ZIP 打包');
    console.log('   运行 "npm install" 后可使用 "npm run zip" 创建 ZIP 包\n');
  }
}

// 运行构建
build().catch(console.error);
