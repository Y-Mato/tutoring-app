"use client"

import { useAuth } from "@/components/AuthProvider";
import { TeacherHome } from "@/components/TeacherHome";
import { ParentHome } from "@/components/ParentHome";

export default function Home() {
  const { profile } = useAuth();

    if (!profile) return null;

  return (
  <div className="flex flex-col gap-6">
    
    {profile.role === "teacher" ? (
      <TeacherHome />
    ): profile.role === "parent" ? (
      <ParentHome />
    ): (
      <p>アカウントの種類が正しくありません</p>
    )}
    
  </div>
);

}
