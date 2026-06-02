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

type ProductSetItem = {
  id: string;
  section: string;
  article: string;
  productKey: string;
};

type CatalogProduct = Article & {
  section: string;
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
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [setItems, setSetItems] = useState<ProductSetItem[]>([]);
  const [setQuery, setSetQuery] = useState("");

  async function loadProduct() {
    const res = await fetch("/api/catalog");
    const data: Section[] = await res.json();

    const section = data.find((item) => item.section === sectionName);
    const article = section?.articles.find(
      (item) =>
        item.article === articleName &&
        item.productKey === productKey
    );

    setCatalogProducts(
      data.flatMap((catalogSection) =>
        catalogSection.articles
          .filter((item) => item.productKey)
          .map((item) => ({
            ...item,
            section: catalogSection.section,
          }))
      )
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

  async function loadSetItems() {
    const res = await fetch(
      `/api/admin/product-sets?section=${encodeURIComponent(
        sectionName
      )}&article=${encodeURIComponent(
        articleName
      )}&productKey=${encodeURIComponent(productKey)}`
    );

    if (!res.ok) return;

    const data = await res.json();
    setSetItems(data.items || []);
  }

  useEffect(() => {
    loadProduct();
    loadTags();
    loadArticleTags();
    loadAttributes();
    loadSetItems();
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

  async function addSetItem(item: CatalogProduct) {
    if (!item.productKey) return;

    const res = await fetch("/api/admin/product-sets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        section: sectionName,
        article: articleName,
        productKey,
        item: {
          section: item.section,
          article: item.article,
          productKey: item.productKey,
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(data.error || "Ошибка добавления в комплект.");
      return;
    }

    setStatus("Изделие добавлено в комплект.");
    setSetQuery("");
    await loadSetItems();
  }

  async function removeSetItem(item: ProductSetItem) {
    const res = await fetch("/api/admin/product-sets", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        section: sectionName,
        article: articleName,
        productKey,
        item: {
          section: item.section,
          article: item.article,
          productKey: item.productKey,
        },
      }),
    });

    if (!res.ok) {
      setStatus("Ошибка удаления из комплекта.");
      return;
    }

    setStatus("Изделие удалено из комплекта.");
    await loadSetItems();
  }

  function findCatalogProduct(item: ProductSetItem) {
    return catalogProducts.find(
      (product) =>
        product.section === item.section &&
        product.article === item.article &&
        product.productKey === item.productKey
    );
  }

  const setSearchResults = catalogProducts
    .filter((item) => {
      if (
        item.section === sectionName &&
        item.article === articleName &&
        item.productKey === productKey
      ) {
        return false;
      }

      const alreadyInSet = setItems.some(
        (setItem) =>
          setItem.section === item.section &&
          setItem.article === item.article &&
          setItem.productKey === item.productKey
      );

      if (alreadyInSet) return false;

      const normalizedQuery = setQuery.trim().toLowerCase();
      if (!normalizedQuery) return false;

      return [
        item.section,
        item.article,
        item.title,
        item.model,
        item.productKey,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    })
    .slice(0, 12);

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

        <section className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-semibold">Комплект</h2>

          <div className="mt-4">
            <input
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none"
              placeholder="Поиск изделия по разделу, модели или productKey..."
              value={setQuery}
              onChange={(e) => setSetQuery(e.target.value)}
            />
          </div>

          {setSearchResults.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {setSearchResults.map((item) => (
                <div
                  key={`${item.section}-${item.article}-${item.productKey}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 p-3"
                >
                  <div>
                    <div className="font-medium">
                      {item.title || item.article}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {item.section} · {item.article} ·{" "}
                      {item.productKey?.replaceAll("-", ".")}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => addSetItem(item)}
                    className="rounded-xl bg-neutral-900 px-3 py-2 text-sm text-white"
                  >
                    Добавить в комплект
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {setItems.map((item) => {
              const product = findCatalogProduct(item);
              const previewUrl = product?.images[0]
                ? `/api/preview?section=${encodeURIComponent(
                    item.section
                  )}&article=${encodeURIComponent(
                    item.article
                  )}&file=${encodeURIComponent(product.images[0])}`
                : "";

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-neutral-200 p-3"
                >
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt={product?.title || item.productKey}
                      loading="lazy"
                      decoding="async"
                      className="h-48 w-full rounded-xl object-contain"
                    />
                  )}

                  <div className="mt-3 font-medium">
                    {product?.title || item.productKey}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {item.section} · {item.article} ·{" "}
                    {item.productKey.replaceAll("-", ".")}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeSetItem(item)}
                    className="mt-3 w-full rounded-xl bg-neutral-200 px-4 py-2 text-sm text-neutral-900"
                  >
                    Удалить из комплекта
                  </button>
                </div>
              );
            })}

            {setItems.length === 0 && (
              <div className="rounded-xl bg-neutral-100 p-4 text-sm text-neutral-500">
                Комплект пока пуст.
              </div>
            )}
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
