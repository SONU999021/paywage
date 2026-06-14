import { useRef, useState } from 'react';
import { Download } from 'lucide-react';
import api from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useQueryClient } from '@tanstack/react-query';

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; message: string }[];
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ImportAttendanceModal({ open, onClose }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const downloadSample = async () => {
    try {
      const response = await api.get('/import/sample/attendance', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'sample-attendance.xlsx';
      link.click();
    } catch {
      toast('Failed to download sample template', 'error');
    }
  };

  const handleFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      toast('Invalid file format. Use .xlsx, .xls, or .csv', 'error');
      return;
    }

    setUploading(true);
    setResult(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post<ImportResult>('/import/attendance', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      if (data.failed === 0) {
        toast(`Imported ${data.success} attendance records`, 'success');
      } else {
        toast(`Imported ${data.success}, failed ${data.failed}`, 'warning');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast(msg || 'Import failed', 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Import Attendance">
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Upload Excel or CSV with columns: Employee Code, Date, Check In, Check Out, Status
        </p>
        <Button variant="outline" size="sm" onClick={downloadSample}>
          <Download className="h-4 w-4" /> Download Sample Template
        </Button>
        <div
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card p-8 hover:border-primary"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            disabled={uploading}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {uploading ? (
            <p className="text-sm text-muted">Uploading and validating...</p>
          ) : (
            <>
              <p className="font-medium text-text">Click to select file</p>
              <p className="mt-1 text-xs text-muted">.xlsx, .xls, .csv</p>
            </>
          )}
        </div>
        {result && (
          <div className="rounded-lg border border-border bg-card p-4 text-sm">
            <p className="font-medium text-success">Success: {result.success}</p>
            <p className="font-medium text-danger">Failed: {result.failed}</p>
            {result.errors.length > 0 && (
              <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-xs text-danger">Row {e.row}: {e.message}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}
