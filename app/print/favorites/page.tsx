"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PrintProductCard from "@/components/PrintProductCard";
import { FavoriteItem, getFavorites } from "@/components/FavoriteButton";

export default function PrintFavoritesPage() {
  const [items, setItems] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    setItems(getFavorites());
  }, []);

  return (
    <main className="min-h-screen bg-white p-8 text-neutral-900">
      <div className="mx-auto max-w-7xl">
        <div className="print:hidden">
          <Link href="/favorites" className="text-sm text-neutral-500">
            ← В избранное
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
          <h1 className="text-4xl font-semibold">Избранное</h1>
          <p className="mt-2 text-neutral-500">Изделий: {items.length}</p>
        </header>

        {items.length > 0 ? (
          <div className="print-grid grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <PrintProductCard key={`${item.section}-${item.article}-${item.productKey}`} {...item} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-neutral-100 p-5 text-neutral-500">
            В избранном пока нет изделий.
          </div>
        )}
      </div>
    </main>
  );
}
