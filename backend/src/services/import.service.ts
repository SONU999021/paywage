import * as XLSX from 'xlsx';
import { prisma } from '../config/database.js';
import { createEmployee } from './employee.service.js';

export interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; message: string }[];
}

export function parseExcelBuffer(buffer: Buffer): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
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
      employeeId: 'employee-id-here',
      date: '2026-06-01',
      checkIn: '09:30',
      checkOut: '18:30',
      status: 'PRESENT',
    }],
  };

  const ws = XLSX.utils.json_to_sheet(samples[type] || samples.employees);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sample');
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}
