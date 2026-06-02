import Link from "next/link";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import ProductGallery from "../components/ProductGallery";
import FavoriteButton from "@/components/FavoriteButton";

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

function buildSetKey(section: string, article: string, productKey: string) {
  return [section, article, productKey].join("|");
}

function getProductSummary(section: string, article: string, productKey: string) {
  const articlePath = path.join(ROOT, section, article);

  if (!fs.existsSync(articlePath)) return null;

  const productImages = fs
    .readdirSync(articlePath)
    .filter(isValidImage)
    .map((file) => ({
      file,
      parsed: parseJewelryFile(file),
    }))
    .filter((item) => item.parsed?.productKey === productKey);

  const parsed = productImages[0]?.parsed;
  const title = parsed
    ? `${parsed.productType} ${parsed.model}${
        parsed.modification ? ` ${parsed.modification}` : ""
      }`
    : article;

  return {
    section,
    article,
    productKey,
    title,
    image: productImages[0]?.file || "",
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
  const title = parsed
    ? `${parsed.productType} ${parsed.model}${
        parsed.modification ? ` ${parsed.modification}` : ""
      }`
    : decodedArticle;
  const previewUrl = images[0]
    ? `/api/preview?section=${encodeURIComponent(
        decodedSection
      )}&article=${encodeURIComponent(decodedArticle)}&file=${encodeURIComponent(
        images[0]
      )}`
    : "";

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

const setItems = await prisma.productSetItem.findMany({
  where: {
    setKey: buildSetKey(decodedSection, decodedArticle, decodedProductKey),
  },
  orderBy: {
    createdAt: "asc",
  },
});

const setProducts = setItems
  .map((item) =>
    getProductSummary(item.section, item.article, item.productKey)
  )
  .filter((item) => item !== null);

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
            {title}
          </h1>

          <p className="mt-2 text-neutral-500">Фото: {images.length}</p>

          <FavoriteButton
            item={{
              section: decodedSection,
              article: decodedArticle,
              productKey: decodedProductKey,
              title,
              previewUrl,
            }}
            className="mt-4"
          />
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

        {setProducts.length > 0 && (
          <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-semibold">Комплект к модели</h2>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {setProducts.map((item) => {
                const itemPreviewUrl = item.image
                  ? `/api/preview?section=${encodeURIComponent(
                      item.section
                    )}&article=${encodeURIComponent(
                      item.article
                    )}&file=${encodeURIComponent(item.image)}`
                  : "";

                return (
                  <Link
                    key={`${item.section}-${item.article}-${item.productKey}`}
                    href={`/product/${encodeURIComponent(
                      item.section
                    )}/${encodeURIComponent(item.article)}/${encodeURIComponent(
                      item.productKey
                    )}`}
                    className="rounded-xl border border-neutral-200 p-3 transition hover:bg-neutral-50"
                  >
                    <div className="flex h-56 w-full items-center justify-center overflow-hidden rounded-xl bg-white">
                      {itemPreviewUrl && (
                        <img
                          src={itemPreviewUrl}
                          alt={item.title}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-contain"
                        />
                      )}
                    </div>

                    <div className="mt-3 font-medium">{item.title}</div>
                    <div className="mt-1 text-sm text-neutral-500">
                      Артикул: {item.article}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
