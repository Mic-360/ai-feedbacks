import {
  getObjectStream,
  getText,
  putJSON,
  putObject,
  putText,
  tryGetJSON,
  tryGetText,
} from "@/lib/rustfs";
import { newFeedbackId } from "@/lib/ids";
import { formatLogs, type LogsPayload } from "@/lib/logs-txt";
import { appendVersion, createEmpty } from "@/lib/fix-prompt-md";
import { addFeedbackId, requireProject } from "@/lib/projects";

export interface Feedback {
  id: string;
  projectSlug: string;
  description: string;
  createdAt: string;
  imageKey: string;
  logsKey: string;
  fixPromptKey: string;
  fixVersions: Array<{ v: number; generatedAt: string; modelId: string }>;
}

export function feedbackJsonKey(slug: string, id: string): string {
  return `projects/${slug}/feedbacks/${id}/feedback.json`;
}

export function imageKey(slug: string, id: string): string {
  return `projects/${slug}/feedbacks/${id}/image.png`;
}

export function logsKey(slug: string, id: string): string {
  return `projects/${slug}/feedbacks/${id}/logs.txt`;
}

export function fixPromptKey(slug: string, id: string): string {
  return `projects/${slug}/feedbacks/${id}/fix-prompt.md`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export async function createFeedback(args: {
  projectSlug: string;
  description: string;
  imageBuffer: Buffer | Uint8Array;
  logs: LogsPayload;
}): Promise<Feedback> {
  const { projectSlug, description, imageBuffer, logs } = args;
  const id = newFeedbackId();
  const createdAt = nowIso();

  const imgKey = imageKey(projectSlug, id);
  const lgKey = logsKey(projectSlug, id);
  const fxKey = fixPromptKey(projectSlug, id);

  await putObject(imgKey, imageBuffer, "image/png");

  const logsText = formatLogs({
    projectSlug,
    feedbackId: id,
    capturedAt: createdAt,
    logs,
  });
  await putText(lgKey, logsText);

  const seed = createEmpty({ projectSlug, feedbackId: id });
  await putText(fxKey, seed, "text/markdown; charset=utf-8");

  const feedback: Feedback = {
    id,
    projectSlug,
    description,
    createdAt,
    imageKey: imgKey,
    logsKey: lgKey,
    fixPromptKey: fxKey,
    fixVersions: [],
  };
  await putJSON(feedbackJsonKey(projectSlug, id), feedback);
  await addFeedbackId(projectSlug, id);
  return feedback;
}

export async function getFeedback(slug: string, id: string): Promise<Feedback | null> {
  return tryGetJSON<Feedback>(feedbackJsonKey(slug, id));
}

export async function requireFeedback(slug: string, id: string): Promise<Feedback> {
  const f = await getFeedback(slug, id);
  if (!f) throw new Error("feedback not found");
  return f;
}

export async function listFeedbacks(slug: string): Promise<Feedback[]> {
  const project = await requireProject(slug);
  const out: Feedback[] = [];
  for (const id of project.feedbackIds) {
    const f = await getFeedback(slug, id);
    if (f) out.push(f);
  }
  out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  return out;
}

export async function getFeedbackImage(
  slug: string,
  id: string,
): Promise<{
  stream: ReadableStream;
  contentType: string | undefined;
  contentLength: number | undefined;
}> {
  return getObjectStream(imageKey(slug, id));
}

export async function getFeedbackLogsText(slug: string, id: string): Promise<string> {
  return getText(logsKey(slug, id));
}

export async function getFeedbackFixPromptText(slug: string, id: string): Promise<string> {
  return getText(fixPromptKey(slug, id));
}

export async function appendFix(
  slug: string,
  id: string,
  args: { modelId: string; body: string },
): Promise<{ v: number; generatedAt: string }> {
  const feedback = await requireFeedback(slug, id);
  const fxKey = fixPromptKey(slug, id);

  const existingRaw = await tryGetText(fxKey);
  const existing = existingRaw ?? createEmpty({ projectSlug: slug, feedbackId: id });

  const v = feedback.fixVersions.length + 1;
  const generatedAt = nowIso();

  const next = appendVersion(existing, {
    v,
    generatedAt,
    modelId: args.modelId,
    body: args.body,
  });
  await putText(fxKey, next, "text/markdown; charset=utf-8");

  feedback.fixVersions.push({ v, generatedAt, modelId: args.modelId });
  await putJSON(feedbackJsonKey(slug, id), feedback);

  return { v, generatedAt };
}
