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
    const { section, article } = await req.json();

    if (!section || !article) {
      return NextResponse.json(
        { error: "Missing section or article" },
        { status: 400 }
      );
    }

    const sourcePath = safeJoin(SOURCE_ROOT, section, article);
    const previewPath = safeJoin(PREVIEW_ROOT, section, article);

    if (fs.existsSync(sourcePath)) {
      fs.rmSync(sourcePath, {
        recursive: true,
        force: true,
      });
    }

    if (fs.existsSync(previewPath)) {
      fs.rmSync(previewPath, {
        recursive: true,
        force: true,
      });
    }

    return NextResponse.json({
      ok: true,
      section,
      article,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Delete article failed" },
      { status: 500 }
    );
  }
}
