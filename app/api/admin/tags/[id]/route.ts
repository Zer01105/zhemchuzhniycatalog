import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_req: Request, { params }: Props) {
  const { id } = await params;

  await prisma.tag.delete({
    where: { id },
  });

  return NextResponse.json({
    ok: true,
  });
}
