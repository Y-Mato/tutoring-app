"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { canUseNotifications, enableNotifications } from "@/lib/notifications";

export function NotificationSetting() {
  const { user } = useAuth();
  const [supported, setSupported] = useState<boolean | null>(null);   // null は「確認中」
  const [permission, setPermission] = useState(() =>
    typeof Notification === "undefined" ? "default" : Notification.permission,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    canUseNotifications().then(setSupported);
  }, []);

  // すでに許可されている端末では、開くたびにトークンを保存し直す
  // （トークンはときどき変わる。前回の保存が途中で止まっていた場合も、これで直る）
  useEffect(() => {
    if (!user || !supported || Notification.permission !== "granted") return;
    enableNotifications(user.uid).catch((err) => console.error("トークンを保存し直せませんでした", err));
  }, [user, supported]);

  async function handleEnable() {
    if (!user) return;
    setError(null);
    setBusy(true);
    try {
      await enableNotifications(user.uid);
      setPermission("granted");
    } catch (err) {
      console.error("通知をオンにできませんでした", err);
      setError(err instanceof Error ? err.message : "通知をオンにできませんでした");
    } finally {
      setBusy(false);
    }
  }

  if (supported === null) return null;

  return (
    <section className="rounded border p-4">
      <h2 className="font-bold">通知</h2>
      {!supported ? (
        <p className="text-sm text-gray-500">
          この端末・ブラウザでは通知を使えません。iPhone では、Safari の共有ボタンから「ホーム画面に追加」して、そこから開いてください。
        </p>
      ) : permission === "granted" ? (
        <p className="text-sm text-gray-500">この端末では通知がオンになっています</p>
      ) : permission === "denied" ? (
        <p className="text-sm text-gray-500">通知がブロックされています。端末やブラウザの設定から許可してください。</p>
      ) : (
        <button onClick={handleEnable} disabled={busy}
          className="mt-2 rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-50">
          {busy ? "設定中…" : "通知をオンにする"}
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}
