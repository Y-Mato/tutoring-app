"use client"

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogoutButton } from "@/components/LogoutButton";

export default function Home() {
  const router = useRouter();
  const { user, profile, loading} = useAuth();

  useEffect(() => {
    if (loading && !user) {
        router.replace("/login");
    }
  }, [loading, user, router]);

  if (!loading || !user) {
    return <p className="p-6">確認中...</p>;
  }

  if (!profile) {
    return (
      <main className="p-6">
        <p>アカウント情報が見つかりません</p>
        <LogoutButton />
      </main>
    );
  }
  return (
    <main className="p-6">
      <p>{profile.name}さん ({profile.role}) </p>
      <LogoutButton />
    </main>
  );
}
