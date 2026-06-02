import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function buildSetKey(section: string, article: string, productKey: string) {
  return [section, article, productKey].join("|");
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const section = clean(searchParams.get("section"));
  const article = clean(searchParams.get("article"));
  const productKey = clean(searchParams.get("productKey"));

  if (!section || !article || !productKey) {
    return NextResponse.json(
      { error: "Missing section, article or productKey" },
      { status: 400 }
    );
  }

  const items = await prisma.productSetItem.findMany({
    where: {
      setKey: buildSetKey(section, article, productKey),
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return NextResponse.json({ ok: true, items });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const section = clean(body.section);
  const article = clean(body.article);
  const productKey = clean(body.productKey);
  const itemSection = clean(body.item?.section);
  const itemArticle = clean(body.item?.article);
  const itemProductKey = clean(body.item?.productKey);

  if (
    !section ||
    !article ||
    !productKey ||
    !itemSection ||
    !itemArticle ||
    !itemProductKey
  ) {
    return NextResponse.json(
      { error: "Missing product set data" },
      { status: 400 }
    );
  }

  const setKey = buildSetKey(section, article, productKey);

  if (
    section === itemSection &&
    article === itemArticle &&
    productKey === itemProductKey
  ) {
    return NextResponse.json(
      { error: "Cannot add product to its own set" },
      { status: 400 }
    );
  }

  const item = await prisma.productSetItem.upsert({
    where: {
      setKey_section_article_productKey: {
        setKey,
        section: itemSection,
        article: itemArticle,
        productKey: itemProductKey,
      },
    },
    update: {},
    create: {
      setKey,
      section: itemSection,
      article: itemArticle,
      productKey: itemProductKey,
    },
  });

  return NextResponse.json({ ok: true, item });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();

  const section = clean(body.section);
  const article = clean(body.article);
  const productKey = clean(body.productKey);
  const itemSection = clean(body.item?.section);
  const itemArticle = clean(body.item?.article);
  const itemProductKey = clean(body.item?.productKey);

  if (
    !section ||
    !article ||
    !productKey ||
    !itemSection ||
    !itemArticle ||
    !itemProductKey
  ) {
    return NextResponse.json(
      { error: "Missing product set data" },
      { status: 400 }
    );
  }

  await prisma.productSetItem.deleteMany({
    where: {
      setKey: buildSetKey(section, article, productKey),
      section: itemSection,
      article: itemArticle,
      productKey: itemProductKey,
    },
  });

  return NextResponse.json({ ok: true });
}
