/**
 * Chrome Extension Background Script
 * 负责监听标签页更新和检测JSON内容
 */

const PENDING_JSON_KEY = 'datamorph:pendingJson';
const AUTO_OPEN_JSON_KEY = 'autoOpenJson';

class ChromeExtensionListener {
  constructor() {
    this.isInitialized = false;
    this.jsonToolsUrl = null;
  }
  /**
   * 初始化后台脚本
   */
  async initialize() {
    if (this.isInitialized) return;

    // 获取插件的JSON Tools页面URL
    this.jsonToolsUrl = chrome.runtime.getURL('index.html');

    // 监听标签页更新事件
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });

    // 监听插件图标点击事件
    chrome.action.onClicked.addListener((tab) => {
      this.handleActionClick(tab);
    });

    this.isInitialized = true;
    console.log('Chrome Extension Listener 已初始化');
  }

  /**
   * 处理标签页更新事件
   */
  async handleTabUpdate(tabId, changeInfo, tab) {
    // 只在页面加载完成时处理
    if (changeInfo.status !== 'complete') return;

    try {
      // 检查是否为受限页面
      if (this.isRestrictedUrl(tab.url)) {
        console.log(`跳过受限页面: ${tab.url}`);
        return;
      }

      // 选项页开关：关闭时保持浏览器原样显示
      if (!(await this.isAutoOpenJsonEnabled())) {
        return;
      }

      // 检查页面是否包含JSON数据
      const hasJson = await this.checkPageForJson(tabId);
      
      if (hasJson) {
        console.log(`检测到JSON数据: ${tab.url}`);
        
        // 获取页面JSON数据
        const jsonData = await this.extractJsonFromPage(tabId);
        
        if (jsonData) {
          // 在当前标签页中打开JSON Tools页面并传递数据
          await this.openJsonToolsWithJson(jsonData, tab.url, tabId);
        }
      }
    } catch (error) {
      console.error('处理标签页更新时发生错误:', error);
    }
  }

  /**
   * 读取"自动打开 JSON 页面"开关，默认开启
   */
  async isAutoOpenJsonEnabled() {
    try {
      const stored = await chrome.storage.local.get(AUTO_OPEN_JSON_KEY);
      return stored[AUTO_OPEN_JSON_KEY] !== false;
    } catch (error) {
      console.error('读取自动打开开关失败:', error);
      return true;
    }
  }

  /**
   * 检查页面是否包含JSON数据
   */
  async checkPageForJson(tabId) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          // 检查页面内容是否为JSON
          const content = document.body.innerText || document.body.textContent;
          
          if (!content || content.trim().length === 0) {
            return false;
          }

          // 尝试解析JSON
          try {
            const trimmedContent = content.trim();
            // 简单检查是否以 { 或 [ 开头
            if (trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) {
              JSON.parse(trimmedContent);
              return true;
            }
          } catch (e) {
            // 不是有效的JSON
          }

          // 检查Content-Type header
          const contentType = document.querySelector('meta[http-equiv="content-type"]')?.getAttribute('content');
          if (contentType && contentType.includes('application/json')) {
            return true;
          }

          // 检查页面标题或URL是否暗示这是JSON
          const title = document.title.toLowerCase();
          const url = window.location.href.toLowerCase();
          
          if (title.includes('json') || url.includes('.json') || url.includes('api')) {
            // 再次尝试解析，这次更宽松一些
            try {
              const cleanedContent = content.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
              if (cleanedContent.startsWith('{') || cleanedContent.startsWith('[')) {
                JSON.parse(cleanedContent);
                return true;
              }
            } catch (e) {
              // 仍然不是有效的JSON
            }
          }

          return false;
        }
      });

      return results[0]?.result || false;
    } catch (error) {
      console.error('检查页面JSON时发生错误:', error);
      return false;
    }
  }

  /**
   * 从页面提取JSON数据
   */
  async extractJsonFromPage(tabId) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const content = document.body.innerText || document.body.textContent;
          
          try {
            // 清理内容并尝试解析
            const cleanedContent = content.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
            const jsonData = JSON.parse(cleanedContent);
            
            return {
              data: jsonData,
              rawContent: cleanedContent,
              url: window.location.href,
              title: document.title
            };
          } catch (error) {
            console.error('解析JSON失败:', error);
            return null;
          }
        }
      });

      return results[0]?.result;
    } catch (error) {
      console.error('提取JSON数据时发生错误:', error);
      return null;
    }
  }

  /**
   * 打开JSON Tools并传递数据：
   * 已打开时在已有页面中新建标签页，否则接管当前标签页。
   */
  async openJsonToolsWithJson(jsonData, sourceUrl, tabId) {
    try {
      const jsonString = typeof jsonData.data === 'string'
        ? jsonData.data
        : JSON.stringify(jsonData.data, null, 2);

      // chrome.tabs.sendMessage 只投递给内容脚本，扩展页面收不到；
      // 先落盘，页面启动或运行中自行读取，不依赖 2 秒竞态。
      await chrome.storage.session.set({
        [PENDING_JSON_KEY]: {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          type: 'regex',
          payload: jsonString,
          sourceUrl: sourceUrl,
          title: jsonData.title,
          createdAt: Date.now()
        }
      });

      // 已有 JSON Tools 页面时保留第三方标签页，
      // 由已打开的页面通过 chrome.storage.onChanged 新建标签页展示数据。
      const openTab = await this.findOpenJsonToolsTab(tabId);

      if (openTab) {
        await this.focusJsonToolsTab(openTab);
        console.log(`已在已打开的 JSON Tools 中新建标签页: ${sourceUrl}`);
        return;
      }

      // 未打开时保持原行为：当前标签页直接打开JSON Tools页面
      await chrome.tabs.update(tabId, {
        url: this.jsonToolsUrl,
        active: true
      });
    } catch (error) {
      console.error('打开JSON Tools页面时发生错误:', error);
    }
  }

  /**
   * 查找已打开的 JSON Tools 页面标签（排除当前标签页）
   */
  async findOpenJsonToolsTab(excludeTabId) {
    try {
      // 片段标识符不参与匹配，带 #/ 路由的页面同样能命中
      const tabs = await chrome.tabs.query({ url: this.jsonToolsUrl });
      const candidates = tabs.filter(
        (tab) => typeof tab.id === 'number' && tab.id !== excludeTabId
      );

      if (candidates.length === 0) {
        return null;
      }

      // 优先复用正在显示的页面
      return candidates.find((tab) => tab.active) || candidates[0];
    } catch (error) {
      console.error('查找已打开的 JSON Tools 页面失败:', error);
      return null;
    }
  }

  /**
   * 聚焦已打开的 JSON Tools 页面，并确保停留在工作区路由
   */
  async focusJsonToolsTab(tab) {
    try {
      if (typeof tab.id !== 'number') {
        return;
      }

      let hash = '';

      try {
        hash = new URL(tab.url || '').hash;
      } catch (error) {
        hash = '';
      }

      // 设置页/工具页不展示工作区标签，切回工作区路由
      const nextUrl = hash && hash !== '#/' ? `${this.jsonToolsUrl}#/` : null;

      await chrome.tabs.update(tab.id, {
        ...(nextUrl ? { url: nextUrl } : {}),
        active: true
      });

      if (typeof tab.windowId === 'number') {
        await chrome.windows.update(tab.windowId, { focused: true });
      }
    } catch (error) {
      console.error('聚焦 JSON Tools 页面时发生错误:', error);
    }
  }

  /**
   * 检查是否为受限URL
   */
  isRestrictedUrl(url) {
    if (!url) return true;
    
    const restrictedProtocols = ['chrome:', 'chrome-extension:', 'moz-extension:', 'edge:', 'opera:'];
    const restrictedDomains = ['extensions', 'extensions-internals'];
    
    try {
      const urlObj = new URL(url);
      
      // 检查协议
      if (restrictedProtocols.includes(urlObj.protocol)) {
        return true;
      }
      
      // 检查域名
      if (restrictedDomains.includes(urlObj.hostname)) {
        return true;
      }
      
      // 检查特殊页面
      if (url.includes('chrome://') || url.includes('about:')) {
        return true;
      }
      
      return false;
    } catch (e) {
      // 如果URL解析失败，认为是受限页面
      return true;
    }
  }

  /**
   * 处理插件图标点击事件
   */
  async handleActionClick(tab) {
    try {
      // 在新标签页中打开JSON Tools主页
      await chrome.tabs.create({
        url: chrome.runtime.getURL('index.html'),
        active: true
      });
      
      console.log('插件图标被点击，已打开JSON Tools主页');
    } catch (error) {
      console.error('打开JSON Tools主页时发生错误:', error);
    }
  }

}

// 初始化Chrome扩展监听器
const chromeExtensionListener = new ChromeExtensionListener();
chromeExtensionListener.initialize();