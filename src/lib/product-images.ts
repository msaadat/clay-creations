import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { listUploadedImages } from "./media-storage";

/**
 * Every photo the admin form can attach to a product: uploads first (newest at
 * the front), then the stock images that ship inside the container.
 *
 * The two halves exist for different reasons. Uploads are the normal route and
 * live on the mounted volume — see src/lib/media-storage.ts. The bundled ones
 * are what `prisma/seed.ts` points the demo catalogue at; they are part of the
 * image, so they cannot be deleted from the admin, only detached.
 */
export async function listAvailableProductImages(): Promise<string[]> {
  const [uploaded, bundled] = await Promise.all([
    listUploadedImages(),
    listBundledProductImages(),
  ]);

  return [...uploaded, ...bundled];
}

/** Photos committed to public/products and copied into the image at build time. */
async function listBundledProductImages(): Promise<string[]> {
  const directory = path.join(process.cwd(), "public", "products");

  try {
    const entries = await fs.readdir(directory);
    return entries
      .filter((name) => /\.(jpe?g|png|webp|avif)$/i.test(name))
      .sort()
      .map((name) => `/products/${name}`);
  } catch {
    return [];
  }
}
