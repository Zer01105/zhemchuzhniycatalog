import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const section = searchParams.get("section") || undefined;

  const articleTags = await prisma.articleTag.findMany({
    where: section ? { section } : {},
    include: {
      tag: true,
    },
  });

  return NextResponse.json(articleTags);
}