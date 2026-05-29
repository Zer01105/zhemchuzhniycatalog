import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const section = searchParams.get("section");
  const article = searchParams.get("article");

  if (!section || !article) {
    return NextResponse.json(
      { error: "Missing section or article" },
      { status: 400 }
    );
  }

  const meta = await prisma.articleMeta.findUnique({
    where: {
      section_article: {
        section,
        article,
      },
    },
  });

  return NextResponse.json(meta);
}
