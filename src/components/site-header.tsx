import Link from "next/link";
import { db } from "@/lib/db";
import { SHOP } from "@/lib/shop-config";
import { CartButton } from "./cart-button";

export async function SiteHeader() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { name: true, slug: true },
  });

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="font-display text-2xl font-semibold tracking-tight">
          {SHOP.name}
        </Link>

        <nav className="no-scrollbar hidden flex-1 items-center gap-5 overflow-x-auto text-sm md:flex">
          <Link href="/shop" className="whitespace-nowrap hover:text-accent">
            All pieces
          </Link>
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/shop?category=${category.slug}`}
              className="whitespace-nowrap text-muted-foreground hover:text-accent"
            >
              {category.name}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <CartButton />
        </div>
      </div>

      {/* Category rail for narrow screens, where the inline nav is hidden. */}
      <nav className="no-scrollbar flex items-center gap-4 overflow-x-auto border-t border-border px-4 py-2 text-sm md:hidden">
        <Link href="/shop" className="whitespace-nowrap hover:text-accent">
          All
        </Link>
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/shop?category=${category.slug}`}
            className="whitespace-nowrap text-muted-foreground hover:text-accent"
          >
            {category.name}
          </Link>
        ))}
      </nav>
    </header>
  );
}
