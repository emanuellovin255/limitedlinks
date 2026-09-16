import { del, list } from "@vercel/blob";
import { NextResponse } from "next/server";
import { deleteByPrefix, getMeta, isExpired } from "@/lib/storage";

export const maxDuration = 60;

export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ids: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: "sites/", mode: "folded", cursor });
    for (const folder of page.folders) ids.push(folder.split("/")[1]);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  let deleted = 0;
  for (const id of ids) {
    const meta = await getMeta(id);
    if (!meta || isExpired(meta)) {
      await deleteByPrefix(`sites/${id}/`);
      deleted++;
    }
  }

  // ZIP-uri temporare rămase (upload abandonat)
  const uploads = await list({ prefix: "uploads/" });
  const old = uploads.blobs.filter((b) => Date.now() - new Date(b.uploadedAt).getTime() > 86_400_000);
  if (old.length) await del(old.map((b) => b.url));

  return NextResponse.json({ checked: ids.length, deleted });
}
