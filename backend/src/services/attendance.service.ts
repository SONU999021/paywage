import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';

export const attendanceSchema = z.object({
  employeeId: z.string(),
  date: z.string(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  breakMinutes: z.number().default(0),
  status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'HOLIDAY', 'WEEK_OFF']).default('PRESENT'),
  source: z.enum(['MANUAL', 'BIOMETRIC', 'EXCEL', 'API']).default('MANUAL'),
});

function calcWorkingHours(checkIn?: Date | null, checkOut?: Date | null, breakMinutes = 0): number {
  if (!checkIn || !checkOut) return 0;
  const diff = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
  return Math.max(0, diff - breakMinutes / 60);
}

export async function listAttendance(companyId: string, params: { date?: string; employeeId?: string; page?: number; limit?: number }) {
  const page = params.page || 1;
  const limit = params.limit || 50;
  const skip = (page - 1) * limit;

  const where = {
    employee: { companyId },
    ...(params.employeeId && { employeeId: params.employeeId }),
    ...(params.date && { date: new Date(params.date) }),
  };

  const [records, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
      include: { employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true } } },
    }),
    prisma.attendance.count({ where }),
  ]);

  return { records, total, page, limit };
}

export async function upsertAttendance(companyId: string, data: z.infer<typeof attendanceSchema>) {
  const employee = await prisma.employee.findFirst({
    where: { id: data.employeeId, companyId },
  });
  if (!employee) throw new AppError(404, 'Employee not found');

  const checkIn = data.checkIn ? new Date(`${data.date}T${data.checkIn}`) : null;
  const checkOut = data.checkOut ? new Date(`${data.date}T${data.checkOut}`) : null;
  const workingHours = calcWorkingHours(checkIn, checkOut, data.breakMinutes);

  let lateMinutes = 0;
  if (checkIn) {
    const standardStart = new Date(`${data.date}T09:30:00`);
    if (checkIn > standardStart) {
      lateMinutes = Math.floor((checkIn.getTime() - standardStart.getTime()) / 60000);
    }
  }

  return prisma.attendance.upsert({
    where: {
      employeeId_date: { employeeId: data.employeeId, date: new Date(data.date) },
    },
    create: {
      ...data,
      date: new Date(data.date),
      checkIn,
      checkOut,
      workingHours,
      lateMinutes,
      overtimeHours: Math.max(0, workingHours - 8),
    },
    update: {
      checkIn,
      checkOut,
      breakMinutes: data.breakMinutes,
      status: data.status,
      source: data.source,
      workingHours,
      lateMinutes,
      overtimeHours: Math.max(0, workingHours - 8),
    },
    include: { employee: true },
  });
}

export async function bulkImportAttendance(companyId: string, records: z.infer<typeof attendanceSchema>[]) {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const record of records) {
    try {
      await upsertAttendance(companyId, record);
      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push(`${record.employeeId}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return results;
}
