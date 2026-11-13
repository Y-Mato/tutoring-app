"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";

// Firebase のエラーを日本語のメッセージにする
function toMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/invalid-credential":
        return "メールアドレスかパスワードが違います";
      case "auth/invalid-email":
        return "メールアドレスの形式が正しくありません"
      case "auth/too-many-requests":
        return "試行回数が多すぎます。しばらく待ってから試してください"
    }
  }
  return "ログインに失敗しました。時間をおいてもう一度試してください";
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  //ログイン済みならホームへ移動
  useEffect(() => {
    if (!loading && user) {
        router.replace("/");
    }
  }, [loading, user, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(toMessage(err));
      setSubmitting(false);
    }
  }

  if (loading || user) {
    return <p className="p-6">確認中...</p>;
  }
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-2xl font-bold">ログイン</h1>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="メールアドレス"
          autoComplete="email"
          required
          className="rounded border px-3 py-2"
        />
        
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="パスワード"
          autoComplete="current-password"
          required
          className="rounded border px-3 py-2"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-blue-600 py-2 text-white disabled:opacity-50"
        >
          {submitting ? "ログイン中…" : "ログイン"}
        </button>
      </form>
    </main>
  );
}
