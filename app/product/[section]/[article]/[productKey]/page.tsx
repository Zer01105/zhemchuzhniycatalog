import Link from "next/link";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import ProductGallery from "../components/ProductGallery";

const ROOT = "/data/catalog/B2B_Фото";
const IMAGE_RE = /\.(jpg|jpeg|png|webp)$/i;

const PRODUCT_TYPES: Record<string, string> = {
  "1": "Кольцо",
  "2": "Серьги",
  "3": "Кулон",
  "4": "Брошь",
};

type Props = {
  params: Promise<{
    section: string;
    article: string;
    productKey: string;
  }>;
};

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

  const productKey = [typeId, model, modification || "base"].join("-");

  return {
    typeId,
    productType: PRODUCT_TYPES[typeId],
    model,
    modification,
    productKey,
  };
}

export default async function ProductPage({ params }: Props) {
  const { section, article, productKey } = await params;

  const decodedSection = decodeURIComponent(section);
  const decodedArticle = decodeURIComponent(article);
  const decodedProductKey = decodeURIComponent(productKey);

  const articlePath = path.join(ROOT, decodedSection, decodedArticle);

  const allImages = fs.readdirSync(articlePath).filter(isValidImage);

  const parsedImages = allImages
    .map((file) => ({
      file,
      parsed: parseJewelryFile(file),
    }))
    .filter((item) => item.parsed?.productKey === decodedProductKey);

  const images = parsedImages.map((item) => item.file);
  const parsed = parsedImages[0]?.parsed;

  const productAttributes = await prisma.articleAttribute.findMany({
  where: {
    section: decodedSection,
    article: decodedArticle,
    productKey: decodedProductKey,
  },
  orderBy: {
    sortOrder: "asc",
  },
});

const modelAttributes = await prisma.articleAttribute.findMany({
  where: {
    section: decodedSection,
    article: decodedArticle,
    productKey: "",
  },
  orderBy: {
    sortOrder: "asc",
  },
});

const attributes =
  productAttributes.length > 0
    ? productAttributes
    : modelAttributes;

  return (
    <main className="min-h-screen bg-neutral-100 p-8 text-neutral-900">
      <div className="mx-auto max-w-7xl">
        <Link
          href={`/section/${encodeURIComponent(decodedSection)}`}
          className="text-sm text-neutral-500"
        >
          ← Назад в раздел
        </Link>

        <header className="mt-6 mb-8">
          <div className="text-sm text-neutral-500">{decodedSection}</div>

          <h1 className="text-4xl font-semibold">
            {parsed
              ? `${parsed.productType} ${parsed.model}${
                  parsed.modification ? ` ${parsed.modification}` : ""
                }`
              : decodedArticle}
          </h1>

          <p className="mt-2 text-neutral-500">Фото: {images.length}</p>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
          <ProductGallery
            section={decodedSection}
            article={decodedArticle}
            images={images}
          />

          <aside className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-semibold">Характеристики</h2>

            {attributes.length > 0 ? (
              <div className="mt-4 space-y-3 text-sm">
                {attributes.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-4 border-b border-neutral-100 pb-2"
                  >
                    <span className="text-neutral-500">{item.name}</span>
                    <span className="text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 text-sm text-neutral-500">
                Характеристики не заполнены.
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}