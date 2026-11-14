"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { LogoutButton } from "@/components/LogoutButton";
import { TabBar } from "@/components/TabBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

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
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b p-4">
        <p>{profile.name}さん</p>
        <LogoutButton />
      </header>

      {/* pb-20：下部タブに中身が隠れないように、下に余白を取る */}
      <main className="flex-1 p-4 pb-20">{children}</main>

      <TabBar role={profile.role} />
    </div>
  );
}
