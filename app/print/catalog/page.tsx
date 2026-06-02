"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import PrintProductCard from "@/components/PrintProductCard";

type Article = {
  article: string;
  title?: string;
  images: string[];
  productKey?: string;
  model?: string;
  productType?: string;
  modification?: string;
};

type Section = {
  section: string;
  articles: Article[];
};

type ArticleTag = {
  section: string;
  article: string;
  productKey: string;
  tagId: string;
};

function PrintCatalogContent() {
  const searchParams = useSearchParams();
  const sectionFilter = searchParams.get("section") || "";
  const query = (searchParams.get("q") || "").trim().toLowerCase();
  const tagIds = (searchParams.get("tagIds") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const [catalog, setCatalog] = useState<Section[]>([]);
  const [articleTags, setArticleTags] = useState<ArticleTag[]>([]);

  useEffect(() => {
    fetch("/api/catalog")
      .then((res) => res.json())
      .then((data) => setCatalog(data));

    fetch(
      sectionFilter
        ? `/api/article-tags?section=${encodeURIComponent(sectionFilter)}`
        : "/api/article-tags"
    )
      .then((res) => res.json())
      .then((data) => setArticleTags(data));
  }, [sectionFilter]);

  const items = useMemo(
    () =>
      catalog
        .filter((section) => !sectionFilter || section.section === sectionFilter)
        .flatMap((section) =>
          section.articles.map((article) => ({
            section: section.section,
            article: article.article,
            title: article.title || article.article,
            productKey: article.productKey || "",
            model: article.model,
            productType: article.productType,
            modification: article.modification,
            previewUrl: article.images[0]
              ? `/api/preview?section=${encodeURIComponent(
                  section.section
                )}&article=${encodeURIComponent(
                  article.article
                )}&file=${encodeURIComponent(article.images[0])}`
              : "",
          }))
        )
        .filter((item) => item.productKey)
        .filter((item) => {
          const searchText = [
            item.section,
            item.article,
            item.title,
            item.model,
            item.productKey,
            item.productType,
            item.modification,
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
                  tag.productKey === item.productKey &&
                  tag.tagId === tagId
              )
            );

          return matchesQuery && matchesTags;
        }),
    [articleTags, catalog, query, sectionFilter, tagIds]
  );

  return (
    <main className="min-h-screen bg-white p-8 text-neutral-900">
      <div className="mx-auto max-w-7xl">
        <div className="print:hidden">
          <Link
            href={sectionFilter ? `/section/${encodeURIComponent(sectionFilter)}` : "/"}
            className="text-sm text-neutral-500"
          >
            ← В каталог
          </Link>

          <button
            type="button"
            onClick={() => window.print()}
            className="ml-4 rounded-xl bg-neutral-900 px-4 py-2 text-sm text-white"
          >
            Печать PDF
          </button>
        </div>

        <header className="my-8">
          <h1 className="text-4xl font-semibold">
            {sectionFilter || "Каталог"}
          </h1>
          <p className="mt-2 text-neutral-500">Изделий: {items.length}</p>
        </header>

        <div className="print-grid grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <PrintProductCard
              key={`${item.section}-${item.article}-${item.productKey}`}
              section={item.section}
              article={item.article}
              productKey={item.productKey}
              title={item.title}
              previewUrl={item.previewUrl}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function PrintCatalogPage() {
  return (
    <Suspense fallback={<main className="p-8">Загрузка...</main>}>
      <PrintCatalogContent />
    </Suspense>
  );
}
