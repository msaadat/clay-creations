import Link from "next/link";
import { SHOP } from "@/lib/shop-config";

// lucide-react no longer ships brand marks, so the Instagram glyph is inlined.
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-muted/50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <h3 className="font-display text-xl">{SHOP.name}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{SHOP.tagline}</p>
          <a
            href={SHOP.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent"
          >
            <InstagramIcon className="size-4" />@{SHOP.instagram}
          </a>
        </div>

        <div className="text-sm">
          <h4 className="font-medium">Shop</h4>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>
              <Link href="/shop" className="hover:text-accent">
                All pieces
              </Link>
            </li>
            <li>
              <Link href="/checkout" className="hover:text-accent">
                Checkout
              </Link>
            </li>
          </ul>
        </div>

        <div className="text-sm">
          <h4 className="font-medium">How ordering works</h4>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-muted-foreground">
            <li>Place your order here</li>
            <li>Transfer the total to our bank account</li>
            <li>Send the receipt on WhatsApp</li>
            <li>We confirm and ship</li>
          </ol>
        </div>
      </div>

      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {SHOP.name}. Handmade with care.
      </div>
    </footer>
  );
}
