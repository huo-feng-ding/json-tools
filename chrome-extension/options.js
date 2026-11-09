const STORAGE_KEY = "autoOpenJson";

const checkbox = document.getElementById("auto-open");
const status = document.getElementById("status");

const renderStatus = (enabled) => {
  status.textContent = enabled
    ? "已开启：检测到 JSON 响应时会自动用 Datamorph 打开。"
    : "已关闭：第三方 JSON 页面将保持原样。";
};

chrome.storage.local.get(STORAGE_KEY, (stored) => {
  const enabled = stored[STORAGE_KEY] !== false;
  checkbox.checked = enabled;
  renderStatus(enabled);
});

checkbox.addEventListener("change", () => {
  const enabled = checkbox.checked;

  chrome.storage.local.set({ [STORAGE_KEY]: enabled }, () => {
    renderStatus(enabled);
  });
});