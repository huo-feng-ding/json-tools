import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Progress,
  useDisclosure,
} from "@heroui/react";
import { Download, X, WifiOff, RefreshCw } from "lucide-react";

import { usePWAUpdate, UpdateStatus } from "@/utils/pwa-updates";
import toast from "@/utils/toast";
import { isPWA } from "@/utils/pwa";

interface PWAUpdateToastProps {
  className?: string;
}

// 离线提示组件
const OfflineToast: React.FC<PWAUpdateToastProps> = ({ className }) => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    setIsOffline(!navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${className}`}
    >
      <WifiOff size={18} />
      <span>网络连接已断开，应用正在离线模式下运行</span>
    </div>
  );
};

// 更新提示模态框
const UpdateModal: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const updateManager = usePWAUpdate();

  const handleUpdate = useCallback(async () => {
    if (!updateManager) return;

    setIsUpdating(true);
    setProgress(20);

    try {
      setProgress(40);
      await updateManager.applyUpdate();
      setProgress(80);

      // 更新会触发页面重新加载，这里只需要等待
      setTimeout(() => setProgress(100), 500);

      // 显示更新成功提示
      toast.success("应用已更新", "新版本已成功安装，页面即将刷新");

      // 延迟刷新，让用户看到成功提示
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("更新失败:", error);
      toast.error("更新失败", "请稍后重试");
      setIsUpdating(false);
      setProgress(0);
    }
  }, [updateManager]);

  const handleSkip = useCallback(() => {
    onClose();
    // 可以选择稍后提醒，比如在页面关闭前
    setTimeout(
      () => {
        if (updateManager?.isUpdatePending()) {
          onOpen();
        }
      },
      30 * 60 * 1000,
    ); // 30 分钟后再次提醒
  }, [onClose, onOpen, updateManager]);

  useEffect(() => {
    const unsubscribe = updateManager?.onUpdate((newStatus) => {
      setStatus(newStatus);
      if (newStatus.isUpdateAvailable) {
        onOpen();
      }
    });

    // 检查是否已有待处理的更新
    if (updateManager?.isUpdatePending()) {
      setStatus({
        isUpdateAvailable: true,
        isOfflineReady: true,
      });
      onOpen();
    }

    // 监听热重载事件
    const handleHotReload = (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail as any;

      console.log("🔥 收到热重载更新事件:", detail);

      setStatus({
        isUpdateAvailable: true,
        isOfflineReady: true,
        version: detail.version,
      });

      onOpen();
    };

    window.addEventListener("pwa-update-available", handleHotReload);

    return () => {
      unsubscribe?.();
      window.removeEventListener("pwa-update-available", handleHotReload);
    };
  }, [updateManager, onOpen]);

  if (!isOpen || !status?.isUpdateAvailable) return null;

  return (
    <Modal
      backdrop={isUpdating ? "blur" : "opaque"}
      hideCloseButton={isUpdating}
      isDismissable={!isUpdating}
      isOpen={isOpen}
      size="sm"
      onClose={isUpdating ? undefined : handleSkip}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Download className="text-primary" size={24} />
                <h3>发现新版本</h3>
              </div>
            </ModalHeader>
            <ModalBody>
              {isUpdating ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    正在更新应用，请稍候...
                  </p>
                  <Progress
                    className="w-full"
                    color="primary"
                    size="sm"
                    value={progress}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    新版本已准备好安装，包含最新功能和改进。
                  </p>
                  <p className="text-xs text-gray-500">
                    更新后页面将自动刷新，请保存您的数据，如果开启本地存储则数据不会丢失。
                  </p>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              {!isUpdating && (
                <>
                  <Button
                    color="default"
                    startContent={<X size={18} />}
                    variant="light"
                    onPress={handleSkip}
                  >
                    稍后更新
                  </Button>
                  <Button
                    color="primary"
                    startContent={<RefreshCw size={18} />}
                    onPress={handleUpdate}
                  >
                    立即更新
                  </Button>
                </>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

// 主组件
export const PWAUpdateManager: React.FC = () => {
  // 只在 PWA 环境下渲染
  if (!isPWA()) {
    return null;
  }

  return (
    <>
      {/* 离线提示 */}
      <OfflineToast />

      {/* 更新模态框 */}
      <UpdateModal />
    </>
  );
};

// 导出单独的组件供按需使用
export { OfflineToast, UpdateModal };
