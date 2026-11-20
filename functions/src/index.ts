// Cloud Functions：Firestore にデータが書かれたら、関係する人に通知を送る
// （サーバーで動くので、Security Rules に関係なく全部のデータを読み書きできる）

import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { setGlobalOptions } from "firebase-functions/v2";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";

// Firestore と同じ東京リージョンで動かす。同時に動く数は少なくてよい
setGlobalOptions({ region: "asia-northeast1", maxInstances: 5 });

initializeApp();
const db = getFirestore();

type Notice = {
  title: string;
  body: string;
  link: string; // 通知を押したときに開く画面
};

// 使えなくなったトークン（アプリを消した端末など）のエラー
const INVALID_TOKEN_ERRORS = [
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
];

// 先生の UID の一覧
async function teacherUids(): Promise<string[]> {
  const snap = await db.collection("users").where("role", "==", "teacher").get();
  return snap.docs.map((d) => d.id);
}

// 生徒の名前
async function studentName(studentId: string): Promise<string> {
  const snap = await db.doc(`students/${studentId}`).get();
  return snap.get("name") ?? "生徒";
}

// "2026-11-20" → "11/20"
function shortDate(date: string): string {
  return `${Number(date.slice(5, 7))}/${Number(date.slice(8))}`;
}

// uids の人の、すべての端末に通知を送る
async function notify(uids: (string | null | undefined)[], notice: Notice) {
  for (const uid of uids) {
    if (!uid) continue;

    const ref = db.doc(`users/${uid}`);
    const tokens: string[] = (await ref.get()).get("fcmTokens") ?? [];
    if (tokens.length === 0) continue;

    // data だけを送り、表示は Service Worker（public/sw.js）に任せる
    const result = await getMessaging().sendEachForMulticast({
      tokens,
      data: notice,
      webpush: { headers: { Urgency: "high" } },
    });

    // 使えなくなったトークンは消しておく
    const invalid = tokens.filter((_, i) => {
      const code = result.responses[i].error?.code;
      return code !== undefined && INVALID_TOKEN_ERRORS.includes(code);
    });
    if (invalid.length > 0) {
      await ref.update({ fcmTokens: FieldValue.arrayRemove(...invalid) });
    }
  }
}

// 申請が来た → 先生に
export const onRequestCreated = onDocumentCreated("requests/{requestId}", async (event) => {
  const req = event.data?.data();
  if (!req) return;

  const name = await studentName(req.studentId);
  const kind = req.type === "makeup" ? "振替" : "追加コマ";
  await notify(await teacherUids(), {
    title: "新しい申請があります",
    body: `${name}：${shortDate(req.date)} ${req.start}〜${req.end} の${kind}`,
    link: "/",
  });
});

// 申請が承認・却下された → 申請した保護者に
export const onRequestUpdated = onDocumentUpdated("requests/{requestId}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;
  if (before.status !== "pending" || after.status === "pending") return; // 承認待ちから変わったときだけ

  const kind = after.type === "makeup" ? "振替" : "追加コマ";
  const when = `${shortDate(after.date)} ${after.start}〜${after.end} の${kind}`;

  if (after.status === "approved") {
    await notify([after.parentUid], {
      title: "申請が承認されました",
      body: when,
      link: `/calendar/${after.date}`,
    });
  } else if (after.status === "rejected") {
    await notify([after.parentUid], {
      title: "申請が却下されました",
      body: after.reason ? `${when}（理由：${after.reason}）` : when,
      link: "/",
    });
  }
});

// コマが休みになった → 休みにしなかった方に
export const onLessonUpdated = onDocumentUpdated("lessons/{lessonId}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;
  if (before.status !== "scheduled" || after.status !== "cancelled") return; // 予定 → 休み のときだけ

  const name = await studentName(after.studentId);
  const targets = after.cancelledBy === "teacher" ? [after.parentUid] : await teacherUids();
  const who = after.cancelledBy === "teacher" ? "先生" : "保護者";
  await notify(targets, {
    title: "授業が休みになりました",
    body: `${name}：${shortDate(after.date)} ${after.start}〜${after.end}（${who}が休みにしました）`,
    link: `/calendar/${after.date}`,
  });
});

// メッセージが届いた → 相手に
export const onMessageCreated = onDocumentCreated("chats/{studentId}/messages/{messageId}", async (event) => {
  const message = event.data?.data();
  if (!message) return;

  const { studentId } = event.params;
  const student = await db.doc(`students/${studentId}`).get();
  const name = student.get("name") ?? "生徒";
  const fromTeacher = message.senderRole === "teacher";

  await notify(fromTeacher ? [student.get("parentUid")] : await teacherUids(), {
    title: fromTeacher ? "先生からメッセージ" : `${name}の保護者からメッセージ`,
    body: String(message.text).slice(0, 100),
    link: `/messages/${studentId}`,
  });
});
