"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { RegularSlot, StudentData } from "@/lib/types";

type Props = {
    initialValues: StudentData;
    submitLabel: string;
    onSubmit: (values: StudentData) => Promise<void>;
};

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];


export function StudentForm({ initialValues, submitLabel, onSubmit }: Props) {
    const [name, setName] = useState(initialValues.name);
    const [color, setColor] = useState(initialValues.color);
    const [parentUid, setParentUid] = useState(initialValues.parentUid);
    const [rates, setRates] = useState(initialValues.rates);
    const [slots, setSlots] = useState<RegularSlot[]>(initialValues.regularSlots);
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

        if (slots.some((slot) => slot.end <= slot.start)) {
            setError("終了時刻は開始時刻より後にしてください");
            return;
        }

        setSubmitting(true);
        try {
            await onSubmit({
                name: name.trim(),
                color,
                parentUid,
                regularSlots: slots,
                rates,
            });
        } catch (err) {
            console.error("生徒の保存に失敗しました", err);
            setError("保存に失敗しました");
            
        }finally { 
            setSubmitting(false); 
        }
    }

    // コマを1つ足す（初期値：月曜 17:00〜18:20）
    function addSlot() {
        setSlots([...slots, { dayOfWeek: 1, start: "17:00", end: "18:20" }]);
    }

    // index 番目のコマの一部を書き換える
    function updateSlot(index: number, changes: Partial<RegularSlot>) {
        setSlots(slots.map((slot, i) => (i === index ? { ...slot, ...changes } : slot)));
    }

    // index 番目のコマを消す
    function removeSlot(index: number) {
        setSlots(slots.filter((_, i) => i !== index));
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
                <legend className="text-sm">レギュラーコマ</legend>

                {slots.map((slot, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <select
                            value={slot.dayOfWeek}
                            onChange={(e) => updateSlot(index, { dayOfWeek: Number(e.target.value) })}
                            className="rounded border px-2 py-1"
                        >
                            {DAY_LABELS.map((label, day) => (
                                <option key={day} value={day}>{label}</option>
                            ))}
                        </select>

                        <input
                            type="time"
                            value={slot.start}
                            onChange={(e) => updateSlot(index, { start: e.target.value })}
                            className="rounded border px-2 py-1"
                        />
                        <span>〜</span>

                        <input
                            type="time"
                            value={slot.end}
                            onChange={(e) => updateSlot(index, { end: e.target.value })}
                            className="rounded border px-2 py-1"
                        />
                        <button type="button" onClick={() => removeSlot(index)} className="text-sm text-red-600">
                            削除
                        </button>
                    </div>
                ))}

                <button type="button" onClick={addSlot} className="self-start rounded border px-3 py-1 text-sm">
                    コマを追加
                </button>
            </fieldset>


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
