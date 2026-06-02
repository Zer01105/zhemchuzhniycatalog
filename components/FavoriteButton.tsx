"use client";

import { useEffect, useState } from "react";

export type FavoriteItem = {
  section: string;
  article: string;
  productKey?: string;
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

function normalizeFavorite(item: FavoriteItem): FavoriteItem {
  return {
    section: item.section,
    article: item.article,
    productKey: item.productKey || "",
    title: item.title || item.article,
    previewUrl: item.previewUrl || "",
  };
}

function writeFavorites(items: FavoriteItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("catalog:favorites-updated"));
}

export function getFavoriteKey(
  item: Pick<FavoriteItem, "section" | "article"> & {
    productKey?: string;
  }
) {
  return item.productKey
    ? `${item.section}|${item.article}|${item.productKey}`
    : `${item.section}|${item.article}`;
}

export function getFavorites() {
  return readFavorites();
}

export function removeFavorite(
  item: Pick<FavoriteItem, "section" | "article"> & {
    productKey?: string;
  }
) {
  const key = getFavoriteKey(item);
  writeFavorites(readFavorites().filter((favorite) => getFavoriteKey(favorite) !== key));
}

export function clearFavorites() {
  writeFavorites([]);
}

export default function FavoriteButton({
  item,
  className = "",
  iconOnly = false,
}: {
  item: FavoriteItem;
  className?: string;
  iconOnly?: boolean;
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

  function toggleFavorite(event?: React.MouseEvent<HTMLButtonElement>) {
    event?.preventDefault();
    event?.stopPropagation();

    const key = getFavoriteKey(item);
    const favorites = readFavorites();

    if (favorites.some((favorite) => getFavoriteKey(favorite) === key)) {
      writeFavorites(favorites.filter((favorite) => getFavoriteKey(favorite) !== key));
      return;
    }

    writeFavorites([...favorites, normalizeFavorite(item)]);
  }

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? "Удалить из избранного" : "Добавить в избранное"}
      className={`rounded-full px-4 py-2 text-sm font-medium shadow-sm transition ${
        isFavorite
          ? "bg-rose-600 text-white ring-2 ring-white"
          : "bg-white/95 text-neutral-900 ring-1 ring-neutral-200 hover:bg-neutral-100"
      } ${className}`}
    >
      {iconOnly ? (
        <span aria-hidden="true" className="text-lg leading-none">
          {isFavorite ? "♥" : "♡"}
        </span>
      ) : (
        <span>{isFavorite ? "♥ В избранном" : "♡ Избранное"}</span>
      )}
    </button>
  );
}
