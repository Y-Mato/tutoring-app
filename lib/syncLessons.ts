import { collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatDate, generateRegularLessons } from "@/lib/lessons";
import type { LessonData, StudentData } from "@/lib/types";

const MONTHS_AHEAD = 3;

// 生徒のレギュラーコマを、今日から3か月先まで Firestore にそろえる
export async function syncRegularLessons(studentId: string, student: StudentData) {
  const today = new Date();
  const until = new Date(today.getFullYear(), today.getMonth() + MONTHS_AHEAD, today.getDate());
  const todayStr = formatDate(today);

  // 1. あるべきコマ
  const desired = generateRegularLessons(studentId, student, today, until);
  const desiredIds = new Set(desired.map((l) => l.id));

  // 2. 今あるコマ（この生徒の分すべて）
  const snap = await getDocs(query(collection(db, "lessons"), where("studentId", "==", studentId)));
  const existing = new Map(snap.docs.map((d) => [d.id, d.data() as LessonData]));

  const batch = writeBatch(db);
  let count = 0;

  // 3. まだないコマを作る
  for (const { id, ...data } of desired) {
    if (!existing.has(id)) {
      batch.set(doc(db, "lessons", id), data);
      count++;
    }
  }

  for (const [id, lesson] of existing) {
    // 4. 今日以降の「予定」のレギュラーコマで、もう合わないものを消す
    if (
      lesson.type === "regular" &&
      lesson.status === "scheduled" &&
      lesson.date >= todayStr &&
      !desiredIds.has(id)
    ) {
      batch.delete(doc(db, "lessons", id));
      count++;
      continue;
    }
    // 5. 保護者が変わっていたら、コマの parentUid も直す（過去のコマも含む）
    if (lesson.parentUid !== student.parentUid) {
      batch.update(doc(db, "lessons", id), { parentUid: student.parentUid });
      count++;
    }
  }

  // 書き込むものがあるときだけ送る
  if (count > 0) {
    await batch.commit();
  }
}
