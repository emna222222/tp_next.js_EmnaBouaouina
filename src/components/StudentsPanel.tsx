"use client";

import { FormEvent, useEffect, useState } from "react";

type Role = "ADMIN" | "ENSEIGNANT" | "ETUDIANT";

type Student = {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
};

type StudentsPanelProps = {
  role: Role;
};

export default function StudentsPanel({ role }: StudentsPanelProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [editing, setEditing] = useState<Student | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadStudents() {
    setError("");
    const response = await fetch("/api/students");
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(`${response.status} : ${data.error ?? "Erreur de chargement"}`);
      return;
    }

    setStudents(data);
  }

  useEffect(() => {
    loadStudents().finally(() => setLoading(false));
  }, []);

  async function submitStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const body: Record<string, string> = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
    };
    const password = String(formData.get("password") ?? "");
    const selectedRole = String(formData.get("role") ?? "");

    if (password) body.password = password;
    if (role === "ADMIN" && selectedRole) body.role = selectedRole;

    const response = await fetch(
      editing ? `/api/students/${editing.id}` : "/api/students",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(`${response.status} : ${data.error ?? "Opération refusée"}`);
    } else {
      event.currentTarget.reset();
      setEditing(null);
      await loadStudents();
    }

    setSaving(false);
  }

  async function deleteStudent(studentId: number) {
    setError("");
    const response = await fetch(`/api/students/${studentId}`, {
      method: "DELETE",
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(`${response.status} : ${data.error ?? "Suppression refusée"}`);
      return;
    }

    await loadStudents();
  }

  if (loading) return <p>Chargement des étudiants...</p>;

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Étudiants</h2>
        <p className="text-sm text-gray-600">
          {role === "ETUDIANT"
            ? "Vous consultez uniquement vos propres données."
            : "Les données affichées sont filtrées côté serveur."}
        </p>
      </div>

      {error && (
        <p className="rounded border border-red-300 bg-red-50 p-2 text-red-700">
          {error}
        </p>
      )}

      {(role === "ADMIN" || role === "ENSEIGNANT") && (
        <div className="space-y-3">
          <h3 className="font-semibold">
            {editing ? "Modifier un étudiant" : "Créer un étudiant"}
          </h3>
          <form onSubmit={submitStudent} className="grid gap-2 sm:grid-cols-2">
            <input
              name="name"
              placeholder="Nom"
              defaultValue={editing?.name ?? ""}
              required
              className="rounded border p-2"
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              defaultValue={editing?.email ?? ""}
              required
              className="rounded border p-2"
            />
            {role === "ADMIN" && !editing && (
              <input
                name="password"
                type="password"
                placeholder="Mot de passe"
                required
                className="rounded border p-2"
              />
            )}
            {role === "ADMIN" && editing && (
              <>
                <input
                  name="password"
                  type="password"
                  placeholder="Nouveau mot de passe (facultatif)"
                  className="rounded border p-2"
                />
                <select
                  name="role"
                  defaultValue={editing.role}
                  className="rounded border p-2"
                >
                  <option value="ETUDIANT">ETUDIANT</option>
                  <option value="ENSEIGNANT">ENSEIGNANT</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </>
            )}
            <div className="flex gap-2 sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded bg-blue-600 px-3 py-2 text-white"
              >
                {saving ? "Enregistrement..." : editing ? "Modifier" : "Créer"}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded border px-3 py-2"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="space-y-2">
        {students.map((student) => (
          <article key={student.id} className="rounded border p-3">
            <p className="font-semibold">{student.name}</p>
            <p>{student.email}</p>
            <p className="text-sm text-gray-600">Rôle : {student.role}</p>
            {(role === "ADMIN" || role === "ENSEIGNANT") && (
              <button
                type="button"
                onClick={() => setEditing(student)}
                className="mt-2 rounded border px-3 py-1"
              >
                Modifier
              </button>
            )}
            {role === "ADMIN" && (
              <button
                type="button"
                onClick={() => deleteStudent(student.id)}
                className="ml-2 mt-2 rounded bg-red-600 px-3 py-1 text-white"
              >
                Supprimer
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
