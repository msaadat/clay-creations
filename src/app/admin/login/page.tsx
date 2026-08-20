import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin sign in" };

export default async function AdminLoginPage() {
  if (await getCurrentAdmin()) redirect("/admin");

  return (
    <div className="mx-auto flex max-w-sm flex-col justify-center px-4 py-20">
      <h1 className="font-display text-3xl">Admin sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Manage products, stock and orders.
      </p>
      <LoginForm />
    </div>
  );
}
