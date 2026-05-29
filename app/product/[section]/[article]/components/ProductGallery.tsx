"use client";

import { useState } from "react";

type Props = {
  section: string;
  article: string;
  images: string[];
};

export default function ProductGallery({ section, article, images }: Props) {
  const [active, setActive] = useState(0);

  const current = images[active];

  function prev() {
    setActive((value) => (value === 0 ? images.length - 1 : value - 1));
  }

  function next() {
    setActive((value) => (value === images.length - 1 ? 0 : value + 1));
  }

  if (!current) return null;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="relative flex h-[460px] items-center justify-center rounded-xl bg-white">
        <img
          src={`/api/preview?section=${encodeURIComponent(
            section
          )}&article=${encodeURIComponent(article)}&file=${encodeURIComponent(
            current
          )}`}
          alt={current}
          className="h-full w-full object-contain"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 rounded-full bg-white/90 px-4 py-3 shadow"
            >
              ←
            </button>

            <button
              onClick={next}
              className="absolute right-3 top-1/2 rounded-full bg-white/90 px-4 py-3 shadow"
            >
              →
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-5 gap-3 md:grid-cols-6">
          {images.map((img, index) => (
            <button
              key={img}
              onClick={() => setActive(index)}
              className={`rounded-xl border p-2 ${
                active === index ? "border-neutral-900" : "border-neutral-200"
              }`}
            >
              <img
                src={`/api/preview?section=${encodeURIComponent(
                  section
                )}&article=${encodeURIComponent(
                  article
                )}&file=${encodeURIComponent(img)}`}
                alt={img}
                className="aspect-square w-full object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
