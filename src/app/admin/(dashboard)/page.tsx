import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatPaisa } from "@/lib/money";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  type OrderStatus,
} from "@/lib/orders";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = ORDER_STATUSES.find((s) => s === status);

  const [orders, counts] = await Promise.all([
    db.order.findMany({
      where: activeStatus ? { status: activeStatus } : {},
      orderBy: { createdAt: "desc" },
      include: { items: { select: { quantity: true } } },
      take: 100,
    }),
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countFor = (s: OrderStatus) =>
    counts.find((c) => c.status === s)?._count._all ?? 0;

  return (
    <div>
      <h1 className="font-display text-3xl">Orders</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/admin"
          className={cn(
            "rounded-full border px-4 py-2 text-sm",
            !activeStatus ? "border-accent bg-accent text-white" : "border-border",
          )}
        >
          All
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin?status=${s}`}
            className={cn(
              "rounded-full border px-4 py-2 text-sm",
              activeStatus === s ? "border-accent bg-accent text-white" : "border-border",
            )}
          >
            {ORDER_STATUS_LABELS[s]} ({countFor(s)})
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="mt-12 text-muted-foreground">No orders here yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Placed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div>{order.customerName}</div>
                    <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
                  </td>
                  <td className="px-4 py-3">
                    {order.items.reduce((sum, i) => sum + i.quantity, 0)}
                  </td>
                  <td className="px-4 py-3">{formatPaisa(order.totalPaisa)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs",
                        ORDER_STATUS_STYLES[order.status as OrderStatus],
                      )}
                    >
                      {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {order.createdAt.toLocaleDateString("en-PK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
