import { prisma } from '../config/database.js';

export async function getDashboardStats(companyId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const [
    totalEmployees,
    presentToday,
    absentToday,
    onLeaveToday,
    pendingPayroll,
    currentPayroll,
    pfLiability,
    esiLiability,
    recentAudit,
    upcomingBirthdays,
    upcomingAnniversaries,
  ] = await Promise.all([
    prisma.employee.count({ where: { companyId, status: 'ACTIVE' } }),
    prisma.attendance.count({
      where: { date: today, status: 'PRESENT', employee: { companyId } },
    }),
    prisma.attendance.count({
      where: { date: today, status: 'ABSENT', employee: { companyId } },
    }),
    prisma.leaveRequest.count({
      where: {
        status: 'HR_APPROVED',
        startDate: { lte: today },
        endDate: { gte: today },
        employee: { companyId },
      },
    }),
    prisma.payrollRun.count({
      where: { companyId, status: { in: ['DRAFT', 'PROCESSING'] } },
    }),
    prisma.payrollRun.findFirst({
      where: { companyId, month, year },
    }),
    prisma.pfRecord.aggregate({
      where: { employee: { companyId }, month, year },
      _sum: { employeeContrib: true, employerContrib: true },
    }),
    prisma.esiRecord.aggregate({
      where: { employee: { companyId }, month, year },
      _sum: { employeeContrib: true, employerContrib: true },
    }),
    prisma.auditLog.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    }),
    prisma.employee.findMany({
      where: {
        companyId,
        status: 'ACTIVE',
        dateOfBirth: { not: null },
      },
      take: 5,
    }),
    prisma.employee.findMany({
      where: {
        companyId,
        status: 'ACTIVE',
        dateOfJoining: { not: null },
      },
      take: 5,
    }),
  ]);

  const pfTotal =
    Number(pfLiability._sum.employeeContrib || 0) + Number(pfLiability._sum.employerContrib || 0);
  const esiTotal =
    Number(esiLiability._sum.employeeContrib || 0) + Number(esiLiability._sum.employerContrib || 0);

  return {
    totalEmployees,
    presentToday,
    absentToday,
    onLeaveToday,
    pendingPayroll,
    monthlyPayrollCost: Number(currentPayroll?.totalNet || 0),
    pfLiability: pfTotal,
    esiLiability: esiTotal,
    recentActivities: recentAudit,
    upcomingBirthdays: upcomingBirthdays.filter((e: { dateOfBirth: Date | null }) => {
      if (!e.dateOfBirth) return false;
      const dob = new Date(e.dateOfBirth);
      return dob.getMonth() === today.getMonth();
    }),
    upcomingAnniversaries: upcomingAnniversaries.filter((e: { dateOfJoining: Date | null }) => {
      if (!e.dateOfJoining) return false;
      const doj = new Date(e.dateOfJoining);
      return doj.getMonth() === today.getMonth();
    }),
  };
}
