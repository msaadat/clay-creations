import type { Metadata } from "next";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-display text-4xl">Checkout</h1>
      <p className="mt-2 text-muted-foreground">
        Place your order here, then transfer the total and send us the receipt on WhatsApp.
      </p>
      <CheckoutForm />
    </div>
  );
}
