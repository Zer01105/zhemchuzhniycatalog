"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

  return (
    <main className="min-h-screen bg-neutral-100 p-8 text-neutral-900">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-4xl font-semibold">B2B каталог</h1>
          <p className="mt-2 text-neutral-500">
            Выберите раздел или найдите артикул по всему каталогу.
          </p>
        </header>

        <input
          className="mb-4 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none"
          placeholder="Глобальный поиск по артикулу..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {tags.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
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
              {searchResults.map((item) => (
                <Link
                  key={`${item.section}-${item.article}-${
                    item.productKey || item.article
                  }`}
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
                  className="rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
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
                        src={`/api/preview?section=${encodeURIComponent(
                          item.section
                        )}&article=${encodeURIComponent(
                          item.article
                        )}&file=${encodeURIComponent(item.images[0])}`}
                        alt={item.images[0]}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain"
                      />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}