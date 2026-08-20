import Image from "next/image";
import Link from "next/link";
import { formatPaisa } from "@/lib/money";

export type ProductCardData = {
  slug: string;
  name: string;
  images: { url: string; alt: string | null }[];
  variants: { pricePaisa: number; stock: number }[];
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const prices = product.variants.map((v) => v.pricePaisa);
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const hasRange = prices.length > 1 && Math.max(...prices) !== lowestPrice;
  const soldOut = product.variants.every((v) => v.stock <= 0);
  const image = product.images[0];

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        {image && (
          <Image
            src={image.url}
            alt={image.alt ?? product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        )}
        {soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-medium">
            Sold out
          </span>
        )}
      </div>

      <h3 className="mt-3 text-sm font-medium group-hover:text-accent">{product.name}</h3>
      <p className="text-sm text-muted-foreground">
        {hasRange ? `From ${formatPaisa(lowestPrice)}` : formatPaisa(lowestPrice)}
      </p>
    </Link>
  );
}
