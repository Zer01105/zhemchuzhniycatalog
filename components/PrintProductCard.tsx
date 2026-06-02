type PrintProductCardProps = {
  section: string;
  article: string;
  productKey?: string;
  title: string;
  previewUrl: string;
};

export default function PrintProductCard({
  section,
  article,
  productKey,
  title,
  previewUrl,
}: PrintProductCardProps) {
  return (
    <article className="print-card rounded-xl border border-neutral-200 bg-white p-3">
      <div className="flex h-56 items-center justify-center rounded-lg bg-white">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={title}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="text-sm text-neutral-400">Нет фото</div>
        )}
      </div>

      <div className="mt-3 text-sm text-neutral-500">{section}</div>
      <h2 className="mt-1 text-lg font-semibold">{title}</h2>
      <div className="mt-1 text-sm text-neutral-600">Артикул: {article}</div>
      {productKey && (
        <div className="mt-1 text-xs text-neutral-500">
          Изделие: {productKey.replaceAll("-", ".")}
        </div>
      )}
    </article>
  );
}
