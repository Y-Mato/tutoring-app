import type { Lesson, StudentData } from "@/lib/types";

// Date → "2026-11-16"
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0"); // 月は 0 始まりなので +1
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// コマのドキュメントID："studentId_2026-11-16_1700"
export function lessonId(studentId: string, date: string, start: string): string {
  return `${studentId}_${date}_${start.replace(":", "")}`;
}

// from から until までの、レギュラーコマを全部作る（Firestore には書かない）
export function generateRegularLessons(
  studentId: string,
  student: StudentData,
  from: Date,
  until: Date,
): Lesson[] {
  const lessons: Lesson[] = [];

  // from の日付から1日ずつ進める（from 自体を変えないようにコピーする）
  const day = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  while (day <= until) {
    const date = formatDate(day);

    for (const slot of student.regularSlots) {
      if (slot.dayOfWeek === day.getDay()) {
        lessons.push({
          id: lessonId(studentId, date, slot.start),
          studentId,
          parentUid: student.parentUid,
          date,
          start: slot.start,
          end: slot.end,
          type: "regular",
          status: "scheduled",
          cancelledBy: null,
          makeupForId: null,
          fee: student.rates.regularFee,
        });
      }

    }

    day.setDate(day.getDate() + 1); // 次の日へ
  }

  return lessons;
}
