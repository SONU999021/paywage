import * as XLSX from 'xlsx';
import { prisma } from '../config/database.js';
import { createEmployee } from './employee.service.js';
import { upsertAttendance } from './attendance.service.js';

export interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; message: string }[];
}

const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'HOLIDAY', 'WEEK_OFF'] as const;

function getCell(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const val = row[key];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return String(val).trim();
    }
  }
  return '';
}

export function parseExcelBuffer(buffer: Buffer): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
}

export async function importAttendance(companyId: string, rows: Record<string, unknown>[]): Promise<ImportResult> {
  const result: ImportResult = { success: 0, failed: 0, errors: [] };

  if (rows.length === 0) {
    result.failed = 1;
    result.errors.push({ row: 0, message: 'File is empty' });
    return result;
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const employeeCode = getCell(row, 'employeeCode', 'Employee Code', 'employeeId', 'Employee ID');
    const date = getCell(row, 'date', 'Date', 'Attendance Date');

    if (!employeeCode) {
      result.failed++;
      result.errors.push({ row: i + 2, message: 'Employee Code is required' });
      continue;
    }
    if (!date) {
      result.failed++;
      result.errors.push({ row: i + 2, message: 'Attendance date is required' });
      continue;
    }

    const employee = await prisma.employee.findFirst({
      where: {
        companyId,
        OR: [{ employeeCode }, { id: employeeCode }],
      },
    });

    if (!employee) {
      result.failed++;
      result.errors.push({ row: i + 2, message: `Employee not found: ${employeeCode}` });
      continue;
    }

    const statusRaw = getCell(row, 'status', 'Status').toUpperCase() || 'PRESENT';
    if (!ATTENDANCE_STATUSES.includes(statusRaw as typeof ATTENDANCE_STATUSES[number])) {
      result.failed++;
      result.errors.push({ row: i + 2, message: `Invalid status: ${statusRaw}` });
      continue;
    }

    try {
      await upsertAttendance(companyId, {
        employeeId: employee.id,
        date,
        checkIn: getCell(row, 'checkIn', 'Check In', 'Check-In') || undefined,
        checkOut: getCell(row, 'checkOut', 'Check Out', 'Check-Out') || undefined,
        status: statusRaw as typeof ATTENDANCE_STATUSES[number],
        source: 'EXCEL',
        breakMinutes: 0,
      });
      result.success++;
    } catch (err) {
      result.failed++;
      result.errors.push({ row: i + 2, message: err instanceof Error ? err.message : 'Import failed' });
    }
  }

  return result;
}

export async function importEmployees(companyId: string, rows: Record<string, unknown>[]): Promise<ImportResult> {
  const result: ImportResult = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      await createEmployee(companyId, {
        firstName: String(row.firstName || row['First Name'] || ''),
        lastName: String(row.lastName || row['Last Name'] || ''),
        fatherName: String(row.fatherName || row['Father Name'] || ''),
        gender: String(row.gender || row.Gender || ''),
        mobile: String(row.mobile || row.Mobile || ''),
        email: String(row.email || row.Email || ''),
        designation: String(row.designation || row.Designation || ''),
        basicSalary: Number(row.basicSalary || row['Basic Salary'] || 0),
        hra: Number(row.hra || row.HRA || 0),
        specialAllowance: Number(row.specialAllowance || row['Special Allowance'] || 0),
        conveyance: 0,
        medical: 0,
        otherAllowances: 0,
        pfEnabled: true,
        esiEnabled: false,
        lwfEnabled: false,
        ptEnabled: true,
        pan: String(row.pan || row.PAN || ''),
        aadhaar: String(row.aadhaar || row.Aadhaar || ''),
        bankName: String(row.bankName || row['Bank Name'] || ''),
        accountNumber: String(row.accountNumber || row['Account Number'] || ''),
        ifsc: String(row.ifsc || row.IFSC || ''),
      });
      result.success++;
    } catch (err) {
      result.failed++;
      result.errors.push({ row: i + 2, message: err instanceof Error ? err.message : 'Import failed' });
    }
  }

  return result;
}

export function getSampleFormat(type: string): Buffer {
  const samples: Record<string, object[]> = {
    employees: [{
      'First Name': 'John',
      'Last Name': 'Doe',
      'Father Name': 'Richard Doe',
      Gender: 'M',
      Mobile: '9876543210',
      Email: 'john@company.com',
      Designation: 'Software Engineer',
      'Basic Salary': 30000,
      HRA: 12000,
      'Special Allowance': 8000,
      PAN: 'ABCDE1234F',
      Aadhaar: '123456789012',
      'Bank Name': 'HDFC Bank',
      'Account Number': '1234567890',
      IFSC: 'HDFC0001234',
    }],
    attendance: [{
      'Employee Code': 'DEMO0001',
      Date: '2026-06-01',
      'Check In': '09:30',
      'Check Out': '18:30',
      Status: 'PRESENT',
    }],
  };

  const ws = XLSX.utils.json_to_sheet(samples[type] || samples.employees);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sample');
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}
