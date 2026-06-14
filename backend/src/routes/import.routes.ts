import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import * as importService from '../services/import.service.js';
import type { AuthRequest } from '../middleware/auth.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();
router.use(authenticate);

router.get('/sample/:type', (req, res) => {
  const buffer = importService.getSampleFormat(req.params.type);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="sample-${req.params.type}.xlsx"`);
  res.send(buffer);
});

router.post('/employees', upload.single('file'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'File required' });
      return;
    }
    const rows = importService.parseExcelBuffer(req.file.buffer);
    const result = await importService.importEmployees(req.user!.companyId!, rows);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/attendance', upload.single('file'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'File required' });
      return;
    }
    const allowed = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv', 'application/csv'];
    if (!allowed.includes(req.file.mimetype) && !req.file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
      res.status(400).json({ error: 'Invalid file format. Use .xlsx, .xls, or .csv' });
      return;
    }
    const rows = importService.parseExcelBuffer(req.file.buffer);
    const result = await importService.importAttendance(req.user!.companyId!, rows);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
