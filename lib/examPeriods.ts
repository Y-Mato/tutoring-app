import { formatDate } from "@/lib/lessons";

// "2026-12-01" に days 日足した日付（マイナスなら引く）
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00`);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

// テスト初日（D）から、提出物期間と勉強期間を計算する（保存はしない）
export function examPeriods(startDate: string) {
  return {
    submitStart: addDays(startDate, -14),
    submitEnd: addDays(startDate, -8),
    studyStart: addDays(startDate, -7),
    studyEnd: addDays(startDate, -1),
  };
}
