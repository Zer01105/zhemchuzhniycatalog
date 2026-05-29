"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function AuthGuard() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/login") return;

    async function checkUser() {
      const res = await fetch("/api/me", {
        cache: "no-store",
      });

      if (!res.ok) {
        await fetch("/api/logout", {
          method: "POST",
        });

        window.location.href = "/login";
      }
    }

    checkUser();

    const interval = setInterval(checkUser, 30000);

    return () => clearInterval(interval);
  }, [pathname]);

  return null;
}
