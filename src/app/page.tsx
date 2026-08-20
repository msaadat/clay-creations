import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { SHOP } from "@/lib/shop-config";

// Rendered per request: the home page shows live stock and whatever the owner
// has just featured in /admin. A local SQLite read costs microseconds, so there
// is nothing to gain from prerendering it.
export const dynamic = "force-dynamic";

const productCardSelect = {
  slug: true,
  name: true,
  images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } },
  variants: { select: { pricePaisa: true, stock: true } },
} as const;

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    }),
    db.product.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: productCardSelect,
    }),
  ]);

  const hero = categories[0];

  return (
    <div>
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-border bg-accent-soft">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
              {SHOP.tagline}
            </p>
            <h1 className="mt-4 font-display text-4xl leading-tight md:text-6xl">
              Miniature floral art, made to be worn
            </h1>
            <p className="mt-4 max-w-md text-muted-foreground">
              Every flower is rolled, shaped and painted by hand in small batches. No two
              pieces are ever quite the same.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="rounded-full bg-accent px-6 py-3 text-sm text-white transition hover:bg-accent-hover"
              >
                Shop the collection
              </Link>
              <a
                href={SHOP.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border px-6 py-3 text-sm transition hover:border-accent hover:text-accent"
              >
                See more on Instagram
              </a>
            </div>
          </div>

          {hero?.imageUrl && (
            <div className="relative aspect-square overflow-hidden rounded-2xl">
              <Image
                src={hero.imageUrl}
                alt="Handmade clay jewellery"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-3xl">Explore the collection</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/shop?category=${category.slug}`}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-muted"
            >
              {category.imageUrl && (
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-4 text-white">
                <h3 className="font-display text-xl">{category.name}</h3>
                <p className="text-xs opacity-90">
                  {category._count.products}{" "}
                  {category._count.products === 1 ? "piece" : "pieces"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-3xl">Featured pieces</h2>
            <Link href="/shop" className="text-sm text-muted-foreground hover:text-accent">
              View all
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* How ordering works — set expectations before checkout, not during it. */}
      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-3xl">How ordering works</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-4">
            {[
              { step: "1", title: "Choose your pieces", body: "Add what you love to the cart and check out." },
              { step: "2", title: "Transfer the amount", body: "We'll show our bank details and your order number." },
              { step: "3", title: "Send the receipt", body: "One tap opens WhatsApp with your order pre-filled." },
              { step: "4", title: "We ship it out", body: "Once payment lands, your order is on its way." },
            ].map((item) => (
              <div key={item.step}>
                <span className="flex size-9 items-center justify-center rounded-full bg-accent text-sm text-white">
                  {item.step}
                </span>
                <h3 className="mt-3 font-medium">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
