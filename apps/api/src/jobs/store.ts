import { randomUUID } from 'crypto';

export interface Job {
  id: string;
  toolId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: { percent?: number; message?: string };
  error?: string;
  files: { name: string; data: Buffer }[];
  options: Record<string, unknown>;
  output?: Buffer;
  outputMime?: string;
  outputFilename?: string;
  createdAt: Date;
  completedAt?: Date;
}

const TTL_MS = 60 * 60 * 1000; // 1 hour

export class JobStore {
  private jobs = new Map<string, Job>();
  
  constructor() {
    // Cleanup old jobs every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }
  
  async create(
    toolId: string,
    files: { name: string; data: Buffer }[],
    options: Record<string, unknown>
  ): Promise<Job> {
    const job: Job = {
      id: randomUUID(),
      toolId,
      status: 'pending',
      files,
      options,
      createdAt: new Date(),
    };
    
    this.jobs.set(job.id, job);
    return job;
  }
  
  get(id: string): Job | undefined {
    return this.jobs.get(id);
  }
  
  update(id: string, updates: Partial<Job>): void {
    const job = this.jobs.get(id);
    if (job) {
      Object.assign(job, updates);
    }
  }
  
  delete(id: string): boolean {
    return this.jobs.delete(id);
  }
  
  private cleanup(): void {
    const now = Date.now();
    for (const [id, job] of this.jobs) {
      const age = now - job.createdAt.getTime();
      if (age > TTL_MS) {
        this.jobs.delete(id);
      }
    }
  }
}
