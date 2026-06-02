"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
type ClientUser = {
  id: string;
  login: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};
type Tag = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

type ImportLog = {
  rowNumber: number;
  section: string;
  article: string;
  productKey: string;
  status: "success" | "skipped" | "error";
  message: string;
};

type SelectedProduct = {
  section: string;
  article: string;
  productKey: string;
  title: string;
};

type AutoTagRule = {
  id: string;
  name: string;
  matchType: string;
  matchValue: string;
  tagName: string;
  isActive: boolean;
  createdAt: string;
};


export default function AdminPage() {
  const [tags, setTags] = useState<Tag[]>([]);
const [tagName, setTagName] = useState("");
const [tagStatus, setTagStatus] = useState("");
  const [catalog, setCatalog] = useState<Section[]>([]);
  const [query, setQuery] = useState("");
  const [clients, setClients] = useState<ClientUser[]>([]);
const [clientLogin, setClientLogin] = useState("");
const [clientPassword, setClientPassword] = useState("");
const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
const [clientStatus, setClientStatus] = useState("");
const [lastCreatedClient, setLastCreatedClient] = useState<{

  login: string;

  password: string;

} | null>(null);

  const [uploadSection, setUploadSection] = useState("");
  const [uploadArticle, setUploadArticle] = useState("");
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
const [importFile, setImportFile] = useState<File | null>(null);
const [importStatus, setImportStatus] = useState("");
const [autoTagStatus, setAutoTagStatus] = useState("");
const [isSyncingAutoTags, setIsSyncingAutoTags] = useState(false);
const [previewStatus, setPreviewStatus] = useState("");
const [previewLogs, setPreviewLogs] = useState<string[]>([]);
const [isGeneratingPreviews, setIsGeneratingPreviews] = useState(false);
const [autoTagRules, setAutoTagRules] = useState<AutoTagRule[]>([]);
const [ruleName, setRuleName] = useState("");
const [ruleMatchType, setRuleMatchType] = useState("first_digit");
const [ruleMatchValue, setRuleMatchValue] = useState("");
const [ruleTagName, setRuleTagName] = useState("");
const [ruleStatus, setRuleStatus] = useState("");
const [isImporting, setIsImporting] = useState(false);
const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
const [selectedProducts, setSelectedProducts] = useState<
  Record<string, SelectedProduct>
>({});
const [bulkTagId, setBulkTagId] = useState("");
const [bulkStatus, setBulkStatus] = useState("");
const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  async function loadCatalog() {
    const res = await fetch("/api/catalog");
    const data = await res.json();
    setCatalog(data);
  }
  async function loadClients() {
  const res = await fetch("/api/admin/users");
  const data = await res.json();
  setClients(data);
}
async function loadTags() {
  const res = await fetch("/api/admin/tags");
  const data = await res.json();
  setTags(data);
}
async function loadAutoTagRules() {
  const res = await fetch("/api/admin/auto-tag-rules");
  const data = await res.json();
  setAutoTagRules(data);
}

async function createTag(e: React.FormEvent) {
  e.preventDefault();

  if (!tagName.trim()) {
    setTagStatus("Введите название тега.");
    return;
  }

  const res = await fetch("/api/admin/tags", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: tagName.trim(),
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    setTagStatus(data.error || "Ошибка создания тега.");
    return;
  }

  setTagStatus(`Тег создан: ${data.tag.name}`);
  setTagName("");
  await loadTags();
}
async function createAutoTagRule(e: React.FormEvent) {
  e.preventDefault();

  if (!ruleMatchValue.trim() || !ruleTagName.trim()) {
    setRuleStatus("Укажи условие и тег.");
    return;
  }

  const res = await fetch("/api/admin/auto-tag-rules", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: ruleName.trim(),
      matchType: ruleMatchType,
      matchValue: ruleMatchValue.trim(),
      tagName: ruleTagName.trim(),
      isActive: true,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    setRuleStatus(data.error || "Ошибка создания правила.");
    return;
  }

  setRuleStatus("Правило создано.");
  setRuleName("");
  setRuleMatchValue("");
  setRuleTagName("");
  await loadAutoTagRules();
}

async function toggleAutoTagRule(rule: AutoTagRule) {
  const res = await fetch("/api/admin/auto-tag-rules", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: rule.id,
      isActive: !rule.isActive,
    }),
  });

  if (res.ok) {
    await loadAutoTagRules();
  }
}

