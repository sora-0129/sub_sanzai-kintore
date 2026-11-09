import { Observable } from "../util/Observable.js";
import { formatNumber, formatTime, parseYen } from "../util/format.js";
import { toDateKey } from "../model/calendar.js";
import { summarizeDay } from "../model/workout.js";

/** 「今日」画面：表示用の状態と、画面からの操作 */
export class TodayViewModel extends Observable {
  #store;
  #clock;
  #draft = { amount: "", memo: "" };

  constructor(store, clock) {
    super();
    this.#store = store;
    this.#clock = clock;
  }

  // ---- 表示用の状態 ----
  get state() {
    const settings = this.#store.settings;
    const day = this.#store.day(this.#todayKey());
    const s = summarizeDay(settings, day);
    const remaining = s.totalRequired - s.totalDone;

    return {
      spent: s.spent,
      allowance: settings.allowance || 0,
      remaining,
      progress: s.totalRequired ? s.totalDone / s.totalRequired : s.spent ? 1 : 0,
      cleared: s.spent > 0 && remaining === 0,
      message: statusMessage(s.spent, s.totalRequired, remaining),
      exercises: settings.exercises.map((ex) => {
        const required = s.required[ex.id];
        const done = day.done[ex.id] || 0;
        return {
          id: ex.id,
          name: ex.name,
          done,
          required,
          progress: required ? Math.min(1, done / required) : 0,
          idle: required === 0,
          cleared: required > 0 && done >= required,
          yenPerRep: ex.yen,
          cap: ex.cap,
        };
      }),
      spends: day.spends
        .slice()
        .reverse()
        .map((sp) => ({ id: sp.id, label: sp.memo || "出費", time: formatTime(sp.t), amount: sp.amt })),
    };
  }

  /** 入力途中の値（金額は表示用の文字列のまま持つ） */
  get draft() {
    return { ...this.#draft };
  }

  // ---- 入力フォーム ----
  setDraftAmount(text) {
    this.#draft.amount = text;
  }

  setDraftMemo(text) {
    this.#draft.memo = text;
  }

  bumpDraftAmount(yen) {
    this.#draft.amount = formatNumber(parseYen(this.#draft.amount) + yen);
    this.notify();
  }

  /** @returns {boolean} 金額が不正なら false（記録しない） */
  submitDraft() {
    const amount = parseYen(this.#draft.amount);
    if (amount <= 0) return false;
    const memo = this.#draft.memo.trim();
    this.#draft = { amount: "", memo: "" };
    this.#store.addSpend(this.#todayKey(), amount, memo, this.#clock().getTime());
    return true;
  }

  // ---- 記録の操作 ----
  removeSpend(spendId) {
    this.#store.removeSpend(this.#todayKey(), spendId);
  }

  logReps(exerciseId, delta) {
    this.#store.addReps(this.#todayKey(), exerciseId, delta);
  }

  completeExercise(exerciseId) {
    this.#store.completeExercise(this.#todayKey(), exerciseId);
  }

  #todayKey() {
    return toDateKey(this.#clock());
  }
}

function statusMessage(spent, totalRequired, remaining) {
  if (spent === 0) return "まだ出費なし。この調子！";
  if (totalRequired === 0) return "無料枠の範囲内。今日は筋トレなし";
  if (remaining === 0) return "今日のノルマ達成！💪";
  return `あと ${formatNumber(remaining)} 回で達成`;
}
