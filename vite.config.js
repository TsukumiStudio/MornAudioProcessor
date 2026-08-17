import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync("package.json", "utf-8"));

// 同梱の @ffmpeg/core はシングルスレッド版で SharedArrayBuffer を使わないため、
// COOP/COEP による cross-origin isolation は不要。本番 (GitHub Pages) でも
// coi-serviceworker を廃止したので、dev/preview でも付けない。
export default defineConfig({
  plugins: [sveltekit()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
  },
});
