// "17:30" → 1050（0時から何分たったか）
export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// 1050 → "17:30"
export function fromMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);   // 時
  const m = minutes % 60;   // 分
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// start から end まで、step 分刻みの時刻の一覧（例："13:00", "13:30", ...）
export function timeOptions(start: string, end: string, step = 30): string[] {
  const list: string[] = [];
  for (let t = toMinutes(start); t <= toMinutes(end); t += step) {
    list.push(fromMinutes(t));
  }
  return list;
}

