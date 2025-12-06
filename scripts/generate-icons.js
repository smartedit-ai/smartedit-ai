/**
 * 图标生成脚本
 * 使用 Node.js 和 sharp 库生成不同尺寸的 PNG 图标
 * 
 * 安装依赖: npm install sharp
 * 运行: node scripts/generate-icons.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 如果没有 sharp，使用内联 SVG 数据 URI 作为替代方案
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#07C160" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
  <path d="M2 17l10 5 10-5"/>
  <path d="M2 12l10 5 10-5"/>
</svg>`;

const sizes = [16, 32, 48, 128];
const iconsDir = path.join(__dirname, '..', 'assets', 'icons');

// 确保目录存在
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 尝试使用 sharp 生成 PNG
async function generateIcons() {
  try {
    const sharp = (await import('sharp')).default;
    
    for (const size of sizes) {
      const outputPath = path.join(iconsDir, `icon${size}.png`);
      
      await sharp(Buffer.from(svgContent))
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`Generated: icon${size}.png`);
    }
    
    console.log('All icons generated successfully!');
  } catch (error) {
    console.log('sharp not installed, creating placeholder icons...');
    console.log('To generate proper icons, run: npm install sharp && node scripts/generate-icons.js');
    
    // 创建简单的占位符说明
    const readme = `# 图标生成说明

请使用以下方法之一生成图标：

## 方法 1: 使用 sharp (推荐)
\`\`\`bash
npm install sharp
node scripts/generate-icons.js
\`\`\`

## 方法 2: 在线转换
1. 访问 https://cloudconvert.com/svg-to-png
2. 上传 icon16.svg 文件
3. 分别生成 16x16, 32x32, 48x48, 128x128 尺寸的 PNG

## 方法 3: 使用设计工具
使用 Figma、Sketch 或 Photoshop 打开 SVG 并导出不同尺寸的 PNG
`;
    
    fs.writeFileSync(path.join(iconsDir, 'README.md'), readme);
    console.log('Created icons/README.md with instructions');
  }
}

generateIcons();
