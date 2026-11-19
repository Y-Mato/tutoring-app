"use client";

import { useState } from "react";
import { addAvailability } from "@/lib/availabilities";
import { toMinutes } from "@/lib/time";

export function AvailabilityForm({ date }: { date: string }) {
  const [start, setStart] = useState("13:00");
  const [end, setEnd] = useState("18:00");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (toMinutes(end) - toMinutes(start) < 60) {
      setError("1時間以上にしてください");
      return;
    }

    setSubmitting(true);
    try {
      await addAvailability({ date, start, end });
    } catch (err) {
      console.error("枠を追加できませんでした", err);
      setError("枠を追加できませんでした");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <input type="time" step={1800} value={start} onChange={(e) => setStart(e.target.value)}
        className="rounded border px-2 py-1" />
      <span>〜</span>
      <input type="time" step={1800} value={end} onChange={(e) => setEnd(e.target.value)}
        className="rounded border px-2 py-1" />
      <button type="submit" disabled={submitting}
        className="rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-50">
        {submitting ? "追加中…" : "枠を追加"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
