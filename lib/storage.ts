import { del, get, list } from "@vercel/blob";

export type Meta = { createdAt: string; expiresAt: string };

export const ACCESS = "private" as const;
export const sitePrefix = (id: string) => `sites/${id}/`;
export const metaPath = (id: string) => `${sitePrefix(id)}_meta.json`;

export async function getMeta(id: string): Promise<Meta | null> {
  const res = await get(metaPath(id), { access: ACCESS }).catch(() => null);
  if (!res || !res.stream) return null;
  return (await new Response(res.stream).json()) as Meta;
}

export function isExpired(meta: Meta): boolean {
  return new Date(meta.expiresAt).getTime() <= Date.now();
}

export async function getFile(id: string, path: string) {
  const res = await get(sitePrefix(id) + path, { access: ACCESS }).catch(() => null);
  return res?.stream ? res : null;
}

export async function deleteByPrefix(prefix: string) {
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    if (page.blobs.length) await del(page.blobs.map((b) => b.url));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
}
