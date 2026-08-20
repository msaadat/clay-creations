import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPaisa } from "@/lib/money";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/orders";
import { SHOP, isPlaceholderBankDetails, isPlaceholderWhatsapp } from "@/lib/shop-config";
import { buildWhatsappOrderLink } from "@/lib/whatsapp";
import { CopyButton } from "@/components/copy-button";

export const metadata: Metadata = { title: "Your order" };

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  const order = await db.order.findUnique({
    where: { orderNumber: orderNumber.toUpperCase() },
    include: { items: true },
  });

  if (!order) notFound();

  const whatsappLink = buildWhatsappOrderLink({
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    totalPaisa: order.totalPaisa,
    items: order.items,
  });

  const showSetupWarning = isPlaceholderBankDetails() || isPlaceholderWhatsapp();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-5">
        <h1 className="font-display text-3xl text-emerald-900">Order placed</h1>
        <p className="mt-1 text-sm text-emerald-800">
          Thank you, {order.customerName}. Your order number is{" "}
          <strong>{order.orderNumber}</strong>.
        </p>
      </div>

      {showSetupWarning && (
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-6 py-4 text-sm text-amber-900">
          <strong>Setup incomplete.</strong> This order page is still showing placeholder{" "}
          {isPlaceholderBankDetails() && "bank details"}
          {isPlaceholderBankDetails() && isPlaceholderWhatsapp() && " and "}
          {isPlaceholderWhatsapp() && "WhatsApp number"}. Update{" "}
          <code className="rounded bg-amber-100 px-1">src/lib/shop-config.ts</code> and{" "}
          <code className="rounded bg-amber-100 px-1">.env</code> before taking real orders.
        </div>
      )}

      {/* Step 1 — transfer */}
      <section className="mt-8 rounded-xl border border-border p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-accent text-sm text-white">
            1
          </span>
          <h2 className="font-display text-2xl">Transfer {formatPaisa(order.totalPaisa)}</h2>
        </div>

        <dl className="mt-5 divide-y divide-border rounded-lg border border-border">
          <DetailRow label="Account title" value={SHOP.bank.accountTitle} />
          <DetailRow label="Bank" value={SHOP.bank.bankName} />
          <DetailRow label="Account number" value={SHOP.bank.accountNumber} copyable />
          <DetailRow label="IBAN" value={SHOP.bank.iban} copyable />
          <DetailRow label="Amount" value={formatPaisa(order.totalPaisa)} />
          <DetailRow label="Reference" value={order.orderNumber} copyable />
        </dl>

        <p className="mt-4 text-sm text-muted-foreground">
          Please put <strong>{order.orderNumber}</strong> in the transfer reference so we can
          match your payment.
        </p>
      </section>

      {/* Step 2 — WhatsApp */}
      <section className="mt-6 rounded-xl border border-border p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-accent text-sm text-white">
            2
          </span>
          <h2 className="font-display text-2xl">Send us the receipt</h2>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          Tap below to open WhatsApp with your order details already filled in — just attach a
          screenshot of your transfer and hit send.
        </p>

        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-medium text-white transition hover:brightness-95"
        >
          Confirm on WhatsApp
        </a>
      </section>

      {/* Summary */}
      <section className="mt-6 rounded-xl border border-border p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">Order summary</h2>
          <span className="rounded-full border border-border px-3 py-1 text-xs">
            {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
          </span>
        </div>

        <ul className="mt-4 divide-y divide-border">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-3 text-sm">
              <span>
                {item.productName}
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
          <div className="flex justify-between border-t border-border pt-2 text-base font-medium">
            <dt>Total</dt>
            <dd>{formatPaisa(order.totalPaisa)}</dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Delivering to</p>
          <p className="mt-1">{order.customerName}</p>
          <p>{order.addressLine}</p>
          <p>
            {order.city}
            {order.postalCode ? ` ${order.postalCode}` : ""}
          </p>
        </div>
      </section>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Save this page — you can return to it any time at{" "}
        <code className="rounded bg-muted px-1">/order/{order.orderNumber}</code>.{" "}
        <Link href="/shop" className="text-accent underline">
          Keep shopping
        </Link>
      </p>
    </div>
  );
}

function DetailRow({
  label,
  value,
  copyable,
}: {
  label: string;
  value: string;
  copyable?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-2 text-sm font-medium">
        <span className="text-right">{value}</span>
        {copyable && <CopyButton value={value} label={label} />}
      </dd>
    </div>
  );
}
