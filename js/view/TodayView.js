import { escapeHtml, formatNumber, formatYen } from "../util/format.js";

const percent = (ratio) => `${Math.round(ratio * 100)}%`;

/** 「今日」画面。表示は ViewModel の state をそのまま描くだけ、操作は ViewModel に渡すだけ */
export class TodayView {
  #vm;
  #hero;
  #exerciseList;
  #spendList;
  #amountInput;
  #memoInput;

  constructor(root, vm) {
    this.#vm = vm;
    this.#hero = root.querySelector("#hero");
    this.#exerciseList = root.querySelector("#exList");
    this.#spendList = root.querySelector("#spendList");
    this.#amountInput = root.querySelector("#amt");
    this.#memoInput = root.querySelector("#memo");
    const form = root.querySelector("#addForm");

    this.#amountInput.addEventListener("input", () => vm.setDraftAmount(this.#amountInput.value));
    this.#memoInput.addEventListener("input", () => vm.setDraftMemo(this.#memoInput.value));

    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      if (vm.submitDraft()) {
        this.#amountInput.blur();
        this.#memoInput.blur();
      } else {
        this.#rejectAmount();
      }
    });

    root.addEventListener("click", (ev) => {
      const el = ev.target.closest("[data-action]");
      if (!el) return;
      const { action, id } = el.dataset;
      if (action === "bump") vm.bumpDraftAmount(Number(el.dataset.amount));
      else if (action === "reps") vm.logReps(id, Number(el.dataset.delta));
      else if (action === "complete") vm.completeExercise(id);
      else if (action === "remove-spend") vm.removeSpend(id);
    });
  }

  render() {
    const s = this.#vm.state;
    this.#syncInputs(this.#vm.draft);
    this.#hero.innerHTML = heroHtml(s);
    this.#exerciseList.innerHTML = s.exercises.length
      ? s.exercises.map(exerciseHtml).join("")
      : `<p class="empty">設定から種目を追加してください</p>`;
    this.#spendList.innerHTML = s.spends.length
      ? `<ul class="list">${s.spends.map(spendHtml).join("")}</ul>`
      : `<p class="empty">まだ記録はありません</p>`;
  }

  #syncInputs(draft) {
    if (this.#amountInput.value !== draft.amount) this.#amountInput.value = draft.amount;
    if (this.#memoInput.value !== draft.memo) this.#memoInput.value = draft.memo;
  }

  #rejectAmount() {
    const box = this.#amountInput.parentElement;
    box.classList.remove("shake");
    void box.offsetWidth; // アニメーションを最初から再生させる
    box.classList.add("shake");
    this.#amountInput.focus();
  }
}

const heroHtml = (s) => `
  <div class="card">
    <div class="hero-row">
      <div>
        <p class="label">今日の出費</p>
        <p class="big">${formatYen(s.spent)}</p>
        ${s.allowance ? `<p class="note">無料枠 ${formatYen(s.allowance)}</p>` : ""}
      </div>
      <div class="right">
        <p class="label">残り</p>
        <p class="big ${s.remaining ? "accent" : "okc"}">${formatNumber(s.remaining)}<span>回</span></p>
      </div>
    </div>
    <div class="bar ${s.cleared ? "ok" : ""}"><i style="width:${percent(s.progress)}"></i></div>
    <p class="status">${escapeHtml(s.message)}</p>
  </div>`;

const exerciseHtml = (ex) => {
  const id = escapeHtml(ex.id);
  const repsButton = (delta, label) =>
    `<button data-action="reps" data-id="${id}" data-delta="${delta}">${label}</button>`;
  return `
  <div class="card ex ${ex.idle ? "zero" : ex.cleared ? "clear" : ""}">
    <div class="ex-head">
      <h3>${escapeHtml(ex.name)}</h3>
      <p><b>${formatNumber(ex.done)}</b> / ${formatNumber(ex.required)} 回</p>
    </div>
    <div class="bar small ${ex.cleared ? "ok" : ""}"><i style="width:${percent(ex.progress)}"></i></div>
    <div class="ex-btns">
      ${repsButton(-1, "−1")}${repsButton(1, "+1")}${repsButton(5, "+5")}${repsButton(10, "+10")}
      <button data-action="complete" data-id="${id}" class="fill">完了</button>
    </div>
    <p class="rate">${formatYen(ex.yenPerRep)} ごとに1回${ex.cap ? ` ・ 上限 ${formatNumber(ex.cap)} 回` : ""}</p>
  </div>`;
};

const spendHtml = (sp) => `
  <li>
    <div class="grow"><p>${escapeHtml(sp.label)}</p><small>${sp.time}</small></div>
    <b>${formatYen(sp.amount)}</b>
    <button class="del" data-action="remove-spend" data-id="${escapeHtml(sp.id)}" aria-label="削除">×</button>
  </li>`;
