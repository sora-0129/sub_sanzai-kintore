import { escapeHtml, formatNumber, formatYen } from "../util/format.js";

/** 「履歴」画面 */
export class HistoryView {
  #vm;
  #root;

  constructor(root, vm) {
    this.#root = root;
    this.#vm = vm;
  }

  render() {
    const s = this.#vm.state;
    this.#root.innerHTML = `
      <div class="stats">
        ${statHtml("連続達成", `${s.streak}<span>日</span>`)}
        ${statHtml("今月の出費", formatYen(s.monthSpent))}
        ${statHtml("今月の回数", `${formatNumber(s.monthReps)}<span>回</span>`)}
      </div>
      <h2 class="sec">これまで</h2>
      ${s.entries.length
        ? `<ul class="list">${s.entries.map(entryHtml).join("")}</ul>`
        : `<p class="empty">まだ記録はありません</p>`}`;
  }
}

const statHtml = (label, valueHtml) =>
  `<div class="card"><p class="label">${label}</p><p class="big">${valueHtml}</p></div>`;

const BADGES = {
  free: () => `<span class="badge free">筋トレなし</span>`,
  achieved: () => `<span class="badge ok">達成</span>`,
  pending: (e) => `<span class="badge ng">${formatNumber(e.remaining)}回残し</span>`,
};

const entryHtml = (e) => `
  <li>
    <div class="grow">
      <p>${escapeHtml(e.label)}</p>
      <small>${formatYen(e.spent)} ・ ${formatNumber(e.done)} / ${formatNumber(e.required)} 回</small>
    </div>
    ${BADGES[e.status](e)}
  </li>`;
