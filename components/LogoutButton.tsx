"use client"

import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"

export function LogoutButton() {

    async function handleClick() {
        await signOut(auth);
        // ログアウト時は、画面に残っている前の人の状態（cacheComponents で隠れて残る画面）を
        // すべて消すため、router.push ではなくページごと読み込み直す
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login";

    }

    return (
        <button type="button" onClick={handleClick} className="rounded border px-4 py-2">
            ログアウト
        </button>
    );

}
