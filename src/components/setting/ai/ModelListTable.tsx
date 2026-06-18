import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";

import toast from "@/utils/toast";

interface ModelListTableProps {
  models: Array<{ value: string; label: string }>;
  onRefresh: () => void;
  onAdd: () => void;
  onRemove: (modelValue: string) => void;
}

/**
 * 模型列表表格（ssooai / custom 线路复用）。
 * 容器支持横向滚动，避免窄屏溢出。
 */
export function ModelListTable({
  models,
  onRefresh,
  onAdd,
  onRemove,
}: ModelListTableProps) {
  return (
    <div className="mt-5 border-t border-default-200 pt-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h4 className="flex items-center gap-2 text-sm font-medium">
          <Icon className="text-primary" icon="solar:layers-bold" width={16} />
          模型列表
        </h4>
        <div className="flex flex-wrap gap-2">
          <Button
            color="primary"
            radius="full"
            size="sm"
            startContent={<Icon icon="solar:add-circle-bold" />}
            variant="flat"
            onPress={onAdd}
          >
            添加模型
          </Button>
          <Button
            isIconOnly
            color="default"
            radius="full"
            size="sm"
            variant="flat"
            onPress={() => {
              onRefresh();
              toast.success("正在刷新模型列表");
            }}
          >
            <Icon icon="solar:refresh-bold" width={18} />
          </Button>
        </div>
      </div>

      <div className="max-h-96 max-w-full overflow-auto rounded-lg border border-default-200 bg-background">
        {models.length === 0 ? (
          <div className="p-4 text-center text-sm text-default-500">
            暂无模型，请刷新或检查API密钥
          </div>
        ) : (
          <div className="min-w-full overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead className="sticky top-0 z-10 bg-default-100 shadow-sm">
                <tr className="text-xs text-default-500">
                  <th className="p-3 text-left text-xs font-medium text-default-500">
                    名称
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-default-500">
                    显示名称
                  </th>
                  <th className="p-3 text-center text-xs font-medium text-default-500">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {models.map((item, index) => (
                  <tr
                    key={item.value}
                    className={`text-sm transition-colors hover:bg-default-100/50 ${
                      index % 2 === 0 ? "bg-default-50/80" : "bg-default-100/20"
                    }`}
                  >
                    <td className="max-w-[260px] truncate p-3">
                      {item.value}
                    </td>
                    <td className="max-w-[260px] truncate p-3">
                      {item.label}
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        isIconOnly
                        className="h-7 w-7 min-w-0"
                        color="danger"
                        radius="full"
                        size="sm"
                        variant="light"
                        onPress={() => onRemove(item.value)}
                      >
                        <Icon
                          icon="solar:trash-bin-minimalistic-bold"
                          width={14}
                        />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
