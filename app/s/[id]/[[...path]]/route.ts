import { mimeFor } from "@/lib/mime";
import { getFile, getMeta, isExpired } from "@/lib/storage";

const page = (status: number, title: string, text: string) =>
  new Response(
    `<!doctype html><html lang="ro"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#0b0b0f;color:#e8e8ee;text-align:center">
<div><h1 style="margin:0 0 8px">${title}</h1><p style="color:#9a9aa8;margin:0">${text}</p></div></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
  );

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; path?: string[] }> },
) {
  const { id, path = [] } = await params;
  const url = new URL(request.url);

  if (!/^[a-z0-9]{24}$/.test(id)) return page(404, "Link inexistent", "Acest link nu există.");

  if (path.length === 0 && !url.pathname.endsWith("/")) {
    return Response.redirect(`${url.origin}/s/${id}/${url.search}`, 308);
  }

  const meta = await getMeta(id);
  if (!meta) return page(404, "Link inexistent", "Acest link nu există.");
  if (isExpired(meta)) return page(410, "Link expirat", "Acest site nu mai este disponibil.");

  let filePath = path.map(decodeURIComponent).join("/");
  if (filePath.includes("..") || filePath === "_meta.json") return page(404, "Negăsit", "Fișierul nu există.");
  if (filePath === "" || url.pathname.endsWith("/")) filePath += (filePath ? "/" : "") + "index.html";

  let file = await getFile(id, filePath);
  if (!file && !filePath.split("/").pop()!.includes(".") && (await getFile(id, filePath + "/index.html"))) {
    return Response.redirect(`${url.origin}${url.pathname}/${url.search}`, 308);
  }
  if (!file) return page(404, "Negăsit", "Fișierul nu există.");

  return new Response(file.stream, {
    headers: {
      "content-type": mimeFor(filePath),
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  });
}
