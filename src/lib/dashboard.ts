import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/auth";

const studentSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
} as const;

export type DashboardUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
};

export type DashboardData = {
  totalStudents: number;
  studentsLast30Days: number;
  recentStudents: Array<{
    id: number;
    name: string;
    email: string;
    createdAt: Date;
  }>;
  roleDistribution: Array<{
    role: string;
    count: number;
  }>;
};

export async function getDashboardData(
  user: DashboardUser
): Promise<DashboardData> {
  const studentScope =
    user.role === "ETUDIANT"
      ? { id: user.id, role: "ETUDIANT" }
      : { role: "ETUDIANT" };
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalStudents, studentsLast30Days, recentStudents, roleGroups] =
    await Promise.all([
      prisma.user.count({ where: studentScope }),
      prisma.user.count({
        where: {
          ...studentScope,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.user.findMany({
        where: studentScope,
        select: studentSelect,
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      user.role === "ADMIN"
        ? prisma.user.groupBy({
            by: ["role"],
            _count: { _all: true },
            orderBy: { role: "asc" },
          })
        : Promise.resolve([]),
    ]);

  return {
    totalStudents,
    studentsLast30Days,
    recentStudents,
    roleDistribution: roleGroups.map((group) => ({
      role: group.role,
      count: group._count._all,
    })),
  };
}
