import type { FastifyInstance } from 'fastify';
import { JobStore } from './store.js';
import { runJob } from './runner.js';

const store = new JobStore();

export async function jobRoutes(app: FastifyInstance) {
  app.post('/tools/:toolId/jobs', async (request, reply) => {
    const { toolId } = request.params as { toolId: string };
    
    const parts = request.parts();
    const files: { name: string; data: Buffer }[] = [];
    let options: Record<string, unknown> = {};
    
    for await (const part of parts) {
      if (part.type === 'file') {
        const chunks: Buffer[] = [];
        for await (const chunk of part.file) {
          chunks.push(chunk);
        }
        files.push({
          name: part.filename ?? 'file',
          data: Buffer.concat(chunks),
        });
      } else {
        if (part.fieldname === 'options') {
          try {
            options = JSON.parse(part.value as string);
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
    
    const job = await store.create(toolId, files, options);
    
    // Run job in background
    runJob(job.id, store).catch(err => {
      console.error(`Job ${job.id} failed:`, err);
    });
    
    return { jobId: job.id };
  });
  
  app.get('/jobs/:jobId', async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const job = store.get(jobId);
    
    if (!job) {
      return reply.status(404).send({ error: 'Job not found' });
    }
    
    return {
      id: job.id,
      toolId: job.toolId,
      status: job.status,
      progress: job.progress,
      error: job.error,
      outputFilename: job.outputFilename,
    };
  });
  
  app.get('/jobs/:jobId/output', async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const job = store.get(jobId);
    
    if (!job) {
      return reply.status(404).send({ error: 'Job not found' });
    }
    
    if (job.status !== 'completed' || !job.output) {
      return reply.status(400).send({ error: 'Output not ready' });
    }
    
    return reply
      .header('Content-Type', job.outputMime ?? 'application/octet-stream')
      .header('Content-Disposition', `attachment; filename="${job.outputFilename ?? 'output'}"`)
      .send(job.output);
  });
  
  app.delete('/jobs/:jobId', async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const deleted = store.delete(jobId);
    
    if (!deleted) {
      return reply.status(404).send({ error: 'Job not found' });
    }
    
    return { success: true };
  });
}
