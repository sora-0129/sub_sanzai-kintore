import { escapeHtml } from "../util/format.js";

/** 「設定」画面。入力値は文字列のまま ViewModel に渡す（解釈は ViewModel の役目） */
export class SettingsView {
  #vm;
  #root;

  constructor(root, vm) {
    this.#root = root;
    this.#vm = vm;

    root.addEventListener("change", (ev) => {
      const el = ev.target;
      const { field, id } = el.dataset;
      if (field === "allowance") vm.setAllowance(el.value);
      else if (field === "name") vm.renameExercise(id, el.value);
      else if (field === "yen") vm.setYenPerRep(id, el.value);
      else if (field === "cap") vm.setCap(id, el.value);
    });

    root.addEventListener("click", (ev) => {
      const el = ev.target.closest("[data-action]");
      if (!el) return;
      const { action, id } = el.dataset;
      if (action === "add-exercise") vm.addExercise();
      else if (action === "remove-exercise" && confirm("この種目を削除しますか？")) vm.removeExercise(id);
      else if (action === "clear-records" && confirm("すべての出費と筋トレの記録を削除します。よろしいですか？"))
        vm.clearRecords();
    });
  }

  render() {
    const s = this.#vm.state;
    this.#root.innerHTML = `
      <div class="card">
        <div class="field">
          <span>1日の無料枠</span>
          <label class="mini">¥<input data-field="allowance" inputmode="numeric" value="${s.allowance}"></label>
        </div>
        <p class="hint">この金額を超えた分だけ筋トレが発生します（0なら1円目から）</p>
      </div>

      <h2 class="sec">種目</h2>
      ${s.exercises.map(exerciseHtml).join("")}
      <p class="hint" style="margin:0 4px 12px">上限を 0 にすると上限なしになります</p>
      <button class="ghost" data-action="add-exercise">＋ 種目を追加</button>

      <h2 class="sec">データ</h2>
      <button class="danger" data-action="clear-records">すべての記録を削除</button>
      <p class="hint">データはこの端末の中だけに保存され、どこにも送信されません。</p>`;
  }
}

const exerciseHtml = (ex) => {
  const id = escapeHtml(ex.id);
  return `
  <div class="card ex-set">
    <input class="text" data-field="name" data-id="${id}" value="${escapeHtml(ex.name)}" maxlength="20" aria-label="種目名">
    <div class="row">
      <label class="mini">¥<input data-field="yen" data-id="${id}" inputmode="numeric" value="${ex.yen}">ごとに1回</label>
      <label class="mini">上限<input data-field="cap" data-id="${id}" inputmode="numeric" value="${ex.cap}">回</label>
      <button class="rm" data-action="remove-exercise" data-id="${id}">削除</button>
    </div>
  </div>`;
};
