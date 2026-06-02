import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

const ROOT = process.env.CATALOG_ROOT || "/data/catalog/B2B_Фото";
const PRODUCT_TYPES = new Set(["1", "2", "3", "4"]);

type ImportLog = {
  rowNumber: number;
  section: string;
  article: string;
  productKey: string;
  status: "success" | "skipped" | "error";
  message: string;
};

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
  const cleaned = value
    .trim()
    .replace(/\.(jpg|jpeg|png|webp)$/i, "");

  if (!cleaned) return null;

  const parts = cleaned.includes("-") ? cleaned.split("-") : cleaned.split(".");
  const typeId = parts[0];
  const model = parts[1]?.padStart(4, "0");
  const modification = parts.slice(2).join(cleaned.includes("-") ? "-" : ".");

  if (!PRODUCT_TYPES.has(typeId) || !model || !/^\d+$/.test(model)) {
    return null;
  }

  return [typeId, model, modification || "base"].join("-");
}

function getArticleVariants(article: string) {
  return Array.from(
    new Set(
      [
        article,
        article.slice(-3),
        article.replace(/^0+/, ""),
        String(Number(article)),
      ].filter(Boolean)
    )
  );
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
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    let processed = 0;
    let skipped = 0;
    let tagsCreated = 0;
    let tagsLinked = 0;
    let attributesUpdated = 0;
    const logs: ImportLog[] = [];

    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 2;
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

      if (!section || !article) {
        skipped++;
        logs.push({
          rowNumber,
          section,
          article,
          productKey: productKey || rawProductKey,
          status: "skipped",
          message: "Пропущено: нет section/article",
        });
        continue;
      }

      if (!productKey) {
        skipped++;
        logs.push({
          rowNumber,
          section,
          article,
          productKey: rawProductKey,
          status: "error",
          message: "Ошибка: неверный productKey",
        });
        continue;
      }

      const articleFolder = getArticleVariants(article).find(
        (variant) => variant && fs.existsSync(path.join(ROOT, section, variant))
      );

      if (!articleFolder) {
        skipped++;
        logs.push({
          rowNumber,
          section,
          article,
          productKey,
          status: "skipped",
          message: "Пропущено: нет папки артикула",
        });
        continue;
      }

      await prisma.articleTag.deleteMany({
        where: {
          section,
          article: articleFolder,
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
              article: articleFolder,
              productKey,
              tagId: tag.id,
            },
          },
          update: {},
          create: {
            section,
            article: articleFolder,
            productKey,
            tagId: tag.id,
          },
        });

        tagsLinked++;
      }

      await prisma.articleAttribute.deleteMany({
        where: {
          section,
          article: articleFolder,
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
            article: articleFolder,
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
      logs.push({
        rowNumber,
        section,
        article: articleFolder,
        productKey,
        status: "success",
        message: "Импортировано",
      });
    }

    return NextResponse.json({
      ok: true,
      processed,
      skipped,
      tagsCreated,
      tagsLinked,
      attributesUpdated,
      logs,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
