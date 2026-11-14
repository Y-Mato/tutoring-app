"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// users コレクションの形（DESIGN.md に合わせる）
export type Role = "teacher" | "parent";
export type UserProfile = { role: Role; name: string };

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
  // users ドキュメントの見張りを止める関数（見張っていないときは null）
  let unsubscribeProfile: (() => void) | null = null;

  const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
    // ログインしている人が変わったら、前の人の見張りを止める
    unsubscribeProfile?.();
    unsubscribeProfile = null;

    setUser(firebaseUser);

    if (firebaseUser == null) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    unsubscribeProfile = onSnapshot(
      doc(db, "users", firebaseUser.uid),
      // 読めたとき（最初の1回と、変わるたび）
      (snap) => {
        setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
        setLoading(false);
      },
      // 読めなかったとき
      (err) => {
        console.error("users ドキュメントの読み込みに失敗しました", err);
        setProfile(null);
        setLoading(false);
      },
    );
  });

  // 画面が消えるときは、両方の見張りを止める
  return () => {
    unsubscribeProfile?.();
    unsubscribeAuth();
  };
}, []);


  return <AuthContext value={{ user, profile, loading }}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (ctx == null) {
    throw new Error("AuthProvider の中で使ってください")
  }
  return ctx;
}
