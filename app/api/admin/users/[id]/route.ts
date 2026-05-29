import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: NextRequest, { params }: Props) {
  const { id } = await params;
  const { isActive } = await req.json();

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user || user.role !== "client") {
    return NextResponse.json(
      { error: "Client not found" },
      { status: 404 }
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      isActive: Boolean(isActive),
    },
    select: {
      id: true,
      login: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    user: updatedUser,
  });
}

export async function DELETE(_req: NextRequest, { params }: Props) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user || user.role !== "client") {
    return NextResponse.json(
      { error: "Client not found" },
      { status: 404 }
    );
  }

  await prisma.user.delete({
    where: { id },
  });

  return NextResponse.json({
    ok: true,
  });
}