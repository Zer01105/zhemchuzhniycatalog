import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-zа-яё0-9-_]/gi, "");
}

export async function GET() {
  const tags = await prisma.tag.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json(tags);
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();

  if (!name || !name.trim()) {
    return NextResponse.json(
      { error: "Missing tag name" },
      { status: 400 }
    );
  }

  const cleanName = name.trim();
  const slug = slugify(cleanName);

  const tag = await prisma.tag.create({
    data: {
      name: cleanName,
      slug,
    },
  });

  return NextResponse.json({
    ok: true,
    tag,
  });
}
