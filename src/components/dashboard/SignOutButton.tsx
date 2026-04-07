"use client";

import { useRouter } from "next/navigation";
import { signOutBrowserSession } from "@/lib/browser-auth";

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await signOutBrowserSession();
        router.push("/");
        router.refresh();
      }}
      className="shrink-0 rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:border-white/40 hover:bg-white/10"
    >
      Sign out
    </button>
  );
}
