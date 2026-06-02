import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { PdfProduct, renderProductsPdf } from "@/lib/pdf";

const ROOT = "/data/catalog/B2B_Фото";
const JEWELRY_SECTIONS = new Set(["Золото", "Серебро"]);
const IMAGE_RE = /\.(jpg|jpeg|png|webp)$/i;

const PRODUCT_TYPES: Record<string, string> = {
  "1": "Кольцо",
  "2": "Серьги",
  "3": "Кулон",
  "4": "Брошь",
};

function isValidImage(file: string) {
  return (
    !file.startsWith("._") &&
    file !== ".DS_Store" &&
    file !== "Thumbs.db" &&
    IMAGE_RE.test(file)
  );
}

function parseJewelryFile(file: string, folderArticle: string) {
  const name = file.replace(IMAGE_RE, "").replace(/_\d+$/, "");
  const parts = name.split(".");

  const typeId = parts[0];
  const modelFromFile = parts[1];
  const modification = parts.slice(2).join(".");

  if (!PRODUCT_TYPES[typeId] || !modelFromFile) return null;

  const model = String(modelFromFile || folderArticle).padStart(4, "0");
  const productKey = [typeId, model, modification || "base"].join("-");

  return {
    productType: PRODUCT_TYPES[typeId],
    model,
    modification,
    productKey,
  };
}

async function readCatalogItems() {
  if (!fs.existsSync(ROOT)) return [];

  const products: PdfProduct[] = [];

  for (const section of fs.readdirSync(ROOT)) {
    const sectionPath = path.join(ROOT, section);
    if (!fs.statSync(sectionPath).isDirectory()) continue;

    for (const article of fs.readdirSync(sectionPath)) {
      const articlePath = path.join(sectionPath, article);
      if (!fs.statSync(articlePath).isDirectory()) continue;

      const images = fs.readdirSync(articlePath).filter(isValidImage);

      if (!JEWELRY_SECTIONS.has(section)) {
        products.push({
          section,
          article,
          title: article,
          imageFile: images[0] || "",
        });
        continue;
      }

      const groups = new Map<string, PdfProduct>();

      for (const image of images) {
        const parsed = parseJewelryFile(image, article);
        if (!parsed) continue;

        if (!groups.has(parsed.productKey)) {
          groups.set(parsed.productKey, {
            section,
            article,
            productKey: parsed.productKey,
            title: `${parsed.productType} ${parsed.model}${
              parsed.modification ? ` ${parsed.modification}` : ""
            }`,
            imageFile: image,
          });
        }
      }

      products.push(...groups.values());
    }
  }

  return products;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sectionFilter = searchParams.get("section") || "";
  const query = (searchParams.get("q") || "").trim().toLowerCase();
  const tagIds = (searchParams.get("tagIds") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const articleTags =
    tagIds.length > 0
      ? await prisma.articleTag.findMany({
          where: sectionFilter ? { section: sectionFilter } : {},
        })
      : [];

  const products = (await readCatalogItems())
    .filter((item) => !sectionFilter || item.section === sectionFilter)
    .filter((item) => {
      const searchText = [
        item.section,
        item.article,
        item.title,
        item.productKey,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !query || searchText.includes(query);
      const matchesTags =
        tagIds.length === 0 ||
        tagIds.every((tagId) =>
          articleTags.some(
            (tag) =>
              tag.section === item.section &&
              tag.article === item.article &&
              tag.productKey === (item.productKey || "") &&
              tag.tagId === tagId
          )
        );

      return matchesQuery && matchesTags;
    });

  const pdf = await renderProductsPdf(products);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="catalog.pdf"',
    },
  });
}
