import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const userId = req.cookies.get("catalog_user_id")?.value;

  if (!userId) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      login: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    const res = NextResponse.json({ ok: false }, { status: 401 });

    res.cookies.delete("catalog_auth");
    res.cookies.delete("catalog_role");
    res.cookies.delete("catalog_user_id");

    return res;
  }

  return NextResponse.json({
    ok: true,
    user,
  });
}
