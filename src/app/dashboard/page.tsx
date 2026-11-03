import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import LogoutButton from "@/components/LogoutButton";
import StudentsPanel from "@/components/StudentsPanel";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, role: true, createdAt: true },
  });

  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-12">
      <h1 className="text-2xl font-bold">Bonjour {user.name} !</h1>
      <p>Email : {user.email}</p>
      <p>Rôle : {user.role}</p>
      <p>
        Membre depuis le {user.createdAt.toLocaleDateString("fr-FR")}
      </p>
      <LogoutButton />
      <StudentsPanel role={user.role as "ADMIN" | "ENSEIGNANT" | "ETUDIANT"} />
    </main>
  );
}