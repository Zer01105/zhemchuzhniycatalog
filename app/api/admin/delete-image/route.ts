import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SOURCE_ROOT = "/data/catalog/B2B_Фото";
const PREVIEW_ROOT = "/data/catalog-previews";

function safeJoin(root: string, ...parts: string[]) {
  const finalPath = path.normalize(path.join(root, ...parts));

  if (!finalPath.startsWith(root)) {
    throw new Error("Forbidden path");
  }

  return finalPath;
}

export async function POST(req: NextRequest) {
  try {
    const { section, article, file } = await req.json();

    if (!section || !article || !file) {
      return NextResponse.json(
        { error: "Missing section, article or file" },
        { status: 400 }
      );
    }

    const sourcePath = safeJoin(SOURCE_ROOT, section, article, file);
    const previewFile = file.replace(/\.(jpg|jpeg|png|webp)$/i, ".jpg");
    const previewPath = safeJoin(PREVIEW_ROOT, section, article, previewFile);

    if (fs.existsSync(sourcePath)) {
      fs.rmSync(sourcePath, {
        force: true,
      });
    }

    if (fs.existsSync(previewPath)) {
      fs.rmSync(previewPath, {
        force: true,
      });
    }

    return NextResponse.json({
      ok: true,
      section,
      article,
      file,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Delete image failed" },
      { status: 500 }
    );
  }
}
