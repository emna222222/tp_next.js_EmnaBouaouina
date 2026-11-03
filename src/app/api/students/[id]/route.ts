import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AuthorizationError, requireRole } from "@/lib/auth";
import { studentPatchSchema } from "@/lib/validation";

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

async function getStudentId(params: Promise<{ id: string }>) {
  const { id } = await params;
  const studentId = Number(id);

  if (!Number.isInteger(studentId) || studentId <= 0) {
    return null;
  }

  return studentId;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["ADMIN", "ENSEIGNANT"]);
    const studentId = await getStudentId(params);
    if (!studentId) {
      return NextResponse.json(
        { error: "Identifiant étudiant invalide" },
        { status: 400 }
      );
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true },
    });
    if (!student || student.role !== "ETUDIANT") {
      return NextResponse.json(
        { error: "Étudiant introuvable" },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = studentPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    if (
      user.role === "ENSEIGNANT"
      && Object.keys(parsed.data).some(
        (key) => key !== "name" && key !== "email"
      )
    ) {
      return NextResponse.json(
        { error: "Un enseignant peut uniquement modifier le nom et l'email" },
        { status: 403 }
      );
    }

    if (parsed.data.email) {
      const existing = await prisma.user.findUnique({
        where: { email: parsed.data.email },
        select: { id: true },
      });
      if (existing && existing.id !== studentId) {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé" },
          { status: 409 }
        );
      }
    }

    const { password, ...fields } = parsed.data;
    const data = password
      ? { ...fields, password: await bcrypt.hash(password, 10) }
      : fields;

    const updatedStudent = await prisma.user.update({
      where: { id: studentId },
      data,
      select: publicUserSelect,
    });

    return NextResponse.json(updatedStudent);
  } catch (error) {
    return authorizationResponse(error)
      ?? NextResponse.json(
        { error: "Erreur interne du serveur" },
        { status: 500 }
      );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN"]);
    const studentId = await getStudentId(params);
    if (!studentId) {
      return NextResponse.json(
        { error: "Identifiant étudiant invalide" },
        { status: 400 }
      );
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true },
    });
    if (!student || student.role !== "ETUDIANT") {
      return NextResponse.json(
        { error: "Étudiant introuvable" },
        { status: 404 }
      );
    }

    await prisma.user.delete({ where: { id: studentId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return authorizationResponse(error)
      ?? NextResponse.json(
        { error: "Erreur interne du serveur" },
        { status: 500 }
      );
  }
}
