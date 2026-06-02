import { NextRequest, NextResponse } from "next/server";
import { PdfProduct, renderProductsPdf } from "@/lib/pdf";

function parseItems(value: string | null): PdfProduct[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        section: String(item.section || "").trim(),
        article: String(item.article || "").trim(),
        productKey: String(item.productKey || "").trim(),
        title: String(item.title || item.article || "").trim(),
        previewUrl: String(item.previewUrl || "").trim(),
      }))
      .filter((item) => item.section && item.article);
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const items = parseItems(searchParams.get("items"));
  const pdf = await renderProductsPdf(items);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="favorites.pdf"',
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const items = parseItems(JSON.stringify(body.items || []));
  const pdf = await renderProductsPdf(items);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="favorites.pdf"',
    },
  });
}
