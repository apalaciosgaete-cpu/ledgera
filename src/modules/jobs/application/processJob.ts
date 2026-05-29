import { claimNextJob, completeJob, failJob } from "../infrastructure/jobRepository";

export type JobHandler = (
  jobType: string,
  payload: Record<string, unknown>,
  userId:  string | null,
) => Promise<Record<string, unknown> | void>;

const handlers = new Map<string, JobHandler>();

export function registerJobHandler(jobType: string, handler: JobHandler): void {
  handlers.set(jobType, handler);
}

export async function processNextJob(jobTypes?: string[]): Promise<boolean> {
  const job = await claimNextJob(jobTypes);
  if (!job) return false;

  const handler = handlers.get(job.jobType);
  if (!handler) {
    await failJob(job.id, `No handler registered for job type: ${job.jobType}`);
    return false;
  }

  try {
    const payload = JSON.parse(job.payload) as Record<string, unknown>;
    const result  = await handler(job.jobType, payload, job.userId);
    await completeJob(job.id, result ?? undefined);
    return true;
  } catch (err) {
    await failJob(job.id, err instanceof Error ? err.message : String(err));
    return false;
  }
}
