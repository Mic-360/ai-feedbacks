import {
  headObject,
  listPrefix,
  putJSON,
  tryGetJSON,
} from "@/lib/rustfs";
import { slugFromWebsiteUrl } from "@/lib/slug";
import { originMatches } from "@/lib/url";
import { parseRepoUrl } from "@/lib/github/repo";

export interface Project {
  slug: string;
  websiteUrl: string;
  repoUrl: string;
  repoOwner: string;
  repoName: string;
  repoDefaultBranch: string;
  createdAt: string;
  contextGeneratedAt: string | null;
  feedbackIds: string[];
  chatThreadIds: string[];
}

export interface ProjectSummary {
  slug: string;
  websiteUrl: string;
  repoUrl: string;
  createdAt: string;
  contextGeneratedAt: string | null;
  feedbackCount: number;
  contextJobState: "queued" | "running" | "done" | "failed" | "none";
}

export interface ContextJob {
  state: "queued" | "running" | "done" | "failed";
  stage: "fetching-tree" | "selecting-files" | "fetching-content" | "generating" | null;
  progress: number;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
  jobId: string;
}

const PROJECTS_PREFIX = "projects/";

function projectKey(slug: string): string {
  return `projects/${slug}/project.json`;
}

function contextJobKey(slug: string): string {
  return `projects/${slug}/context-job.json`;
}

export function contextKey(slug: string): string {
  return `projects/${slug}/context.md`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export async function createProject(args: {
  websiteUrl: string;
  repoUrl: string;
}): Promise<Project> {
  const slug = slugFromWebsiteUrl(args.websiteUrl);
  const { owner, name } = parseRepoUrl(args.repoUrl);
  const head = await headObject(projectKey(slug));
  if (head.exists) throw new Error("project already exists");
  const project: Project = {
    slug,
    websiteUrl: args.websiteUrl,
    repoUrl: args.repoUrl,
    repoOwner: owner,
    repoName: name,
    repoDefaultBranch: "main",
    createdAt: nowIso(),
    contextGeneratedAt: null,
    feedbackIds: [],
    chatThreadIds: [],
  };
  await putJSON(projectKey(slug), project);
  return project;
}

export async function getProject(slug: string): Promise<Project | null> {
  return tryGetJSON<Project>(projectKey(slug));
}

export async function requireProject(slug: string): Promise<Project> {
  const p = await getProject(slug);
  if (!p) throw new Error("project not found");
  return p;
}

export async function listProjectSlugs(): Promise<string[]> {
  const keys = await listPrefix(PROJECTS_PREFIX);
  const slugs = new Set<string>();
  const re = /^projects\/([^/]+)\/project\.json$/;
  for (const k of keys) {
    const m = re.exec(k);
    if (m && m[1]) slugs.add(m[1]);
  }
  return Array.from(slugs).sort();
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const slugs = await listProjectSlugs();
  const out: ProjectSummary[] = [];
  for (const slug of slugs) {
    const project = await tryGetJSON<Project>(projectKey(slug));
    if (!project) continue;
    const job = await tryGetJSON<ContextJob>(contextJobKey(slug));
    out.push({
      slug: project.slug,
      websiteUrl: project.websiteUrl,
      repoUrl: project.repoUrl,
      createdAt: project.createdAt,
      contextGeneratedAt: project.contextGeneratedAt,
      feedbackCount: project.feedbackIds.length,
      contextJobState: job ? job.state : "none",
    });
  }
  return out;
}

export async function findProjectBySiteUrl(
  url: string,
): Promise<{ slug: string } | null> {
  const slugs = await listProjectSlugs();
  for (const slug of slugs) {
    const project = await tryGetJSON<Project>(projectKey(slug));
    if (!project) continue;
    if (originMatches(project.websiteUrl, url)) return { slug: project.slug };
  }
  return null;
}

export async function updateProject(
  slug: string,
  mut: (p: Project) => Project | void,
): Promise<Project> {
  const project = await requireProject(slug);
  const result = mut(project);
  const next = result ?? project;
  await putJSON(projectKey(slug), next);
  return next;
}

export async function addFeedbackId(slug: string, id: string): Promise<void> {
  await updateProject(slug, (p) => {
    p.feedbackIds.push(id);
  });
}

export async function addChatThreadId(slug: string, id: string): Promise<void> {
  await updateProject(slug, (p) => {
    p.chatThreadIds.push(id);
  });
}

export async function setContextGeneratedAt(slug: string, iso: string): Promise<void> {
  await updateProject(slug, (p) => {
    p.contextGeneratedAt = iso;
  });
}

export async function getContextJob(slug: string): Promise<ContextJob | null> {
  return tryGetJSON<ContextJob>(contextJobKey(slug));
}

export async function putContextJob(slug: string, job: ContextJob): Promise<void> {
  await putJSON(contextJobKey(slug), job);
}
