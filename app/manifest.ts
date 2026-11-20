import type { MetadataRoute } from "next";

// PWA の設定（ホーム画面に追加したときの名前・アイコン・開き方）
// Next.js がこのファイルから /manifest.webmanifest を作り、<head> に自動でリンクを入れる
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "家庭教師アプリ",
    short_name: "家庭教師",        // ホーム画面のアイコンの下に出る名前（短く）
    description: "授業の予定・記録・成績・料金を先生と保護者で共有するアプリ",
    start_url: "/",
    display: "standalone",         // ブラウザのアドレスバーなどを出さず、アプリのように開く
    background_color: "#ffffff",
    theme_color: "#2563eb",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
