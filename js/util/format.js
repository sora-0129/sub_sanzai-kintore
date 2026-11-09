/** 表示・入力の変換（状態を持たない純粋関数だけ） */

export const pad2 = (n) => String(n).padStart(2, "0");

export const formatNumber = (n) => n.toLocaleString("ja-JP");

export const formatYen = (n) => `¥${formatNumber(n)}`;

const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);

/** "2026-11-09" → "11月9日（月）" */
export function formatDayLabel(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const weekday = "日月火水木金土"[new Date(y, m - 1, d).getDay()];
  return `${m}月${d}日（${weekday}）`;
}

/** タイムスタンプ → "12:30" */
export function formatTime(timestamp) {
  const t = new Date(timestamp);
  return `${pad2(t.getHours())}:${pad2(t.getMinutes())}`;
}

/** "１,２００円" のような入力も数値にする。上限 99,999,999 */
export function parseYen(text) {
  const digits = String(text ?? "")
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[^0-9]/g, "");
  return Math.min(parseInt(digits || "0", 10), 99_999_999);
}
