"use client";

import { useEffect, useState } from "react";

export type FavoriteItem = {
  section: string;
  article: string;
  productKey: string;
  title: string;
  previewUrl: string;
};

const STORAGE_KEY = "catalog:favorites";

function readFavorites() {
  if (typeof window === "undefined") return [];

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? (JSON.parse(value) as FavoriteItem[]) : [];
  } catch {
    return [];
  }
}

function writeFavorites(items: FavoriteItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("catalog:favorites-updated"));
}

export function getFavoriteKey(item: Pick<FavoriteItem, "section" | "article" | "productKey">) {
  return `${item.section}|${item.article}|${item.productKey}`;
}

export function getFavorites() {
  return readFavorites();
}

export function removeFavorite(item: Pick<FavoriteItem, "section" | "article" | "productKey">) {
  const key = getFavoriteKey(item);
  writeFavorites(readFavorites().filter((favorite) => getFavoriteKey(favorite) !== key));
}

export function clearFavorites() {
  writeFavorites([]);
}

export default function FavoriteButton({
  item,
  className = "",
}: {
  item: FavoriteItem;
  className?: string;
}) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const updateState = () => {
      const key = getFavoriteKey(item);
      setIsFavorite(
        readFavorites().some((favorite) => getFavoriteKey(favorite) === key)
      );
    };

    updateState();
    window.addEventListener("catalog:favorites-updated", updateState);
    window.addEventListener("storage", updateState);

    return () => {
      window.removeEventListener("catalog:favorites-updated", updateState);
      window.removeEventListener("storage", updateState);
    };
  }, [item]);

  function toggleFavorite() {
    const key = getFavoriteKey(item);
    const favorites = readFavorites();

    if (favorites.some((favorite) => getFavoriteKey(favorite) === key)) {
      writeFavorites(favorites.filter((favorite) => getFavoriteKey(favorite) !== key));
      return;
    }

    writeFavorites([...favorites, item]);
  }

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      className={`rounded-xl px-4 py-2 text-sm ${
        isFavorite
          ? "bg-neutral-200 text-neutral-900"
          : "bg-neutral-900 text-white"
      } ${className}`}
    >
      {isFavorite ? "В избранном" : "Добавить в избранное"}
    </button>
  );
}
