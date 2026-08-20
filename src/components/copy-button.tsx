"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard access can be denied (insecure origin, permissions) — the
          // value is on screen anyway, so failing silently is acceptable here.
        }
      }}
      className="text-muted-foreground transition hover:text-accent"
    >
      {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
    </button>
  );
}
