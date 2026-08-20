import { formatPaisa } from "./money";
import { SHOP } from "./shop-config";

type WhatsappOrderLine = {
  productName: string;
  variantLabel?: string | null;
  quantity: number;
  lineTotalPaisa: number;
};

type WhatsappOrder = {
  orderNumber: string;
  customerName: string;
  totalPaisa: number;
  items: WhatsappOrderLine[];
};

/**
 * Builds a wa.me deep link with the order pre-filled. This is deliberately not
 * the WhatsApp Business API: a plain link needs no approval, no token and no
 * webhook, and opens the customer's own WhatsApp with the message ready to send.
 */
export function buildWhatsappOrderLink(order: WhatsappOrder): string {
  const lines = order.items.map((item) => {
    const label = item.variantLabel ? ` (${item.variantLabel})` : "";
    return `• ${item.productName}${label} × ${item.quantity} — ${formatPaisa(item.lineTotalPaisa)}`;
  });

  const message = [
    `Assalam o Alaikum! I've placed an order on ${SHOP.name}.`,
    "",
    `Order number: ${order.orderNumber}`,
    `Name: ${order.customerName}`,
    "",
    "Items:",
    ...lines,
    "",
    `Total: ${formatPaisa(order.totalPaisa)}`,
    "",
    "I'm attaching my bank transfer receipt.",
  ].join("\n");

  return `https://wa.me/${SHOP.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

/** Generic "ask a question about this product" link used on product pages. */
export function buildWhatsappEnquiryLink(productName: string): string {
  const message = `Hi! I'd like to ask about "${productName}".`;
  return `https://wa.me/${SHOP.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
