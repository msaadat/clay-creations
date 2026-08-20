import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Shop" };

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: categorySlug } = await searchParams;

  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" } });

  if (categorySlug && !categories.some((c) => c.slug === categorySlug)) {
    notFound();
  }

  const activeCategory = categories.find((c) => c.slug === categorySlug);

  const products = await db.product.findMany({
    where: {
      isActive: true,
      ...(activeCategory ? { categoryId: activeCategory.id } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      slug: true,
      name: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } },
      variants: { select: { pricePaisa: true, stock: true } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl">{activeCategory?.name ?? "All pieces"}</h1>
      {activeCategory?.description && (
        <p className="mt-2 max-w-2xl text-muted-foreground">{activeCategory.description}</p>
      )}

      <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-2">
        <FilterPill href="/shop" active={!activeCategory}>
          All
        </FilterPill>
        {categories.map((category) => (
          <FilterPill
            key={category.slug}
            href={`/shop?category=${category.slug}`}
            active={activeCategory?.slug === category.slug}
          >
            {category.name}
          </FilterPill>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">
          Nothing here yet — check back soon.
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "whitespace-nowrap rounded-full border px-4 py-2 text-sm transition",
        active
          ? "border-accent bg-accent text-white"
          : "border-border text-muted-foreground hover:border-accent hover:text-accent",
      )}
    >
      {children}
    </Link>
  );
}
