import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { jobRoutes } from './jobs/routes.js';

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: true,
});

await app.register(multipart, {
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
});

app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

await app.register(jobRoutes, { prefix: '/api' });

const port = parseInt(process.env.PORT ?? '3001', 10);
const host = process.env.HOST ?? '0.0.0.0';

try {
  await app.listen({ port, host });
  console.log(`API server running on http://${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
