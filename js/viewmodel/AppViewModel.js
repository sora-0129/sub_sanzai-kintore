import { Observable } from "../util/Observable.js";
import { formatDayLabel } from "../util/format.js";
import { toDateKey } from "../model/calendar.js";
import { TodayViewModel } from "./TodayViewModel.js";
import { HistoryViewModel } from "./HistoryViewModel.js";
import { SettingsViewModel } from "./SettingsViewModel.js";

export const TABS = Object.freeze(["today", "history", "settings"]);

/** アプリ全体：どのタブを開いているかと、各画面の ViewModel をまとめる */
export class AppViewModel extends Observable {
  #clock;
  #tab = "today";

  /** @param {() => Date} clock テストで日時を固定できるよう注入する */
  constructor(store, clock = () => new Date()) {
    super();
    this.#clock = clock;
    this.today = new TodayViewModel(store, clock);
    this.history = new HistoryViewModel(store, clock);
    this.settings = new SettingsViewModel(store);
  }

  get tab() {
    return this.#tab;
  }

  get dateLabel() {
    return formatDayLabel(toDateKey(this.#clock()));
  }

  selectTab(tab) {
    if (!TABS.includes(tab) || tab === this.#tab) return;
    this.#tab = tab;
    this.notify();
  }

  /** アプリに戻ってきたとき、日付が変わっていれば表示を更新するため */
  refresh() {
    this.notify();
  }
}
