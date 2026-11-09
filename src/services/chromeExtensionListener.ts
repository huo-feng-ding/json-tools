import { useTabStore } from "@/store/useTabStore";

const PENDING_JSON_STORAGE_KEY = "datamorph:pendingJson";

/**
 * Chrome扩展事件监听器管理
 * 
 * 这个类负责管理Chrome插件的监听事件，
 * 包括从background script接收JSON数据。
 * 复用utoolsListener.ts的逻辑结构，但适配Chrome扩展环境。
 */
class ChromeExtensionListener {
  private static instance: ChromeExtensionListener;
  private isInitialized: boolean = false;
  private lastHandledId: string | null = null;

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): ChromeExtensionListener {
    if (!ChromeExtensionListener.instance) {
      ChromeExtensionListener.instance = new ChromeExtensionListener();
    }

    return ChromeExtensionListener.instance;
  }

  /**
   * 初始化监听器
   */
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    if (typeof window !== "undefined") {
      // 页面已打开时无需重新加载即可接收 background 新写入的 JSON
      this.setupPendingJsonWatch();
      void this.consumePendingJson();
      this.isInitialized = true;
      console.log("Chrome扩展监听器已初始化");
    }
  }

  /**
   * 监听 storage.session 中的待处理 JSON。
   * 已打开的页面由 background 聚焦后会收到变更通知并即时新建标签页。
   */
  private setupPendingJsonWatch(): void {
    if (
      typeof chrome === "undefined" ||
      !chrome.storage?.session ||
      !chrome.storage.onChanged
    ) {
      return;
    }

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "session") {
        return;
      }

      if (!changes[PENDING_JSON_STORAGE_KEY]?.newValue) {
        return;
      }

      void this.consumePendingJson();
    });
  }

  /**
   * 读取 background 写入的待处理 JSON（storage.session）。
   * 扩展页面不能接收 chrome.tabs.sendMessage，所以用落盘交接而非定时推送。
   */
  private async consumePendingJson(): Promise<void> {
    const storage =
      typeof chrome !== "undefined" ? chrome.storage?.session : undefined;

    if (!storage) {
      return;
    }

    try {
      const result = await storage.get(PENDING_JSON_STORAGE_KEY);
      const pending = result?.[PENDING_JSON_STORAGE_KEY];

      if (!pending) {
        return;
      }

      await storage.remove(PENDING_JSON_STORAGE_KEY);
      this.handleExtensionMessage(pending);
    } catch (error) {
      console.error("读取Chrome扩展待处理JSON失败:", error);
    }
  }

  /**
   * 处理Chrome扩展消息
   */
  private handleExtensionMessage(data: any): void {
    if (
      !data ||
      data.type !== "regex" ||
      typeof data.payload !== "string" ||
      data.payload === ""
    ) {
      return;
    }

    const handledId = typeof data.id === "string" ? data.id : null;

    if (handledId && this.lastHandledId === handledId) {
      return;
    }

    const tabStore = useTabStore.getState();

    if (!tabStore.hydrated) {
      const unsubscribe = useTabStore.subscribe((state) => {
        if (state.hydrated) {
          unsubscribe();
          this.handleExtensionMessage(data);
        }
      });
      return;
    }

    if (handledId) {
      this.lastHandledId = handledId;
    }

    try {
      console.log("Chrome扩展消息:", data);

      const current = tabStore.activeTab();

      if (
        current?.kind === "document" &&
        tabStore.tabs.length === 1 &&
        current.content.trim() === ""
      ) {
        tabStore.updateTabContent(current.key, data.payload);
        console.log("Chrome扩展数据已更新到当前标签页");
      } else {
        const title = data.sourceUrl
          ? `JSON - ${new URL(data.sourceUrl).hostname}`
          : data.title || "JSON数据";

        tabStore.addTab(title, data.payload);
        console.log("Chrome扩展已创建新标签页");
      }
    } catch (error) {
      console.error("处理Chrome扩展消息时发生错误:", error);
    }
  }
}

export default ChromeExtensionListener;
export { ChromeExtensionListener };