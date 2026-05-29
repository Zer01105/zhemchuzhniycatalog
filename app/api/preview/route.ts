import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ROOT = "/data/catalog-previews";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const section = searchParams.get("section");
  const article = searchParams.get("article");
  const file = searchParams.get("file");

  if (!section || !article || !file) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const previewFile = file.replace(/\.(jpg|jpeg|png|webp)$/i, ".jpg");
  const safePath = path.normalize(path.join(ROOT, section, article, previewFile));

  if (!safePath.startsWith(ROOT)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!fs.existsSync(safePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const imageBuffer = fs.readFileSync(safePath);

  return new NextResponse(imageBuffer, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
