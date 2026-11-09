import { parseYen } from "../util/format.js";
import { NEW_EXERCISE } from "../model/defaults.js";

/** 「設定」画面：入力文字列の解釈と検証はここで行い、View には持たせない */
export class SettingsViewModel {
  #store;

  constructor(store) {
    this.#store = store;
  }

  get state() {
    const s = this.#store.settings;
    return {
      allowance: s.allowance || 0,
      exercises: s.exercises.map(({ id, name, yen, cap }) => ({ id, name, yen, cap })),
    };
  }

  setAllowance(text) {
    this.#store.setAllowance(parseYen(text));
  }

  renameExercise(exerciseId, text) {
    this.#store.updateExercise(exerciseId, { name: text.trim() || "種目" });
  }

  setYenPerRep(exerciseId, text) {
    this.#store.updateExercise(exerciseId, { yen: Math.max(1, parseYen(text)) });
  }

  setCap(exerciseId, text) {
    this.#store.updateExercise(exerciseId, { cap: parseYen(text) });
  }

  addExercise() {
    this.#store.addExercise({ ...NEW_EXERCISE });
  }

  removeExercise(exerciseId) {
    this.#store.removeExercise(exerciseId);
  }

  clearRecords() {
    this.#store.clearRecords();
  }
}
