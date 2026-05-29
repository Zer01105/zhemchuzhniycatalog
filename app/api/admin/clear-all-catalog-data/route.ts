import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  await prisma.articleTag.deleteMany({});
  await prisma.articleMeta.deleteMany({});

  return NextResponse.json({
    ok: true,
  });
}
