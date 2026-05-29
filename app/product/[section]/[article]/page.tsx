import Link from "next/link";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import ProductGallery from "./components/ProductGallery";
const ROOT = "/data/catalog/B2B_Фото";

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

  const images = fs
    .readdirSync(articlePath)
    .filter(
      (file) =>
        !file.startsWith("._") &&
        file !== ".DS_Store" &&
        file !== "Thumbs.db" &&
        /\.(jpg|jpeg|png|webp)$/i.test(file)
    );

  const attributes = await prisma.articleAttribute.findMany({
    where: {
      section: decodedSection,
      article: decodedArticle,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  const mainImage = images[0];

  return (
    <main className="min-h-screen bg-neutral-100 p-8 text-neutral-900">
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="text-sm text-neutral-500">
          ← Назад в каталог
        </Link>

        <header className="mt-6 mb-8">
          <div className="text-sm text-neutral-500">{decodedSection}</div>
          <h1 className="text-4xl font-semibold">Артикул {decodedArticle}</h1>
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