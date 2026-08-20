"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, {});

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          className="mt-1.5 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Password</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1.5 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
        />
      </label>

      {state?.error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-accent px-6 py-3 text-sm text-white transition hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
