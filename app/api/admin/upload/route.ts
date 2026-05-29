import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const SOURCE_ROOT = "/data/catalog/B2B_Фото";
const PREVIEW_ROOT = "/data/catalog-previews";

const IMAGE_RE = /\.(jpg|jpeg|png|webp)$/i;

function safeName(name: string) {
  return name.replace(/[\/\\:*?"<>|]/g, "_");
}

async function createPreview(sourcePath: string, previewPath: string) {
  fs.mkdirSync(path.dirname(previewPath), { recursive: true });

  await sharp(sourcePath)
    .rotate()
    .resize({
      width: 500,
      height: 500,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 75 })
    .toFile(previewPath);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const sectionRaw = String(formData.get("section") || "");
  const articleRaw = String(formData.get("article") || "");

  const section = safeName(sectionRaw.trim());
  const article = safeName(articleRaw.trim());

  const files = formData.getAll("files") as File[];

  if (!section || !article || files.length === 0) {
    return NextResponse.json(
      { error: "Missing section, article or files" },
      { status: 400 }
    );
  }

  const articleDir = path.join(SOURCE_ROOT, section, article);
  const previewDir = path.join(PREVIEW_ROOT, section, article);

  fs.mkdirSync(articleDir, { recursive: true });
  fs.mkdirSync(previewDir, { recursive: true });

  let uploaded = 0;

  for (const file of files) {
    if (!IMAGE_RE.test(file.name)) continue;

    const fileName = safeName(file.name);
    const sourcePath = path.join(articleDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(sourcePath, buffer);

    const previewName = fileName.replace(/\.(jpg|jpeg|png|webp)$/i, ".jpg");
    const previewPath = path.join(previewDir, previewName);

    await createPreview(sourcePath, previewPath);

    uploaded++;
  }

  return NextResponse.json({
    ok: true,
    uploaded,
    section,
    article,
  });
}