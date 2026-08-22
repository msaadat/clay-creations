import { getCurrentAdmin } from "@/lib/auth";
import { saveUploadedImage } from "@/lib/media-storage";

/**
 * Receives one product photo from the admin form.
 *
 * Deliberately a route handler rather than a server action: server actions cap
 * request bodies at 1 MB by default, which every photo taken on a phone exceeds.
 * Route handlers stream the request and have no such limit.
 */
export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return Response.json({ error: "Not authorised" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file was sent" }, { status: 400 });

  const result = await saveUploadedImage(file);
  if ("error" in result) return Response.json(result, { status: 400 });

  return Response.json(result, { status: 201 });
}
