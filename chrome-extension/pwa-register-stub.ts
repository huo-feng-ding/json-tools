/**
 * Stub for `virtual:pwa-register/react` in the Chrome extension build.
 *
 * Chrome extension pages (chrome-extension://) cannot register a Service Worker,
 * and the generated sw.js is a PWA artifact that must not ship inside the
 * extension. This module keeps the PWAUpdateManager component compiling while
 * making registration a no-op: there is never an update to apply, and no
 * "Service Worker 注册失败" error is produced.
 */

type BoolSetter = (value: boolean) => void;

export interface RegisterSWResult {
  needRefresh: [boolean, BoolSetter];
  offlineReady: [boolean, BoolSetter];
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
}

const noopSetter: BoolSetter = () => {};

const noopUpdate = async (): Promise<void> => {};

export function useRegisterSW(): RegisterSWResult {
  return {
    needRefresh: [false, noopSetter],
    offlineReady: [false, noopSetter],
    updateServiceWorker: noopUpdate,
  };
}

export function registerSW(): (reloadPage?: boolean) => Promise<void> {
  return noopUpdate;
}

export default useRegisterSW;