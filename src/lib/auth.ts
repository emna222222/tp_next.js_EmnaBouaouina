import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const ROLES = ["ADMIN", "ENSEIGNANT", "ETUDIANT"] as const;
export type Role = (typeof ROLES)[number];

function isRole(value: string): value is Role {
  return ROLES.includes(value as Role);
}

export class AuthorizationError extends Error {
  constructor(
    public readonly status: 401 | 403,
    message: string
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function requireRole(rolesAutorises: readonly Role[]) {
  const session = await getSession();

  if (!session) {
    throw new AuthorizationError(401, "Non authentifié");
  }

  // Le rôle est toujours relu en base à partir de l'identifiant de session.
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  if (!user) {
    throw new AuthorizationError(401, "Session invalide");
  }

  if (!isRole(user.role) || !rolesAutorises.includes(user.role)) {
    throw new AuthorizationError(403, "Accès interdit");
  }

  return user;
}
