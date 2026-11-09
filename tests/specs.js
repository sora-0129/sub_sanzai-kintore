// Model と ViewModel のテスト。DOM を使わないので View とは無関係に確かめられる
import { parseYen, formatDayLabel } from "../js/util/format.js";
import { previousDateKey } from "../js/model/calendar.js";
import { requiredReps, summarizeDay, achievementStreak, monthTotals } from "../js/model/workout.js";
import { createDefaultState } from "../js/model/defaults.js";
import { LocalStorageRepository, STORAGE_KEY } from "../js/model/LocalStorageRepository.js";
import { WorkoutStore } from "../js/model/WorkoutStore.js";
import { AppViewModel } from "../js/viewmodel/AppViewModel.js";

class MemoryStorage {
  data = new Map();
  getItem(k) { return this.data.has(k) ? this.data.get(k) : null; }
  setItem(k, v) { this.data.set(k, String(v)); }
}

const fixedClock = (iso) => () => new Date(iso);
const day = (amounts, done = {}) => ({ spends: amounts.map((a, i) => ({ id: `s${i}`, amt: a, memo: "", t: 0 })), done });

function setup({ now = "2026-11-09T12:00:00", state } = {}) {
  const storage = new MemoryStorage();
  if (state) storage.setItem(STORAGE_KEY, JSON.stringify(state));
  let n = 0;
  const store = new WorkoutStore(new LocalStorageRepository(storage), () => `id${++n}`);
  const app = new AppViewModel(store, fixedClock(now));
  return { storage, store, app };
}

