import { pad2 } from "../util/format.js";

/** 日付をローカル時間の "YYYY-MM-DD" キーにする */
export const toDateKey = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export function previousDateKey(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return toDateKey(new Date(y, m - 1, d - 1));
}

/** "2026-11-09" → "2026-11" */
export const monthOf = (dateKey) => dateKey.slice(0, 7);
