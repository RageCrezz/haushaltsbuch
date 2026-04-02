"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    setIsPending(true);

    try {
      await signOut({
        callbackUrl: "/",
        redirect: false,
      });
    } finally {
      router.push("/");
      router.refresh();
      setIsPending(false);
    }
  }

  return (
    <button
      className="button-primary"
      onClick={handleLogout}
      disabled={isPending}
    >
      {isPending ? "..." : "Logout"}
    </button>
  );
}
