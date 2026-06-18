import type { Tool } from "./useToolboxStore";

import { useTabStore } from "./useTabStore";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const sampleTool: Tool = {
  id: "jsonAIRepair",
  name: "JSON AI 修复",
  icon: "fluent-emoji-flat:magic-wand",
  description: "AI 智能识别并修复JSON格式错误，让您的JSON数据恢复正常",
  path: "/toolbox/jsonAIRepair",
  category: ["AI", "数据处理"],
};

useTabStore.getState().initTab();

const toolboxTabKey = useTabStore.getState().openToolboxTab();
const repeatedToolboxTabKey = useTabStore.getState().openToolboxTab();

assert(
  toolboxTabKey === repeatedToolboxTabKey,
  "toolbox launcher should reuse a single tab",
);

const firstToolTabKey = useTabStore.getState().addToolTab(sampleTool);
const secondToolTabKey = useTabStore.getState().addToolTab(sampleTool);

assert(
  firstToolTabKey !== secondToolTabKey,
  "tool clicks should create independent tool tabs",
);

const tabs = useTabStore.getState().tabs;

assert(
  tabs.some((tab) => tab.kind === "toolbox"),
  "toolbox tab should be marked with toolbox kind",
);
assert(
  tabs.filter((tab) => tab.kind === "tool").length === 2,
  "tool tabs should be marked with tool kind",
);
