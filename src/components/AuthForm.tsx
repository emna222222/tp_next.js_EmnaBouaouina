"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

type AuthFormProps = {
  mode: "login" | "register";
};

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      ...(mode === "register" && { name: formData.get("name") }),
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Une erreur est survenue");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  const cls = "w-full rounded border p-2";

  return <form onSubmit={onSubmit} className="flex max-w-sm flex-col gap-2">
      {mode === "register" && (
        <input name="name" placeholder="Nom" required className={cls} />
      )}
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        className={cls}
      />
      <input
        name="password"
        type="password"
        placeholder="Mot de passe"
        required
        className={cls}
      />
      {error && <p className="text-red-600">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading
          ? "Patientez..."
          : mode === "login"
            ? "Se connecter"
            : "S'inscrire"}
      </button>
    </form>
}