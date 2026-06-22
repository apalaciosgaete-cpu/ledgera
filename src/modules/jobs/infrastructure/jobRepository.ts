import { prisma } from "@/lib/prisma";

export type JobStatus = "PENDING" | "RUNNING" | "DONE" | "FAILED" | "CANCELLED";

export async function enqueueJob(input: {
  jobType:     string;
  payload:     Record<string, unknown>;
  userId?:     string;
  priority?:   number;
  scheduledAt?: Date;
}) {
  return prisma.jobQueue.create({
    data: {
      jobType:     input.jobType,
      payload:     JSON.stringify(input.payload),
      userId:      input.userId ?? null,
      priority:    input.priority ?? 0,
      scheduledAt: input.scheduledAt ?? new Date(),
      status:      "PENDING",
    },
  });
}

export async function claimNextJob(jobTypes?: string[]) {
  return prisma.$transaction(async (tx) => {
    const job = await tx.jobQueue.findFirst({
      where: {
        status:      "PENDING",
        scheduledAt: { lte: new Date() },
        attempts:    { lt: tx.jobQueue.fields.maxAttempts as unknown as number },
        ...(jobTypes && jobTypes.length > 0 ? { jobType: { in: jobTypes } } : {}),
      },
      orderBy: [{ priority: "desc" }, { scheduledAt: "asc" }],
    });

    if (!job) return null;

    return tx.jobQueue.update({
      where: { id: job.id },
      data: {
        status:    "RUNNING",
        startedAt: new Date(),
        attempts:  { increment: 1 },
      },
    });
  });
}

export async function completeJob(id: string, result?: Record<string, unknown>) {
  return prisma.jobQueue.update({
    where: { id },
    data: {
      status:      "DONE",
      completedAt: new Date(),
      result:      result ? JSON.stringify(result) : null,
    },
  });
}

export async function failJob(id: string, errorMsg: string) {
  const job = await prisma.jobQueue.findUnique({ where: { id } });
  if (!job) return;

  const isFinal = job.attempts >= job.maxAttempts;
  return prisma.jobQueue.update({
    where: { id },
    data: {
      status:   isFinal ? "FAILED" : "PENDING",
      errorMsg,
    },
  });
}

export async function findJobsByUser(userId: string, limit = 20) {
  return prisma.jobQueue.findMany({
    where:   { userId },
    orderBy: { createdAt: "desc" },
    take:    limit,
  });
}

export async function findPendingJobs(jobType?: string, limit = 50) {
  return prisma.jobQueue.findMany({
    where: {
      status:      "PENDING",
      scheduledAt: { lte: new Date() },
      ...(jobType ? { jobType } : {}),
    },
    orderBy: [{ priority: "desc" }, { scheduledAt: "asc" }],
    take: limit,
  });
}
