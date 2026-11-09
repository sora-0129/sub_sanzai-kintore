/**
 * 出費 → 筋トレ回数のルール（純粋関数）。
 *
 * 型（保存形式。互換性のため名前は変えない）
 *   Settings = { allowance: number, exercises: Exercise[] }
 *   Exercise = { id: string, name: string, yen: number, cap: number }   // yen 円ごとに1回、cap=0 は上限なし
 *   Day      = { spends: Spend[], done: { [exerciseId]: number } }
 *   Spend    = { id: string, amt: number, memo: string, t: number }
 */
import { monthOf, previousDateKey } from "./calendar.js";

export const emptyDay = () => ({ spends: [], done: {} });

export const totalSpent = (day) => day.spends.reduce((sum, s) => sum + s.amt, 0);

/** 種目ごとの必要回数 */
export function requiredReps(settings, day) {
  const overBudget = Math.max(0, totalSpent(day) - (settings.allowance || 0));
  const reps = {};
  for (const ex of settings.exercises) {
    let n = ex.yen > 0 ? Math.floor(overBudget / ex.yen) : 0;
    if (ex.cap > 0) n = Math.min(n, ex.cap);
    reps[ex.id] = n;
  }
  return reps;
}

/** 1日の集計。totalDone は必要回数を超えた分を数えない */
export function summarizeDay(settings, day) {
  const required = requiredReps(settings, day);
  let totalRequired = 0;
  let totalDone = 0;
  let totalLogged = 0;
  for (const ex of settings.exercises) {
    const logged = day.done[ex.id] || 0;
    totalRequired += required[ex.id];
    totalDone += Math.min(logged, required[ex.id]);
    totalLogged += logged;
  }
  return {
    spent: totalSpent(day),
    required,
    totalRequired,
    totalDone,
    totalLogged,
    achieved: totalDone >= totalRequired,
  };
}

/**
 * 今日から遡って達成が続いている日数。
 * 今日が未達成でも途切れ扱いにはしない（まだ途中のため）。記録のない日は「出費なし＝達成」。
 */
export function achievementStreak(settings, days, todayKey) {
  const keys = Object.keys(days).sort();
  if (keys.length === 0) return 0;
  const firstKey = keys[0];
  let streak = 0;
  for (let key = todayKey; key >= firstKey; key = previousDateKey(key)) {
    if (summarizeDay(settings, days[key] ?? emptyDay()).achieved) streak++;
    else if (key !== todayKey) break;
  }
  return streak;
}

/** 指定月（"YYYY-MM"）の出費合計と、実際にやった回数の合計 */
export function monthTotals(settings, days, month) {
  let spent = 0;
  let reps = 0;
  for (const [key, day] of Object.entries(days)) {
    if (monthOf(key) !== month) continue;
    const s = summarizeDay(settings, day);
    spent += s.spent;
    reps += s.totalLogged;
  }
  return { spent, reps };
}
