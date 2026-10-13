import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export default function RegisterPage() {
  return (
    <main className="flex flex-col items-center gap-4 pt-24">
      <h1 className="text-2xl font-bold">Inscription</h1>
      <AuthForm mode="register" />
      <Link href="/login">Déjà un compte ?</Link>
    </main>
  );
}