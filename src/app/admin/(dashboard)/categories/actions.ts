"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authorised");
  return admin;
}

const categoryInputSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(60),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(500).optional(),
  imageUrl: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

export type CategoryFormState = { error?: string };

/**
 * Categories are surfaced in the site header, which lives in the root layout,
 * so a category change can be visible on any route — hence the layout-wide
 * revalidation rather than the per-page calls used for products.
 */
function revalidateStorefront() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/categories");
}

export async function saveCategory(
  categoryId: string | null,
  _prevState: CategoryFormState | undefined,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();

  const parsed = categoryInputSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? ""),
    sortOrder: String(formData.get("sortOrder") || "0"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form" };
  }
  const input = parsed.data;

  const slug = slugify(input.slug || input.name);
  if (!slug) return { error: "Could not derive a URL slug from that name" };

  const clash = await db.category.findFirst({
    where: { slug, ...(categoryId ? { NOT: { id: categoryId } } : {}) },
    select: { id: true },
  });
  if (clash) return { error: `Another category already uses the slug "${slug}"` };

  const data = {
    name: input.name,
    slug,
    description: input.description || null,
    imageUrl: input.imageUrl || null,
    sortOrder: input.sortOrder,
  };

  try {
    if (categoryId) {
      await db.category.update({ where: { id: categoryId }, data });
    } else {
      await db.category.create({ data });
    }
  } catch (error) {
    console.error("saveCategory failed", error);
    return { error: "Could not save the category. Please try again." };
  }

  revalidateStorefront();
  redirect("/admin/categories");
}

export async function deleteCategory(
  categoryId: string,
  _prevState: CategoryFormState | undefined,
): Promise<CategoryFormState> {
  await requireAdmin();

  // Product.categoryId is a required foreign key with no cascade, so deleting a
  // category that still holds products would fail at the database level. Check
  // first so the admin gets an explanation instead of a constraint error.
  const productCount = await db.product.count({ where: { categoryId } });
  if (productCount > 0) {
    return {
      error: `This category still has ${productCount} ${
        productCount === 1 ? "product" : "products"
      }. Move them to another category first.`,
    };
  }

  try {
    await db.category.delete({ where: { id: categoryId } });
  } catch (error) {
    console.error("deleteCategory failed", error);
    return { error: "Could not delete the category. Please try again." };
  }

  revalidateStorefront();
  redirect("/admin/categories");
}
