"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";

export function DeleteSubcontractButton({
  projectId,
  subId,
}: {
  projectId: string;
  subId: string;
}) {
  const router = useRouter();
  const { dict } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف عقد الباطن؟")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/subcontracts/${subId}`, {
        method: "DELETE",
      });
      if (res.ok) router.push(`/dashboard/projects/${projectId}`);
    } catch {}
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center gap-2 bg-red-50 border-2 border-red-200 text-red-600 px-5 py-3 rounded-xl text-sm font-bold hover:bg-red-100 transition-all disabled:opacity-50"
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin inline-block" />
      ) : (
        dict.common.delete
      )}
    </button>
  );
}
