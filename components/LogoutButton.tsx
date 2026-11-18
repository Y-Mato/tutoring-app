"use client"

import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"

export function LogoutButton() {

    async function handleClick() {
        await signOut(auth);
        window.location.href = "/login";

    }

    return (
        <button type="button" onClick={handleClick} className="rounded border px-4 py-2">
            ログアウト
        </button>
    );

}
