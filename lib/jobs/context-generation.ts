import { generateText, Output } from "ai";
import { z } from "zod";
import {
  contextKey,
  putContextJob,
  requireProject,
  setContextGeneratedAt,
  updateProject,
  type ContextJob,
} from "@/lib/projects";
import { fetchFileContent, fetchRepoInfo, fetchTree } from "@/lib/github/api";
import { filterTree, type TreeEntry } from "@/lib/github/tree-filter";
import { putText } from "@/lib/rustfs";
import { wrapContext } from "@/lib/context-md";
import { contextModel } from "@/lib/gemini";

const MAX_FILES = 40;
const MAX_FILE_BYTES = 30 * 1024;
const FETCH_CONCURRENCY = 5;

function nowIso(): string {
  return new Date().toISOString();
}

async function pMap<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers: Promise<void>[] = [];
  const width = Math.max(1, Math.min(concurrency, items.length));
  for (let w = 0; w < width; w++) {
    workers.push(
      (async () => {
        while (true) {
          const idx = cursor++;
          if (idx >= items.length) return;
          results[idx] = await fn(items[idx]!);
        }
      })(),
    );
  }
  await Promise.all(workers);
  return results;
}

function extensionFor(path: string): string {
  const i = path.lastIndexOf(".");
  if (i === -1) return "";
  const ext = path.slice(i + 1).toLowerCase();
  const map: Record<string, string> = {
    ts: "ts",
    tsx: "tsx",
    js: "js",
    jsx: "jsx",
    mjs: "js",
    cjs: "js",
    py: "python",
    go: "go",
    rs: "rust",
    md: "md",
    mdx: "md",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    sql: "sql",
    sh: "bash",
    css: "css",
    scss: "scss",
    html: "html",
    prisma: "prisma",
  };
  return map[ext] ?? "";
}

function truncate(content: string): { body: string; truncated: boolean } {
  const buf = Buffer.from(content, "utf8");
  if (buf.byteLength <= MAX_FILE_BYTES) return { body: content, truncated: false };
  return {
    body: buf.subarray(0, MAX_FILE_BYTES).toString("utf8"),
    truncated: true,
  };
}

async function update(
  slug: string,
  jobId: string,
  startedAt: string,
  patch: Partial<ContextJob>,
): Promise<void> {
  const base: ContextJob = {
    state: "running",
    stage: null,
    progress: 0,
    error: null,
    startedAt,
    finishedAt: null,
    jobId,
  };
  await putContextJob(slug, { ...base, ...patch });
}

export async function runContextGeneration(payload: {
  slug: string;
  jobId: string;
}): Promise<void> {
  const { slug, jobId } = payload;
  const startedAt = nowIso();

  await update(slug, jobId, startedAt, {
    state: "running",
    stage: "fetching-tree",
    progress: 10,
  });

  const project = await requireProject(slug);
  const { repoOwner, repoName, repoUrl } = project;

  const repoInfo = await fetchRepoInfo(repoOwner, repoName);
  const sha = repoInfo.latestSha;

  await updateProject(slug, (p) => {
    p.repoDefaultBranch = repoInfo.defaultBranch;
  });

  const rawTree = await fetchTree(repoOwner, repoName, sha);
  const filtered = filterTree(rawTree);
  const filteredByPath = new Map<string, TreeEntry>();
  for (const e of filtered) filteredByPath.set(e.path, e);

  await update(slug, jobId, startedAt, {
    state: "running",
    stage: "selecting-files",
    progress: 30,
  });

  const treeForPrompt = filtered.map((e) => ({ path: e.path, size: e.size ?? 0 }));

  const selectionSchema = z.object({
    paths: z
      .array(z.string())
      .max(MAX_FILES)
      .describe("Up to 40 most important file paths"),
  });

  const selection = await generateText({
    model: contextModel(),
    system:
      "You are reviewing a project's file tree. Pick up to 40 files that best represent the project's architecture, entry points, configuration, and public interface. Prefer source code over generated assets.",
    prompt: JSON.stringify(treeForPrompt),
    experimental_output: Output.object({ schema: selectionSchema }),
  });

  const candidatePaths: string[] = Array.isArray(selection.experimental_output?.paths)
    ? selection.experimental_output.paths
    : [];

  const selectedPaths: string[] = [];
  for (const p of candidatePaths) {
    if (selectedPaths.length >= MAX_FILES) break;
    if (filteredByPath.has(p) && !selectedPaths.includes(p)) {
      selectedPaths.push(p);
    }
  }

  await update(slug, jobId, startedAt, {
    state: "running",
    stage: "fetching-content",
    progress: 60,
  });

  const fetched = await pMap(selectedPaths, FETCH_CONCURRENCY, async (path) => {
    try {
      const body = await fetchFileContent(repoOwner, repoName, path, sha);
      return { path, body, ok: true as const };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[context-generation] fetch failed for ${path}: ${message}`);
      return { path, body: "", ok: false as const };
    }
  });

  const successes = fetched.filter((f) => f.ok);
  if (selectedPaths.length > 0 && successes.length === 0) {
    throw new Error("failed to fetch any selected files");
  }

  await update(slug, jobId, startedAt, {
    state: "running",
    stage: "generating",
    progress: 80,
  });

  const promptParts: string[] = [];
  for (const f of successes) {
    const lang = extensionFor(f.path);
    const { body, truncated } = truncate(f.body);
    const note = truncated ? " (truncated)" : "";
    promptParts.push(`\n### \`${f.path}\`${note}\n\n\`\`\`${lang}\n${body}\n\`\`\`\n`);
  }
  const synthesisPrompt = promptParts.join("");

  const synthesis = await generateText({
    model: contextModel(),
    system:
      "You are creating a comprehensive context document for a software project. Output well-structured Markdown with these sections: Overview, Tech Stack, Architecture, Key Modules, Data Flow, Conventions, Common Bug Areas. Be specific and concise; cite filenames where relevant.",
    prompt: synthesisPrompt,
    temperature: 0.4,
  });

  const generatedAt = nowIso();
  const wrapped = wrapContext(
    {
      projectSlug: slug,
      repoUrl,
      commitSha: sha,
      generatedAt,
    },
    synthesis.text,
  );

  await putText(contextKey(slug), wrapped, "text/markdown; charset=utf-8");
  await setContextGeneratedAt(slug, generatedAt);

  await update(slug, jobId, startedAt, {
    state: "done",
    stage: "generating",
    progress: 100,
    finishedAt: generatedAt,
  });
}
