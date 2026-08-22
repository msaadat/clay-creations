import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Categories</h1>
        <Link
          href="/admin/categories/new"
          className="rounded-full bg-accent px-5 py-2.5 text-sm text-white hover:bg-accent-hover"
        >
          Add category
        </Link>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
        Order here sets the order in the shop header and on the home page. The first category
        fills the home page hero.
      </p>

      {categories.length === 0 ? (
        <p className="mt-12 text-muted-foreground">No categories yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Products</th>
                <th className="px-4 py-3 font-medium">Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {category.imageUrl && (
                          <Image
                            src={category.imageUrl}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/admin/categories/${category.id}`}
                          className="font-medium text-accent hover:underline"
                        >
                          {category.name}
                        </Link>
                        {category.description && (
                          <div className="line-clamp-1 max-w-sm text-xs text-muted-foreground">
                            {category.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{category.slug}</code>
                  </td>
                  <td className="px-4 py-3">{category._count.products}</td>
                  <td className="px-4 py-3 text-muted-foreground">{category.sortOrder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
