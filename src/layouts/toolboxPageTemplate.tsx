import { ReactNode } from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";

interface ToolboxPageTemplateProps {
  toolName: string; // 动态工具名称
  toolIcon?: string; // 工具图标
  toolIconColor?: string; // 工具图标颜色
  actions?: ReactNode; // 工具特定的操作按钮
  statusIndicator?: ReactNode; // 状态指示器
  children: ReactNode; // 主要内容区域（通常是编辑器）
}

export default function ToolboxPageTemplate({
  toolName,
  toolIcon = "solar:magic-stick-bold",
  toolIconColor = "text-primary",
  actions,
  statusIndicator,
  children,
}: ToolboxPageTemplateProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-default-50 w-full h-full flex flex-col">
      <div className="w-full mx-auto px-3 py-2 flex-1 flex flex-col">
        {/* 头部区域 */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1.5">
            <Button
              isIconOnly
              aria-label="返回工具箱"
              size="sm"
              variant="light"
              onPress={() => navigate("/toolbox")}
            >
              <Icon
                className="text-default-500"
                icon="solar:arrow-left-outline"
                width={18}
              />
            </Button>

            <h1 className="text-base font-bold flex items-center ml-0.5">
              <Icon
                className={`mr-1.5 ${toolIconColor}`}
                icon={toolIcon}
                width={18}
              />
              {toolName}
            </h1>
          </div>
        </div>

        {/* 操作和状态区域 */}
        {(actions || statusIndicator) && (
          <div className="mb-2 flex flex-wrap justify-between gap-1.5 items-center">
            <div className="flex items-center gap-1.5 [&_button]:h-7 [&_button]:min-w-0 [&_button]:px-2 [&_button]:text-xs">{actions}</div>

            <div className="flex items-center">{statusIndicator}</div>
          </div>
        )}

        {/* 主内容区域 */}
        {children}
      </div>
    </div>
  );
}
