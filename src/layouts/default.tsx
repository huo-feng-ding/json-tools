import "@/styles/globals.css";
import {
  Button,
  cn,
  Image,
  Spacer,
  Tooltip,
  useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import SidebarDrawer from "@/components/sidebar/SidebarDrawer.tsx";
import Sidebar from "@/components/sidebar/Sidebar.tsx";
import { items, SidebarKeys } from "@/components/sidebar/Items.tsx";
import { ThemeSwitch } from "@/components/button/ThemeSwitch.tsx";
import { useSidebarStore } from "@/store/useSidebarStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTabStore } from "@/store/useTabStore";
import { getFontSizeConfig } from "@/styles/fontSize";

function RootLayout({ children }: { children: React.ReactNode }) {
  const sidebarStore = useSidebarStore();
  const { tabs, activeTabKey, setActiveTab, addTab } = useTabStore();
  const navigate = useNavigate();
  const location = useLocation();

  const { isOpen, onOpenChange } = useDisclosure();
  const [isCollapsed, setIsCollapsed] = React.useState(true);

  // 菜单项点击事件
  const handleSidebarSelect = (
    key: string | React.SyntheticEvent<HTMLUListElement>,
  ) => {
    const selectedKey = key as SidebarKeys;
    let isContinue = false;

    items.forEach((item) => {
      if (key == item.key && item.route) {
        isContinue = true;
        navigate(item.route);
      }
    });

    if (isContinue) {
      return;
    }

    const isEditorView = [
      SidebarKeys.textView,
      SidebarKeys.treeView,
      SidebarKeys.diffView,
      SidebarKeys.tableView,
    ].includes(selectedKey);

    if (isEditorView) {
      const currentTab = tabs.find((tab) => tab.key === activeTabKey);

      if (currentTab && currentTab.kind !== "json") {
        const lastJsonTab = [...tabs]
          .reverse()
          .find((tab) => tab.kind === "json");

        if (lastJsonTab) {
          setActiveTab(lastJsonTab.key);
        } else {
          addTab(undefined, undefined);
        }
      }
    }

    if (location.pathname !== "/") {
      navigate("/");
    }
    sidebarStore.updateClickSwitchKey(selectedKey);
  };

  // 折叠/展开：同时持久化到设置 store（修复此前折叠状态不保存的问题）
  const onToggle = React.useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;

      useSettingsStore.getState().setExpandSidebar(!next);

      return next;
    });
  }, []);

  // 当前高亮项：从路由派生，确保任何页面下高亮都与实际位置一致。
  // 编辑器四视图仍由 store 的 activeKey 驱动 renderEditor()，高亮与编辑器选择解耦。
  const currentKey = React.useMemo(() => {
    const pathname = location.pathname;
    const currentTab = tabs.find((tab) => tab.key === activeTabKey);

    if (pathname === "/settings") return SidebarKeys.settings;
    if (pathname.startsWith("/toolbox")) return SidebarKeys.toolbox;
    if (currentTab && currentTab.kind !== "json") return SidebarKeys.toolbox;

    return sidebarStore.activeKey;
  }, [activeTabKey, location.pathname, sidebarStore.activeKey, tabs]);

  useEffect(() => {
    const init = async () => {
      // 先同步设置数据到 store（如果有的话）
      await useSettingsStore.getState().syncSettingsStore();

      // 获取同步后的设置状态
      const expandSidebar = useSettingsStore.getState().expandSidebar;

      // 本地存储始终启用，同步侧边栏状态
      setIsCollapsed(!expandSidebar);
      await sidebarStore.syncSidebarStore();
    };

    init();
  }, []);

  return (
    <div className="relative flex h-dvh w-full border-t border-default-200">
      {/* Sidebar */}
      <SidebarDrawer
        className={cn("shrink-0", {
          "w-[40px]": isCollapsed,
          "w-[170px]": !isCollapsed,
        })}
        hideCloseButton={true}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
        <div
          className={cn(
            "will-change relative flex h-full flex-col bg-default-100 py-4 px-2 transition-width",
            {
              "items-center px-[2px] py-4": isCollapsed,
            },
          )}
          style={{ width: isCollapsed ? 40 : 170 }}
        >
          <div
            className={cn(
              "w-full flex items-center justify-between gap-3 pl-4 pr-4",
              {
                "justify-center gap-0 px-0": isCollapsed,
              },
            )}
          >
            <div
              className={cn("flex items-center justify-center rounded-full")}
            >
              <Image className="h-9 w-9 rounded-fulll" src="./logo.png" />
            </div>

            <div className={cn("flex-end flex", { hidden: isCollapsed })}>
              <Icon
                className="cursor-pointer dark:text-primary-foreground/60 [&>g]:stroke-[1px]"
                icon="solar:round-alt-arrow-left-line-duotone"
                width={20}
                onClick={onToggle}
              />
            </div>
          </div>
          <Spacer y={4} />

          {/* 菜单项（含设置一级项，高亮从路由派生）*/}
          <Sidebar
            currentKey={currentKey}
            iconClassName="group-data-[selected=true]:text-default-900"
            isCompact={isCollapsed}
            itemClasses={{
              base: cn(
                "data-[selected=true]:bg-default-200 data-[hover=true]:bg-default-200/70 group-data-[selected=true]:text-default-900",
                {
                  "px-3": !isCollapsed,
                  "px-0 py-0": isCollapsed,
                },
              ),
              title: "group-data-[selected=true]:text-default-900",
            }}
            items={items}
            onSelect={handleSidebarSelect}
          />

          <div
            className={cn("mt-auto flex flex-col", {
              "items-center": isCollapsed,
            })}
          >
            {isCollapsed && (
              <Tooltip
                content="展开菜单"
                isDisabled={!isCollapsed}
                placement="right"
              >
                <Button
                  isIconOnly
                  aria-label="展开菜单"
                  className="flex h-8 w-8 text-default-600"
                  size="sm"
                  variant="light"
                >
                  <Icon
                    className="cursor-pointer dark:text-primary-foreground/60 [&>g]:stroke-[1px]"
                    height={20}
                    icon="solar:round-alt-arrow-right-line-duotone"
                    width={20}
                    onClick={onToggle}
                  />
                </Button>
              </Tooltip>
            )}

            {/* 主题切换（设置已提升为菜单项，底部仅保留主题/折叠）*/}
            <ThemeSwitch isCollapsed={isCollapsed} />
          </div>
        </div>
      </SidebarDrawer>

      {/*  Settings Content */}
      <div className="flex-1 overflow-hidden min-w-16">{children}</div>
    </div>
  );
}

// 根组件外层包装字体大小样式
function FontSizeLayout({ children }: { children: React.ReactNode }) {
  const { fontSize } = useSettingsStore();
  const fontSizeConfig = getFontSizeConfig(fontSize);

  return (
    <div
      className="font-size-text"
      style={{
        // 应用字体大小到整个布局
        fontSize: fontSizeConfig.base,
        lineHeight: fontSizeConfig.lineHeight,
      }}
    >
      {children}
    </div>
  );
}

export default function DefaultLayout(props: { children: React.ReactNode }) {
  return (
    <FontSizeLayout>
      <RootLayout {...props} />
    </FontSizeLayout>
  );
}
