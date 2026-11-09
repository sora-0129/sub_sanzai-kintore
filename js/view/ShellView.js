/** 共通部分：日付の見出し・タブバー・画面の切り替え */
export class ShellView {
  #vm;
  #dateEl;
  #screens;
  #tabButtons;

  constructor(root, vm) {
    this.#vm = vm;
    this.#dateEl = root.querySelector("#date");
    this.#screens = [...root.querySelectorAll("[data-screen]")];
    this.#tabButtons = [...root.querySelectorAll("[data-tab]")];

    root.querySelector(".tabs").addEventListener("click", (ev) => {
      const button = ev.target.closest("[data-tab]");
      if (!button) return;
      vm.selectTab(button.dataset.tab);
      window.scrollTo(0, 0);
    });
  }

  render() {
    const tab = this.#vm.tab;
    this.#dateEl.textContent = this.#vm.dateLabel;
    for (const el of this.#screens) el.hidden = el.dataset.screen !== tab;
    for (const b of this.#tabButtons) b.classList.toggle("on", b.dataset.tab === tab);
  }
}
