import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

/**
 * Lists the photos sitting in public/products so the admin form can offer them
 * as a picker.
 *
 * This is the interim story until object storage is wired up: drop files into
 * that folder and they show up here. Replace with an S3/R2 listing when uploads
 * move off the local disk.
 */
export async function listAvailableProductImages(): Promise<string[]> {
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
