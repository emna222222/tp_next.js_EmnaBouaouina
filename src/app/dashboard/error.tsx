"use client";

export default function DashboardError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-slate-900">
        Impossible de charger le tableau de bord
      </h1>
      <p className="mt-2 text-slate-600">
        Une erreur est survenue. Réessayez ou reconnectez-vous.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
      >
        Réessayer
      </button>
    </main>
  );
}
