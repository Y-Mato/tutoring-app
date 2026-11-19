// "17:30" → 1050（0時から何分たったか）
export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
