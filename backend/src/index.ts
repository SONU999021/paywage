import app from './app.js';
import { env } from './config/env.js';

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`PayWager API running on port ${env.PORT}`);
  console.log(`Swagger docs: /api/docs`);
});
