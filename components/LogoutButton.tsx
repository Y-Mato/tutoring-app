"use client"

import { useRouter } from "next/navigation"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"

export function LogoutButton(){
    const router = useRouter();

    async function handleClick() {
        await signOut(auth);
        router.replace("/login");
    }

    return (
        <button type="button" onClick={handleClick} className="rounded border px-4 py-2">
            ログアウト
        </button>
    );

}
