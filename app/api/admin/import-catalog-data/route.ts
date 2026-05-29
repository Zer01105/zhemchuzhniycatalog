import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-zа-яё0-9-_]/gi, "");
}

function clean(value: unknown) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function getValue(row: Record<string, unknown>, names: string[]) {
  for (const name of names) {
    const value = clean(row[name]);
    if (value) return value;
  }

  return "";
}

function normalizeProductKey(value: string) {
  if (!value) return "";

  const cleanValue = value.trim();

  if (cleanValue.includes("-")) {
    return cleanValue;
  }

  const parts = cleanValue.split(".");
  const typeId = parts[0];
  const model = parts[1]?.padStart(4, "0");
  const modification = parts.slice(2).join(".");

  if (!typeId || !model) return cleanValue;

  return [typeId, model, modification || "base"].join("-");
}

const SERVICE_COLUMNS = new Set([
  "section",
  "article",
  "productkey",
  "tags",
  "раздел",
  "модель",
  "изделие",
  "теги",
]);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    let processed = 0;
    let tagsCreated = 0;
    let tagsLinked = 0;
    let attributesUpdated = 0;

    for (const row of rows) {
      const section = getValue(row, ["section", "Раздел", "раздел"]);
      const article = getValue(row, ["article", "Модель", "модель"]);
      const rawProductKey = getValue(row, [
        "productKey",
        "productkey",
        "Изделие",
        "изделие",
      ]);
      const productKey = normalizeProductKey(rawProductKey);
      const tagsRaw = getValue(row, ["tags", "Теги", "теги"]);

      if (!section || !article) continue;

      await prisma.articleTag.deleteMany({
        where: {
          section,
          article,
          productKey,
        },
      });

      const tagNames = tagsRaw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      for (const tagName of tagNames) {
        const slug = slugify(tagName);

        let tag = await prisma.tag.findUnique({
          where: { slug },
        });

        if (!tag) {
          tag = await prisma.tag.create({
            data: {
              name: tagName,
              slug,
            },
          });

          tagsCreated++;
        }

        await prisma.articleTag.upsert({
          where: {
            section_article_productKey_tagId: {
              section,
              article,
              productKey,
              tagId: tag.id,
            },
          },
          update: {},
          create: {
            section,
            article,
            productKey,
            tagId: tag.id,
          },
        });

        tagsLinked++;
      }

      await prisma.articleAttribute.deleteMany({
        where: {
          section,
          article,
          productKey,
        },
      });

      let sortOrder = 0;

      for (const [key, rawValue] of Object.entries(row)) {
        const columnName = key.trim();
        const normalizedColumn = columnName.toLowerCase();

        if (SERVICE_COLUMNS.has(normalizedColumn)) continue;

        const value = clean(rawValue);
        if (!value) continue;

        await prisma.articleAttribute.create({
          data: {
            section,
            article,
            productKey,
            name: columnName,
            value,
            sortOrder,
          },
        });

        sortOrder++;
        attributesUpdated++;
      }

      processed++;
    }

    return NextResponse.json({
      ok: true,
      processed,
      tagsCreated,
      tagsLinked,
      attributesUpdated,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Import failed" },
      { status: 500 }
    );
  }
}