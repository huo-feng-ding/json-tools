/**
 * Chrome Extension Build Script
 * 用于构建Chrome扩展版本
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ChromeExtensionBuilder {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.extensionDir = __dirname;
    this.distDir = path.join(this.extensionDir, 'dist');
  }

  /**
   * 构建Chrome扩展
   */
  async build() {
    console.log('开始构建Chrome扩展...');
    console.log(`项目根目录: ${this.projectRoot}`);
    console.log(`扩展目录: ${this.extensionDir}`);

    try {
      // 1. 构建主应用
      console.log('步骤1: 构建主应用...');
      await this.buildMainApp();
      
      // 2. 清空dist目录
      console.log('步骤0: 清空dist目录...');
      await this.cleanDistDir();

      // 3. 复制构建产物到扩展目录
      console.log('步骤2: 复制构建产物...');
      await this.copyBuildAssets();

      // 4. 创建扩展特定的文件
      console.log('步骤3: 创建扩展特定文件...');
      await this.createExtensionFiles();

      console.log('✅ Chrome扩展构建完成！');
      console.log(`📁 扩展目录: ${this.distDir}`);
      console.log('🚀 请在Chrome中加载此目录作为未打包的扩展程序');

    } catch (error) {
      console.error('❌ 构建失败:', error);
      process.exit(1);
    }
  }

  /**
   * 清空dist目录
   */
  async cleanDistDir() {
    if (fs.existsSync(this.distDir)) {
      console.log(`清空目录: ${this.distDir}`);
      await this.removeDirectory(this.distDir);
    }
  }

  /**
   * 递归删除目录
   */
  async removeDirectory(dir) {
    if (fs.existsSync(dir)) {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          await this.removeDirectory(itemPath);
        } else {
          fs.unlinkSync(itemPath);
        }
      }
      
      fs.rmdirSync(dir);
    }
  }

  /**
   * 构建主应用
   */
  async buildMainApp() {
    console.log('构建主应用...');
    
    // 切换到项目根目录并执行构建
    process.chdir(this.projectRoot);
    
    try {
      // 扩展页面不能注册 Service Worker，且 MV3 CSP 禁止内联脚本：
      // 用扩展专用配置构建，关闭 PWA 插件（见 vite.extension.config.ts）。
      execSync(
        'pnpm exec tsc && pnpm exec vite build --config chrome-extension/vite.extension.config.ts',
        { stdio: 'inherit' }
      );
    } catch (error) {
      throw new Error('主应用构建失败: ' + error.message);
    }

    console.log('主应用构建完成');
  }

  /**
   * 复制构建产物
   */
  async copyBuildAssets() {
    console.log('复制构建产物...');

    const sourceDir = path.join(this.projectRoot, 'dist');
    
    // 确保目标目录存在
    if (!fs.existsSync(this.distDir)) {
      fs.mkdirSync(this.distDir, { recursive: true });
    }

    // 复制所有构建产物
    await this.copyDirectory(sourceDir, this.distDir);

    console.log('构建产物复制完成');
  }

  /**
   * 创建扩展特定的文件
   */
  async createExtensionFiles() {
    console.log('创建扩展特定文件...');

    // 处理现有的index.html文件
    await this.processIndexHtml();

    // 复制扩展文件到dist目录
    const extensionFiles = [
      'manifest.json',
      'background.js',
      'options.html',
      'options.js'
    ];

    for (const file of extensionFiles) {
      const sourcePath = path.join(this.extensionDir, file);
      const targetPath = path.join(this.distDir, file);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
      }
    }

    console.log('扩展特定文件创建完成');
  }

  /**
   * 处理现有的index.html文件
   */
  async processIndexHtml() {
    console.log('处理index.html文件...');

    const indexPath = path.join(this.distDir, 'index.html');
    let indexContent = fs.readFileSync(indexPath, 'utf8');

    // 提取Monaco环境配置的script标签内容
    const monacoScriptMatch = indexContent.match(/<script>self\[\"MonacoEnvironment\"[\s\S]*?<\/script>/);
    if (monacoScriptMatch) {
      const monacoScriptContent = monacoScriptMatch[0];
      const monacoJsContent = monacoScriptContent.replace(/<\/?script>/g, '');
      
      // 创建main.js文件
      const mainJsPath = path.join(this.distDir, 'main.js');
      fs.writeFileSync(mainJsPath, monacoJsContent + '\n');
      
      // 从index.html中移除Monaco script标签
      indexContent = indexContent.replace(monacoScriptMatch[0], '');
      
      // 在head中添加对main.js的引用
      const headEndMatch = indexContent.match(/<\/head>/);
      if (headEndMatch) {
        indexContent = indexContent.replace(
          headEndMatch[0],
          '    <script type="module" src="./main.js"></script>\n  </head>'
        );
      }
      
      console.log('✅ 成功提取Monaco配置到main.js');
    } else {
      console.log('⚠️  未找到Monaco环境配置script标签');
    }

    // MV3 扩展页面的 CSP 为 script-src 'self'，内联脚本会被直接拦截。
    const inlineScriptPattern =
      /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g;
    let inlineScriptIndex = 0;

    indexContent = indexContent.replace(
      inlineScriptPattern,
      (match, attrs, body) => {
        const type = (
          attrs.match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1] ?? ""
        ).toLowerCase();
        const executable =
          type === "" ||
          type === "module" ||
          type === "text/javascript" ||
          type === "application/javascript";

        if (!executable || body.trim() === "") {
          return match;
        }

        const fileName = `inline-script-${inlineScriptIndex}.js`;
        inlineScriptIndex += 1;
        fs.writeFileSync(
          path.join(this.distDir, fileName),
          body.trim() + "\n"
        );

        const keptAttrs = attrs.trim();
        return `<script${keptAttrs ? " " + keptAttrs : ""} src="./${fileName}"></script>`;
      }
    );

    const remainingInline = indexContent.match(
      /<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/g
    );
    if (remainingInline) {
      console.warn(
        `⚠️  index.html 仍包含 ${remainingInline.length} 个内联脚本，MV3 CSP 会拦截`
      );
    }

    // PWA 插件已从扩展构建中移除，不再引用 manifest.webmanifest。
    indexContent = indexContent.replace(
      /[ \t]*<link[^>]*rel=["']manifest["'][^>]*>\s*/gi,
      ""
    );

    fs.writeFileSync(indexPath, indexContent);

    console.log(
      `✅ 已将 ${inlineScriptIndex} 个内联脚本提取为外部文件并更新index.html`
    );
  }

  /**
   * 递归复制目录
   */
  async copyDirectory(source, target) {
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }

    const items = fs.readdirSync(source);

    for (const item of items) {
      const sourcePath = path.join(source, item);
      const targetPath = path.join(target, item);

      const stat = fs.statSync(sourcePath);

      if (stat.isDirectory()) {
        await this.copyDirectory(sourcePath, targetPath);
      } else {
        fs.copyFileSync(sourcePath, targetPath);
      }
    }
  }
}

// 如果直接运行此脚本
if (process.argv[1] && process.argv[1].endsWith('build.js')) {
  const builder = new ChromeExtensionBuilder();
  builder.build().catch(console.error);
}

export default ChromeExtensionBuilder;
