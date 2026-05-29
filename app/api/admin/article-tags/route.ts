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

  const articleTags = await prisma.articleTag.findMany({
    where: {
      section,
      article,
    },
    include: {
      tag: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return NextResponse.json(articleTags);
}

export async function POST(req: NextRequest) {
  const { section, article, tagId } = await req.json();

  if (!section || !article || !tagId) {
    return NextResponse.json(
      { error: "Missing section, article or tagId" },
      { status: 400 }
    );
  }

  const articleTag = await prisma.articleTag.upsert({
    where: {
      section_article_tagId: {
        section,
        article,
        tagId,
      },
    },
    update: {},
    create: {
      section,
      article,
      tagId,
    },
    include: {
      tag: true,
    },
  });

  return NextResponse.json({
    ok: true,
    articleTag,
  });
}

export async function DELETE(req: NextRequest) {
  const { section, article, tagId } = await req.json();

  if (!section || !article || !tagId) {
    return NextResponse.json(
      { error: "Missing section, article or tagId" },
      { status: 400 }
    );
  }

  await prisma.articleTag.deleteMany({
    where: {
      section,
      article,
      tagId,
    },
  });

  return NextResponse.json({
    ok: true,
  });
}
