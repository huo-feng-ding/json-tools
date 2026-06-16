/**
 * 运行环境检测工具
 * 统一判断当前是否运行在 uTools（Electron）环境中，并提供在 uTools 下可用的外链打开方式。
 */

/** uTools 运行时会在 window 上挂载 utools 全局对象 */
export const isUtoolsAvailable =
  typeof window !== "undefined" && "utools" in window;

/** window.utools 的最小可用类型，避免引入额外的类型声明包 */
interface UtoolsGlobal {
  shellOpenExternal?: (url: string) => void;
}

/**
 * 打开外部链接。
 * - uTools 环境：调用官方 API utools.shellOpenExternal 在系统默认浏览器中打开。
 * - 浏览器环境：使用 window.open 新标签打开。
 * @param url 要打开的链接地址
 */
export function openExternal(url: string): void {
  if (isUtoolsAvailable) {
    const utools = (window as unknown as { utools?: UtoolsGlobal }).utools;

    if (utools?.shellOpenExternal) {
      utools.shellOpenExternal(url);

      return;
    }
  }

  window.open(url, "_blank", "noopener,noreferrer");
}
