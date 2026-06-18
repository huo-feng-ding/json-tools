import { type SidebarItem } from "./Sidebar.tsx";

/**
 * Please check the https://nextui.org/docs/guide/routing to have a seamless router integration
 */

export enum SidebarKeys {
  textView = "textView",
  treeView = "treeView",
  diffView = "diffView",
  tableView = "tableView",
  toolbox = "toolbox",
  settings = "settings",
}

export const items: SidebarItem[] = [
  {
    key: SidebarKeys.textView,
    icon: "solar:home-2-linear",
    title: "文本视图",
  },
  {
    key: SidebarKeys.treeView,
    icon: "solar:widget-2-linear",
    title: "树形视图",
  },
  {
    key: SidebarKeys.diffView,
    icon: "solar:checklist-minimalistic-linear",
    title: "DIFF视图",
  },
  {
    key: SidebarKeys.tableView,
    icon: "solar:bill-list-linear",
    title: "表格视图",
  },
  {
    key: SidebarKeys.toolbox,
    icon: "solar:box-linear",
    route: "./toolbox",
    title: "工具箱",
  },
  {
    // 设置作为一级导航项，与上方视图之间用留白区隔（去掉生硬的分割线）
    key: SidebarKeys.settings,
    icon: "solar:settings-linear",
    route: "./settings",
    title: "设置",
  },
];
