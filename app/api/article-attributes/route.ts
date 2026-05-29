import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const section = searchParams.get("section");
  const article = searchParams.get("article");
  const productKey = searchParams.get("productKey") || "";

  if (!section || !article) {
    return NextResponse.json(
      { error: "Missing section or article" },
      { status: 400 }
    );
  }

  const productAttributes = await prisma.articleAttribute.findMany({
    where: {
      section,
      article,
      productKey,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  if (productAttributes.length > 0) {
    return NextResponse.json(productAttributes);
  }

  const modelAttributes = await prisma.articleAttribute.findMany({
    where: {
      section,
      article,
      productKey: "",
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  return NextResponse.json(modelAttributes);
}