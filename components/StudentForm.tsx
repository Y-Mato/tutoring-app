"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { StudentData } from "@/lib/types";

type Props = {
  initialValues: StudentData;
  submitLabel: string;
  onSubmit: (values: StudentData) => Promise<void>;
};

export function StudentForm({ initialValues, submitLabel, onSubmit }: Props) {
  const [name, setName] = useState(initialValues.name);
  const [color, setColor] = useState(initialValues.color);
  const [parentUid, setParentUid] = useState(initialValues.parentUid);
  const [rates, setRates] = useState(initialValues.rates);
  const [parents, setParents] = useState<{ uid: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 保護者の一覧を読む（選択肢に使う）
  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "parent"));
    getDocs(q).then((snap) => {
      setParents(snap.docs.map((d) => ({ uid: d.id, name: d.data().name })));
    });
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        color,
        parentUid,
        regularSlots: initialValues.regularSlots, // 2-3 で入力できるようにする
        rates,
      });
    } catch (err) {
      console.error("生徒の保存に失敗しました", err);
      setError("保存に失敗しました");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm">名前</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="rounded border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm">色</span>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-10 w-20 rounded border"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm">保護者</span>
        <select
          value={parentUid ?? ""}
          onChange={(e) => setParentUid(e.target.value || null)}
          className="rounded border px-3 py-2"
        >
          <option value="">（まだ登録していない）</option>
          {parents.map((p) => (
            <option key={p.uid} value={p.uid}>{p.name}</option>
          ))}

        </select>
      </label>

      <fieldset className="flex flex-col gap-2 rounded border p-3">
        <legend className="text-sm">単価</legend>
        <label className="flex items-center justify-between gap-2">
          <span className="text-sm">通常コマの料金（円）</span>
          <input
            type="number"
            min={0}
            value={rates.regularFee}
            onChange={(e) => setRates({ ...rates, regularFee: Number(e.target.value) })}
            className="w-28 rounded border px-2 py-1 text-right"
          />
        </label>

        <label className="flex items-center justify-between gap-2">
          <span className="text-sm">通常コマの長さ（分）</span>
          <input
            type="number"
            min={0}
            value={rates.regularMinutes}
            onChange={(e) => setRates({ ...rates, regularMinutes: Number(e.target.value) })}
            className="w-28 rounded border px-2 py-1 text-right"
          />
        </label>

        <label className="flex items-center justify-between gap-2">
          <span className="text-sm">追加コマの時給（円）</span>
          <input
            type="number"
            min={0}
            value={rates.hourlyRate}
            onChange={(e) => setRates({ ...rates, hourlyRate: Number(e.target.value) })}
            className="w-28 rounded border px-2 py-1 text-right"
          />
        </label>

        <label className="flex items-center justify-between gap-2">
          <span className="text-sm">追加コマの計算単位（分）</span>
          <input
            type="number"
            min={0}
            value={rates.unitMinutes}
            onChange={(e) => setRates({ ...rates, unitMinutes: Number(e.target.value) })}
            className="w-28 rounded border px-2 py-1 text-right"
          />
        </label>

      </fieldset>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-blue-600 py-2 text-white disabled:opacity-50"
      >
        {submitting ? "保存中…" : submitLabel}
      </button>
    </form>
  );
}
