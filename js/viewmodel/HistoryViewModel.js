import { formatDayLabel } from "../util/format.js";
import { monthOf, toDateKey } from "../model/calendar.js";
import { achievementStreak, monthTotals, summarizeDay } from "../model/workout.js";

/** 「履歴」画面：表示用の状態だけ（操作なし） */
export class HistoryViewModel {
  #store;
  #clock;

  constructor(store, clock) {
    this.#store = store;
    this.#clock = clock;
  }

  get state() {
    const { settings, days } = this.#store;
    const todayKey = toDateKey(this.#clock());
    const totals = monthTotals(settings, days, monthOf(todayKey));

    const entries = Object.keys(days)
      .sort()
      .reverse()
      .map((key) => ({ key, s: summarizeDay(settings, days[key]) }))
      .filter(({ s }) => s.spent > 0 || s.totalLogged > 0)
      .map(({ key, s }) => ({
        key,
        label: formatDayLabel(key),
        spent: s.spent,
        done: s.totalDone,
        required: s.totalRequired,
        remaining: s.totalRequired - s.totalDone,
        /** "free"=筋トレなし / "achieved"=達成 / "pending"=未達 */
        status: s.totalRequired === 0 ? "free" : s.achieved ? "achieved" : "pending",
      }));

    return {
      streak: achievementStreak(settings, days, todayKey),
      monthSpent: totals.spent,
      monthReps: totals.reps,
      entries,
    };
  }
}
