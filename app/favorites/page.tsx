"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FavoriteItem,
  clearFavorites,
  getFavoriteKey,
  getFavorites,
  removeFavorite,
} from "@/components/FavoriteButton";

export default function FavoritesPage() {
  const [items, setItems] = useState<FavoriteItem[]>([]);

  function loadItems() {
    setItems(getFavorites());
  }

  useEffect(() => {
    loadItems();
    window.addEventListener("catalog:favorites-updated", loadItems);
    window.addEventListener("storage", loadItems);

    return () => {
      window.removeEventListener("catalog:favorites-updated", loadItems);
      window.removeEventListener("storage", loadItems);
    };
  }, []);

  function deleteItem(item: FavoriteItem) {
    removeFavorite(item);
    loadItems();
  }

  function deleteAll() {
    clearFavorites();
    loadItems();
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-8 text-neutral-900">
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="text-sm text-neutral-500">
          ← В каталог
        </Link>

        <header className="mt-6 mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-semibold">Избранное</h1>
            <p className="mt-2 text-neutral-500">Изделий: {items.length}</p>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={deleteAll}
              className="rounded-xl bg-red-600 px-4 py-3 text-sm text-white"
            >
              Очистить всё избранное
            </button>
          )}
        </header>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <div
                key={getFavoriteKey(item)}
                className="rounded-2xl bg-white p-5 shadow-sm"
              >
                <Link
                  href={`/product/${encodeURIComponent(
                    item.section
                  )}/${encodeURIComponent(item.article)}/${encodeURIComponent(
                    item.productKey
                  )}`}
                >
                  <div className="text-sm text-neutral-500">{item.section}</div>
                  <div className="mt-1 text-xl font-semibold">{item.title}</div>
                  <div className="mt-2 text-sm text-neutral-500">
                    Артикул: {item.article}
                  </div>

                  <div className="mt-4 flex h-80 w-full items-center justify-center overflow-hidden rounded-xl bg-white">
                    {item.previewUrl && (
                      <img
                        src={item.previewUrl}
                        alt={item.title}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain"
                      />
                    )}
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => deleteItem(item)}
                  className="mt-4 w-full rounded-xl bg-neutral-200 px-4 py-2 text-sm text-neutral-900"
                >
                  Удалить из избранного
                </button>
              </div>
            ))}
          </div>
        ) : (
          <section className="rounded-2xl bg-white p-5 text-neutral-500 shadow-sm">
            В избранном пока нет изделий.
          </section>
        )}
      </div>
    </main>
  );
}
