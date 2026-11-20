// Service Worker：アプリを閉じていても、通知を受け取って表示する
// （画面とは別に、ブラウザの裏で動く小さなプログラム）
//
// Cloud Functions からは「data」だけのメッセージを送る（title・body・link）。
// iPhone では、届いたら必ず通知を表示する必要があるので、ここで毎回表示する。

// 今の版（入れ替わったかを、開発者ツールのコンソールで確かめるため）
const SW_VERSION = "2026-11-20-3";
console.log("sw.js", SW_VERSION);

// Safari（Mac・iPhone）か（Chrome の名前には "Safari" も入っているので、Chrome と Android を除く）
const IS_SAFARI = /^((?!chrome|android|crios|fxios).)*safari/i.test(self.navigator.userAgent);

// 新しい sw.js が届いたら、古い方が終わるのを待たずにすぐ入れ替える
self.addEventListener("install", () => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};
  const data = payload.data || {};
  const title = data.title || "家庭教師アプリ";
  const link = data.link || "/";

  event.waitUntil(
    (async () => {
      // その画面（例：そのチャット）が、画面に見えているか
      // （focused＝「いちばん前で操作中」だと、別のアプリを触っている間は false になるので、visibilityState で見る）
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const viewing = windows.some(
        (client) => client.visibilityState === "visible" && new URL(client.url).pathname === link,
      );

      if (viewing) {
        // 見ている画面の通知は出さない
        if (!IS_SAFARI) return;   // Chrome などは、画面が見えていれば通知を出さなくてよい

        // Safari（iPhone）は「届いたら必ず通知を表示する」決まりがあり、表示しないと通知の許可を外されることがある。
        // そこで、音なしで表示して、すぐに消す
        await self.registration.showNotification(title, { body: data.body || "", silent: true, tag: "viewing" });
        const shown = await self.registration.getNotifications({ tag: "viewing" });
        shown.forEach((notification) => notification.close());
        return;
      }

      await self.registration.showNotification(title, {
        body: data.body || "",
        icon: "/icon-192.png",
        data: { link },
      });
    })(),
  );
});

// 通知を押したら、その画面を開く（もう開いていれば、そのタブを前に出す）
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      return self.clients.openWindow(link);
    }),
  );
});
