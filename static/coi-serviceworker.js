// 以前ここには coi-serviceworker (COOP/COEP を付与して crossOriginIsolated を
// 有効にする Service Worker) を置いていた。
//
// 同梱している @ffmpeg/core はシングルスレッド版で SharedArrayBuffer を使わないため、
// cross-origin isolation は不要だった。さらに coi-serviceworker は初回訪問時に
// window.location.reload() でページを強制リロードするため、初回表示を無駄に遅くしていた。
//
// ただしファイルを消すだけでは、既に Service Worker を登録済みの訪問者のブラウザには
// 旧 SW が残り続け、全リクエストを永久にプロキシしてしまう。そのため 1 リリースの間だけ
// 「自分自身を登録解除するスタブ」を同じパスに置いておく。次のリリースで
// src/app.html の読み込みごとこのファイルを削除する。
// 注意: 旧 SW に制御されているページで登録解除すると、進行中の
// ffmpeg コア取得が中断されて「読み込みに失敗しました」になる。
// そのため制御されている場合は登録解除後に一度だけ再読み込みし、
// SW の無い状態でやり直させる（無限ループしないよう sessionStorage で見張る）。
(() => {
  if (!("serviceWorker" in navigator)) return;

  const RELOAD_FLAG = "coi-sw-removed-reload";

  navigator.serviceWorker
    .getRegistrations()
    .then(async (registrations) => {
      if (registrations.length === 0) return;
      await Promise.all(registrations.map((r) => r.unregister().catch(() => {})));

      const controlled = navigator.serviceWorker.controller !== null;
      if (controlled && !sessionStorage.getItem(RELOAD_FLAG)) {
        sessionStorage.setItem(RELOAD_FLAG, "1");
        location.reload();
      }
    })
    .catch(() => {});
})();
