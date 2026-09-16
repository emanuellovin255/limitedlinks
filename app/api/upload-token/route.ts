import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

const MAX_SIZE = 200 * 1024 * 1024;

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadPresignedBody;
  try {
    const result = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname) => {
        if (!pathname.startsWith("uploads/") || !pathname.toLowerCase().endsWith(".zip")) {
          throw new Error("Doar fișiere .zip");
        }
        const token = await issueSignedToken({
          pathname,
          operations: ["put"],
          maximumSizeInBytes: MAX_SIZE,
          validUntil: Date.now() + 15 * 60_000,
        });
        return { token, urlOptions: { addRandomSuffix: true, maximumSizeInBytes: MAX_SIZE } };
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
