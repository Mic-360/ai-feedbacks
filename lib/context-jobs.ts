import { putContextJob } from "@/lib/projects";
import { newJobId } from "@/lib/ids";
import { enqueue } from "@/lib/jobs";

function nowIso(): string {
  return new Date().toISOString();
}

export async function startContextGeneration(
  slug: string,
): Promise<{ jobId: string }> {
  const jobId = newJobId();
  await putContextJob(slug, {
    state: "queued",
    stage: null,
    progress: 0,
    error: null,
    startedAt: nowIso(),
    finishedAt: null,
    jobId,
  });
  enqueue("context-generation", { slug, jobId });
  return { jobId };
}
