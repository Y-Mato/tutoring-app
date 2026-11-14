"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword, type UserCredential } from "firebase/auth";
import { doc, getDoc, writeBatch } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";

function toMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/email-already-in-use":
        return "このメールアドレスはすでに登録されています";
      case "auth/invalid-email":
        return "メールアドレスの形式が正しくありません";
      case "auth/weak-password":
        return "パスワードは6文字以上にしてください";
    }
  }
  return "登録に失敗しました。時間をおいてもう一度試してください";
}

export default function SignupPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // すでにログインしている人はホームへ（登録の途中は除く）
  useEffect(() => {
    if (!loading && user && !submitting) {
      router.replace("/");
    }
  }, [loading, user, submitting, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    // 入力のゆれをなくす（前後の空白を消して、大文字にそろえる）
    const inviteCode = code.trim().toUpperCase();

    // 1. 招待コードを確かめる
    try {
      const inviteSnap = await getDoc(doc(db, "invites", inviteCode));
      if (!inviteSnap.exists()) {
        setError("招待コードが見つかりません");
        setSubmitting(false);
        return;
      }
      if (inviteSnap.data().used) {
        setError("この招待コードはすでに使われています");
        setSubmitting(false);
        return;
      }
    } catch (err) {
      console.error("招待コードの確認に失敗しました", err);
      setError("招待コードを確認できませんでした");
      setSubmitting(false);
      return;
    }

    // 2. アカウントを作る
    let credential: UserCredential;
    try {
      credential = await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(toMessage(err));
      setSubmitting(false);
      return;
    }

    // 3. users の作成と、招待コードの使用済み化をまとめて書き込む
    try {
      const uid = credential.user.uid;
      const batch = writeBatch(db);
      batch.set(doc(db, "users", uid), {
        role: "parent",
        name: name.trim(),
        studentIds: [],
        inviteCode,
      });
      batch.update(doc(db, "invites", inviteCode), {
        used: true,
        usedBy: uid,
      });
      await batch.commit();
      router.replace("/");
    } catch (err) {
      console.error("登録の書き込みに失敗しました", err);
      // 4. 中途半端なアカウントを残さないように消す
      try {
        await credential.user.delete();
      } catch (deleteErr) {
        console.error("アカウントの削除に失敗しました", deleteErr);
      }
      setError("登録に失敗しました。招待コードを確認して、もう一度試してください");
      setSubmitting(false);
    }
  }

  // 登録中はフォームを出したまま。それ以外で確認中・ログイン済みなら待つ
  if (!submitting && (loading || user)) {
    return <p className="p-6">確認中...</p>;
  }

return (
    <main className="flex flex-1 items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-2xl font-bold">保護者の新規登録</h1>

        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="招待コード"
          autoComplete="off"
          required
          className="rounded border px-3 py-2 uppercase"
        />
        
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="保護者の名前"
          autoComplete="name"
          required
          className="rounded border px-3 py-2"
        />

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
          placeholder="パスワード(6文字以上)"
          autoComplete="new-password"
          required
          className="rounded border px-3 py-2"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-blue-600 py-2 text-white disabled:opacity-50"
        >
          {submitting ? "登録中…" : "登録する"}
        </button>

        <Link href="/login" className="text-sm text-blue-600 underline">ログイン画面に戻る</Link>

      </form>

    </main>
  );
}
