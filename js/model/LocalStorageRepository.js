import { createDefaultState } from "./defaults.js";

/** 旧版（単一ファイル版）と同じキー。既存のデータをそのまま読む */
export const STORAGE_KEY = "sanzai-kintore-v1";

/** 状態の読み書きだけを担当。保存先を差し替えられるよう storage を受け取る */
export class LocalStorageRepository {
  #storage;
  #key;

  constructor(storage = defaultStorage(), key = STORAGE_KEY) {
    this.#storage = storage;
    this.#key = key;
  }

  load() {
    try {
      const state = JSON.parse(this.#storage.getItem(this.#key));
      if (isValidState(state)) return state;
    } catch {
      // 読めない・壊れている場合は初期状態で始める
    }
    return createDefaultState();
  }

  save(state) {
    try {
      this.#storage.setItem(this.#key, JSON.stringify(state));
    } catch {
      // プライベートモードなどで保存できなくても、画面は動かし続ける
    }
  }
}

function defaultStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

const isValidState = (s) =>
  !!s && typeof s.days === "object" && !!s.settings && Array.isArray(s.settings.exercises);
