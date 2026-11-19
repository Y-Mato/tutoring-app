import { formatDate } from "@/lib/lessons";
import type { Lesson, LessonStatus } from "@/lib/types";

// Date → "2026-11-19T17:30"（コマの終了日時と比べるための形）
export function toDateTimeString(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${formatDate(date)}T${h}:${m}`;
}

// 表示するときの状態：予定のままでも、終了時刻を過ぎていれば「実施済み」として扱う
// （Firestore の status は書き換えない）
export function displayStatus(lesson: Lesson, now: Date): LessonStatus {
  if (lesson.status !== "scheduled") return lesson.status;   // 休み・実施済みはそのまま
  return `${lesson.date}T${lesson.end}` <= toDateTimeString(now) ? "done" : "scheduled";
}

// Date → "2026-11"
export function toMonth(date: Date): string {
  return formatDate(date).slice(0, 7);
}

// 2000 → "2,000円"
export function yen(amount: number): string {
  return `${amount.toLocaleString("ja-JP")}円`;
}

export type MonthSummary = {
  confirmed: number;   // 確定：実施済みのコマの合計
  expected: number;    // 見込み：これからのコマの合計
  lessons: Lesson[];   // その月の、休み以外のコマ（日付・時刻の順）
};

// month（"2026-11"）の料金をまとめる。休みのコマは数えない
export function summarizeMonth(lessons: Lesson[], month: string, now: Date): MonthSummary {
  const inMonth = lessons
    .filter((l) => l.date.startsWith(month) && l.status !== "cancelled")
    .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));

  let confirmed = 0;
  let expected = 0;
  for (const l of inMonth) {
    if (displayStatus(l, now) === "done") {
      confirmed += l.fee;
    } else {
      expected += l.fee;

    }
  }

  return { confirmed, expected, lessons: inMonth };
}
