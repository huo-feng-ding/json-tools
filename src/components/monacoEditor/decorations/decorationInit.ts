import * as monaco from "monaco-editor";
import { loader } from "@monaco-editor/react";

import { Json5LanguageDef } from "@/components/monacoEditor/MonacoLanguageDef.tsx";
import { registerBase64HoverProvider } from "@/components/monacoEditor/decorations/base64Decoration.ts";
import { registerUnicodeHoverProvider } from "@/components/monacoEditor/decorations/unicodeDecoration.ts";
import { registerUrlHoverProvider } from "@/components/monacoEditor/decorations/urlDecoration.ts";

// 悬停复制按钮使用的命令ID
export const COPY_HOVER_COMMAND_ID = "editor.hover.copyDecodedText";

let copyCommandRegistered = false;

/**
 * 注册悬停复制命令（全局一次性）
 */
const registerCopyCommand = () => {
  if (copyCommandRegistered) return;

  monaco.editor.registerCommand(COPY_HOVER_COMMAND_ID, (_accessor, text: string) => {
    if (typeof text === "string" && text) {
      navigator.clipboard.writeText(text);
    }
  });

  copyCommandRegistered = true;
};

/**
 * 构建带复制按钮的 hover 内容
 */
export const buildHoverContents = (title: string, decoded: string): monaco.IMarkdownString[] => {
  const copyArgs = encodeURIComponent(JSON.stringify(decoded));

  return [
    { value: title },
    { value: "```\n" + decoded + "\n```" },
    {
      value: `[复制](${`command:${COPY_HOVER_COMMAND_ID}?${copyArgs}`})`,
      isTrusted: true,
    },
  ];
};

/**
 * Monaco编辑器全局初始化状态管理
 *
 * 这个模块负责Monaco编辑器的全局初始化，包括：
 * 1. Monaco编辑器核心初始化
 * 2. JSON5语言支持注册
 * 3. Base64、Unicode、URL悬停提供者的全局注册
 *
 * 通过集中管理这些初始化逻辑，避免了在每个编辑器实例创建时重复注册，
 * 提高了性能并减少了内存占用。
 */

// 全局Monaco初始化状态
let isInitialized = false;
let baseProviderRegistered = false;

// 初始化 Promise，保证全局只执行一次
let initPromise: Promise<void> | null = null;

/**
 * 初始化Monaco编辑器全局配置
 *
 * 幂等操作：多次调用只会执行一次初始化。
 * @returns 初始化后的Monaco实例
 */
export const initMonacoGlobally = async () => {
  if (isInitialized) return;

  if (!initPromise) {
    initPromise = (async () => {
      console.log("Initializing Monaco editor globally");

      // 配置Monaco加载器
      loader.config({ monaco });

      // 初始化Monaco实例
      const monacoInstance = await loader.init();

      // 注册JSON5语言支持
      if (
        !monacoInstance.languages
          .getLanguages()
          .some((lang) => lang.id === "json5")
      ) {
        monacoInstance.languages.register({ id: "json5" });
        monacoInstance.languages.setMonarchTokensProvider(
          "json5",
          Json5LanguageDef,
        );
      }

      isInitialized = true;
    })();
  }

  await initPromise;
};

/**
 * 注册Base64、Unicode、URL全局悬停提供者
 * 这些提供者将在所有JSON和JSON5编辑器中共享使用
 */
export const registerGlobalBase64Provider = () => {
  if (baseProviderRegistered) return;

  // 注册悬停复制命令
  registerCopyCommand();

  // 注册全局Base64悬停提供者
  registerBase64HoverProvider();

  // 注册全局Unicode悬停提供者
  registerUnicodeHoverProvider();

  // 注册全局URL悬停提供者
  registerUrlHoverProvider();

  baseProviderRegistered = true;
};

/**
 * 确保全局提供者已注册
 * 编辑器组件挂载时调用，保证悬停功能可用
 */
export const ensureProvidersRegistered = () => {
  registerGlobalBase64Provider();
};
