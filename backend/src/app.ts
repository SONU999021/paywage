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

const app = express();

app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
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
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api', limiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'PayWager API', version: '2.0.0' });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', routes);

app.use(errorHandler);

export default app;
