import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';

export const employeeSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  fatherName: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  bloodGroup: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  aadhaar: z.string().optional(),
  pan: z.string().optional(),
  departmentId: z.string().optional(),
  designation: z.string().optional(),
  branchId: z.string().optional(),
  managerId: z.string().optional(),
  dateOfJoining: z.string().optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']).optional(),
  probationMonths: z.number().optional(),
  noticePeriodDays: z.number().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_NOTICE', 'TERMINATED']).optional(),
  basicSalary: z.number().default(0),
  hra: z.number().default(0),
  specialAllowance: z.number().default(0),
  conveyance: z.number().default(0),
  medical: z.number().default(0),
  otherAllowances: z.number().default(0),
  pfEnabled: z.boolean().default(true),
  esiEnabled: z.boolean().default(false),
  lwfEnabled: z.boolean().default(false),
  ptEnabled: z.boolean().default(true),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifsc: z.string().optional(),
  bankBranch: z.string().optional(),
  accountHolderName: z.string().optional(),
});

async function generateEmployeeCode(companyId: string): Promise<string> {
  const count = await prisma.employee.count({ where: { companyId } });
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  const prefix = company?.name.substring(0, 3).toUpperCase() || 'EMP';
  return `${prefix}${String(count + 1).padStart(4, '0')}`;
}

function calcGross(data: { basicSalary: number; hra: number; specialAllowance: number; conveyance: number; medical: number; otherAllowances: number }) {
  return data.basicSalary + data.hra + data.specialAllowance + data.conveyance + data.medical + data.otherAllowances;
}

export async function listEmployees(companyId: string, params: { search?: string; page?: number; limit?: number; departmentId?: string; status?: string }) {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const where = {
    companyId,
    ...(params.departmentId && { departmentId: params.departmentId }),
    ...(params.status && { status: params.status as 'ACTIVE' }),
    ...(params.search && {
      OR: [
        { firstName: { contains: params.search, mode: 'insensitive' as const } },
        { lastName: { contains: params.search, mode: 'insensitive' as const } },
        { employeeCode: { contains: params.search, mode: 'insensitive' as const } },
        { email: { contains: params.search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { department: true, branch: true, manager: { select: { id: true, firstName: true, lastName: true } } },
    }),
    prisma.employee.count({ where }),
  ]);

  return { employees, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getEmployee(companyId: string, id: string) {
  const employee = await prisma.employee.findFirst({
    where: { id, companyId },
    include: { department: true, branch: true, manager: true },
  });
  if (!employee) throw new AppError(404, 'Employee not found');
  return employee;
}

export async function createEmployee(companyId: string, data: z.infer<typeof employeeSchema>) {
  const employeeCode = await generateEmployeeCode(companyId);
  const grossSalary = calcGross(data);
  const ctc = grossSalary * 12;

  return prisma.employee.create({
    data: {
      companyId,
      employeeCode,
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      dateOfJoining: data.dateOfJoining ? new Date(data.dateOfJoining) : undefined,
      grossSalary,
      ctc,
    },
    include: { department: true, branch: true },
  });
}

export async function updateEmployee(companyId: string, id: string, data: Partial<z.infer<typeof employeeSchema>>) {
  const existing = await getEmployee(companyId, id);
  const merged = { ...existing, ...data };
  const grossSalary = calcGross({
    basicSalary: Number(merged.basicSalary),
    hra: Number(merged.hra),
    specialAllowance: Number(merged.specialAllowance),
    conveyance: Number(merged.conveyance),
    medical: Number(merged.medical),
    otherAllowances: Number(merged.otherAllowances),
  });

  return prisma.employee.update({
    where: { id },
    data: {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      dateOfJoining: data.dateOfJoining ? new Date(data.dateOfJoining) : undefined,
      grossSalary,
      ctc: grossSalary * 12,
    },
    include: { department: true, branch: true },
  });
}

export async function deleteEmployee(companyId: string, id: string) {
  await getEmployee(companyId, id);
  await prisma.employee.delete({ where: { id } });
  return { message: 'Employee deleted' };
}
