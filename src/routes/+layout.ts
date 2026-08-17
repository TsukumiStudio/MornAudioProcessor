export const ssr = false;
// index.html を生成させる。これが無いと build/ には 404.html しか出ず、
// GitHub Pages がルート URL に対して HTTP 404 ステータスを返してしまう。
export const prerender = true;
