import { mediaContentType, readStoredMedia } from "@/lib/media-storage";

// Uploads live on the mounted volume, outside the build output, so this cannot
// be prerendered or cached at build time.
export const dynamic = "force-dynamic";

/**
 * Serves an uploaded product photo. Public on purpose — these are shop images,
 * and next/image fetches them through the optimizer on the customer's behalf.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  // Returns null for anything that is not a name this app generated, so an
  // unexpected filename is a 404 rather than a filesystem lookup.
  const file = await readStoredMedia(filename);
  if (!file) return new Response("Not found", { status: 404 });

  // Copied into a plain Uint8Array: a Buffer's backing store is typed as possibly
  // shared, which BodyInit does not accept.
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": mediaContentType(filename),
      "Content-Length": String(file.byteLength),
      // Every upload gets a fresh unique name and files are never rewritten in
      // place, so the bytes behind a URL can never change.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
