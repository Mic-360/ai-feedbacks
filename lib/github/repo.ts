export function parseRepoUrl(url: string): { owner: string; name: string } {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    throw new Error("invalid github url");
  }
  if (u.hostname.toLowerCase() !== "github.com") {
    throw new Error("invalid github url");
  }
  const parts = u.pathname.split("/").filter(Boolean);
  if (parts.length < 2) throw new Error("invalid github url");
  const owner = parts[0]!;
  let name = parts[1]!;
  if (name.endsWith(".git")) name = name.slice(0, -4);
  if (!owner || !name) throw new Error("invalid github url");
  if (!/^[A-Za-z0-9._-]+$/.test(owner) || !/^[A-Za-z0-9._-]+$/.test(name)) {
    throw new Error("invalid github url");
  }
  return { owner, name };
}
