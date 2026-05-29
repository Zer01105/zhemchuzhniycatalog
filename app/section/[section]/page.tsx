"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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
  tagId: string;
  tag: Tag;
};

export default function SectionPage() {
  const params = useParams();
  const sectionName = decodeURIComponent(params.section as string);

  const [articles, setArticles] = useState<Article[]>([]);
  const [articleTags, setArticleTags] = useState<ArticleTag[]>([]);
  const [query, setQuery] = useState("");
  const [activeTagIds, setActiveTagIds] = useState<string[]>([]);

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

  const filteredArticles = articles.filter((item) => {
    const matchesQuery = item.article
      .toLowerCase()
      .includes(query.toLowerCase());

    const matchesTag =
      activeTagIds.length === 0 ||
      activeTagIds.every((tagId) =>
        articleTags.some(
          (tag) => tag.article === item.article && tag.tagId === tagId
        )
      );

    return matchesQuery && matchesTag;
  });

  return (
    <main className="min-h-screen bg-neutral-100 p-8 text-neutral-900">
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="text-sm text-neutral-500">
          ← Назад к разделам
        </Link>

        <header className="mt-6 mb-8">
          <h1 className="text-4xl font-semibold">{sectionName}</h1>
          <p className="mt-2 text-neutral-500">
            Артикулов: {filteredArticles.length}
          </p>
        </header>

        <input
          className="mb-4 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none"
          placeholder="Поиск по артикулу внутри раздела..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filteredArticles.map((article) => (
            <Link
              key={article.article}
              href={
  article.productKey
    ? `/product/${encodeURIComponent(sectionName)}/${encodeURIComponent(
        article.article
      )}/${encodeURIComponent(article.productKey)}`
    : `/product/${encodeURIComponent(sectionName)}/${encodeURIComponent(
        article.article
      )}`
}
              className="rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
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
                    src={`/api/preview?section=${encodeURIComponent(
                      sectionName
                    )}&article=${encodeURIComponent(
                      article.article
                    )}&file=${encodeURIComponent(article.images[0])}`}
                    alt={article.images[0]}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain"
                  />
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}