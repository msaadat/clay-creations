import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { AddToCart } from "./add-to-cart";
import { ProductGallery } from "./product-gallery";
import { buildWhatsappEnquiryLink } from "@/lib/whatsapp";

async function getProduct(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Not found" };
  return {
    title: product.name,
    description: product.description ?? undefined,
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
      images: product.images[0] ? [product.images[0].url] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product || !product.isActive) notFound();

  const related = await db.product.findMany({
    where: { categoryId: product.categoryId, isActive: true, NOT: { id: product.id } },
    take: 4,
    select: {
      slug: true,
      name: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } },
      variants: { select: { pricePaisa: true, stock: true } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="text-sm text-muted-foreground">
        <Link href="/shop" className="hover:text-accent">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/shop?category=${product.category.slug}`} className="hover:text-accent">
          {product.category.name}
        </Link>
      </nav>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        <div>
          <h1 className="font-display text-4xl">{product.name}</h1>

          {product.description && (
            <p className="mt-4 leading-relaxed text-muted-foreground">{product.description}</p>
          )}

          <AddToCart
            productSlug={product.slug}
            productName={product.name}
            imageUrl={product.images[0]?.url ?? null}
            variants={product.variants.map((v) => ({
              id: v.id,
              optionName: v.optionName,
              optionValue: v.optionValue,
              pricePaisa: v.pricePaisa,
              stock: v.stock,
            }))}
          />

          <div className="mt-8 space-y-2 border-t border-border pt-6 text-sm text-muted-foreground">
            <p>Handmade to order — allow 2–3 days for dispatch.</p>
            <p>Payment by bank transfer, confirmed on WhatsApp.</p>
            <a
              href={buildWhatsappEnquiryLink(product.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-accent underline"
            >
              Questions about this piece? Message us
            </a>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl">More from {product.category.name}</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.slug} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
