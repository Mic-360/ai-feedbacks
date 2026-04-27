import type { TreeEntry } from "@/lib/github/tree-filter";

export interface RepoInfo {
  defaultBranch: string;
  latestSha: string;
}

const BASE = "https://api.github.com";
const HEADERS: Record<string, string> = {
  Accept: "application/vnd.github+json",
  "User-Agent": "ai-feedbacks",
};

const BACKOFF_MS = [200, 800, 2000];

async function withBackoff<T>(fn: () => Promise<Response>, label: string): Promise<T> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= BACKOFF_MS.length; attempt++) {
    try {
      const res = await fn();
      if (res.status === 403 || res.status === 429) {
        if (attempt < BACKOFF_MS.length) {
          await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt]));
          continue;
        }
        throw new Error(`${label} rate limited (${res.status})`);
      }
      if (!res.ok) {
        throw new Error(`${label} failed: ${res.status} ${res.statusText}`);
      }
      return (await res.json()) as T;
    } catch (err) {
      lastErr = err;
      if (attempt >= BACKOFF_MS.length) break;
      await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt]));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(`${label} failed`);
}

interface RepoResponse {
  default_branch: string;
}

interface CommitResponse {
  sha: string;
}

interface TreeResponse {
  tree: Array<{ path: string; type: string; size?: number }>;
  truncated?: boolean;
}

interface ContentResponse {
  content: string;
  encoding: string;
}

export async function fetchRepoInfo(owner: string, name: string): Promise<RepoInfo> {
  const repo = await withBackoff<RepoResponse>(
    () => fetch(`${BASE}/repos/${owner}/${name}`, { headers: HEADERS }),
    `fetchRepoInfo(${owner}/${name})`,
  );
  const defaultBranch = repo.default_branch;
  const commit = await withBackoff<CommitResponse>(
    () =>
      fetch(`${BASE}/repos/${owner}/${name}/commits/${defaultBranch}`, {
        headers: HEADERS,
      }),
    `fetchRepoInfo.commit(${owner}/${name}@${defaultBranch})`,
  );
  return { defaultBranch, latestSha: commit.sha };
}

export async function fetchTree(
  owner: string,
  name: string,
  sha: string,
): Promise<TreeEntry[]> {
  const tree = await withBackoff<TreeResponse>(
    () =>
      fetch(`${BASE}/repos/${owner}/${name}/git/trees/${sha}?recursive=1`, {
        headers: HEADERS,
      }),
    `fetchTree(${owner}/${name}@${sha})`,
  );
  const entries: TreeEntry[] = [];
  for (const t of tree.tree) {
    if (t.type !== "blob" && t.type !== "tree") continue;
    entries.push({
      path: t.path,
      type: t.type,
      size: t.size,
    });
  }
  return entries;
}

export async function fetchFileContent(
  owner: string,
  name: string,
  path: string,
  sha: string,
): Promise<string> {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const data = await withBackoff<ContentResponse>(
    () =>
      fetch(`${BASE}/repos/${owner}/${name}/contents/${encodedPath}?ref=${sha}`, {
        headers: HEADERS,
      }),
    `fetchFileContent(${owner}/${name}:${path}@${sha})`,
  );
  if (data.encoding !== "base64") {
    throw new Error(`unexpected encoding: ${data.encoding}`);
  }
  return Buffer.from(data.content, "base64").toString("utf8");
}
