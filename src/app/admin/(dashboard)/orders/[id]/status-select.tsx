"use client";

import { useState, useTransition } from "react";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/orders";
import { updateOrderStatus } from "../../actions";

export function StatusSelect({
  orderId,
  current,
}: {
  orderId: string;
  current: OrderStatus;
}) {
  const [value, setValue] = useState<OrderStatus>(current);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-muted-foreground" htmlFor="order-status">
        Status
      </label>
      <select
        id="order-status"
        value={value}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value as OrderStatus;
          const previous = value;
          setValue(next);
          setError(null);
          startTransition(async () => {
            try {
              await updateOrderStatus(orderId, next);
            } catch {
              setValue(previous);
              setError("Could not update status.");
            }
          });
        }}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent disabled:opacity-60"
      >
        {ORDER_STATUSES.map((status) => (
          <option key={status} value={status}>
            {ORDER_STATUS_LABELS[status]}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-rose-700">{error}</span>}
    </div>
  );
}
