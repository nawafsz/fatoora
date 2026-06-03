"use client";

import { useState } from "react";
import { ClientInvoicesDialog } from "./client-invoices-dialog";

type Client = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  taxNumber: string | null;
};

export function ClientNameCell({ client }: { client: Client }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 text-right hover:opacity-80 transition-opacity"
      >
        <div className="w-9 h-9 rounded-xl bg-[#1a5632]/10 flex items-center justify-center text-[#1a5632] font-bold text-sm flex-shrink-0">
          {client.name?.[0] ?? "؟"}
        </div>
        <span className="text-sm font-semibold text-[#0d2818] hover:text-[#1a5632] transition-colors">
          {client.name}
        </span>
      </button>

      {open && (
        <ClientInvoicesDialog
          client={client}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
