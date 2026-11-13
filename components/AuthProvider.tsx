"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc} from "firebase/firestore";
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser)

      if (firebaseUser == null) {
        setProfile(null)
      }else {
        try {
            const snap = await getDoc(doc(db, "users", firebaseUser.uid));
            if (snap.exists()) {
                setProfile(snap.data() as UserProfile);
            }else {
                setProfile(null);
            }
        }catch (e) {
            console.error("users ドキュメントの読み込みに失敗しました", e);
            setProfile(null);
        }
      }
      setLoading(false);
    
    });
    return unsubscribe;
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
