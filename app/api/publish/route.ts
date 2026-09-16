import { del, get, put } from "@vercel/blob";
import { unzipSync } from "fflate";
import { customAlphabet } from "nanoid";
import { NextResponse } from "next/server";
import { mimeFor } from "@/lib/mime";
import { ACCESS, metaPath, sitePrefix, type Meta } from "@/lib/storage";

export const maxDuration = 60;

const newId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 24);

export async function POST(request: Request) {
  const { password, zipUrl, days } = await request.json();

  if (!process.env.UPLOAD_PASSWORD || password !== process.env.UPLOAD_PASSWORD) {
    return NextResponse.json({ error: "Parolă greșită" }, { status: 401 });
  }
  const d = Number(days);
  if (!Number.isInteger(d) || d < 1 || d > 365) {
    return NextResponse.json({ error: "Număr de zile invalid (1–365)" }, { status: 400 });
  }

  try {
    const zip = await get(zipUrl, { access: ACCESS });
    if (!zip?.stream) throw new Error("ZIP-ul nu a fost găsit");
    const bytes = new Uint8Array(await new Response(zip.stream).arrayBuffer());

    const entries = Object.entries(unzipSync(bytes)).filter(
      ([name]) => !name.endsWith("/") && !name.startsWith("__MACOSX/") && !name.split("/").pop()!.startsWith("."),
    );
    if (!entries.length) throw new Error("ZIP-ul este gol");

    // Dacă totul e într-un singur folder rădăcină, îl eliminăm.
    const roots = new Set(entries.map(([n]) => (n.includes("/") ? n.split("/")[0] : "")));
    const strip = roots.size === 1 && !roots.has("") ? [...roots][0] + "/" : "";
    const files = entries.map(([n, data]) => [n.slice(strip.length), data] as const);

    if (!files.some(([n]) => n === "index.html")) {
      throw new Error("ZIP-ul trebuie să conțină index.html");
    }

    const id = newId();
    for (let i = 0; i < files.length; i += 10) {
      await Promise.all(
        files.slice(i, i + 10).map(([name, data]) =>
          put(sitePrefix(id) + name, Buffer.from(data), {
            access: ACCESS,
            contentType: mimeFor(name),
          }),
        ),
      );
    }

    const now = new Date();
    const meta: Meta = {
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + d * 86_400_000).toISOString(),
    };
    await put(metaPath(id), JSON.stringify(meta), { access: ACCESS, contentType: "application/json" });

    return NextResponse.json({
      url: `${new URL(request.url).origin}/s/${id}/`,
      expiresAt: meta.expiresAt,
      files: files.length,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  } finally {
    await del(zipUrl).catch(() => {});
  }
}
