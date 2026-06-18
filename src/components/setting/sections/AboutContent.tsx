import { Icon } from "@iconify/react";

import { GroupLabel, SectionCard, SectionHeader } from "../settingPrimitives";

import ExternalLink from "@/components/ExternalLink";
import pkg from "@/../package.json";

const APP_VERSION = `v${pkg.version}`;

const FEATURES = [
  { label: "JSON 格式化与验证", icon: "solar:check-circle-bold" },
  { label: "智能 AI 辅助修复", icon: "solar:check-circle-bold" },
  { label: "数据格式转换", icon: "solar:check-circle-bold" },
];

const LINKS = [
  {
    href: "https://github.com/fevrax/json-tools",
    icon: "mdi:github",
    label: "GitHub 仓库",
  },
  {
    href: "https://github.com/fevrax/json-tools/issues",
    icon: "solar:chat-square-code-bold",
    label: "问题反馈",
  },
  {
    href: "https://github.com/fevrax/json-tools",
    icon: "solar:document-bold",
    label: "使用文档",
  },
];

/**
 * 关于页（Apple 系统风 · 居中 Hero + 双列）。
 * 放宽宽度限制：根容器 max-w-5xl，内容用 grid 充分利用横向空间。
 */
export function AboutContent() {
  return (
    <div className="h-full">
      <SectionHeader
        description="了解更多关于应用的信息"
        title="关于 JSON Tools"
      />

      {/* 品牌信息 */}
      <SectionCard className="mb-5">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-default-100">
              <img alt="JSON Tools Logo" className="h-8 w-8" src="./logo.png" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-default-900">
                JSON Tools
              </h3>
              <p className="text-[12px] text-default-500">
                强大的 JSON 处理工具集，一站式 JSON 开发者工具箱
              </p>
            </div>
          </div>
          <span className="w-fit rounded-full border border-default-200 px-2.5 py-1 text-xs font-medium text-default-600">
            {APP_VERSION}
          </span>
        </div>
      </SectionCard>

      {/* 双列：功能特点 + 技术支持 */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <GroupLabel>功能特点</GroupLabel>
          <SectionCard divided>
            {FEATURES.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-3 px-3 py-3 sm:px-4"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-success text-white">
                  <Icon icon={f.icon} width={18} />
                </div>
                <span className="text-[13px] font-medium text-default-900">
                  {f.label}
                </span>
              </div>
            ))}
          </SectionCard>
        </div>

        <div>
          <GroupLabel>技术支持</GroupLabel>
          <SectionCard divided>
            {LINKS.map((l) => (
              <ExternalLink
                key={l.label}
                showUrl
                className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-default-50/80 sm:px-4"
                href={l.href}
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-default-100 text-default-700">
                  <Icon icon={l.icon} width={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-default-900">
                    {l.label}
                  </span>
                </div>
                <Icon
                  className="flex-shrink-0 text-default-400"
                  icon="solar:arrow-right-linear"
                  width={16}
                />
              </ExternalLink>
            ))}
          </SectionCard>
        </div>
      </div>

      <p className="mt-6 text-center text-[12px] text-default-400">
        © {new Date().getFullYear()} JSON Tools · 基于 React、TypeScript 和
        HeroUI 构建
      </p>
    </div>
  );
}
