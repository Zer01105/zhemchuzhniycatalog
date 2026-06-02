import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type BulkItem = {
  section?: unknown;
  article?: unknown;
  productKey?: unknown;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const action = body.action;
  const tagId = clean(body.tagId);
  const items = Array.isArray(body.items) ? (body.items as BulkItem[]) : [];

  if ((action !== "add" && action !== "remove") || !tagId || items.length === 0) {
    return NextResponse.json(
      { error: "Missing action, tagId or items" },
      { status: 400 }
    );
  }

  const tag = await prisma.tag.findUnique({
    where: {
      id: tagId,
    },
  });

  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  let processed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const item of items) {
    const section = clean(item.section);
    const article = clean(item.article);
    const productKey = clean(item.productKey);

    if (!section || !article || !productKey) {
      skipped++;
      errors.push(`Пропущено: нет section/article/productKey`);
      continue;
    }

    try {
      if (action === "add") {
        await prisma.articleTag.upsert({
          where: {
            section_article_productKey_tagId: {
              section,
              article,
              productKey,
              tagId,
            },
          },
          update: {},
          create: {
            section,
            article,
            productKey,
            tagId,
          },
        });
      } else {
        await prisma.articleTag.deleteMany({
          where: {
            section,
            article,
            productKey,
            tagId,
          },
        });
      }

      processed++;
    } catch (error) {
      skipped++;
      errors.push(
        `Ошибка ${section}/${article}/${productKey}: ${
          error instanceof Error ? error.message : "unknown"
        }`
      );
    }
  }

  return NextResponse.json({
    ok: true,
    processed,
    skipped,
    errors,
  });
}
