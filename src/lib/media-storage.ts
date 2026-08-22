import "server-only";

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Uploaded product photos, kept on the same persistent volume as the SQLite
 * database.
 *
 * The one thing that must not happen here is writing uploads into `public/`:
 * the container filesystem is rebuilt from git on every deploy, so those files
 * would work in testing and then vanish on the next push. Everything below
 * lives under MEDIA_DIR, which points inside the mounted volume
 * (/data/uploads in Docker, alongside prod.db).
 *
 * Files are read back out by src/app/api/media/[filename]/route.ts rather than
 * by Next's static handler, which only knows about `public/` as it existed at
 * build time.
 *
 * This module is the seam to replace if uploads ever move to object storage:
 * swap these functions for R2/S3 calls and nothing else has to change.
 */

/** Public URL prefix. Matches the route that serves the files. */
const URL_PREFIX = "/api/media";

/** Roughly a phone photo. Larger files are rejected before anything is written. */
const MAX_BYTES = 8 * 1024 * 1024;

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

/**
 * Stored names are generated, never taken from the client: `<base36 millis>-<uuid>.<ext>`.
 * The timestamp prefix makes a plain lexicographic sort chronological, and the
 * shape doubles as the validator on the serving route — a name that fails this
 * pattern never reaches the filesystem, so path traversal has nothing to grip.
 */
const STORED_NAME =
  /^[0-9a-z]{6,12}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|avif)$/;

/**
 * Resolved per call rather than at module load: the admin pages that import this
 * are dynamic, but a module-level read would also run during `next build`, where
 * /data does not exist yet.
 */
function mediaRoot(): string {
  if (process.env.MEDIA_DIR) return process.env.MEDIA_DIR;
  return process.env.NODE_ENV === "production"
    ? "/data/uploads"
    : path.join(process.cwd(), ".media");
}

/**
 * Identifies the format from the file's own leading bytes. The browser-supplied
 * MIME type and filename are ignored entirely — this is what decides both the
 * stored extension and whether the upload is an image at all.
 */
function sniffExtension(bytes: Uint8Array): string | null {
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.subarray(start, end));

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";

  if (
    bytes[0] === 0x89 &&
    ascii(1, 4) === "PNG" &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }

  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";

  // ISO-BMFF: "ftyp" box, then the brand. HEIC shares the container but browsers
  // cannot display it, so only the AVIF brands are accepted.
  if (ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) return "avif";

  return null;
}

export function isStoredMediaName(name: string): boolean {
  return STORED_NAME.test(name);
}

/** Content type for a name that has already passed isStoredMediaName. */
export function mediaContentType(name: string): string {
  return CONTENT_TYPES[name.split(".").pop()!];
}

export type SaveResult = { url: string } | { error: string };

export async function saveUploadedImage(file: File): Promise<SaveResult> {
  if (file.size === 0) return { error: "That file is empty" };
  if (file.size > MAX_BYTES) {
    return { error: `Images must be under ${MAX_BYTES / 1024 / 1024} MB` };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = sniffExtension(bytes);
  if (!extension) return { error: "Only JPEG, PNG, WebP and AVIF images can be uploaded" };

  const filename = `${Date.now().toString(36)}-${crypto.randomUUID()}.${extension}`;
  const root = mediaRoot();

  // The volume is mounted before the server starts, but the directory inside it
  // may not exist on a first deploy; the entrypoint creates it and this is the
  // belt-and-braces for running outside Docker.
  await fs.mkdir(root, { recursive: true });
  await fs.writeFile(path.join(root, filename), bytes);

  return { url: `${URL_PREFIX}/${filename}` };
}

/** Uploaded photos as public URLs, newest first. */
export async function listUploadedImages(): Promise<string[]> {
  try {
    const entries = await fs.readdir(mediaRoot());
    return entries
      .filter(isStoredMediaName)
      .sort()
      .reverse()
      .map((name) => `${URL_PREFIX}/${name}`);
  } catch {
    // No uploads directory yet — same meaning as no uploads.
    return [];
  }
}

/** File contents, or null when the name is unknown. */
export async function readStoredMedia(name: string): Promise<Buffer | null> {
  if (!isStoredMediaName(name)) return null;
  try {
    return await fs.readFile(path.join(mediaRoot(), name));
  } catch {
    return null;
  }
}