async function deleteAutoTagRule(rule: AutoTagRule) {
  const ok = confirm(`Удалить правило "${rule.name}"?`);

  if (!ok) return;

  const res = await fetch("/api/admin/auto-tag-rules", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: rule.id,
    }),
  });

  if (res.ok) {
    await loadAutoTagRules();
  }
}
function toggleSection(sectionName: string) {
  setOpenSections((current) => ({
    ...current,
    [sectionName]: !current[sectionName],
  }));
}
async function importCatalogData(e: React.FormEvent) {
  e.preventDefault();

  if (!importFile) {
    setImportStatus("Выбери Excel-файл.");
    return;
  }

  const formData = new FormData();
  formData.append("file", importFile);

  setIsImporting(true);
  setImportStatus("Импорт...");
  setImportLogs([]);

  const res = await fetch("/api/admin/import-catalog-data", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    setImportStatus(data.error || "Ошибка импорта.");
    setIsImporting(false);
    return;
  }

  setImportStatus(
    `Готово. Обработано: ${data.processed}, пропущено: ${data.skipped}, тегов создано: ${data.tagsCreated}, тегов назначено: ${data.tagsLinked}, характеристик обновлено: ${data.attributesUpdated}.`
  );
  setImportLogs(data.logs || []);

  setImportFile(null);
  setIsImporting(false);

  await loadCatalog();
  await loadTags();
}
function downloadImportLog() {
  if (importLogs.length === 0) return;

  const content = importLogs
    .map(
      (log) =>
        [
          `Строка ${log.rowNumber}`,
          log.status,
          log.section || "-",
          log.article || "-",
          log.productKey || "-",
          log.message,
        ].join(" | ")
    )
    .join("\n");

  const blob = new Blob([content], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "catalog-import-log.txt";
  link.click();
  URL.revokeObjectURL(url);
}

function getSelectionKey(
  sectionName: string,
  articleName: string,
  productKey: string
) {
  return `${sectionName}|${articleName}|${productKey}`;
}

function toggleProductSelection(sectionName: string, article: Article) {
  if (!article.productKey) return;

  const key = getSelectionKey(
    sectionName,
    article.article,
    article.productKey
  );

  setSelectedProducts((current) => {
    if (current[key]) {
      const next = { ...current };
      delete next[key];
      return next;
    }

    return {
      ...current,
      [key]: {
        section: sectionName,
        article: article.article,
        productKey: article.productKey!,
        title: article.title || article.article,
      },
    };
  });
}

async function updateSelectedTags(action: "add" | "remove") {
  const items = Object.values(selectedProducts).map((item) => ({
    section: item.section,
    article: item.article,
    productKey: item.productKey,
  }));

  if (!bulkTagId || items.length === 0) {
    setBulkStatus("Выбери изделия и тег.");
    setBulkErrors([]);
    return;
  }

  setBulkStatus("Обновление тегов...");
  setBulkErrors([]);

  const res = await fetch("/api/admin/bulk-article-tags", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action,
      tagId: bulkTagId,
      items,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    setBulkStatus(data.error || "Ошибка массового обновления тегов.");
    setBulkErrors(data.errors || []);
    return;
  }

  setBulkStatus(
    `Готово. Обновлено: ${data.processed}, пропущено: ${data.skipped}.`
  );
  setBulkErrors(data.errors || []);
  await loadCatalog();
}
async function deleteTag(tag: Tag) {
  const ok = confirm(`Удалить тег "${tag.name}"? Он будет снят со всех артикулов.`);

  if (!ok) return;

  const res = await fetch(`/api/admin/tags/${tag.id}`, {
    method: "DELETE",
  });

  if (res.ok) {
    await loadTags();
  }
}
async function createClient(e: React.FormEvent) {
  e.preventDefault();

  if (!clientLogin.trim() || !clientPassword.trim()) {
    setClientStatus("Укажи логин и пароль клиента.");
    return;
  }

  const res = await fetch("/api/admin/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      login: clientLogin.trim(),
      password: clientPassword.trim(),
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    setClientStatus(data.error || "Ошибка создания клиента.");
    return;
  }

setClientStatus(`Клиент создан: ${data.user.login}`);
setLastCreatedClient({
  login: clientLogin.trim(),
  password: clientPassword.trim(),
});
setClientLogin("");
setClientPassword("");
await loadClients();
}

async function toggleClient(user: ClientUser) {
  const res = await fetch(`/api/admin/users/${user.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      isActive: !user.isActive,
    }),
  });

  if (res.ok) {
    await loadClients();
  }
}
async function syncProductTypeTags() {
  const ok = confirm(
    "Распределить автоматические теги Кольцо/Серьги/Кулон/Брошь по названию файлов?"
  );

  if (!ok) return;

  setIsSyncingAutoTags(true);
  setAutoTagStatus("Распределение тегов...");

  const res = await fetch("/api/admin/sync-product-type-tags", {
    method: "POST",
  });

  const data = await res.json();

  if (!res.ok) {
    setAutoTagStatus(data.error || "Ошибка распределения тегов.");
    setIsSyncingAutoTags(false);
    return;
  }

  setAutoTagStatus(
    `Готово. Создано тегов: ${data.created}, назначено: ${data.linked}.`
  );

  setIsSyncingAutoTags(false);
  await loadTags();
  await loadCatalog();
}
async function generatePreviews() {
  setIsGeneratingPreviews(true);
  setPreviewStatus("Генерация превью...");
  setPreviewLogs([]);

  const res = await fetch("/api/admin/generate-previews", {
    method: "POST",
  });

  const data = await res.json();

  if (!res.ok || !data.ok) {
    setPreviewStatus(data.error || "Ошибка генерации превью.");
    setPreviewLogs(data.logs || []);
    setIsGeneratingPreviews(false);
    return;
  }

  setPreviewStatus("Генерация превью завершена.");
  setPreviewLogs(data.logs || []);
  setIsGeneratingPreviews(false);
}
async function deleteClient(user: ClientUser) {
  const ok = confirm(`Удалить клиента ${user.login}? Это действие нельзя отменить.`);

  if (!ok) return;

  const res = await fetch(`/api/admin/users/${user.id}`, {
    method: "DELETE",
  });

  if (res.ok) {
    await loadClients();
  }
}

useEffect(() => {
  loadCatalog();
  loadClients();
  loadTags();
  loadAutoTagRules();
}, []);

  const totalArticles = useMemo(
    () => catalog.reduce((sum, section) => sum + section.articles.length, 0),
    [catalog]
  );

  const totalImages = useMemo(
    () =>
      catalog.reduce(
        (sum, section) =>
          sum +
          section.articles.reduce(
            (articleSum, article) => articleSum + article.images.length,
            0
          ),
        0
      ),
    [catalog]
  );

  const filteredCatalog = catalog.map((section) => ({
    ...section,
    articles: section.articles.filter((article) =>
      `${section.section} ${article.article} ${article.title || ""} ${
        article.productKey || ""
      }`
        .toLowerCase()
        .includes(query.toLowerCase())
    ),
  }));

  const selectedProductList = Object.values(selectedProducts);
  const filteredProductList = filteredCatalog.flatMap((section) =>
    section.articles
      .filter((article) => article.productKey)
      .map((article) => ({
        section: section.section,
        article: article.article,
        productKey: article.productKey!,
        title: article.title || article.article,
        image: article.images[0] || "",
      }))
  );

  function selectAllFilteredProducts() {
    setSelectedProducts((current) => {
      const next = { ...current };

      for (const item of filteredProductList) {
        next[getSelectionKey(item.section, item.article, item.productKey)] = {
          section: item.section,
          article: item.article,
          productKey: item.productKey,
          title: item.title,
        };
      }

      return next;
    });
  }
async function clearAllCatalogData() {
  const ok = confirm(
    "Удалить ВСЕ теги и ВСЕ характеристики у всех артикулов?"
  );

  if (!ok) return;

  const res = await fetch("/api/admin/clear-all-catalog-data", {
    method: "POST",
  });

  if (!res.ok) {
    alert("Ошибка очистки");
    return;
  }

  alert("Все характеристики и теги удалены.");
}
  async function uploadPhotos(e: React.FormEvent) {
    e.preventDefault();

    if (!uploadSection.trim() || !uploadArticle.trim() || !uploadFiles?.length) {
      setUploadStatus("Заполни раздел, артикул и выбери фото.");
      return;
    }

    const formData = new FormData();
    formData.append("section", uploadSection.trim());
    formData.append("article", uploadArticle.trim());

    Array.from(uploadFiles).forEach((file) => {
      formData.append("files", file);
    });

    setIsUploading(true);
    setUploadStatus("Загрузка...");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadStatus(data.error || "Ошибка загрузки.");
        return;
      }

      setUploadStatus(
        `Готово. Загружено файлов: ${data.uploaded}. Раздел: ${data.section}, артикул: ${data.article}.`
      );

      setUploadArticle("");
      setUploadFiles(null);

      const input = document.getElementById("admin-upload-files") as HTMLInputElement | null;
      if (input) input.value = "";

      await loadCatalog();
    } catch {
      setUploadStatus("Ошибка соединения при загрузке.");
    } finally {
      setIsUploading(false);
    }
  }
async function deleteArticle(sectionName: string, articleName: string) {
  const ok = confirm(
    `Удалить артикул ${articleName} из раздела ${sectionName}? Будут удалены оригиналы и превью. Это действие нельзя отменить.`
  );

  if (!ok) return;

  const res = await fetch("/api/admin/delete-article", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      section: sectionName,
      article: articleName,
    }),
  });

  if (!res.ok) {
    alert("Ошибка удаления артикула");
    return;
  }

  await loadCatalog();
}
  return (
    <main className="min-h-screen bg-neutral-100 p-8 text-neutral-900">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/" className="text-sm text-neutral-500">
              ← В каталог
            </Link>

            <h1 className="mt-4 text-4xl font-semibold">Админка</h1>

            <p className="mt-2 text-neutral-500">
              Обзор каталога и загрузка фото в артикула.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="text-sm text-neutral-500">Разделы</div>
              <div className="text-2xl font-semibold">{catalog.length}</div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="text-sm text-neutral-500">Артикулы</div>
              <div className="text-2xl font-semibold">{totalArticles}</div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="text-sm text-neutral-500">Фото</div>
              <div className="text-2xl font-semibold">{totalImages}</div>
            </div>
          </div>
        </header> 
        <section className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
  <h2 className="text-2xl font-semibold">Импорт данных из Excel</h2>

  <p className="mt-2 text-sm text-neutral-500">
    Формат колонок: section, article, tags, weight, price, material, description.
  </p>

  <form onSubmit={importCatalogData} className="mt-5 grid gap-4 md:grid-cols-3">
    <div className="md:col-span-2">
      <input
        type="file"
        accept=".xlsx,.xls"
        className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none"
        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
      />
    </div>

    <div>
      <button
        disabled={isImporting}
        className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-white disabled:opacity-50"
      >
        {isImporting ? "Импорт..." : "Импортировать"}
      </button>
    </div>
  </form>

  {importStatus && (
    <div className="mt-4 rounded-xl bg-neutral-100 px-4 py-3 text-sm text-neutral-700">
      {importStatus}
    </div>
  )}

  {importLogs.length > 0 && (
    <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="text-lg font-semibold">Лог импорта</h3>

        <button
          type="button"
          onClick={downloadImportLog}
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm text-white"
        >
          Скачать лог .txt
        </button>
      </div>

      <div className="mt-4 max-h-72 overflow-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="p-2">Строка</th>
              <th className="p-2">Статус</th>
              <th className="p-2">Раздел</th>
              <th className="p-2">Артикул</th>
              <th className="p-2">Изделие</th>
              <th className="p-2">Сообщение</th>
            </tr>
          </thead>

          <tbody>
            {importLogs.map((log) => (
              <tr
                key={`${log.rowNumber}-${log.section}-${log.article}-${log.productKey}`}
                className="border-t border-neutral-100"
              >
                <td className="p-2">{log.rowNumber}</td>
                <td className="p-2">{log.status}</td>
                <td className="p-2">{log.section || "-"}</td>
                <td className="p-2">{log.article || "-"}</td>
                <td className="p-2">{log.productKey || "-"}</td>
                <td className="p-2">{log.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )}
</section>
<section className="mb-8 rounded-2xl bg-white p-5 shadow-sm border border-red-200">
  <h2 className="text-2xl font-semibold text-red-600">
    Массовая очистка
  </h2>

  <p className="mt-2 text-sm text-neutral-500">
    Удаляет все характеристики и все теги из базы.
    Фотографии и артикулы не затрагиваются.
  </p>

  <button
    onClick={clearAllCatalogData}
    className="mt-4 rounded-xl bg-red-600 px-4 py-3 text-white"
  >
    Очистить все характеристики и теги
  </button>
</section>
<section className="mb-8 rounded-2xl bg-white p-5 shadow-sm border border-blue-200">
  <h2 className="text-2xl font-semibold text-blue-700">
    Автоматические теги
  </h2>

  <p className="mt-2 text-sm text-neutral-500">
    Назначает теги Кольцо, Серьги, Кулон, Брошь по первой цифре в названии файла.
    Работает только для разделов Золото и Серебро.
  </p>

  <button
    onClick={syncProductTypeTags}
    disabled={isSyncingAutoTags}
    className="mt-4 rounded-xl bg-blue-700 px-4 py-3 text-white disabled:opacity-50"
  >
    {isSyncingAutoTags
      ? "Распределение..."
      : "Распределить автоматические теги"}
  </button>

  {autoTagStatus && (
    <div className="mt-4 rounded-xl bg-neutral-100 px-4 py-3 text-sm text-neutral-700">
      {autoTagStatus}
    </div>
  )}
</section>
<section className="mb-8 rounded-2xl bg-white p-5 shadow-sm border border-blue-200">
  <h2 className="text-2xl font-semibold text-blue-700">
    Конструктор автотегов
  </h2>

  <p className="mt-2 text-sm text-neutral-500">
    Создай дополнительные правила. Базовые правила 1–4 сохраняются всегда.
  </p>

  <form onSubmit={createAutoTagRule} className="mt-5 grid gap-4 md:grid-cols-5">
    <input
      className="rounded-xl border border-neutral-300 px-4 py-3 outline-none"
      placeholder="Название правила"
      value={ruleName}
      onChange={(e) => setRuleName(e.target.value)}
    />

    <select
      className="rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none"
      value={ruleMatchType}
      onChange={(e) => setRuleMatchType(e.target.value)}
    >
      <option value="first_digit">Первая цифра</option>
      <option value="last_letter">Последняя буква</option>
    </select>

    <input
      className="rounded-xl border border-neutral-300 px-4 py-3 outline-none"
      placeholder="5, d или *"
      value={ruleMatchValue}
      onChange={(e) => setRuleMatchValue(e.target.value)}
    />

    <input
      className="rounded-xl border border-neutral-300 px-4 py-3 outline-none"
      placeholder="Например: Браслет"
      value={ruleTagName}
      onChange={(e) => setRuleTagName(e.target.value)}
    />

    <button className="rounded-xl bg-neutral-900 px-4 py-3 text-white">
      Создать правило
    </button>
  </form>

  {ruleStatus && (
    <div className="mt-4 rounded-xl bg-neutral-100 px-4 py-3 text-sm text-neutral-700">
      {ruleStatus}
    </div>
  )}

  <div className="mt-5 overflow-hidden rounded-xl border border-neutral-200">
    <table className="w-full text-left text-sm">
      <thead className="bg-neutral-50 text-neutral-500">
        <tr>
          <th className="p-3">Правило</th>
          <th className="p-3">Условие</th>
          <th className="p-3">Тег</th>
          <th className="p-3">Статус</th>
          <th className="p-3">Действия</th>
        </tr>
      </thead>

      <tbody>
        {autoTagRules.map((rule) => (
          <tr key={rule.id} className="border-t border-neutral-200">
            <td className="p-3 font-medium">{rule.name}</td>
            <td className="p-3 text-neutral-500">
              {rule.matchType === "first_digit"
                ? "Первая цифра"
                : "Последняя буква"}{" "}
              = {rule.matchValue}
            </td>
            <td className="p-3">{rule.tagName}</td>
            <td className="p-3">
              {rule.isActive ? "Включено" : "Выключено"}
            </td>
            <td className="flex gap-3 p-3">
              <button
                type="button"
                onClick={() => toggleAutoTagRule(rule)}
                className="underline"
              >
                {rule.isActive ? "Выключить" : "Включить"}
              </button>

              <button
                type="button"
                onClick={() => deleteAutoTagRule(rule)}
                className="text-red-600 underline"
              >
                Удалить
              </button>
            </td>
          </tr>
        ))}

        {autoTagRules.length === 0 && (
          <tr>
            <td colSpan={5} className="p-3 text-neutral-500">
              Дополнительных правил пока нет.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</section>
<section className="mb-8 rounded-2xl bg-white p-5 shadow-sm border border-emerald-200">
  <h2 className="text-2xl font-semibold text-emerald-700">
    Превью
  </h2>

  <p className="mt-2 text-sm text-neutral-500">
    Генерирует недостающие превью для фото каталога. Уже готовые превью не перезаписываются.
  </p>

  <button
    type="button"
    onClick={generatePreviews}
    disabled={isGeneratingPreviews}
    className="mt-4 rounded-xl bg-emerald-700 px-4 py-3 text-white disabled:opacity-50"
  >
    {isGeneratingPreviews ? "Генерация..." : "Сгенерировать превью"}
  </button>

  {previewStatus && (
    <div className="mt-4 rounded-xl bg-neutral-100 px-4 py-3 text-sm text-neutral-700">
      {previewStatus}
    </div>
  )}

  {previewLogs.length > 0 && (
    <div className="mt-4 max-h-72 overflow-auto rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600">
      {previewLogs.slice(-80).map((line, index) => (
        <div key={`${index}-${line}`}>{line}</div>
      ))}
    </div>
  )}
</section>
<section className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
  <h2 className="text-2xl font-semibold">Теги</h2>

  <p className="mt-2 text-sm text-neutral-500">
    Здесь можно создавать и удалять теги для фильтров каталога.
  </p>

  <form onSubmit={createTag} className="mt-5 grid gap-4 md:grid-cols-3">
    <div className="md:col-span-2">
      <label className="mb-2 block text-sm text-neutral-500">
        Название тега
      </label>

      <input
        className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none"
        placeholder="Например: Новинки"
        value={tagName}
        onChange={(e) => setTagName(e.target.value)}
      />
    </div>

    <div className="flex items-end">
      <button className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-white">
        Создать тег
      </button>
    </div>
  </form>

  {tagStatus && (
    <div className="mt-4 rounded-xl bg-neutral-100 px-4 py-3 text-sm text-neutral-700">
      {tagStatus}
    </div>
  )}

  <div className="mt-6 flex flex-wrap gap-2">
    {tags.map((tag) => (
      <div
        key={tag.id}
        className="flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm"
      >
        <span>{tag.name}</span>

        <button
          onClick={() => deleteTag(tag)}
          className="text-red-600"
        >
          ×
        </button>
      </div>
    ))}

    {tags.length === 0 && (
      <div className="text-sm text-neutral-500">
        Тегов пока нет.
      </div>
    )}
  </div>
</section>
        <section className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-semibold">Загрузить фото</h2>

          <p className="mt-2 text-sm text-neutral-500">
            Можно загрузить несколько фото в один артикул. Если раздела или артикула ещё нет, сайт создаст папки автоматически.
          </p>

          <form onSubmit={uploadPhotos} className="mt-5 grid gap-4 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm text-neutral-500">
                Раздел
              </label>

              <input
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none"
                placeholder="Например: Золото"
                value={uploadSection}
                onChange={(e) => setUploadSection(e.target.value)}
                list="admin-sections"
              />

              <datalist id="admin-sections">
                {catalog.map((section) => (
                  <option key={section.section} value={section.section} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="mb-2 block text-sm text-neutral-500">
                Артикул
              </label>

              <input
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none"
                placeholder="Например: 008"
                value={uploadArticle}
                onChange={(e) => setUploadArticle(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-neutral-500">
                Фото
              </label>

              <input
                id="admin-upload-files"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none"
                onChange={(e) => setUploadFiles(e.target.files)}
              />
            </div>

            <div className="flex items-end">
              <button
                disabled={isUploading}
                className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUploading ? "Загрузка..." : "Загрузить"}
              </button>
            </div>
          </form>

          {uploadStatus && (
            <div className="mt-4 rounded-xl bg-neutral-100 px-4 py-3 text-sm text-neutral-700">
              {uploadStatus}
            </div>
          )}
        </section>
<section className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
  <h2 className="text-2xl font-semibold">Клиенты</h2>

  <p className="mt-2 text-sm text-neutral-500">
    Здесь можно создавать клиентов, отключать доступ или полностью удалять клиента.
  </p>

  <form onSubmit={createClient} className="mt-5 grid gap-4 md:grid-cols-3">
    <div>
      <label className="mb-2 block text-sm text-neutral-500">
        Логин клиента
      </label>

      <input
        className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none"
        placeholder="Например: client-ivan"
        value={clientLogin}
        onChange={(e) => setClientLogin(e.target.value)}
      />
    </div>

    <div>
      <label className="mb-2 block text-sm text-neutral-500">
        Пароль
      </label>

      <input
        type="text"
        className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none"
        placeholder="Пароль для клиента"
        value={clientPassword}
        onChange={(e) => setClientPassword(e.target.value)}
      />
    </div>

    <div className="flex items-end">
      <button className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-white">
        Создать клиента
      </button>
    </div>
  </form>

  {clientStatus && (
    <div className="mt-4 rounded-xl bg-neutral-100 px-4 py-3 text-sm text-neutral-700">
      {clientStatus}
    </div>
  )}
  {lastCreatedClient && (
  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
    <div className="font-semibold">Данные нового клиента</div>
    <div className="mt-2">Логин: {lastCreatedClient.login}</div>
    <div>Пароль: {lastCreatedClient.password}</div>
    <div className="mt-2 text-xs">
      Сохрани пароль сейчас. Позже его нельзя будет посмотреть, только сбросить.
    </div>
  </div>
)}

  <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200">
    <table className="w-full text-left text-sm">
      <thead className="bg-neutral-50 text-neutral-500">
        <tr>
          <th className="p-3">Логин</th>
          <th className="p-3">Статус</th>
          <th className="p-3">Создан</th>
          <th className="p-3">Действия</th>
        </tr>
      </thead>

      <tbody>
        {clients.map((user) => (
          <tr key={user.id} className="border-t border-neutral-200">
            <td className="p-3 font-medium">{user.login}</td>

            <td className="p-3">
              {user.isActive ? (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">
                  Активен
                </span>
              ) : (
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">
                  Отключён
                </span>
              )}
            </td>

            <td className="p-3 text-neutral-500">
              {new Date(user.createdAt).toLocaleDateString("ru-RU")}
            </td>

            <td className="flex gap-3 p-3">
              <button
                onClick={() => toggleClient(user)}
                className="underline"
              >
                {user.isActive ? "Отключить" : "Включить"}
              </button>

              <button
                onClick={() => deleteClient(user)}
                className="text-red-600 underline"
              >
                Удалить
              </button>
            </td>
          </tr>
        ))}

        {clients.length === 0 && (
          <tr>
            <td colSpan={4} className="p-3 text-neutral-500">
              Клиентов пока нет.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</section>
        <section className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-semibold">Массовое назначение тегов</h2>

          <p className="mt-2 text-sm text-neutral-500">
            Выбери изделия в таблицах ниже, затем добавь или удали существующий тег.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-[2fr_1fr_1fr_1fr]">
            <select
              className="rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none"
              value={bulkTagId}
              onChange={(e) => setBulkTagId(e.target.value)}
            >
              <option value="">Выбери тег</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => updateSelectedTags("add")}
              className="rounded-xl bg-neutral-900 px-4 py-3 text-white"
            >
              Назначить тег выбранным
            </button>

            <button
              type="button"
              onClick={() => updateSelectedTags("remove")}
              className="rounded-xl bg-neutral-200 px-4 py-3 text-neutral-900"
            >
              Удалить тег у выбранных
            </button>

            <button
              type="button"
              onClick={selectAllFilteredProducts}
              className="rounded-xl border border-neutral-300 px-4 py-3 text-neutral-700"
            >
              Выбрать всё в текущем списке
            </button>
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={() => setSelectedProducts({})}
              className="rounded-xl border border-neutral-300 px-4 py-3 text-neutral-700"
            >
              Снять выбор
            </button>
          </div>

          <div className="mt-4 text-sm text-neutral-500">
            Выбрано изделий: {selectedProductList.length}
          </div>

          {selectedProductList.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedProductList.map((item) => (
                <span
                  key={getSelectionKey(
                    item.section,
                    item.article,
                    item.productKey
                  )}
                  className="rounded-full bg-neutral-100 px-3 py-1 text-xs"
                >
                  {item.title} · {item.productKey.replaceAll("-", ".")}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {filteredProductList.map((item) => {
              const key = getSelectionKey(
                item.section,
                item.article,
                item.productKey
              );
              const selected = !!selectedProducts[key];
              const previewUrl = item.image
                ? `/api/preview?section=${encodeURIComponent(
                    item.section
                  )}&article=${encodeURIComponent(
                    item.article
                  )}&file=${encodeURIComponent(item.image)}`
                : "";

              return (
                <label
                  key={key}
                  className={`relative cursor-pointer rounded-xl border p-3 ${
                    selected
                      ? "border-neutral-900 bg-neutral-50"
                      : "border-neutral-200 bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() =>
                      toggleProductSelection(item.section, {
                        article: item.article,
                        productKey: item.productKey,
                        title: item.title,
                        images: item.image ? [item.image] : [],
                      })
                    }
                    className="absolute right-3 top-3 h-5 w-5"
                  />

                  <div className="flex h-36 items-center justify-center rounded-lg bg-white">
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt={item.title}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain"
                      />
                    )}
                  </div>

                  <div className="mt-3 font-medium">{item.title}</div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {item.section} · {item.article} ·{" "}
                    {item.productKey.replaceAll("-", ".")}
                  </div>
                </label>
              );
            })}
          </div>

          {bulkStatus && (
            <div className="mt-4 rounded-xl bg-neutral-100 px-4 py-3 text-sm text-neutral-700">
              {bulkStatus}
            </div>
          )}

          {bulkErrors.length > 0 && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {bulkErrors.map((error) => (
                <div key={error}>{error}</div>
              ))}
            </div>
          )}
        </section>
        <input
          className="mb-8 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none"
          placeholder="Поиск по разделу или артикулу..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="space-y-8">
          {filteredCatalog.map((section) => {
  const isOpen = !!openSections[section.section];

  return (
    <section key={section.section} className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => toggleSection(section.section)}
          className="text-left"
        >
          <h2 className="text-2xl font-semibold">
            {isOpen ? "▾" : "▸"} {section.section}
          </h2>
          <p className="text-sm text-neutral-500">
            Изделий: {section.articles.length}
          </p>
        </button>

        <Link
          href={`/section/${encodeURIComponent(section.section)}`}
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm text-white"
        >
          Открыть раздел
        </Link>
      </div>

      {isOpen && (
        <div className="overflow-hidden rounded-xl border border-neutral-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="p-3">Выбор</th>
                <th className="p-3">Изделие</th>
                <th className="p-3">Модель</th>
                <th className="p-3">Фото</th>
                <th className="p-3">Действия</th>
              </tr>
            </thead>

            <tbody>
              {section.articles.map((article) => (
                <tr
                  key={`${article.article}-${article.productKey || article.article}`}
                  className="border-t border-neutral-200"
                >
                  <td className="p-3">
                    {article.productKey ? (
                      <input
                        type="checkbox"
                        checked={
                          !!selectedProducts[
                            getSelectionKey(
                              section.section,
                              article.article,
                              article.productKey
                            )
                          ]
                        }
                        onChange={() =>
                          toggleProductSelection(section.section, article)
                        }
                        className="h-4 w-4"
                      />
                    ) : (
                      <span className="text-xs text-neutral-400">-</span>
                    )}
                  </td>

                  <td className="p-3 font-medium">
                    {article.title || article.article}
                    {article.productKey && (
                      <div className="mt-1 text-xs text-neutral-500">
                        {article.productKey.replaceAll("-", ".")}
                      </div>
                    )}
                  </td>

                  <td className="p-3 text-neutral-500">
                    {article.model || article.article}
                  </td>

                  <td className="p-3 text-neutral-500">
                    {article.images.length}
                  </td>

                  <td className="flex gap-3 p-3">
                    <Link
                      href={
                        article.productKey
                          ? `/admin/product/${encodeURIComponent(
                              section.section
                            )}/${encodeURIComponent(
                              article.article
                            )}/${encodeURIComponent(article.productKey)}`
                          : `/admin/product/${encodeURIComponent(
                              section.section
                            )}/${encodeURIComponent(article.article)}`
                      }
                      className="text-neutral-900 underline"
                    >
                      Открыть
                    </Link>

                    <button
                      onClick={() =>
                        deleteArticle(section.section, article.article)
                      }
                      className="text-red-600 underline"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
})}
        </div>

      </div>

    </main>

  );

}
