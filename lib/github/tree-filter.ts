export interface TreeEntry {
  path: string;
  type: "blob" | "tree";
  size?: number;
}

const EXCLUDED_SEGMENTS = new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  ".git",
  "coverage",
  "out",
  ".turbo",
  ".vercel",
]);

const LOCKFILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lock",
  "bun.lockb",
  "Cargo.lock",
  "go.sum",
  "poetry.lock",
  "Pipfile.lock",
]);

const ALLOWED_EXTENSIONS = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "py",
  "go",
  "rs",
  "md",
  "mdx",
  "json",
  "yaml",
  "yml",
  "toml",
  "sql",
  "sh",
  "css",
  "scss",
  "html",
  "prisma",
]);

const ALLOWED_NAMES = new Set([
  "Dockerfile",
  "Makefile",
  "README",
  ".env.example",
  "env.example",
]);

const MAX_SIZE = 200 * 1024;

export function filterTree(entries: TreeEntry[]): TreeEntry[] {
  return entries.filter((entry) => {
    if (entry.type !== "blob") return false;
    if (entry.size !== undefined && entry.size > MAX_SIZE) return false;

    const segments = entry.path.split("/");
    for (const seg of segments) {
      if (EXCLUDED_SEGMENTS.has(seg)) return false;
    }

    const filename = segments[segments.length - 1] ?? "";
    if (LOCKFILES.has(filename)) return false;

    if (ALLOWED_NAMES.has(filename)) return true;

    if (filename.toLowerCase().endsWith(".env.example")) return true;

    const dotIdx = filename.lastIndexOf(".");
    if (dotIdx === -1 || dotIdx === 0) return false;
    const ext = filename.slice(dotIdx + 1).toLowerCase();
    return ALLOWED_EXTENSIONS.has(ext);
  });
}
