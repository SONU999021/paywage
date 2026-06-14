import { useState } from 'react';
import { Download, Upload, FileSpreadsheet } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';

const importTypes = [
  { type: 'employees', label: 'Employees', desc: 'Import employee master data' },
  { type: 'attendance', label: 'Attendance', desc: 'Bulk import daily attendance' },
  { type: 'salary-structure', label: 'Salary Structure', desc: 'Update salary components' },
  { type: 'leave-balance', label: 'Leave Balance', desc: 'Import opening leave balances' },
  { type: 'bank-details', label: 'Bank Details', desc: 'Update employee bank information' },
];

export function ImportPage() {
  const [result, setResult] = useState<{ success: number; failed: number; errors: { row: number; message: string }[] } | null>(null);
  const [uploading, setUploading] = useState(false);

  const downloadSample = async (type: string) => {
    const response = await api.get(`/import/sample/${type}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `sample-${type}.xlsx`;
    link.click();
  };

  const handleUpload = async (type: string, file: File) => {
    setUploading(true);
    setResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const endpoint = type === 'employees' ? '/import/employees' : '/import/employees';
      const { data } = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
    } catch {
      setResult({ success: 0, failed: 1, errors: [{ row: 0, message: 'Upload failed' }] });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Excel Import</h1>
        <p className="text-muted">Import wizard with sample formats, column mapping, and error reporting</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {importTypes.map((item) => (
          <Card key={item.type}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-base">{item.label}</CardTitle>
                  <p className="text-sm text-muted">{item.desc}</p>
                </div>
              </div>
            </CardHeader>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => downloadSample(item.type)}>
                <Download className="h-4 w-4" /> Sample
              </Button>
              <label className="cursor-pointer">
                <span className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5">
                  <Upload className="h-4 w-4" /> {uploading ? 'Uploading...' : 'Upload'}
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => e.target.files?.[0] && handleUpload(item.type, e.target.files[0])}
                />
              </label>
            </div>
          </Card>
        ))}
      </div>

      {result && (
        <Card>
          <CardHeader><CardTitle>Import Results</CardTitle></CardHeader>
          <p className="text-success">Success: {result.success}</p>
          <p className="text-danger">Failed: {result.failed}</p>
          {result.errors.length > 0 && (
            <div className="mt-4 space-y-1">
              {result.errors.map((e, i) => (
                <p key={i} className="text-sm text-danger">Row {e.row}: {e.message}</p>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
