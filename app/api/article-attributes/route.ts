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

  const attributes = await prisma.articleAttribute.findMany({
    where: {
      section,
      article,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  return NextResponse.json(attributes);
}
