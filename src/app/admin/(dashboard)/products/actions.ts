"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { rupeeStringToPaisa } from "@/lib/money";
import { slugify } from "@/lib/utils";

async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authorised");
  return admin;
}

const variantInputSchema = z.object({
  id: z.string().optional(),
  optionValue: z.string().trim().max(60).optional(),
  price: z.string().trim().min(1, "Price is required"),
  stock: z.coerce.number().int().min(0).max(9999),
});

const productInputSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  slug: z.string().trim().max(140).optional(),
  description: z.string().trim().max(2000).optional(),
  categoryId: z.string().min(1, "Pick a category"),
  optionName: z.string().trim().max(40).optional(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  imageUrls: z.array(z.string().trim().min(1)).max(8),
  variants: z.array(variantInputSchema).min(1, "Add at least one variant"),
});

export type ProductFormState = { error?: string };

/** Reads the repeated variant-* and image-* fields out of the form payload. */
function parseFormData(formData: FormData) {
  const imageUrls = formData
    .getAll("imageUrl")
    .map((v) => String(v).trim())
    .filter(Boolean);

  const variantIds = formData.getAll("variantId").map(String);
  const variantValues = formData.getAll("variantOptionValue").map(String);
  const variantPrices = formData.getAll("variantPrice").map(String);
  const variantStocks = formData.getAll("variantStock").map(String);

  const variants = variantPrices.map((price, i) => ({
    id: variantIds[i] || undefined,
    optionValue: variantValues[i]?.trim() || undefined,
    price,
    stock: variantStocks[i] ?? "0",
  }));

  return {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    optionName: String(formData.get("optionName") ?? ""),
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    imageUrls,
    variants,
  };
}

export async function saveProduct(
  productId: string | null,
  _prevState: ProductFormState | undefined,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();

  const parsed = productInputSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form" };
  }
  const input = parsed.data;

  let pricesPaisa: number[];
  try {
    pricesPaisa = input.variants.map((v) => rupeeStringToPaisa(v.price));
  } catch {
    return { error: "Prices must be numbers, e.g. 1550 or 1550.00" };
  }

  const slug = slugify(input.slug || input.name);
  if (!slug) return { error: "Could not derive a URL slug from that name" };

  const clash = await db.product.findFirst({
    where: { slug, ...(productId ? { NOT: { id: productId } } : {}) },
    select: { id: true },
  });
  if (clash) return { error: `Another product already uses the slug "${slug}"` };

  // A single unnamed variant means "no options"; that's how simple products are
  // represented, so optionName is only stored when there is something to pick.
  const hasOptions = input.variants.length > 1 || Boolean(input.variants[0]?.optionValue);
  const optionName = hasOptions ? input.optionName || "Option" : null;

  const data = {
    name: input.name,
    slug,
    description: input.description || null,
    categoryId: input.categoryId,
    isActive: input.isActive,
    isFeatured: input.isFeatured,
  };

  try {
    await db.$transaction(async (tx) => {
      const product = productId
        ? await tx.product.update({ where: { id: productId }, data })
        : await tx.product.create({ data });

      // Images are few and always fully replaced, so a delete-and-recreate is
      // simpler than diffing and costs nothing at this scale.
      await tx.productImage.deleteMany({ where: { productId: product.id } });
      if (input.imageUrls.length > 0) {
        await tx.productImage.createMany({
          data: input.imageUrls.map((url, i) => ({
            productId: product.id,
            url,
            alt: input.name,
            sortOrder: i,
          })),
        });
      }

      // Variants ARE diffed: their ids appear in historical order lines, so
      // deleting and recreating would sever that link.
      const keptIds = input.variants.map((v) => v.id).filter(Boolean) as string[];
      await tx.variant.deleteMany({
        where: { productId: product.id, NOT: { id: { in: keptIds } } },
      });

      for (const [i, variant] of input.variants.entries()) {
        const variantData = {
          optionName: hasOptions ? optionName : null,
          optionValue: hasOptions ? variant.optionValue ?? null : null,
          pricePaisa: pricesPaisa[i],
          stock: variant.stock,
          sortOrder: i,
        };

        if (variant.id) {
          await tx.variant.update({ where: { id: variant.id }, data: variantData });
        } else {
          await tx.variant.create({ data: { ...variantData, productId: product.id } });
        }
      }
    });
  } catch (error) {
    console.error("saveProduct failed", error);
    return { error: "Could not save the product. Please try again." };
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath(`/product/${slug}`);
  redirect("/admin/products");
}

export async function deleteProduct(productId: string) {
  await requireAdmin();

  // Order lines keep their own snapshot of name and price, and variantId is
  // nulled rather than cascaded, so past orders survive a product deletion.
  await db.product.delete({ where: { id: productId } });

  revalidatePath("/admin/products");
  revalidatePath("/shop");
}
