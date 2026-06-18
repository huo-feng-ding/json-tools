import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Textarea,
  Divider,
} from "@heroui/react";
import { useState } from "react";
import { Icon } from "@iconify/react";

import { TabHistoryItem } from "@/store/useTabStore";
import { formatDate } from "@/utils/date";

interface TabHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentContent: string;
  historyItems: TabHistoryItem[];
  onRestore: (historyKey: string) => void;
  onDelete: (historyKey: string) => void;
  onClear: () => void;
}

const TabHistoryModal: React.FC<TabHistoryModalProps> = ({
  isOpen,
  onClose,
  currentContent,
  historyItems,
  onRestore,
  onDelete,
  onClear,
}) => {
  const [selectedHistory, setSelectedHistory] = useState<TabHistoryItem | null>(
    null,
  );
  const [previewMode, setPreviewMode] = useState(false);

  const handleSelectHistory = (item: TabHistoryItem) => {
    setSelectedHistory(item);
    setPreviewMode(true);
  };

  const handleRestore = () => {
    if (selectedHistory) {
      onRestore(selectedHistory.key);
      setSelectedHistory(null);
      setPreviewMode(false);
      onClose();
    }
  };

  const handleDelete = (historyKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(historyKey);
    if (selectedHistory?.key === historyKey) {
      setSelectedHistory(null);
      setPreviewMode(false);
    }
  };

  const handleClear = () => {
    onClear();
    setSelectedHistory(null);
    setPreviewMode(false);
  };

  const handleClose = () => {
    setSelectedHistory(null);
    setPreviewMode(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      scrollBehavior="inside"
      size={previewMode ? "5xl" : "2xl"}
      onClose={handleClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">
              {previewMode ? "预览历史记录" : "历史记录"}
            </h3>
            <Chip
              className="text-default-500"
              classNames={{
                base: "h-5 px-2",
                content: "text-tiny font-medium",
              }}
              size="sm"
              variant="flat"
            >
              {historyItems.length}
            </Chip>
          </div>
        </ModalHeader>
        <ModalBody>
          {previewMode && selectedHistory ? (
            <div className="flex flex-col gap-4 h-full">
              {/* 历史记录信息 */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-small font-semibold text-default-700">
                      版本 #{selectedHistory.monacoVersion}
                    </span>
                    <Chip className="h-5 px-1.5" size="sm" variant="flat">
                      <span className="text-tiny text-default-500">
                        {formatDate(selectedHistory.timestamp)}
                      </span>
                    </Chip>
                  </div>
                </div>
              </div>

              <Divider />

              {/* 内容对比 */}
              <div className="flex flex-col gap-2 flex-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="text-small font-medium">当前内容</span>
                </div>
                <Textarea
                  readOnly
                  className="flex-1"
                  classNames={{
                    input: "text-small",
                  }}
                  maxRows={10}
                  minRows={5}
                  value={currentContent}
                />

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-small font-medium">
                    历史内容（{formatDate(selectedHistory.timestamp)}）
                  </span>
                </div>
                <Textarea
                  readOnly
                  className="flex-1"
                  classNames={{
                    input: "text-small",
                  }}
                  maxRows={10}
                  minRows={5}
                  value={selectedHistory.content}
                />
              </div>
            </div>
          ) : (
            <>
              {historyItems.length === 0 ? (
                <div className="text-center py-8 text-default-400">
                  <p>暂无历史记录</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {historyItems.map((item) => (
                    <div
                      key={item.key}
                      className="group flex items-center gap-3 p-3 rounded-lg hover:bg-default-100 cursor-pointer transition-colors"
                      onClick={() => handleSelectHistory(item)}
                    >
                      <div className="flex flex-col flex-1">
                        <span className="text-small font-semibold text-default-700">
                          版本 #{item.monacoVersion}
                        </span>
                        <span className="text-tiny text-default-400">
                          {formatDate(item.timestamp)}
                        </span>
                        <span className="text-tiny text-default-400 truncate max-w-md">
                          {item.content.substring(0, 50)}
                          {item.content.length > 50 ? "..." : ""}
                        </span>
                      </div>
                      <Button
                        isIconOnly
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        color="danger"
                        size="sm"
                        variant="light"
                        onClick={(e) => handleDelete(item.key, e)}
                      >
                        <Icon icon="solar:trash-bin-trash-linear" width={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          {previewMode ? (
            <>
              <Button variant="flat" onPress={() => setPreviewMode(false)}>
                返回列表
              </Button>
              <Button color="primary" onPress={handleRestore}>
                回滚到此版本
              </Button>
            </>
          ) : (
            <>
              {historyItems.length > 0 && (
                <Button color="danger" variant="light" onPress={handleClear}>
                  清空历史
                </Button>
              )}
              <Button color="primary" variant="flat" onPress={handleClose}>
                关闭
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TabHistoryModal;
