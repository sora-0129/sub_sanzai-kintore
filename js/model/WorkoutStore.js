import { Observable } from "../util/Observable.js";
import { emptyDay, requiredReps } from "./workout.js";

const createId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/**
 * アプリの状態を持つ唯一の場所。
 * 変更はすべてここのメソッドを通し、変更のたびに保存して購読者へ通知する。
 * 返す値は読み取り専用として扱うこと。
 */
export class WorkoutStore extends Observable {
  #state;
  #repository;
  #newId;

  constructor(repository, newId = createId) {
    super();
    this.#repository = repository;
    this.#newId = newId;
    this.#state = repository.load();
  }

  // ---- 読み取り ----
  get settings() {
    return this.#state.settings;
  }

  get days() {
    return this.#state.days;
  }

  day(dateKey) {
    return this.#state.days[dateKey] ?? emptyDay();
  }

  // ---- 出費 ----
  addSpend(dateKey, amount, memo, timestamp) {
    this.#editableDay(dateKey).spends.push({ id: this.#newId(), amt: amount, memo, t: timestamp });
    this.#commit();
  }

  removeSpend(dateKey, spendId) {
    const day = this.#editableDay(dateKey);
    day.spends = day.spends.filter((s) => s.id !== spendId);
    this.#commit();
  }

  // ---- 筋トレ記録 ----
  addReps(dateKey, exerciseId, delta) {
    const day = this.#editableDay(dateKey);
    day.done[exerciseId] = Math.max(0, (day.done[exerciseId] || 0) + delta);
    this.#commit();
  }

  completeExercise(dateKey, exerciseId) {
    const day = this.#editableDay(dateKey);
    const required = requiredReps(this.settings, day)[exerciseId] || 0;
    day.done[exerciseId] = Math.max(day.done[exerciseId] || 0, required);
    this.#commit();
  }

  clearRecords() {
    this.#state.days = {};
    this.#commit();
  }

  // ---- 設定 ----
  setAllowance(yen) {
    this.#state.settings.allowance = yen;
    this.#commit();
  }

  addExercise(fields) {
    this.#state.settings.exercises.push({ id: this.#newId(), ...fields });
    this.#commit();
  }

  updateExercise(exerciseId, patch) {
    const ex = this.#state.settings.exercises.find((e) => e.id === exerciseId);
    if (!ex) return;
    Object.assign(ex, patch);
    this.#commit();
  }

  removeExercise(exerciseId) {
    const s = this.#state.settings;
    s.exercises = s.exercises.filter((e) => e.id !== exerciseId);
    this.#commit();
  }

  // ---- 内部 ----
  #editableDay(dateKey) {
    return (this.#state.days[dateKey] ??= emptyDay());
  }

  #commit() {
    this.#repository.save(this.#state);
    this.notify();
  }
}
