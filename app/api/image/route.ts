import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ROOT = "/data/catalog/B2B_Фото";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const section = searchParams.get("section");
  const article = searchParams.get("article");
  const file = searchParams.get("file");

  if (!section || !article || !file) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const safePath = path.normalize(path.join(ROOT, section, article, file));

  if (!safePath.startsWith(ROOT)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!fs.existsSync(safePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const imageBuffer = fs.readFileSync(safePath);
  const ext = path.extname(file).toLowerCase();

  const contentType =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
      ? "image/webp"
      : "image/jpeg";

  return new NextResponse(imageBuffer, {
    headers: {
      "Content-Type": contentType,
    },
  });
}