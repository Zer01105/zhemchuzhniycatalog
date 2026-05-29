import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { section, article, mode } = await req.json();

  if (!section || !article || !mode) {
    return NextResponse.json(
      { error: "Missing section, article or mode" },
      { status: 400 }
    );
  }

  if (mode === "tags" || mode === "all") {
    await prisma.articleTag.deleteMany({
      where: {
        section,
        article,
      },
    });
  }

  if (mode === "meta" || mode === "all") {
    await prisma.articleMeta.deleteMany({
      where: {
        section,
        article,
      },
    });
  }

  return NextResponse.json({ ok: true });
}

