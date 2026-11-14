"use client"

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogoutButton } from "@/components/LogoutButton";
import { TeacherHome } from "@/components/TeacherHome";
import { ParentHome } from "@/components/ParentHome";

export default function Home() {
  const router = useRouter();
  const { user, profile, loading} = useAuth();

  useEffect(() => {
    if (!loading && !user) {
        router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
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
  <main className="flex flex-col gap-6 p-6">
    <header className="flex items-center justify-between">
      <p>{profile.name}さん</p>
      <LogoutButton />
    </header>
    
    {profile.role === "teacher" ? (
      <TeacherHome />
    ): profile.role === "parent" ? (
      <ParentHome />
    ): (
      <p>アカウントの種類が正しくありません</p>
    )}
    
  </main>
);

}
