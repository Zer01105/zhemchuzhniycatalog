import Link from "next/link";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import ProductGallery from "./components/ProductGallery";
import FavoriteButton from "@/components/FavoriteButton";
const ROOT = "/data/catalog/B2B_Фото";
const IMAGE_RE = /\.(jpg|jpeg|png|webp)$/i;

type Props = {
  params: Promise<{
    section: string;
    article: string;
  }>;
};

export default async function ProductPage({ params }: Props) {
  const { section, article } = await params;

  const decodedSection = decodeURIComponent(section);
  const decodedArticle = decodeURIComponent(article);

  const articlePath = path.join(ROOT, decodedSection, decodedArticle);

  const articleExists =
    fs.existsSync(articlePath) && fs.statSync(articlePath).isDirectory();

  const images = articleExists
    ? fs
        .readdirSync(articlePath)
        .filter(
          (file) =>
            !file.startsWith("._") &&
            file !== ".DS_Store" &&
            file !== "Thumbs.db" &&
            IMAGE_RE.test(file)
        )
    : [];

  const attributes = await prisma.articleAttribute.findMany({
    where: {
      section: decodedSection,
      article: decodedArticle,
      productKey: "",
    },
    orderBy: {
      sortOrder: "asc",
    },
  }).catch((error) => {
    console.error("Article attributes read error", error);
    return [];
  });

  const mainImage = images[0];
  const title = `Артикул ${decodedArticle}`;
  const previewUrl = mainImage
    ? `/api/preview?section=${encodeURIComponent(
        decodedSection
      )}&article=${encodeURIComponent(decodedArticle)}&file=${encodeURIComponent(
        mainImage
      )}`
    : "";

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
          <div className="relative pr-0 md:pr-56">
            <h1 className="text-4xl font-semibold">{title}</h1>

            <FavoriteButton
              item={{
                section: decodedSection,
                article: decodedArticle,
                title,
                previewUrl,
              }}
              className="mt-4 px-4 py-2 md:absolute md:right-0 md:top-0 md:mt-0"
            />
          </div>
          <p className="mt-2 text-neutral-500">Фото: {images.length}</p>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
          {images.length > 0 ? (
            <ProductGallery
              section={decodedSection}
              article={decodedArticle}
              images={images}
            />
          ) : (
            <section className="rounded-2xl bg-white p-5 text-neutral-500 shadow-sm">
              {!articleExists
                ? "Папка артикула не найдена."
                : "Фото для этого артикула не найдены."}
            </section>
          )}

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