export const specs = {
  // ---- util ----
  "parseYen: 全角・カンマ・記号を数値にする"(t) {
    t.eq(parseYen("１,２００円"), 1200);
    t.eq(parseYen(""), 0);
    t.eq(parseYen("abc"), 0);
    t.eq(parseYen("999999999999"), 99_999_999);
  },
  "formatDayLabel / previousDateKey: 月またぎ"(t) {
    t.eq(formatDayLabel("2026-11-09"), "11月9日（月）");
    t.eq(previousDateKey("2026-03-01"), "2026-02-28");
    t.eq(previousDateKey("2027-01-01"), "2026-12-31");
  },

  // ---- model ----
  "requiredReps: 100円で1回、端数は切り捨て"(t) {
    const s = createDefaultState().settings;
    t.deepEq(requiredReps(s, day([2480])), { pushup: 24, squat: 24, situp: 12 });
  },
  "requiredReps: 上限で止まる、上限0なら無制限"(t) {
    const s = createDefaultState().settings;
    t.deepEq(requiredReps(s, day([50000])), { pushup: 100, squat: 100, situp: 50 });
    s.exercises[0].cap = 0;
    t.eq(requiredReps(s, day([50000])).pushup, 500);
  },
  "requiredReps: 無料枠を超えた分だけ数える"(t) {
    const s = createDefaultState().settings;
    s.allowance = 1000;
    t.deepEq(requiredReps(s, day([2480])), { pushup: 14, squat: 14, situp: 7 });
    t.deepEq(requiredReps(s, day([800])), { pushup: 0, squat: 0, situp: 0 });
  },
  "summarizeDay: 必要回数を超えてやった分は達成数に含めない"(t) {
    const s = createDefaultState().settings;
    const r = summarizeDay(s, day([1000], { pushup: 30, squat: 3 }));
    t.eq(r.totalRequired, 25);
    t.eq(r.totalDone, 13);
    t.eq(r.totalLogged, 33);
    t.eq(r.achieved, false);
  },
  "achievementStreak: 今日が途中でも途切れない、未達の日で止まる"(t) {
    const s = createDefaultState().settings;
    const days = {
      "2026-11-05": day([100]),
      "2026-11-06": day([100], { pushup: 1, squat: 1 }),
      "2026-11-07": day([]),
      "2026-11-08": day([200], { pushup: 2, squat: 2, situp: 1 }),
      "2026-11-09": day([300]),
    };
    t.eq(achievementStreak(s, days, "2026-11-09"), 3);
    days["2026-11-09"].done = { pushup: 3, squat: 3, situp: 1 };
    t.eq(achievementStreak(s, days, "2026-11-09"), 4);
    t.eq(achievementStreak(s, {}, "2026-11-09"), 0);
  },
  "monthTotals: その月だけを合計する"(t) {
    const s = createDefaultState().settings;
    const days = { "2026-10-31": day([5000], { pushup: 9 }), "2026-11-01": day([1200], { pushup: 4 }), "2026-11-09": day([300], { squat: 2 }) };
    t.deepEq(monthTotals(s, days, "2026-11"), { spent: 1500, reps: 6 });
  },
  "LocalStorageRepository: 壊れたデータなら初期状態、保存したものは読み戻せる"(t) {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, "{not json");
    const repo = new LocalStorageRepository(storage);
    t.deepEq(repo.load(), createDefaultState());
    const state = createDefaultState();
    state.settings.allowance = 500;
    repo.save(state);
    t.eq(repo.load().settings.allowance, 500);
  },
  "WorkoutStore: 変更のたびに保存と通知をする"(t) {
    const { storage, store } = setup();
    let notified = 0;
    store.subscribe(() => notified++);
    store.addSpend("2026-11-09", 1000, "ランチ", 123);
    t.eq(notified, 1);
    const saved = JSON.parse(storage.getItem(STORAGE_KEY));
    t.deepEq(saved.days["2026-11-09"].spends, [{ id: "id1", amt: 1000, memo: "ランチ", t: 123 }]);
  },

  // ---- viewmodel ----
  "TodayViewModel: 旧版で保存したデータをそのまま表示できる"(t) {
    const state = createDefaultState();
    state.days["2026-11-09"] = { spends: [{ id: "a", amt: 2480, memo: "ランチと本", t: new Date("2026-11-09T12:30:00").getTime() }], done: { pushup: 10 } };
    const { app } = setup({ state });
    const s = app.today.state;
    t.eq(s.spent, 2480);
    t.eq(s.remaining, 50);
    t.eq(s.message, "あと 50 回で達成");
    t.deepEq(s.spends, [{ id: "a", label: "ランチと本", time: "12:30", amount: 2480 }]);
    t.deepEq(s.exercises.map((e) => [e.done, e.required]), [[10, 24], [0, 24], [0, 12]]);
  },
  "TodayViewModel: 0円は記録しない、正しい金額は記録して入力欄を空にする"(t) {
    const { app, store } = setup();
    app.today.setDraftAmount("0");
    t.eq(app.today.submitDraft(), false);
    t.eq(store.day("2026-11-09").spends.length, 0);
    app.today.setDraftAmount("1,500");
    app.today.setDraftMemo("  本  ");
    t.eq(app.today.submitDraft(), true);
    t.deepEq(app.today.draft, { amount: "", memo: "" });
    t.eq(store.day("2026-11-09").spends[0].memo, "本");
    t.eq(app.today.state.spent, 1500);
  },
  "TodayViewModel: クイック加算ボタンは入力中の金額に足す"(t) {
    const { app } = setup();
    app.today.setDraftAmount("1,000");
    app.today.bumpDraftAmount(500);
    t.eq(app.today.draft.amount, "1,500");
  },
  "TodayViewModel: 回数は0未満にならない、完了は必要回数まで埋める"(t) {
    const { app } = setup();
    app.today.setDraftAmount("1000");
    app.today.submitDraft();
    app.today.logReps("pushup", -1);
    t.eq(app.today.state.exercises[0].done, 0);
    app.today.completeExercise("pushup");
    app.today.completeExercise("squat");
    app.today.completeExercise("situp");
    const s = app.today.state;
    t.eq(s.remaining, 0);
    t.eq(s.cleared, true);
    t.eq(s.message, "今日のノルマ達成！💪");
  },
  "HistoryViewModel: 状態ごとのバッジと連続日数"(t) {
    const state = createDefaultState();
    state.days["2026-11-08"] = day([300], { pushup: 3, squat: 3, situp: 1 });
    state.days["2026-11-09"] = day([500]);
    state.days["2026-11-07"] = { spends: [], done: {} };
    const { app } = setup({ state });
    const h = app.history.state;
    t.deepEq(h.entries.map((e) => [e.key, e.status]), [["2026-11-09", "pending"], ["2026-11-08", "achieved"]]);
    t.eq(h.streak, 2); // 11/9 は途中、11/8 達成、11/7 は記録の最初の日（出費なし＝達成）
    t.eq(h.monthSpent, 800);
  },
  "SettingsViewModel: 入力文字列を検証してから保存する"(t) {
    const { app, store } = setup();
    app.settings.setAllowance("１,０００");
    app.settings.setYenPerRep("pushup", "0");
    app.settings.renameExercise("squat", "   ");
    app.settings.addExercise();
    t.eq(store.settings.allowance, 1000);
    t.eq(store.settings.exercises[0].yen, 1);
    t.eq(store.settings.exercises[1].name, "種目");
    t.deepEq(store.settings.exercises[3], { id: "id1", name: "新しい種目", yen: 100, cap: 100 });
  },
  "AppViewModel: 存在しないタブには切り替えない"(t) {
    const { app } = setup();
    let notified = 0;
    app.subscribe(() => notified++);
    app.selectTab("history");
    app.selectTab("history");
    app.selectTab("nope");
    t.eq(app.tab, "history");
    t.eq(notified, 1);
  },
};
