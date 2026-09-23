import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Global in-memory cache to survive across requests in warm serverless/container instances
declare global {
  // eslint-disable-next-line no-var
  var __IMAGE_CACHE__: Map<string, Buffer> | undefined;
}

if (!globalThis.__IMAGE_CACHE__) {
  globalThis.__IMAGE_CACHE__ = new Map<string, Buffer>();
}

export function getImageCache(): Map<string, Buffer> {
  return globalThis.__IMAGE_CACHE__!;
}

/**
 * Checks if the current execution environment is a serverless runtime
 * with a strictly read-only root filesystem (e.g., Vercel, AWS Lambda).
 */
function isServerlessReadOnlyEnv(): boolean {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT) {
    return true;
  }
  const cwd = process.cwd();
  if (cwd.startsWith('/var/task') || cwd.startsWith('/var/runtime')) {
    return true;
  }
  return false;
}

/**
 * Saves an image to storage (memory cache and writable disk location).
 * Never throws EROFS on Vercel/Lambda by prioritizing os.tmpdir() in serverless environments.
 */
export async function saveImageFile(filename: string, buffer: Buffer): Promise<string> {
  // 1. Save in memory cache (cap to 100 entries to prevent memory pressure)
  const cache = getImageCache();
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(filename, buffer);

  // 2. In serverless runtimes (Vercel, AWS Lambda), write directly to /tmp/uploads
  if (isServerlessReadOnlyEnv()) {
    try {
      const tmpDir = path.join(os.tmpdir(), 'uploads');
      await fs.mkdir(tmpDir, { recursive: true });
      const tmpPath = path.join(tmpDir, filename);
      await fs.writeFile(tmpPath, buffer);
      return tmpPath;
    } catch (err) {
      console.warn('Could not write to serverless tmp directory, image retained in memory cache:', err);
      return filename;
    }
  }

  // 3. In persistent environments (local development, Docker containers), write to public/uploads
  try {
    const publicDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(publicDir, { recursive: true });
    const publicPath = path.join(publicDir, filename);
    await fs.writeFile(publicPath, buffer);
    return publicPath;
  } catch (err: any) {
    // If public/uploads is read-only (EROFS), fall back to os.tmpdir()
    try {
      const tmpDir = path.join(os.tmpdir(), 'uploads');
      await fs.mkdir(tmpDir, { recursive: true });
      const tmpPath = path.join(tmpDir, filename);
      await fs.writeFile(tmpPath, buffer);
      return tmpPath;
    } catch (tmpErr) {
      console.warn('Fallback write to tmp failed, image retained in memory cache:', tmpErr);
      return filename;
    }
  }
}

/**
 * Retrieves an image buffer from memory cache, public/uploads, or tmp directories.
 */
export async function getImageFile(filename: string): Promise<Buffer | null> {
  // 1. Check in-memory cache
  const cache = getImageCache();
  const cached = cache.get(filename);
  if (cached) return cached;

  // 2. Check os.tmpdir()/uploads (where serverless writes)
  try {
    const tmpPath = path.join(os.tmpdir(), 'uploads', filename);
    const buf = await fs.readFile(tmpPath);
    cache.set(filename, buf);
    return buf;
  } catch {}

  // 3. Check public/uploads (where local dev/containers write)
  try {
    const publicPath = path.join(process.cwd(), 'public', 'uploads', filename);
    const buf = await fs.readFile(publicPath);
    cache.set(filename, buf);
    return buf;
  } catch {}

  // 4. Check /tmp/uploads
  try {
    const directTmp = path.join('/tmp', 'uploads', filename);
    const buf = await fs.readFile(directTmp);
    cache.set(filename, buf);
    return buf;
  } catch {}

  // 5. Check /tmp directly
  try {
    const directTmpRoot = path.join('/tmp', filename);
    const buf = await fs.readFile(directTmpRoot);
    cache.set(filename, buf);
    return buf;
  } catch {}

  return null;
}
