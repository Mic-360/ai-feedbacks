import { notFound } from "next/navigation";
import { getContextJob, getProject } from "@/lib/projects";
import { listFeedbacks } from "@/lib/feedbacks";
import { ProjectClient } from "./client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();
  const [feedbacks, job] = await Promise.all([
    listFeedbacks(slug),
    getContextJob(slug),
  ]);

  return (
    <ProjectClient
      project={project}
      feedbacks={feedbacks}
      initialJob={job}
    />
  );
}
