"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type GalleryImage = { id: string; url: string; alt: string | null };

export function ProductGallery({
  images,
  productName,
}: {
  images: GalleryImage[];
  productName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  if (images.length === 0) {
    return <div className="aspect-square rounded-2xl bg-muted" />;
  }

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
        <Image
          src={active.url}
          alt={active.alt ?? productName}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-3">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View image ${index + 1}`}
              className={cn(
                "relative size-20 overflow-hidden rounded-lg border-2 bg-muted transition",
                index === activeIndex ? "border-accent" : "border-transparent hover:border-border",
              )}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
