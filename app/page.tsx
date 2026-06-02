"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

type SearchResult = {
  section: string;
  article: string;
  title?: string;
  images: string[];
  productKey?: string;
  model?: string;
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

export default function Home() {
  const [catalog, setCatalog] = useState<Section[]>([]);
  const [articleTags, setArticleTags] = useState<ArticleTag[]>([]);
  const [query, setQuery] = useState("");
  const [activeTagIds, setActiveTagIds] = useState<string[]>([]);
  const [filtersPinned, setFiltersPinned] = useState(true);

  useEffect(() => {
    fetch("/api/catalog")
      .then((res) => res.json())
      .then((data) => setCatalog(data));

    fetch("/api/article-tags")
      .then((res) => res.json())
      .then((data) => setArticleTags(data));
  }, []);

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

  const searchResults: SearchResult[] = catalog
    .flatMap((section) =>
      section.articles.map((item) => ({
        section: section.section,
        article: item.article,
        title: item.title,
        images: item.images,
        productKey: item.productKey,
        model: item.model,
      }))
    )
    .filter((item) => {
      const searchText = [
        item.article,
        item.title,
        item.model,
        item.productKey,
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
        tag.section === item.section &&
        tag.article === item.article &&
        tag.productKey === (item.productKey || "") &&
        tag.tagId === tagId
    )
  );

      return matchesQuery && matchesTag;
    });

  const isFiltering = query.trim().length > 0 || activeTagIds.length > 0;
  const pdfParams = new URLSearchParams();
  if (query.trim()) pdfParams.set("q", query.trim());
  if (activeTagIds.length > 0) {
    pdfParams.set("tagIds", activeTagIds.join(","));
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-8 text-neutral-900">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-4xl font-semibold">B2B каталог</h1>
          <p className="mt-2 text-neutral-500">
            Выберите раздел или найдите артикул по всему каталогу.
          </p>
          <Link href="/favorites" className="mt-3 inline-block text-sm text-neutral-500">
            Избранное
          </Link>
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
            placeholder="Глобальный поиск по артикулу..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {tags.length > 0 && (
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
          )}

          {isFiltering && (
            <div className="mt-3">
              <a
                href={`/api/pdf/catalog?${pdfParams.toString()}`}
                className="inline-block rounded-full bg-neutral-900 px-4 py-2 text-sm text-white"
              >
                Скачать PDF
              </a>
            </div>
          )}
        </div>

        {!isFiltering ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {catalog.map((section) => (
              <Link
                key={section.section}
                href={`/section/${encodeURIComponent(section.section)}`}
                className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="text-2xl font-semibold">{section.section}</div>

                <div className="mt-2 text-sm text-neutral-500">
                  Артикулов: {section.articles.length}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <section>
            <h2 className="mb-4 text-2xl font-medium">
              Найдено: {searchResults.length}
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {searchResults.map((item) => {
                const previewUrl = item.images[0]
                  ? `/api/preview?section=${encodeURIComponent(
                      item.section
                    )}&article=${encodeURIComponent(
                      item.article
                    )}&file=${encodeURIComponent(item.images[0])}`
                  : "";

                return (
                  <div
                    key={`${item.section}-${item.article}-${
                      item.productKey || item.article
                    }`}
                    className="relative rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <FavoriteButton
                      item={{
                        section: item.section,
                        article: item.article,
                        productKey: item.productKey || "",
                        title: item.title || item.article,
                        previewUrl,
                      }}
                      iconOnly
                      className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center p-0"
                    />

                    <Link
                      href={
                        item.productKey
                          ? `/product/${encodeURIComponent(
                              item.section
                            )}/${encodeURIComponent(
                              item.article
                            )}/${encodeURIComponent(item.productKey)}`
                          : `/product/${encodeURIComponent(
                              item.section
                            )}/${encodeURIComponent(item.article)}`
                      }
                    >
                      <div className="text-sm text-neutral-500">
                        {item.section}
                      </div>

                      <div className="mt-1 text-xl font-semibold">
                        {item.title || item.article}
                      </div>

                      <div className="mt-2 text-sm text-neutral-500">
                        Фото: {item.images.length}
                      </div>

                      <div className="mt-4 flex h-80 w-full items-center justify-center overflow-hidden rounded-xl bg-white">
                        {item.images[0] && (
                          <img
                            src={previewUrl}
                            alt={item.images[0]}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-contain"
                          />
                        )}
                      </div>
                    </Link>

                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
