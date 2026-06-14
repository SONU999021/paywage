import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';

export const leaveTypeSchema = z.object({
  name: z.string().min(1),
  isPaid: z.boolean().default(true),
  annualAllocation: z.number().default(0),
  carryForward: z.boolean().default(false),
  encashmentAllowed: z.boolean().default(false),
  approvalRequired: z.boolean().default(true),
});

export const leaveRequestSchema = z.object({
  employeeId: z.string(),
  leaveTypeId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().optional(),
});

export async function listLeaveTypes(companyId: string) {
  return prisma.leaveType.findMany({
    where: { companyId, isActive: true },
    orderBy: { name: 'asc' },
  });
}

export async function createLeaveType(companyId: string, data: z.infer<typeof leaveTypeSchema>) {
  return prisma.leaveType.create({ data: { companyId, ...data } });
}

export async function listLeaveRequests(companyId: string, params: { status?: string; employeeId?: string }) {
  return prisma.leaveRequest.findMany({
    where: {
      employee: { companyId },
      ...(params.status && { status: params.status as 'PENDING' }),
      ...(params.employeeId && { employeeId: params.employeeId }),
    },
    include: {
      employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
      leaveType: true,
      approver: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function applyLeave(companyId: string, data: z.infer<typeof leaveRequestSchema>) {
  const employee = await prisma.employee.findFirst({
    where: { id: data.employeeId, companyId },
  });
  if (!employee) throw new AppError(404, 'Employee not found');

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return prisma.leaveRequest.create({
    data: {
      employeeId: data.employeeId,
      leaveTypeId: data.leaveTypeId,
      startDate: start,
      endDate: end,
      days,
      reason: data.reason,
    },
    include: { leaveType: true, employee: true },
  });
}

export async function approveLeave(companyId: string, requestId: string, approverId: string, role: string) {
  const request = await prisma.leaveRequest.findFirst({
    where: { id: requestId, employee: { companyId } },
    include: { leaveType: true },
  });
  if (!request) throw new AppError(404, 'Leave request not found');

  const newStatus = role === 'REPORTING_MANAGER' ? 'MANAGER_APPROVED' : 'HR_APPROVED';

  const updated = await prisma.leaveRequest.update({
    where: { id: requestId },
    data: { status: newStatus, approverId, approvedAt: new Date() },
    include: { employee: true, leaveType: true },
  });

  if (newStatus === 'HR_APPROVED') {
    const year = new Date().getFullYear();
    await prisma.leaveBalance.upsert({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year,
        },
      },
      create: {
        employeeId: request.employeeId,
        leaveTypeId: request.leaveTypeId,
        year,
        allocated: request.leaveType.annualAllocation,
        used: Number(request.days),
        balance: request.leaveType.annualAllocation - Number(request.days),
      },
      update: {
        used: { increment: Number(request.days) },
        balance: { decrement: Number(request.days) },
      },
    });
  }

  return updated;
}

export async function rejectLeave(companyId: string, requestId: string, approverId: string) {
  const request = await prisma.leaveRequest.findFirst({
    where: { id: requestId, employee: { companyId } },
  });
  if (!request) throw new AppError(404, 'Leave request not found');

  return prisma.leaveRequest.update({
    where: { id: requestId },
    data: { status: 'REJECTED', approverId, rejectedAt: new Date() },
  });
}
