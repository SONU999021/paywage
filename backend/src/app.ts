import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { getAllowedOrigins } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { apiNotFound } from './middleware/notFound.js';

const app = express();

app.set('trust proxy', 1);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    const allowed = getAllowedOrigins();
    const isAllowed =
      allowed.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.up.railway.app');
    callback(null, isAllowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later' },
  skip: (req) => req.method === 'OPTIONS',
});
app.use('/api', limiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'PayWager API', version: '2.0.0' });
});

app.get('/api/health', (_req, res) => {
  res.json({ success: true, status: 'running', service: 'PayWager API', version: '2.0.0' });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', routes);
app.use('/api', apiNotFound);

app.use(errorHandler);

export default app;
