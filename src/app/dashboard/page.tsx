import { redirect } from "next/navigation";
import { AuthorizationError, requireRole } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import LogoutButton from "@/components/LogoutButton";

export default async function DashboardPage() {
  let user: Awaited<ReturnType<typeof requireRole>>;
  try {
    user = await requireRole(["ADMIN", "ENSEIGNANT", "ETUDIANT"]);
  } catch (error) {
    if (error instanceof AuthorizationError && error.status === 401) {
      redirect("/login");
    }
    throw error;
  }

  const data = await getDashboardData(user);
  const highestRoleCount = Math.max(
    1,
    ...data.roleDistribution.map((item) => item.count)
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-300">Tableau de bord</p>
            <h1 className="mt-1 text-3xl font-bold">Bonjour {user.name} !</h1>
            <p className="mt-2 text-sm text-slate-300">
              {user.email} · {user.role}
            </p>
          </div>
          <LogoutButton />
        </header>

        <section aria-label="Indicateurs clés" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              {user.role === "ETUDIANT" ? "Mon profil étudiant" : "Total étudiants"}
            </p>
            <p className="mt-2 text-3xl font-bold">{data.totalStudents}</p>
            <p className="mt-1 text-sm text-slate-500">
              {user.role === "ETUDIANT"
                ? "Donnée limitée à votre compte"
                : "Étudiants accessibles selon votre rôle"}
            </p>
          </article>
          <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              Nouveaux sur 30 jours
            </p>
            <p className="mt-2 text-3xl font-bold">{data.studentsLast30Days}</p>
            <p className="mt-1 text-sm text-slate-500">Calcul dynamique depuis la base</p>
          </article>
          <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">Périmètre</p>
            <p className="mt-2 text-xl font-bold">
              {user.role === "ADMIN"
                ? "Vue globale"
                : user.role === "ENSEIGNANT"
                  ? "Données pédagogiques"
                  : "Données personnelles"}
            </p>
            <p className="mt-1 text-sm text-slate-500">Contrôlé côté serveur</p>
          </article>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Derniers étudiants</h2>
              <p className="mt-1 text-sm text-slate-500">
                Les cinq ajouts les plus récents dans votre périmètre.
              </p>
            </div>
            {data.recentStudents.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                Aucun étudiant à afficher pour le moment.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-3 font-semibold">Nom</th>
                      <th className="px-3 py-3 font-semibold">Email</th>
                      <th className="px-3 py-3 font-semibold">Ajouté le</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.recentStudents.map((student) => (
                      <tr key={student.id}>
                        <td className="px-3 py-3 font-medium">{student.name}</td>
                        <td className="px-3 py-3 text-slate-600">{student.email}</td>
                        <td className="px-3 py-3 text-slate-600">
                          {student.createdAt.toLocaleDateString("fr-FR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {user.role === "ADMIN" && (
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold">Répartition des comptes</h2>
              <p className="mt-1 text-sm text-slate-500">
                Vue globale réservée aux administrateurs.
              </p>
              {data.roleDistribution.length === 0 ? (
                <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                  Aucune donnée à représenter.
                </p>
              ) : (
                <div className="mt-5 space-y-4">
                  {data.roleDistribution.map((item) => (
                    <div key={item.role}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium">{item.role}</span>
                        <span className="text-slate-500">{item.count}</span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100">
                        <div
                          className="h-3 rounded-full bg-blue-600"
                          style={{
                            width: `${(item.count / highestRoleCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}