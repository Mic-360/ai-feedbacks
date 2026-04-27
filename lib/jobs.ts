import { getContextJob, putContextJob } from "@/lib/projects";
import { runContextGeneration } from "@/lib/jobs/context-generation";

export type JobType = "context-generation";

export interface ContextGenerationPayload {
  slug: string;
  jobId: string;
}

export type JobPayload = ContextGenerationPayload;

interface QueueEntry {
  type: JobType;
  payload: JobPayload;
}

const queue: QueueEntry[] = [];
let running = false;

function nowIso(): string {
  return new Date().toISOString();
}

export function enqueue(jobType: JobType, payload: JobPayload): void {
  queue.push({ type: jobType, payload });
  void tick();
}

async function tick(): Promise<void> {
  if (running) return;
  const job = queue.shift();
  if (!job) return;
  running = true;
  try {
    await dispatch(job);
  } catch (err) {
    await persistFailure(job, err);
  } finally {
    running = false;
    void tick();
  }
}

async function dispatch(job: QueueEntry): Promise<void> {
  if (job.type === "context-generation") {
    await runContextGeneration(job.payload);
  }
}

async function persistFailure(job: QueueEntry, err: unknown): Promise<void> {
  try {
    const message = err instanceof Error ? err.message : String(err);
    const existing = await getContextJob(job.payload.slug);
    const startedAt = existing?.startedAt ?? nowIso();
    const stage = existing?.stage ?? null;
    const progress = existing?.progress ?? 0;
    await putContextJob(job.payload.slug, {
      state: "failed",
      stage,
      progress,
      error: message,
      startedAt,
      finishedAt: nowIso(),
      jobId: job.payload.jobId,
    });
  } catch (persistErr) {
    console.error("[jobs] failed to persist job failure", persistErr);
  }
}
