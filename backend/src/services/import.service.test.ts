import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseExcelBuffer } from './import.service.js';

describe('import.service', () => {
  it('parseExcelBuffer returns rows from xlsx buffer', () => {
    const ws = XLSX.utils.json_to_sheet([
      { 'Employee Code': 'EMP001', Date: '2026-06-01', Status: 'PRESENT' },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buffer = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
    const rows = parseExcelBuffer(buffer);
    expect(rows).toHaveLength(1);
    expect(rows[0]['Employee Code']).toBe('EMP001');
  });

  it('parseExcelBuffer returns empty array for empty sheet', () => {
    const ws = XLSX.utils.aoa_to_sheet([]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buffer = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
    const rows = parseExcelBuffer(buffer);
    expect(rows).toEqual([]);
  });
});
