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
  const modification = parts.slice(2).join(".");

  if (!PRODUCT_TYPES[typeId] || !model) return null;

  return {
    typeId,
    productType: PRODUCT_TYPES[typeId],
    pearlType,
    productKey: [typeId, model, modification || "base"].join("-"),
  };
}

function getPearlTagName(pearlType) {
  if (!pearlType) return null;
  if (pearlType === "b") return null;
  if (pearlType === "d") return "Капля";

  return "Барочный";
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
        await attachTag({
          section,
          article: folderArticle,
          productKey: parsed.productKey,
          tagName: parsed.productType,
        });

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