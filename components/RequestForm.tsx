"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createRequest } from "@/lib/requests";
import { fromMinutes, timeOptions, toMinutes } from "@/lib/time";
import type { Availability, Lesson, LessonData, LessonRequestData, RequestType, Student } from "@/lib/types";

type Props = {
  slot: Availability;      // 選んだ出勤可能枠
  students: Student[];     // 自分の子
  parentUid: string;
  onDone: () => void;      // 申請したとき・やめたときに呼ぶ
};

export function RequestForm({ slot, students, parentUid, onDone }: Props) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [type, setType] = useState<RequestType>("extra");
  const [makeupForId, setMakeupForId] = useState("");
  const [start, setStart] = useState(slot.start);
  const [end, setEnd] = useState(fromMinutes(toMinutes(slot.start) + 60));
  const [candidates, setCandidates] = useState<Lesson[]>([]);   // 振替元の候補
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 振替元の候補を読む：休みのコマのうち、まだ振替が決まっていないもの
  useEffect(() => {
    const lessonsQuery = query(collection(db, "lessons"), where("parentUid", "==", parentUid));
    const requestsQuery = query(collection(db, "requests"), where("parentUid", "==", parentUid));

    Promise.all([getDocs(lessonsQuery), getDocs(requestsQuery)]).then(([lessonSnap, requestSnap]) => {
      const lessons = lessonSnap.docs.map((d) => ({ id: d.id, ...(d.data() as LessonData) }));

      // すでに振替に使われている（または申請中の）コマのID
      const used = new Set<string>();
      lessons.forEach((l) => {
        if (l.makeupForId) used.add(l.makeupForId);
      });
      requestSnap.docs.forEach((d) => {
        const r = d.data() as LessonRequestData;
        if (r.makeupForId && r.status !== "rejected") used.add(r.makeupForId);
      });

      setCandidates(
        lessons
          .filter((l) => l.status === "cancelled" && !used.has(l.id))
          .sort((a, b) => a.date.localeCompare(b.date)),
      );
    });
  }, [parentUid]);

  // 選んでいる生徒の候補だけ
  const studentCandidates = candidates.filter((l) => l.studentId === studentId);

  // 開始は「枠の終わりの1時間前」まで、終了は「開始の1時間後」から
  const startOptions = timeOptions(slot.start, fromMinutes(toMinutes(slot.end) - 60));
  const endOptions = timeOptions(fromMinutes(toMinutes(start) + 60), slot.end);

  function handleStartChange(value: string) {
    setStart(value);
    // 終了が「開始の1時間後」より前になったら、終了をずらす
    if (toMinutes(end) - toMinutes(value) < 60) {
      setEnd(fromMinutes(toMinutes(value) + 60));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!studentId) {
      setError("生徒を選んでください");
      return;
    }
    if (type === "makeup" && makeupForId === "") {
      setError("振替元のコマを選んでください");
      return;
    }

    setSubmitting(true);
    try {
      await createRequest({
        studentId,
        parentUid,
        availabilityId: slot.id,
        type,
        date: slot.date,
        start,
        end,
        makeupForId: type === "makeup" ? makeupForId : null,
      });
      onDone();
    } catch (err) {
      console.error("申請できませんでした", err);
      setError("申請できませんでした");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2 rounded bg-gray-50 p-3 text-sm dark:bg-gray-900">
      <label className="flex items-center gap-2">
        <span className="w-16">生徒</span>
        <select value={studentId} onChange={(e) => { setStudentId(e.target.value); setMakeupForId(""); }}
          className="rounded border px-2 py-1">
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-2">
        <span className="w-16">種類</span>
        <label className="flex items-center gap-1">
          <input type="radio" checked={type === "extra"} onChange={() => setType("extra")} />
          追加コマ
        </label>
        <label className="flex items-center gap-1">
          <input type="radio" checked={type === "makeup"} onChange={() => setType("makeup")} />
          振替
        </label>
      </div>

      {type === "makeup" && (
        <label className="flex items-center gap-2">
          <span className="w-16">振替元</span>
          {studentCandidates.length === 0 ? (
            <span className="text-gray-500">振替できる休みのコマがありません</span>
          ) : (
            <select value={makeupForId} onChange={(e) => setMakeupForId(e.target.value)}
              className="rounded border px-2 py-1">
              <option value="">選んでください</option>
              {studentCandidates.map((l) => (
                <option key={l.id} value={l.id}>{l.date} {l.start}〜{l.end}</option>
              ))}
            </select>
          )}
        </label>
      )}

      <div className="flex items-center gap-2">
        <span className="w-16">時間</span>
        <select value={start} onChange={(e) => handleStartChange(e.target.value)} className="rounded border px-2 py-1">
          {startOptions.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <span>〜</span>
        <select value={end} onChange={(e) => setEnd(e.target.value)} className="rounded border px-2 py-1">
          {endOptions.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={submitting}
          className="rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-50">
          {submitting ? "申請中…" : "申請する"}
        </button>
        <button type="button" onClick={onDone} className="rounded border px-3 py-1">
          やめる
        </button>
      </div>
    </form>
  );
}
