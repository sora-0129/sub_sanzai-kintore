// 組み立てだけを行う入口（Composition Root）
import { LocalStorageRepository } from "./model/LocalStorageRepository.js";
import { WorkoutStore } from "./model/WorkoutStore.js";
import { AppViewModel } from "./viewmodel/AppViewModel.js";
import { ShellView } from "./view/ShellView.js";
import { TodayView } from "./view/TodayView.js";
import { HistoryView } from "./view/HistoryView.js";
import { SettingsView } from "./view/SettingsView.js";

const store = new WorkoutStore(new LocalStorageRepository());
const app = new AppViewModel(store);

const screen = (name) => document.querySelector(`[data-screen="${name}"]`);
const shell = new ShellView(document, app);
const views = {
  today: new TodayView(screen("today"), app.today),
  history: new HistoryView(screen("history"), app.history),
  settings: new SettingsView(screen("settings"), app.settings),
};

function render() {
  shell.render();
  views[app.tab].render();
}

// データ・タブ・入力欄のどれが変わっても描き直す
for (const source of [store, app, app.today]) source.subscribe(render);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) app.refresh();
});
render();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
