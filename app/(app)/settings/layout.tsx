"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { profile } = useAuth();
  const isTeacher = profile?.role === "teacher";

  useEffect(() => {
    if (profile && !isTeacher) {
      router.replace("/");
    }
  }, [profile, isTeacher, router]);

  if (!isTeacher) return null;
  return <>{children}</>;
}
