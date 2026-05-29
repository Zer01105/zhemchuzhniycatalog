import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

const ROOT = "/data/catalog/B2B_Фото";
const JEWELRY_SECTIONS = new Set(["Золото", "Серебро"]);
const IMAGE_RE = /\.(jpg|jpeg|png|webp)$/i;

const PRODUCT_TYPES: Record<string, string> = {
  "1": "Кольцо",
  "2": "Серьги",
  "3": "Кулон",
  "4": "Брошь",
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-zа-яё0-9-_]/gi, "");
}

function isValidImage(file: string) {
  return (
    !file.startsWith("._") &&
    file !== ".DS_Store" &&
    file !== "Thumbs.db" &&
    IMAGE_RE.test(file)
  );
}

function parseJewelryFile(file: string) {
  const name = file.replace(IMAGE_RE, "").replace(/_\d+$/, "");
  const parts = name.split(".");

  const typeId = parts[0];
  const model = parts[1]?.padStart(4, "0");
  const modification = parts.slice(2).join(".");

  if (!PRODUCT_TYPES[typeId] || !model) return null;

  return {
    productType: PRODUCT_TYPES[typeId],
    productKey: [typeId, model, modification || "base"].join("-"),
  };
}

async function getOrCreateTag(name: string) {
  const slug = slugify(name);

  let tag = await prisma.tag.findUnique({
    where: { slug },
  });

  if (!tag) {
    tag = await prisma.tag.create({
      data: { name, slug },
    });
  }

  return tag;
}

export async function POST() {
  let linked = 0;
  let created = 0;

  for (const section of fs.readdirSync(ROOT)) {
    if (!JEWELRY_SECTIONS.has(section)) continue;

    const sectionPath = path.join(ROOT, section);

    for (const folderArticle of fs.readdirSync(sectionPath)) {
      const articlePath = path.join(sectionPath, folderArticle);

      if (!fs.statSync(articlePath).isDirectory()) continue;

      const images = fs.readdirSync(articlePath).filter(isValidImage);
      const productKeys = new Map<string, string>();

      for (const file of images) {
        const parsed = parseJewelryFile(file);
        if (!parsed) continue;

        productKeys.set(parsed.productKey, parsed.productType);
      }

      for (const [productKey, productType] of productKeys.entries()) {
        const before = await prisma.tag.findUnique({
          where: { slug: slugify(productType) },
        });

        const tag = await getOrCreateTag(productType);

        if (!before) created++;

        await prisma.articleTag.upsert({
          where: {
            section_article_productKey_tagId: {
              section,
              article: folderArticle,
              productKey,
              tagId: tag.id,
            },
          },
          update: {},
          create: {
            section,
            article: folderArticle,
            productKey,
            tagId: tag.id,
          },
        });

        linked++;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    created,
    linked,
  });
}
