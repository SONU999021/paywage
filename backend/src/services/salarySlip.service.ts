import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getSalarySlip(companyId: string, slipId: string) {
  const slip = await prisma.salarySlip.findFirst({
    where: { id: slipId, employee: { companyId } },
    include: {
      employee: { include: { department: true } },
      payrollRun: { include: { company: true } },
    },
  });
  if (!slip) throw new AppError(404, 'Salary slip not found');
  return slip;
}

export async function generateSalarySlipPdf(companyId: string, slipId: string): Promise<Buffer> {
  const slip = await getSalarySlip(companyId, slipId);
  const company = slip.payrollRun.company;
  const emp = slip.employee;

  const verificationUrl = `https://paywager.app/verify/${slip.id}`;
  const qrDataUrl = await QRCode.toDataURL(verificationUrl);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).fillColor('#2563EB').text(company.name, { align: 'center' });
    doc.fontSize(10).fillColor('#0F172A').text(company.address, { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text('SALARY SLIP', { align: 'center', underline: true });
    doc.moveDown();

    const period = `${slip.periodStart.toLocaleDateString()} - ${slip.periodEnd.toLocaleDateString()}`;
    doc.fontSize(10);
    doc.text(`Employee: ${emp.firstName} ${emp.lastName} (${emp.employeeCode})`);
    doc.text(`Department: ${emp.department?.name || 'N/A'} | Designation: ${emp.designation || 'N/A'}`);
    doc.text(`Pay Period: ${period}`);
    doc.text(`Working Days: ${slip.workingDays} | Present: ${slip.presentDays}`);
    doc.moveDown();

    const earnings = slip.earnings as { name: string; amount: number }[];
    const deductions = slip.deductions as { name: string; amount: number }[];

    doc.fontSize(12).fillColor('#2563EB').text('EARNINGS');
    doc.fontSize(10).fillColor('#0F172A');
    earnings.forEach((e) => doc.text(`${e.name}: ₹${e.amount.toFixed(2)}`));
    doc.moveDown();

    doc.fontSize(12).fillColor('#2563EB').text('DEDUCTIONS');
    doc.fontSize(10).fillColor('#0F172A');
    deductions.forEach((d) => doc.text(`${d.name}: ₹${d.amount.toFixed(2)}`));
    doc.moveDown();

    doc.fontSize(14).fillColor('#10B981').text(`Net Salary: ₹${Number(slip.netSalary).toFixed(2)}`, { align: 'right' });
    doc.moveDown();

    if (emp.bankName) {
      doc.fontSize(10).fillColor('#0F172A');
      doc.text(`Bank: ${emp.bankName} | A/C: ${emp.accountNumber} | IFSC: ${emp.ifsc}`);
    }

    doc.moveDown(2);
    doc.text('Authorized Signatory', { align: 'right' });
    doc.fontSize(8).fillColor('#64748B').text('Scan QR to verify authenticity', { align: 'center' });

    doc.end();
  });
}

export async function listSalarySlips(companyId: string, params: { employeeId?: string; month?: number; year?: number }) {
  return prisma.salarySlip.findMany({
    where: {
      employee: { companyId },
      ...(params.employeeId && { employeeId: params.employeeId }),
      ...(params.month && params.year && {
        payrollRun: { month: params.month, year: params.year },
      }),
    },
    include: {
      employee: { select: { employeeCode: true, firstName: true, lastName: true } },
      payrollRun: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}
