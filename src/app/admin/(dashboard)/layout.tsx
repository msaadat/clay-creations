import Link from "next/link";
import { redirect } from "next/navigation";
import { destroySession, getCurrentAdmin } from "@/lib/auth";

/**
 * Guards every admin route. /admin/login deliberately sits outside this route
 * group so it stays reachable when signed out.
 *
 * The check runs here rather than in middleware so it executes on the Node
 * runtime with direct database access.
 */
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  async function signOut() {
    "use server";
    await destroySession();
    redirect("/admin/login");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center gap-4 border-b border-border pb-4">
        <Link href="/admin" className="font-display text-2xl">
          Admin
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin" className="text-muted-foreground hover:text-accent">
            Orders
          </Link>
          <Link href="/admin/products" className="text-muted-foreground hover:text-accent">
            Products
          </Link>
          <Link href="/admin/categories" className="text-muted-foreground hover:text-accent">
            Categories
          </Link>
          <Link href="/" className="text-muted-foreground hover:text-accent">
            View shop
          </Link>
        </nav>

        <form action={signOut} className="ml-auto flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{admin.email}</span>
          <button type="submit" className="text-sm text-muted-foreground hover:text-accent">
            Sign out
          </button>
        </form>
      </div>

      <div className="pt-8">{children}</div>
    </div>
  );
}
