import type { JobStore } from './store.js';

export async function runJob(jobId: string, store: JobStore): Promise<void> {
  const job = store.get(jobId);
  if (!job) return;
  
  store.update(jobId, { status: 'running' });
  
  try {
    // TODO: Implement server-side tool handlers
    // For now, just mark as failed with a message
    throw new Error(`Server-side processing for "${job.toolId}" not yet implemented`);
    
    // When implemented, the flow would be:
    // 1. Look up the tool handler by toolId
    // 2. Run the handler with job.files and job.options
    // 3. Store the output in job.output
    // store.update(jobId, {
    //   status: 'completed',
    //   output: result,
    //   outputMime: 'application/pdf',
    //   outputFilename: 'result.pdf',
    //   completedAt: new Date(),
    // });
  } catch (err) {
    store.update(jobId, {
      status: 'failed',
      error: err instanceof Error ? err.message : 'Unknown error',
      completedAt: new Date(),
    });
  }
}
