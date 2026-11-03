import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AuthorizationError, requireRole } from "@/lib/auth";
import { studentCreateSchema } from "@/lib/validation";

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

function authorizationResponse(error: unknown) {
  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }

  return null;
}

export async function GET() {
  try {
    const user = await requireRole(["ADMIN", "ENSEIGNANT", "ETUDIANT"]);

    const students = user.role === "ETUDIANT"
      ? await prisma.user.findMany({
          where: { id: user.id, role: "ETUDIANT" },
          select: publicUserSelect,
        })
      : await prisma.user.findMany({
          where: { role: "ETUDIANT" },
          select: publicUserSelect,
          orderBy: { id: "asc" },
        });

    return NextResponse.json(students);
  } catch (error) {
    return authorizationResponse(error)
      ?? NextResponse.json(
        { error: "Erreur interne du serveur" },
        { status: 500 }
      );
  }
}

export async function POST(req: Request) {
  try {
    await requireRole(["ADMIN"]);

    const body = await req.json().catch(() => null);
    const parsed = studentCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: await bcrypt.hash(password, 10),
        role: "ETUDIANT",
      },
      select: publicUserSelect,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return authorizationResponse(error)
      ?? NextResponse.json(
        { error: "Erreur interne du serveur" },
        { status: 500 }
      );
  }
}
