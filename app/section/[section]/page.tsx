"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import FavoriteButton from "@/components/FavoriteButton";

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

type Tag = {
  id: string;
  name: string;
  slug: string;
};

type ArticleTag = {
  id: string;
  section: string;
  article: string;
  productKey: string;
  tagId: string;
  tag: Tag;
};

function ProductCard({
  sectionName,
  article,
}: {
  sectionName: string;
  article: Article;
}) {
  const previewUrl = article.images[0]
    ? `/api/preview?section=${encodeURIComponent(
        sectionName
      )}&article=${encodeURIComponent(article.article)}&file=${encodeURIComponent(
        article.images[0]
      )}`
    : "";

  return (
    <div
      key={`${article.article}-${article.productKey || article.article}`}
      className="relative rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <FavoriteButton
        item={{
          section: sectionName,
          article: article.article,
          productKey: article.productKey || "",
          title: article.title || article.article,
          previewUrl,
        }}
        iconOnly
        className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center p-0"
      />

      <Link
        href={
          article.productKey
            ? `/product/${encodeURIComponent(sectionName)}/${encodeURIComponent(
                article.article
              )}/${encodeURIComponent(article.productKey)}`
            : `/product/${encodeURIComponent(sectionName)}/${encodeURIComponent(
                article.article
              )}`
        }
      >
        <div className="text-xl font-semibold">
          {article.title || article.article}
        </div>

        <div className="mt-2 text-sm text-neutral-500">
          Фото: {article.images.length}
        </div>

        <div className="mt-4 flex h-80 w-full items-center justify-center overflow-hidden rounded-xl bg-white">
          {article.images[0] && (
            <img
              src={previewUrl}
              alt={article.images[0]}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain"
            />
          )}
        </div>
      </Link>

    </div>
  );
}

export default function SectionPage() {
  const params = useParams();
  const sectionName = decodeURIComponent(params.section as string);

  const [articles, setArticles] = useState<Article[]>([]);
  const [articleTags, setArticleTags] = useState<ArticleTag[]>([]);
  const [query, setQuery] = useState("");
  const [activeTagIds, setActiveTagIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"products" | "sets">("products");
  const [filtersPinned, setFiltersPinned] = useState(true);

  useEffect(() => {
    fetch("/api/catalog")
      .then((res) => res.json())
      .then((data: Section[]) => {
        const section = data.find((item) => item.section === sectionName);
        setArticles(section?.articles || []);
      });

    fetch(`/api/article-tags?section=${encodeURIComponent(sectionName)}`)
      .then((res) => res.json())
      .then((data) => setArticleTags(data));
  }, [sectionName]);

  function toggleTag(tagId: string) {
    setActiveTagIds((current) =>
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId]
    );
  }

  const tags = Array.from(
    new Map(articleTags.map((item) => [item.tag.id, item.tag])).values()
  );

  const normalizedQuery = query.trim().toLowerCase();
  const normalizedQueryNoZeros = normalizedQuery.replace(/^0+/, "");

  const filteredArticles = articles.filter((item) => {
    const searchText = [
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

    const searchTextNoZeros = searchText.replace(/\b0+/g, "");

    const matchesQuery =
      !normalizedQuery ||
      searchText.includes(normalizedQuery) ||
      (!!normalizedQueryNoZeros &&
        searchTextNoZeros.includes(normalizedQueryNoZeros));

const matchesTag =
  activeTagIds.length === 0 ||
  activeTagIds.every((tagId) =>
    articleTags.some(
      (tag) =>
        tag.article === item.article &&
        tag.productKey === (item.productKey || "") &&
        tag.tagId === tagId
    )
  );

    return matchesQuery && matchesTag;
  });

  const groupedByModel = Array.from(
    filteredArticles
      .reduce((map, article) => {
        const model = article.model || article.article;

        if (!map.has(model)) {
          map.set(model, []);
        }

        map.get(model)!.push(article);

        return map;
      }, new Map<string, Article[]>())
      .entries()
  );

  const printParams = new URLSearchParams();
  printParams.set("section", sectionName);
  if (query.trim()) printParams.set("q", query.trim());
  if (activeTagIds.length > 0) {
    printParams.set("tagIds", activeTagIds.join(","));
  }
  const pdfParams = printParams.toString();

  return (
    <main className="min-h-screen bg-neutral-100 p-8 text-neutral-900">
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="text-sm text-neutral-500">
          ← Назад к разделам
        </Link>

        <Link href="/favorites" className="mt-3 inline-block text-sm text-neutral-500">
          Избранное
        </Link>

        <header className="mt-6 mb-8">
          <h1 className="text-4xl font-semibold">{sectionName}</h1>
          <p className="mt-2 text-neutral-500">
            Артикулов: {filteredArticles.length}
          </p>
        </header>

        <div
          className={`${
            filtersPinned ? "sticky top-4 z-20" : "relative"
          } mb-8 rounded-2xl bg-neutral-100/95 p-3 shadow-sm backdrop-blur`}
        >
          {filtersPinned && (
            <button
              type="button"
              onClick={() => setFiltersPinned(false)}
              aria-label="Открепить фильтры"
              className="absolute right-2 top-2 rounded-full bg-white px-2 py-1 text-sm text-neutral-500 shadow-sm"
            >
              ×
            </button>
          )}

          <input
            className="mb-4 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 pr-10 outline-none"
            placeholder="Поиск по артикулу внутри раздела..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setViewMode("products")}
              className={`rounded-full px-4 py-2 text-sm ${
                viewMode === "products"
                  ? "bg-neutral-900 text-white"
                  : "bg-white text-neutral-700"
              }`}
            >
              По изделиям
            </button>

            <button
              onClick={() => setViewMode("sets")}
              className={`rounded-full px-4 py-2 text-sm ${
                viewMode === "sets"
                  ? "bg-neutral-900 text-white"
                  : "bg-white text-neutral-700"
              }`}
            >
              По комплектам
            </button>

            <Link
              href={`/print/catalog?${printParams.toString()}`}
              className="rounded-full bg-white px-4 py-2 text-sm text-neutral-700"
            >
              Печать PDF
            </Link>

            <a
              href={`/api/pdf/catalog?${pdfParams}`}
              className="rounded-full bg-neutral-900 px-4 py-2 text-sm text-white"
            >
              Скачать PDF
            </a>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTagIds([])}
              className={`rounded-full px-4 py-2 text-sm ${
                activeTagIds.length === 0
                  ? "bg-neutral-900 text-white"
                  : "bg-white text-neutral-700"
              }`}
            >
              Все
            </button>

            {tags.map((tag) => {
              const active = activeTagIds.includes(tag.id);

              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`rounded-full px-4 py-2 text-sm ${
                    active
                      ? "bg-neutral-900 text-white"
                      : "bg-white text-neutral-700"
                  }`}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>

        {viewMode === "products" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filteredArticles.map((article) => (
              <ProductCard
                key={`${article.article}-${article.productKey || article.article}`}
                sectionName={sectionName}
                article={article}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {groupedByModel.map(([model, modelArticles]) => (
              <section
                key={model}
                className="rounded-3xl bg-white/60 p-5 shadow-sm ring-1 ring-neutral-200"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-neutral-500">Модель</div>
                    <h2 className="text-2xl font-semibold">{model}</h2>
                  </div>

                  <div className="text-sm text-neutral-500">
                    Изделий: {modelArticles.length}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {modelArticles.map((article) => (
                    <ProductCard
                      key={`${article.article}-${
                        article.productKey || article.article
                      }`}
                      sectionName={sectionName}
                      article={article}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
