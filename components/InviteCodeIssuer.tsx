"use client";

import { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// 紛らわしい 0 O 1 I L を除いた31文字
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

function generateCode(): string {
  // 推測されにくい乱数を8個作る
  const values = crypto.getRandomValues(new Uint32Array(CODE_LENGTH));
  // 各乱数を31で割った余り（0〜30）を使って、CODE_CHARS から1文字ずつ選び、つなげる
  return Array.from(values, (v) => CODE_CHARS[v % CODE_CHARS.length]).join("");
}

export function InviteCodeIssuer() {
  const [code, setCode] = useState<string | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {

    setError(null);
    setIssuing(true);

    const newCode = generateCode();
    try {
      await setDoc(doc(db, "invites", newCode), {
        used: false,
        usedBy: null,
        createdAt: serverTimestamp(),
      });
      setCode(newCode);

    } catch (err) {
      console.error("発行に失敗しました", err)
      setError("発行に失敗しました");
    } finally {
      setIssuing(false);
    }
  }

  return (
    <section className="rounded border p-4">
      <h2 className="font-bold">保護者の招待</h2>

      <button
        type="button"
        onClick={handleClick}
        disabled={issuing}
        className="mt-2 rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {issuing ? "発行中..." : "招待コードを発行"}

      </button>

      {code && (
        <div className="mt-3">
          <p className="font-mono text-2xl tracking-widest">{code}</p>
          <p className="text-sm text-gray-500">このコードを保護者に伝えてください（1回だけ使えます）</p>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

    </section>
  );
}
