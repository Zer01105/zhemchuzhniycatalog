import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MATCH_TYPES = new Set(["first_digit", "last_letter"]);

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  try {
    const rules = await prisma.autoTagRule.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error("Auto tag rules read error", error);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const matchType = clean(body.matchType);
  const matchValue = clean(body.matchValue).toLowerCase();
  const tagName = clean(body.tagName);
  const name = clean(body.name) || `${matchType}:${matchValue} → ${tagName}`;

  if (!MATCH_TYPES.has(matchType) || !matchValue || !tagName) {
    return NextResponse.json(
      { error: "Missing matchType, matchValue or tagName" },
      { status: 400 }
    );
  }

  const rule = await prisma.autoTagRule.create({
    data: {
      name,
      matchType,
      matchValue,
      tagName,
      isActive: body.isActive !== false,
    },
  });

  return NextResponse.json({ ok: true, rule });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const id = clean(body.id);

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const rule = await prisma.autoTagRule.update({
    where: {
      id,
    },
    data: {
      isActive: Boolean(body.isActive),
    },
  });

  return NextResponse.json({ ok: true, rule });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const id = clean(body.id);

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await prisma.autoTagRule.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({ ok: true });
}
