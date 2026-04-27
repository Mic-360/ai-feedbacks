import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

interface RustFsConfig {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

let cachedConfig: RustFsConfig | null = null;
let cachedClient: S3Client | null = null;

function readConfig(): RustFsConfig {
  if (cachedConfig) return cachedConfig;
  const endpoint = process.env.RUSTFS_ENDPOINT;
  const accessKeyId = process.env.RUSTFS_ACCESS_KEY;
  const secretAccessKey = process.env.RUSTFS_SECRET_KEY;
  const bucket = process.env.RUSTFS_BUCKET_NAME;
  if (!endpoint) throw new Error("RUSTFS_ENDPOINT is not set");
  if (!accessKeyId) throw new Error("RUSTFS_ACCESS_KEY is not set");
  if (!secretAccessKey) throw new Error("RUSTFS_SECRET_KEY is not set");
  if (!bucket) throw new Error("RUSTFS_BUCKET_NAME is not set");
  cachedConfig = { endpoint, accessKeyId, secretAccessKey, bucket };
  return cachedConfig;
}

function client(): S3Client {
  if (cachedClient) return cachedClient;
  const cfg = readConfig();
  cachedClient = new S3Client({
    endpoint: cfg.endpoint,
    region: "auto",
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
    forcePathStyle: true,
  });
  return cachedClient;
}

export class RustFsUnreachableError extends Error {
  constructor(cause: unknown, op: string) {
    const endpoint = process.env.RUSTFS_ENDPOINT ?? "(unset)";
    const reason = cause instanceof Error ? cause.message : String(cause);
    super(
      `RustFS at ${endpoint} did not return a valid S3 response (op=${op}). ` +
        `Underlying error: ${reason}. ` +
        `Verify the RustFS server is running, the endpoint URL is correct, ` +
        `and that any upstream proxy (e.g. Cloudflare) can reach the origin.`,
    );
    this.name = "RustFsUnreachableError";
  }
}

function isDeserializationError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: string; message?: string };
  if (e.name === "DeserializationError") return true;
  if (typeof e.message === "string" && /Deserialization|is not expected/i.test(e.message)) return true;
  return false;
}

async function send<T>(op: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (isDeserializationError(err)) {
      throw new RustFsUnreachableError(err, op);
    }
    throw err;
  }
}

export function getBucketName(): string {
  return readConfig().bucket;
}

function isNotFound(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: string; Code?: string; $metadata?: { httpStatusCode?: number } };
  if (e.name === "NotFound" || e.name === "NoSuchKey") return true;
  if (e.Code === "NotFound" || e.Code === "NoSuchKey") return true;
  if (e.$metadata?.httpStatusCode === 404) return true;
  return false;
}

export async function putObject(
  key: string,
  body: Uint8Array | Buffer | string,
  contentType: string,
): Promise<void> {
  await client().send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function getObject(key: string): Promise<Buffer> {
  const res = await client().send(
    new GetObjectCommand({ Bucket: getBucketName(), Key: key }),
  );
  if (!res.Body) throw new Error(`empty body for ${key}`);
  const bytes = await res.Body.transformToByteArray();
  return Buffer.from(bytes);
}

export async function getObjectStream(
  key: string,
): Promise<{
  stream: ReadableStream;
  contentType: string | undefined;
  contentLength: number | undefined;
}> {
  const res = await client().send(
    new GetObjectCommand({ Bucket: getBucketName(), Key: key }),
  );
  if (!res.Body) throw new Error(`empty body for ${key}`);
  const stream = (res.Body as { transformToWebStream: () => ReadableStream }).transformToWebStream();
  return {
    stream,
    contentType: res.ContentType,
    contentLength: res.ContentLength,
  };
}

export async function headObject(
  key: string,
): Promise<{ exists: boolean; contentLength?: number; contentType?: string }> {
  try {
    const res = await client().send(
      new HeadObjectCommand({ Bucket: getBucketName(), Key: key }),
    );
    return {
      exists: true,
      contentLength: res.ContentLength,
      contentType: res.ContentType,
    };
  } catch (err) {
    if (isNotFound(err)) return { exists: false };
    throw err;
  }
}

export async function deleteObject(key: string): Promise<void> {
  await client().send(
    new DeleteObjectCommand({ Bucket: getBucketName(), Key: key }),
  );
}

export async function listPrefix(prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;
  do {
    const res = await send("listPrefix", () =>
      client().send(
        new ListObjectsV2Command({
          Bucket: getBucketName(),
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      ),
    );
    for (const obj of res.Contents ?? []) {
      if (obj.Key) keys.push(obj.Key);
    }
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);
  return keys;
}

export async function getJSON<T>(key: string): Promise<T> {
  const buf = await getObject(key);
  return JSON.parse(buf.toString("utf8")) as T;
}

export async function tryGetJSON<T>(key: string): Promise<T | null> {
  try {
    return await getJSON<T>(key);
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

export async function putJSON(key: string, value: unknown): Promise<void> {
  await putObject(key, JSON.stringify(value, null, 2), "application/json");
}

export async function getText(key: string): Promise<string> {
  const buf = await getObject(key);
  return buf.toString("utf8");
}

export async function tryGetText(key: string): Promise<string | null> {
  try {
    return await getText(key);
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

export async function putText(
  key: string,
  body: string,
  contentType: string = "text/plain; charset=utf-8",
): Promise<void> {
  await putObject(key, body, contentType);
}
