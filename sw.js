// COACT サービスワーカー：ホーム画面アプリとして起動できるようにするためのもの。
// 会員データは常に最新を表示したいのでキャッシュはせず、通信できないときだけ案内を出す。
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {
  if (e.request.mode !== "navigate") return;
  e.respondWith(fetch(e.request).catch(() => new Response(
    '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>COACT</title></head>' +
    '<body style="margin:0;font-family:sans-serif;background:#f5f6f8;color:#13294b;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:24px">' +
    '<div><div style="font-weight:800;font-size:22px;letter-spacing:.08em">CO<span style="color:#0e7c6b">ACT</span></div>' +
    '<p style="font-size:14px">インターネットに接続できません。<br>電波の良い場所で、もう一度開いてください。</p></div></body></html>',
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  )));
});
