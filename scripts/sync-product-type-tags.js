const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const ROOT = process.env.CATALOG_ROOT || "/data/catalog/B2B_Фото";
const JEWELRY_SECTIONS = new Set(["Золото", "Серебро"]);
const IMAGE_RE = /\.(jpg|jpeg|png|webp)$/i;

const PRODUCT_TYPES = {
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

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-zа-яё0-9-_]/gi, "");
}

function isValidImage(file) {
  return (
    !file.startsWith("._") &&
    file !== ".DS_Store" &&
    file !== "Thumbs.db" &&
    IMAGE_RE.test(file)
  );
}

function parseJewelryFile(file) {
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

function getPearlTagName(pearlType) {
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
    console.error("auto tag rules unavailable, using defaults:", error.message);
    return DEFAULT_RULES;
  }
}

function getRuleTagNames(parsed, rules) {
  const tagNames = [];

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

async function getOrCreateTag(name) {
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

async function attachTag({ section, article, productKey, tagName }) {
  const tag = await getOrCreateTag(tagName);

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

  console.log(`${section}/${article}/${productKey} → ${tag.name}`);
}

async function main() {
  const rules = await loadAutoTagRules();

  if (!fs.existsSync(ROOT)) {
    console.error("catalog root not found:", ROOT);
    return;
  }

  for (const section of fs.readdirSync(ROOT)) {
    if (!JEWELRY_SECTIONS.has(section)) continue;

    const sectionPath = path.join(ROOT, section);

    for (const folderArticle of fs.readdirSync(sectionPath)) {
      const articlePath = path.join(sectionPath, folderArticle);

      if (!fs.statSync(articlePath).isDirectory()) continue;

      const images = fs.readdirSync(articlePath).filter(isValidImage);
      const products = new Map();

      for (const file of images) {
        const parsed = parseJewelryFile(file);
        if (!parsed) continue;

        products.set(parsed.productKey, parsed);
      }

      for (const parsed of products.values()) {
        for (const tagName of getRuleTagNames(parsed, rules)) {
          await attachTag({
            section,
            article: folderArticle,
            productKey: parsed.productKey,
            tagName,
          });
        }

        const pearlTagName = getPearlTagName(parsed.pearlType);

        if (pearlTagName) {
          await attachTag({
            section,
            article: folderArticle,
            productKey: parsed.productKey,
            tagName: pearlTagName,
          });
        }
      }
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Done");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
