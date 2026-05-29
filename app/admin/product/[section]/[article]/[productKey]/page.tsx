"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Article = {
  article: string;
  title?: string;
  images: string[];
  productKey?: string;
};

type Section = {
  section: string;
  articles: Article[];
};

type Tag = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

type ArticleTag = {
  id: string;
  section: string;
  article: string;
  productKey: string;
  tagId: string;
  tag: Tag;
};

type ArticleAttribute = {
  id: string;
  section: string;
  article: string;
  productKey: string;
  name: string;
  value: string;
  sortOrder: number;
};

export default function AdminProductPage() {
  const params = useParams();

  const sectionName = decodeURIComponent(params.section as string);
  const articleName = decodeURIComponent(params.article as string);
  const productKey = decodeURIComponent(params.productKey as string);

  const [title, setTitle] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState("");

  const [tags, setTags] = useState<Tag[]>([]);
  const [articleTags, setArticleTags] = useState<ArticleTag[]>([]);
  const [attributes, setAttributes] = useState<ArticleAttribute[]>([]);

  async function loadProduct() {
    const res = await fetch("/api/catalog");
    const data: Section[] = await res.json();

    const section = data.find((item) => item.section === sectionName);
    const article = section?.articles.find(
      (item) =>
        item.article === articleName &&
        item.productKey === productKey
    );

    setImages(article?.images || []);
    setTitle(article?.title || articleName);
  }

  async function loadTags() {
    const res = await fetch("/api/admin/tags");
    const data = await res.json();
    setTags(data);
  }

  async function loadArticleTags() {
    const res = await fetch(
      `/api/admin/article-tags?section=${encodeURIComponent(
        sectionName
      )}&article=${encodeURIComponent(
        articleName
      )}&productKey=${encodeURIComponent(productKey)}`
    );

    const data = await res.json();
    setArticleTags(data);
  }

  async function loadAttributes() {
    const res = await fetch(
      `/api/article-attributes?section=${encodeURIComponent(
        sectionName
      )}&article=${encodeURIComponent(
        articleName
      )}&productKey=${encodeURIComponent(productKey)}`
    );

    const data = await res.json();
    setAttributes(data);
  }

  useEffect(() => {
    loadProduct();
    loadTags();
    loadArticleTags();
    loadAttributes();
  }, []);

  async function toggleTag(tag: Tag) {
    const hasTag = articleTags.some((item) => item.tagId === tag.id);

    const res = await fetch("/api/admin/article-tags", {
      method: hasTag ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: sectionName,
        article: articleName,
        productKey,
        tagId: tag.id,
      }),
    });

    if (res.ok) {
      await loadArticleTags();
    }
  }

  async function clearArticleData(mode: "tags" | "meta" | "all") {
    const labels = {
      tags: "теги",
      meta: "характеристики",
      all: "теги и характеристики",
    };

    const ok = confirm(`Очистить ${labels[mode]} изделия ${title}?`);

    if (!ok) return;

    const res = await fetch("/api/admin/clear-article-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        section: sectionName,
        article: articleName,
        productKey,
        mode,
      }),
    });

    if (!res.ok) {
      setStatus("Ошибка очистки данных.");
      return;
    }

    setStatus("Данные очищены.");

    await loadArticleTags();
    await loadAttributes();
  }

  async function deleteImage(file: string) {
    const ok = confirm(
      `Удалить фото ${file}? Будет удалён оригинал и preview.`
    );

    if (!ok) return;

    const res = await fetch("/api/admin/delete-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        section: sectionName,
        article: articleName,
        file,
      }),
    });

    if (!res.ok) {
      setStatus("Ошибка удаления фото.");
      return;
    }

    setStatus(`Фото удалено: ${file}`);
    await loadProduct();
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-8 text-neutral-900">
      <div className="mx-auto max-w-7xl">
        <div className="flex gap-4">
          <Link href="/admin" className="text-sm text-neutral-500">
  ← В админку
</Link>

          <Link
            href={`/product/${encodeURIComponent(
              sectionName
            )}/${encodeURIComponent(articleName)}/${encodeURIComponent(
              productKey
            )}`}
            className="text-sm text-neutral-500"
          >
            Открыть страницу товара
          </Link>
        </div>

        <header className="mt-6 mb-8">
          <div className="text-sm text-neutral-500">{sectionName}</div>
          <h1 className="text-4xl font-semibold">{title}</h1>
          <p className="mt-2 text-neutral-500">
            Модель: {articleName} · Изделие: {productKey.replaceAll("-", ".")} · Фото: {images.length}
          </p>
        </header>

        {attributes.length > 0 && (
          <section className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-semibold">Характеристики</h2>

            <div className="mt-4 space-y-2 text-sm">
              {attributes.map((item) => (
                <div key={item.id} className="flex gap-2">
                  <span className="text-neutral-500">{item.name}:</span>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-semibold">Очистка данных</h2>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => clearArticleData("meta")}
              className="rounded-xl bg-neutral-200 px-4 py-2 text-sm"
            >
              Очистить характеристики
            </button>

            <button
              onClick={() => clearArticleData("tags")}
              className="rounded-xl bg-neutral-200 px-4 py-2 text-sm"
            >
              Очистить теги
            </button>

            <button
              onClick={() => clearArticleData("all")}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm text-white"
            >
              Очистить всё
            </button>
          </div>
        </section>

        <section className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-semibold">Теги изделия</h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => {
              const active = articleTags.some((item) => item.tagId === tag.id);

              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full px-4 py-2 text-sm ${
                    active
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-700"
                  }`}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </section>

        {status && (
          <div className="mb-6 rounded-xl bg-white px-4 py-3 text-sm text-neutral-700 shadow-sm">
            {status}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {images.map((img) => (
            <div key={img} className="rounded-2xl bg-white p-3 shadow-sm">
              <img
                src={`/api/preview?section=${encodeURIComponent(
                  sectionName
                )}&article=${encodeURIComponent(
                  articleName
                )}&file=${encodeURIComponent(img)}`}
                alt={img}
                loading="lazy"
                decoding="async"
                className="w-full rounded-xl object-contain"
              />

              <div className="mt-3 break-all text-sm text-neutral-500">
                {img}
              </div>

              <button
                onClick={() => deleteImage(img)}
                className="mt-3 w-full rounded-xl bg-red-600 px-4 py-2 text-sm text-white"
              >
                Удалить фото
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}