# 散財筋トレ

使ったお金の分だけ筋トレするスマホ用 Web アプリ（PWA）。
ビルド不要。ブラウザ標準の ES Modules だけで動く。データは端末の localStorage にのみ保存する。

## 設計（MVVM）

```
View ──操作──▶ ViewModel ──変更──▶ Model(WorkoutStore) ──保存──▶ Repository(localStorage)
  ▲                 │                     │
  └────描画──── state(表示用の値) ◀───通知──┘
```

| 層 | 場所 | 役割 | 持たないもの |
|---|---|---|---|
| Model | `js/model/` | 状態・ルール・保存 | DOM、表示用の文字列 |
| ViewModel | `js/viewmodel/` | Model を画面用の `state` に変換し、入力文字列を検証して Model を更新する | DOM |
| View | `js/view/` | `state` を HTML に描き、操作を ViewModel に渡す | 計算・検証・保存 |

- `js/model/workout.js` … 出費 → 回数の計算ルール（純粋関数）
- `js/model/WorkoutStore.js` … 状態を持つ唯一の場所。変更するたびに保存して通知する
- `js/model/LocalStorageRepository.js` … 読み書きだけを担当（テストではメモリ上のものに差し替える）
- `js/main.js` … 各部品を組み立てて、変更通知で描き直すようにつなぐ
- 日時は `clock` として外から渡すので、テストでは日付を固定できる

## テスト

ローカルでサーバーを立てて `tests/` を開く。

```
python -m http.server 8765
# → http://127.0.0.1:8765/tests/
```

テストはメモリ上の保存先を使うので、実際の記録には触れない。

## 公開

`main` ブランチを GitHub Pages で公開している。
ファイルを追加したら、オフラインでも動くよう `sw.js` の `ASSETS` に加え、`CACHE` の番号を上げる。
