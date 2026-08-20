"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function login(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const admin = await db.adminUser.findUnique({ where: { email } });

  // Hash even when the user doesn't exist, so response time doesn't reveal
  // which emails are registered.
  const hash = admin?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva";
  const valid = await bcrypt.compare(password, hash);

  if (!admin || !valid) {
    return { error: "Incorrect email or password." };
  }

  await createSession(admin.id);
  redirect("/admin");
}
