import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPaisa } from "@/lib/money";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/orders";
import { buildWhatsappOrderLink } from "@/lib/whatsapp";
import { StatusSelect } from "./status-select";

export const metadata: Metadata = { title: "Order detail" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) notFound();

  // Opens WhatsApp addressed to the customer, pre-filled with their order.
  const customerWhatsapp = `https://wa.me/${order.customerPhone}?text=${encodeURIComponent(
    `Hi ${order.customerName}, thank you for your order ${order.orderNumber} from ClayCreations!`,
  )}`;

  return (
    <div>
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-accent">
        ← Back to orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">{order.orderNumber}</h1>
        <StatusSelect orderId={order.id} current={order.status as OrderStatus} />
      </div>

      <p className="mt-1 text-sm text-muted-foreground">
        Placed{" "}
        {order.createdAt.toLocaleString("en-PK", {
          dateStyle: "long",
          timeStyle: "short",
        })}
        {" · "}
        Currently: {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border p-6">
          <h2 className="font-medium">Customer</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Name" value={order.customerName} />
            <Row label="Phone" value={order.customerPhone} />
            {order.customerEmail && <Row label="Email" value={order.customerEmail} />}
            <Row label="Address" value={order.addressLine} />
            <Row label="City" value={order.city} />
            {order.postalCode && <Row label="Postal code" value={order.postalCode} />}
            {order.notes && <Row label="Notes" value={order.notes} />}
          </dl>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={customerWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#25D366] px-4 py-2 text-sm text-white hover:brightness-95"
            >
              Message customer
            </a>
            <a
              href={buildWhatsappOrderLink({
                orderNumber: order.orderNumber,
                customerName: order.customerName,
                totalPaisa: order.totalPaisa,
                items: order.items,
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-border px-4 py-2 text-sm hover:border-accent"
            >
              Copy of customer's message
            </a>
          </div>
        </section>

        <section className="rounded-xl border border-border p-6">
          <h2 className="font-medium">Items</h2>
          <ul className="mt-3 divide-y divide-border text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 py-3">
                <span>
                  <Link
                    href={`/product/${item.productSlug}`}
                    className="hover:text-accent hover:underline"
                  >
                    {item.productName}
                  </Link>
                  {item.variantLabel && (
                    <span className="text-muted-foreground"> — {item.variantLabel}</span>
                  )}
                  <span className="text-muted-foreground"> × {item.quantity}</span>
                </span>
                <span>{formatPaisa(item.lineTotalPaisa)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatPaisa(order.subtotalPaisa)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd>{order.shippingPaisa === 0 ? "Free" : formatPaisa(order.shippingPaisa)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-medium">
              <dt>Total</dt>
              <dd>{formatPaisa(order.totalPaisa)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="flex-1">{value}</dd>
    </div>
  );
}
