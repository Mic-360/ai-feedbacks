import { getContextJob, listProjectSlugs, putContextJob } from "@/lib/projects";

function nowIso(): string {
  return new Date().toISOString();
}

export async function recoverStaleJobs(): Promise<void> {
  const slugs = await listProjectSlugs();
  for (const slug of slugs) {
    const job = await getContextJob(slug);
    if (!job) continue;
    if (job.state !== "running") continue;
    await putContextJob(slug, {
      ...job,
      state: "failed",
      error: "server restarted",
      finishedAt: nowIso(),
    });
  }
}
