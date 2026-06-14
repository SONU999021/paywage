import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

const PF_EMPLOYEE_RATE = 0.12;
const PF_EMPLOYER_RATE = 0.12;
const ESI_EMPLOYEE_RATE = 0.0075;
const ESI_EMPLOYER_RATE = 0.0325;
const ESI_WAGE_LIMIT = 21000;

interface RuleCondition {
  field: string;
  operator: string;
  value: number | string;
}

interface RuleAction {
  type: string;
  value?: number | string;
}

function evaluateCondition(condition: RuleCondition, context: Record<string, number | string>): boolean {
  const fieldValue = context[condition.field];
  switch (condition.operator) {
    case '>': return Number(fieldValue) > Number(condition.value);
    case '>=': return Number(fieldValue) >= Number(condition.value);
    case '<': return Number(fieldValue) < Number(condition.value);
    case '==': return fieldValue === condition.value;
    case '!=': return fieldValue !== condition.value;
    default: return false;
  }
}

function applyRules(rules: { condition: unknown; action: unknown }[], context: Record<string, number | string>) {
  const deductions: { name: string; amount: number }[] = [];
  const earnings: { name: string; amount: number }[] = [];

  for (const rule of rules) {
    const condition = rule.condition as RuleCondition;
    const action = rule.action as RuleAction;
    if (!evaluateCondition(condition, context)) continue;

    if (action.type === 'DEDUCT_HALF_DAY') {
      const perDay = Number(context.perDaySalary) || 0;
      deductions.push({ name: 'Late Entry Deduction', amount: perDay / 2 });
    } else if (action.type === 'DEDUCT_FULL_DAY') {
      deductions.push({ name: 'Attendance Deduction', amount: Number(context.perDaySalary) || 0 });
    } else if (action.type === 'ADD_OVERTIME') {
      const rate = Number(context.overtimeRate) || 0;
      const hours = Number(context.overtimeHours) || 0;
      earnings.push({ name: 'Overtime Pay', amount: rate * hours });
    } else if (action.type === 'DEDUCT_UNPAID_LEAVE') {
      const days = Number(context.unpaidLeaveDays) || 0;
      deductions.push({ name: 'Unpaid Leave Deduction', amount: (Number(context.perDaySalary) || 0) * days });
    }
  }

  return { deductions, earnings };
}

