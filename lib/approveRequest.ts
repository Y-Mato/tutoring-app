import { collection, doc, getDoc, getDocs, query, runTransaction, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { lessonId } from "@/lib/lessons";
import { toMinutes } from "@/lib/time";
import type { LessonData, LessonRequest, StudentData } from "@/lib/types";

// 2つの時間帯が重なっているか（"17:00" のような文字列はそのまま比べられる）
function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export async function approveRequest(req: LessonRequest) {
  // 1. 生徒を読む
  const studentSnap = await getDoc(doc(db, "students", req.studentId));
  if (!studentSnap.exists()) throw new Error("生徒が見つかりません");
  const student = studentSnap.data() as StudentData;

  // 2. 重なりの確認（トランザクションの中ではクエリが使えないので、先に確かめる）
  const sameDay = await getDocs(query(collection(db, "lessons"), where("date", "==", req.date)));
  const hasOverlap = sameDay.docs
    .map((d) => d.data() as LessonData)
    .some((l) => l.status !== "cancelled" && overlaps(req.start, req.end, l.start, l.end));
  if (hasOverlap) throw new Error("同じ時間にほかのコマがあります");

  if (req.makeupForId) {
    const made = await getDocs(query(collection(db, "lessons"), where("makeupForId", "==", req.makeupForId)));
    if (!made.empty) throw new Error("このコマの振替はもう作られています");
  }

  // 3. 料金
  const minutes = toMinutes(req.end) - toMinutes(req.start);
  const fee = req.type === "extra"
    ? Math.round(student.rates.hourlyRate * minutes / 60)
    : student.rates.regularFee;

  // 4. トランザクション：申請の確認・コマの作成・申請の更新をまとめて行う
  const requestRef = doc(db, "requests", req.id);
  const lessonRef = doc(db, "lessons", lessonId(req.studentId, req.date, req.start));

  await runTransaction(db, async (tx) => {
    const requestSnap = await tx.get(requestRef);
    if (!requestSnap.exists() || requestSnap.data().status !== "pending") {
      throw new Error("この申請はすでに処理されています");
    }
    const lessonSnap = await tx.get(lessonRef);
    if (lessonSnap.exists()) throw new Error("同じ時間のコマがすでにあります");

    const lesson: LessonData = {
      studentId: req.studentId,
      parentUid: student.parentUid,
      date: req.date,
      start: req.start,
      end: req.end,
      type: req.type,
      status: "scheduled",
      cancelledBy: null,
      makeupForId: req.makeupForId,
      fee,
    };
    tx.set(lessonRef, lesson);
    tx.update(requestRef, { status: "approved", lessonId: lessonRef.id });
  });
}

export async function rejectRequest(requestId: string, reason: string) {
  await updateDoc(doc(db, "requests", requestId), {
    status: "rejected",
    reason: reason.trim() === "" ? null : reason.trim(),
  });
}
