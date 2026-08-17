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
(() => {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    })
    .catch(() => {});
})();
