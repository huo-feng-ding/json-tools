# JSON Tools Chrome 扩展

Datamorph（JSON Tools）的 MV3 扩展：在浏览器直接打开返回 JSON 的第三方地址时，自动把数据交给 Datamorph 展示。

## 行为

- **扩展未打开**：接管当前标签页，用 Datamorph 展示 JSON。
- **扩展已打开**：保留第三方标签页，聚焦已打开的 Datamorph，并在其工作区新建标签页展示 JSON。
- JSON 检测由 `background.js` 在标签页加载完成时通过 `chrome.scripting.executeScript` 执行，扩展不注入常驻内容脚本。
- 设置页可关闭自动打开：`chrome://extensions` -> 扩展详情 -> 扩展程序选项，开关存储在 `chrome.storage.local.autoOpenJson`。

## 构建与加载

```bash
pnpm build:extension
```

1. 打开 `chrome://extensions`，开启“开发者模式”。
2. 点击“加载已解压的扩展程序”，选择 `chrome-extension/dist`。
3. 修改源码后重新执行 `pnpm build:extension`，并在扩展页点击刷新。

## 文件

| 文件 | 作用 |
|---|---|
| `manifest.json` | MV3 清单：模块化 Service Worker、storage/scripting 权限 |
| `background.js` | 检测 JSON 页面；已打开插件时聚焦并交接数据，否则接管当前标签页 |
| `options.html` / `options.js` | 自动打开开关 |
| `build.js` | 构建主应用、复制产物、提取内联脚本 |
| `vite.extension.config.ts` | 扩展专用 Vite 配置（移除 PWA） |
| `pwa-register-stub.ts` | `virtual:pwa-register` 空实现 |
| `test-pages/sample-api.json` | 手动验证用的 JSON 样例 |

## 权限

- `storage`：`chrome.storage.session` 交接待处理 JSON，`chrome.storage.local` 保存开关。
- `scripting`：按需在标签页中执行 JSON 检测。
- `<all_urls>`：检测任意 http/https/file 页面。

## 说明

- 扩展页面无法注册 Service Worker，PWA 在扩展构建中被移除。
- MV3 CSP 为 `script-src 'self'`，`build.js` 会把 `index.html` 中的内联脚本提取为外部文件。
- 第三方页面保持原样时（已打开插件的情况），数据通过 `chrome.storage.session` 交接，运行中的插件页通过 `chrome.storage.onChanged` 即时消费。
