import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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
    typeId,
    productType: PRODUCT_TYPES[typeId],
    model,
    modification,
    productKey,
  };
}

export async function GET() {
  try {
    const sections = fs

  .readdirSync(ROOT)

  .filter((item) =>

    fs.statSync(path.join(ROOT, item)).isDirectory()

  );

    const data = sections.map((section) => {
      const sectionPath = path.join(ROOT, section);

      const articles = fs

  .readdirSync(sectionPath)

  .filter((item) =>

    fs.statSync(path.join(sectionPath, item)).isDirectory()

  )
        .flatMap((folderArticle) => {
          const articlePath = path.join(sectionPath, folderArticle);

          const images = fs.readdirSync(articlePath).filter(isValidImage);

          if (!JEWELRY_SECTIONS.has(section)) {
            return [
              {
                article: folderArticle,
                title: folderArticle,
                images,
              },
            ];
          }

          const groups = new Map<string, any>();

          for (const file of images) {
            const parsed = parseJewelryFile(file, folderArticle);

            if (!parsed) continue;

            if (!groups.has(parsed.productKey)) {
              groups.set(parsed.productKey, {
                article: folderArticle,
                title: `${parsed.productType} ${parsed.model}${
                  parsed.modification ? ` ${parsed.modification}` : ""
                }`,
                model: parsed.model,
                productKey: parsed.productKey,
                productTypeId: parsed.typeId,
                productType: parsed.productType,
                modification: parsed.modification,
                images: [],
              });
            }

            groups.get(parsed.productKey).images.push(file);
          }

          return Array.from(groups.values());
        });

      return {
        section,
        articles,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Catalog read error" },
      { status: 500 }
    );
  }
}