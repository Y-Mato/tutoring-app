// Service Worker：アプリを閉じていても、通知を受け取って表示する
// （画面とは別に、ブラウザの裏で動く小さなプログラム）
//
// Cloud Functions からは「data」だけのメッセージを送る（title・body・link）。
// iPhone では、届いたら必ず通知を表示する必要があるので、ここで毎回表示する。

self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};
  const data = payload.data || {};

  event.waitUntil(
    self.registration.showNotification(data.title || "家庭教師アプリ", {
      body: data.body || "",
      icon: "/icon-192.png",
      data: { link: data.link || "/" },
    }),
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
