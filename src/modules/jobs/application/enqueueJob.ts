import { enqueueJob as _enqueue } from "../infrastructure/jobRepository";

export type EnqueueJobInput = {
  jobType:     string;
  payload:     Record<string, unknown>;
  userId?:     string;
  priority?:   number;
  scheduledAt?: Date;
};

export async function enqueueJob(input: EnqueueJobInput) {
  return _enqueue(input);
}