export async function processPayroll(companyId: string, month: number, year: number) {
  const existing = await prisma.payrollRun.findUnique({
    where: { companyId_month_year: { companyId, month, year } },
  });
  if (existing?.status === 'LOCKED') throw new AppError(400, 'Payroll is locked for this period');

  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0);
  const workingDays = periodEnd.getDate();

  const employees = await prisma.employee.findMany({
    where: { companyId, status: 'ACTIVE' },
  });

  const rules = await prisma.payrollRule.findMany({
    where: { companyId, isActive: true },
    orderBy: { priority: 'asc' },
  });

  const payrollRun = existing || await prisma.payrollRun.create({
    data: { companyId, month, year, periodStart, periodEnd, status: 'PROCESSING' },
  });

  let totalGross = 0;
  let totalNet = 0;
  let totalPf = 0;
  let totalEsi = 0;

  for (const emp of employees) {
    const attendance = await prisma.attendance.findMany({
      where: {
        employeeId: emp.id,
        date: { gte: periodStart, lte: periodEnd },
      },
    });

    const presentDays = attendance.filter((a: { status: string }) => a.status === 'PRESENT').length;
    const halfDays = attendance.filter((a: { status: string }) => a.status === 'HALF_DAY').length;
    const absentDays = attendance.filter((a: { status: string }) => a.status === 'ABSENT').length;
    const effectivePresent = presentDays + halfDays * 0.5;
    const lateMinutes = attendance.reduce((s: number, a: { lateMinutes: number }) => s + a.lateMinutes, 0);
    const overtimeHours = attendance.reduce((s: number, a: { overtimeHours: unknown }) => s + Number(a.overtimeHours), 0);

    const grossMonthly = Number(emp.grossSalary);
    const perDaySalary = grossMonthly / workingDays;
    const earnedGross = perDaySalary * effectivePresent;

    const unpaidLeaves = await prisma.leaveRequest.count({
      where: {
        employeeId: emp.id,
        status: 'HR_APPROVED',
        leaveType: { isPaid: false },
        startDate: { lte: periodEnd },
        endDate: { gte: periodStart },
      },
    });

    const context: Record<string, number | string> = {
      lateMinutes,
      overtimeHours,
      perDaySalary,
      unpaidLeaveDays: unpaidLeaves,
      overtimeRate: perDaySalary / 8,
      absentDays,
    };

    const ruleResult = applyRules(rules, context);

    const earnings = [
      { name: 'Basic', amount: Number(emp.basicSalary) * (effectivePresent / workingDays) },
      { name: 'HRA', amount: Number(emp.hra) * (effectivePresent / workingDays) },
      { name: 'Special Allowance', amount: Number(emp.specialAllowance) * (effectivePresent / workingDays) },
      ...ruleResult.earnings,
    ];

    const grossSalary = earnings.reduce((s, e) => s + e.amount, 0);

    let pfEmployee = 0;
    let pfEmployer = 0;
    if (emp.pfEnabled) {
      const pfWages = Math.min(Number(emp.basicSalary), 15000) * (effectivePresent / workingDays);
      pfEmployee = pfWages * PF_EMPLOYEE_RATE;
      pfEmployer = pfWages * PF_EMPLOYER_RATE;
    }

    let esiEmployee = 0;
    let esiEmployer = 0;
    const isEsiEligible = emp.esiEnabled && grossMonthly <= ESI_WAGE_LIMIT;
    if (isEsiEligible) {
      esiEmployee = grossSalary * ESI_EMPLOYEE_RATE;
      esiEmployer = grossSalary * ESI_EMPLOYER_RATE;
    }

    const ptAmount = emp.ptEnabled ? 200 : 0;
    const deductions = [
      ...(pfEmployee > 0 ? [{ name: 'PF', amount: pfEmployee }] : []),
      ...(esiEmployee > 0 ? [{ name: 'ESI', amount: esiEmployee }] : []),
      ...(ptAmount > 0 ? [{ name: 'Professional Tax', amount: ptAmount }] : []),
      ...ruleResult.deductions,
    ];

    const netSalary = grossSalary - deductions.reduce((s, d) => s + d.amount, 0);

    await prisma.salarySlip.upsert({
      where: { payrollRunId_employeeId: { payrollRunId: payrollRun.id, employeeId: emp.id } },
      create: {
        payrollRunId: payrollRun.id,
        employeeId: emp.id,
        periodStart,
        periodEnd,
        workingDays,
        presentDays: effectivePresent,
        earnings,
        deductions,
        grossSalary,
        netSalary,
        pfEmployee,
        pfEmployer,
        esiEmployee,
        esiEmployer,
        ptAmount,
      },
      update: {
        workingDays,
        presentDays: effectivePresent,
        earnings,
        deductions,
        grossSalary,
        netSalary,
        pfEmployee,
        pfEmployer,
        esiEmployee,
        esiEmployer,
        ptAmount,
      },
    });

    if (emp.pfEnabled) {
      await prisma.pfRecord.upsert({
        where: { employeeId_month_year: { employeeId: emp.id, month, year } },
        create: {
          employeeId: emp.id,
          month,
          year,
          basicWages: Number(emp.basicSalary),
          employeeContrib: pfEmployee,
          employerContrib: pfEmployer,
          epsContrib: pfEmployer * 0.67,
          edliContrib: pfEmployer * 0.005,
          adminCharges: pfEmployer * 0.01,
        },
        update: {
          basicWages: Number(emp.basicSalary),
          employeeContrib: pfEmployee,
          employerContrib: pfEmployer,
        },
      });
    }

    if (isEsiEligible) {
      await prisma.esiRecord.upsert({
        where: { employeeId_month_year: { employeeId: emp.id, month, year } },
        create: {
          employeeId: emp.id,
          month,
          year,
          grossWages: grossSalary,
          employeeContrib: esiEmployee,
          employerContrib: esiEmployer,
          isEligible: true,
        },
        update: {
          grossWages: grossSalary,
          employeeContrib: esiEmployee,
          employerContrib: esiEmployer,
        },
      });
    }

    totalGross += grossSalary;
    totalNet += netSalary;
    totalPf += pfEmployee;
    totalEsi += esiEmployee;
  }

  const updated = await prisma.payrollRun.update({
    where: { id: payrollRun.id },
    data: {
      status: 'PROCESSED',
      totalGross,
      totalNet,
      totalPf,
      totalEsi,
      processedAt: new Date(),
    },
    include: { salarySlips: { include: { employee: true } } },
  });

  return updated;
}

export async function lockPayroll(companyId: string, payrollRunId: string) {
  const run = await prisma.payrollRun.findFirst({
    where: { id: payrollRunId, companyId },
  });
  if (!run) throw new AppError(404, 'Payroll run not found');
  if (run.status !== 'PROCESSED') throw new AppError(400, 'Payroll must be processed before locking');

  return prisma.payrollRun.update({
    where: { id: payrollRunId },
    data: { status: 'LOCKED', lockedAt: new Date() },
  });
}
