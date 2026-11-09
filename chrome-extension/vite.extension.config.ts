/**
 * Vite config for the Chrome extension build (pnpm build:extension).
 *
 * It reuses the web app's root config so the app is built exactly the same way,
 * then makes the extension-specific adjustments that MV3 requires:
 *
 * 1. Drops every `vite-plugin-pwa` plugin: extension pages cannot register a
 *    Service Worker (`navigator.serviceWorker.register` fails with
 *    NotSupportedError), and sw.js / workbox bundles must not ship.
 * 2. Aliases `virtual:pwa-register` to a no-op stub, because PWAUpdateManager
 *    imports it statically. Without the plugin the virtual module no longer
 *    resolves; the stub keeps the component inert in the extension.
 *
 * Inline-script extraction (the other MV3 CSP constraint) is handled after the
 * build by `chrome-extension/build.js`.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import type { ConfigEnv, UserConfig } from "vite";

import baseConfig from "../vite.config";

const extensionDir = path.dirname(fileURLToPath(import.meta.url));
const pwaRegisterStub = path.resolve(extensionDir, "pwa-register-stub.ts");

const isPwaPlugin = (plugin: unknown): boolean => {
  if (plugin === null || typeof plugin !== "object") return false;
  const name = (plugin as { name?: unknown }).name;
  return typeof name === "string" && name.startsWith("vite-plugin-pwa");
};

export default defineConfig((env: ConfigEnv): UserConfig => {
  const base: UserConfig =
    typeof baseConfig === "function" ? baseConfig(env) : baseConfig;

  const plugins = (base.plugins ?? [])
    .flat(Infinity)
    .filter((plugin) => !isPwaPlugin(plugin));

  const baseAlias = base.resolve?.alias;
  const alias = [
    ...(Array.isArray(baseAlias)
      ? baseAlias
      : baseAlias
        ? Object.entries(baseAlias).map(([find, replacement]) => ({
            find,
            replacement,
          }))
        : []),
    { find: /^virtual:pwa-register$/, replacement: pwaRegisterStub },
    { find: /^virtual:pwa-register\/react$/, replacement: pwaRegisterStub },
  ];

  return {
    ...base,
    plugins,
    resolve: {
      ...base.resolve,
      alias,
    },
  };
});