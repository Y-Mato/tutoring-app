"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/components/AuthProvider";

export function TabBar({ role }: { role: Role }) {
  const pathname = usePathname();   // 今の URL（例："/calendar"）

  const tabs = [
    { href: "/", label: "ホーム" },
    { href: "/calendar", label: "カレンダー" },
    { href: "/records", label: "記録" },
    { href: "/messages", label: "メッセージ" },

    ...(role === "teacher" ? [{ href: "/settings", label: "設定" }] : []),

  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 flex border-t bg-white dark:bg-black">
      {tabs.map((tab) => {
        const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 py-3 text-center text-sm ${active ? "font-bold text-blue-600" : "text-gray-500"}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
