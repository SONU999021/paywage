import app from './app.js';
import { env } from './config/env.js';

app.listen(env.PORT, () => {
  console.log(`PayWage API running on http://localhost:${env.PORT}`);
  console.log(`Swagger docs: http://localhost:${env.PORT}/api/docs`);
});
