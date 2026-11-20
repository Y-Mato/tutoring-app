import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { app, db } from "@/lib/firebase";

// この端末で通知を使えるか（iPhone はホーム画面に追加したときだけ使える）
export async function canUseNotifications(): Promise<boolean> {
  return "Notification" in window && "serviceWorker" in navigator && (await isSupported());
}

// 通知を許可してもらい、この端末のトークンを users/{uid} の fcmTokens に足す
export async function enableNotifications(uid: string) {
  // まだ許可されていないときだけ「許可しますか？」と聞く
  // （Safari では、ボタンを押したとき以外に聞くと、許可済みでも「許可されていない」と返ってくるため）
  if (Notification.permission !== "granted") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("通知が許可されませんでした");
    }
  }

  await navigator.serviceWorker.register("/sw.js");
  // 登録した直後の Service Worker はまだ準備中なので、動き出すまで待つ
  // （待たずにトークンをもらいに行くと、Safari では止まったまま進まないことがある）
  const registration = await navigator.serviceWorker.ready;
  const token = await getToken(getMessaging(app), {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  await updateDoc(doc(db, "users", uid), { fcmTokens: arrayUnion(token) });

}
