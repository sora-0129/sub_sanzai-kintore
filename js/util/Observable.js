/** 変更を購読者に知らせるだけの最小の仕組み */
export class Observable {
  #listeners = new Set();

  /** @param {() => void} listener @returns {() => void} 購読解除 */
  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  notify() {
    for (const listener of this.#listeners) listener();
  }
}
