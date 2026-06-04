"use client";

import { signOut } from "next-auth/react";

export function SignoutButton({ label }: { label: string }) {
  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    await signOut({ callbackUrl: "/" });
  };

  return (
    <button type="button" onClick={handleSignOut} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
      {label}
    </button>
  );
}
