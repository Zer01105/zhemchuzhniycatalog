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

const DEFAULT_RULES = [
  { matchType: "first_digit", matchValue: "1", tagName: "Кольцо" },
  { matchType: "first_digit", matchValue: "2", tagName: "Серьги" },
  { matchType: "first_digit", matchValue: "3", tagName: "Кулон" },
  { matchType: "first_digit", matchValue: "4", tagName: "Брошь" },
];

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
  const pearlType = parts[3]?.toLowerCase();
  const lastLetter = name.match(/[a-zа-яё]$/i)?.[0]?.toLowerCase() || "";
  const modification = parts.slice(2).join(".");

  if (!model) return null;

  return {
    typeId,
    productType: PRODUCT_TYPES[typeId],
    pearlType,
    lastLetter,
    productKey: [typeId, model, modification || "base"].join("-"),
  };
}

function getPearlTagName(pearlType?: string) {
  if (!pearlType) return null;
  if (pearlType === "b") return null;
  if (pearlType === "d") return "Капля";

  return "Барочный";
}

async function loadAutoTagRules() {
  try {
    const rules = await prisma.autoTagRule.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return [
      ...DEFAULT_RULES,
      ...rules.map((rule) => ({
        matchType: rule.matchType,
        matchValue: rule.matchValue.toLowerCase(),
        tagName: rule.tagName,
      })),
    ];
  } catch (error) {
    console.error("auto tag rules unavailable, using defaults:", error);
    return DEFAULT_RULES;
  }
}

function getRuleTagNames(
  parsed: NonNullable<ReturnType<typeof parseJewelryFile>>,
  rules: Array<{ matchType: string; matchValue: string; tagName: string }>
) {
  const tagNames: string[] = [];

  for (const rule of rules) {
    if (
      rule.matchType === "first_digit" &&
      parsed.typeId === rule.matchValue
    ) {
      tagNames.push(rule.tagName);
    }

    if (
      rule.matchType === "last_letter" &&
      (parsed.lastLetter === rule.matchValue || rule.matchValue === "*")
    ) {
      tagNames.push(rule.tagName);
    }
  }

  return Array.from(new Set(tagNames));
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
  const logs: string[] = [];
  const rules = await loadAutoTagRules();

  if (!fs.existsSync(ROOT)) {
    return NextResponse.json({
      ok: true,
      created,
      linked,
      message: "Catalog root not found",
      logs: ["Catalog root not found"],
    });
  }

  for (const section of fs.readdirSync(ROOT)) {
    if (!JEWELRY_SECTIONS.has(section)) continue;

    const sectionPath = path.join(ROOT, section);

    for (const folderArticle of fs.readdirSync(sectionPath)) {
      const articlePath = path.join(sectionPath, folderArticle);

      if (!fs.statSync(articlePath).isDirectory()) continue;

      const images = fs.readdirSync(articlePath).filter(isValidImage);
      const products = new Map<
        string,
        NonNullable<ReturnType<typeof parseJewelryFile>>
      >();

      for (const file of images) {
        const parsed = parseJewelryFile(file);
        if (!parsed) continue;

        products.set(parsed.productKey, parsed);
      }

      for (const parsed of products.values()) {
        const tagNames = [
          ...getRuleTagNames(parsed, rules),
          ...(getPearlTagName(parsed.pearlType)
            ? [getPearlTagName(parsed.pearlType)!]
            : []),
        ];

        for (const tagName of Array.from(new Set(tagNames))) {
          const before = await prisma.tag.findUnique({
            where: { slug: slugify(tagName) },
          });

          const tag = await getOrCreateTag(tagName);

          if (!before) created++;

          await prisma.articleTag.upsert({
            where: {
              section_article_productKey_tagId: {
                section,
                article: folderArticle,
                productKey: parsed.productKey,
                tagId: tag.id,
              },
            },
            update: {},
            create: {
              section,
              article: folderArticle,
              productKey: parsed.productKey,
              tagId: tag.id,
            },
          });

          linked++;
          logs.push(`${section}/${folderArticle}/${parsed.productKey} → ${tag.name}`);
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    created,
    linked,
    logs,
  });
}
