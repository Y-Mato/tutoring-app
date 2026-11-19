"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { approveRequest, rejectRequest } from "@/lib/approveRequest";
import { REQUEST_TYPE_LABELS } from "@/lib/requests";
import type { LessonRequest, LessonRequestData, Student, StudentData } from "@/lib/types";

export function PendingRequests() {
  const [requests, setRequests] = useState<LessonRequest[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);   // 却下の理由を入力中の申請
  const [reason, setReason] = useState("");

  useEffect(() => {
    const unsubRequests = onSnapshot(
      query(collection(db, "requests"), where("status", "==", "pending")),
      (snap) => setRequests(snap.docs.map((d) => ({ id: d.id, ...(d.data() as LessonRequestData) }))),
    );
    const unsubStudents = onSnapshot(collection(db, "students"), (snap) => {
      setStudents(snap.docs.map((d) => ({ id: d.id, ...(d.data() as StudentData) })));
    });
    return () => {
      unsubRequests();
      unsubStudents();
    };
  }, []);

  // 日付・時刻の順に並べる
  const sorted = [...requests].sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));

  async function handleApprove(req: LessonRequest) {
    setError(null);
    setBusyId(req.id);
    try {
      await approveRequest(req);
    } catch (err) {
      console.error("承認できませんでした", err);
      setError(err instanceof Error ? err.message : "承認できませんでした");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(req: LessonRequest) {
    setError(null);
    setBusyId(req.id);
    try {
      await rejectRequest(req.id, reason);
      setRejectingId(null);
      setReason("");
    } catch (err) {
      console.error("却下できませんでした", err);
      setError("却下できませんでした");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="rounded border p-4">
      <h2 className="font-bold">承認待ちの申請</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-500">承認待ちの申請はありません</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {sorted.map((req) => {
            const student = students.find((s) => s.id === req.studentId);
            const busy = busyId === req.id;
            return (
              <li key={req.id} className="flex flex-wrap items-center gap-2 rounded border p-3 text-sm">
                <span>{req.date.slice(5).replace("-", "/")} {req.start}〜{req.end}</span>
                <span>{student?.name ?? "生徒"}</span>
                <span className="text-gray-500">{REQUEST_TYPE_LABELS[req.type]}</span>
                {rejectingId === req.id ? (
                  <div className="flex w-full flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="却下の理由（空でもかまいません）"
                      className="flex-1 rounded border px-2 py-1"
                    />
                    <button onClick={() => handleReject(req)} disabled={busy}
                      className="rounded bg-red-600 px-2 py-1 text-white disabled:opacity-50">
                      却下する
                    </button>
                    <button onClick={() => { setRejectingId(null); setReason(""); }}
                      className="rounded border px-2 py-1">
                      やめる
                    </button>
                  </div>
                ) : (
                  <div className="ml-auto flex gap-2">
                    <button onClick={() => handleApprove(req)} disabled={busy}
                      className="rounded bg-blue-600 px-2 py-1 text-white disabled:opacity-50">
                      承認
                    </button>
                    <button onClick={() => { setRejectingId(req.id); setReason(""); }} disabled={busy}
                      className="rounded border px-2 py-1 disabled:opacity-50">
                      却下
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
