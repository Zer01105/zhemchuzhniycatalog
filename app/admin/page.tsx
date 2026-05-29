"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Article = {
  article: string;
  images: string[];
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


export default function AdminPage() {
  const [tags, setTags] = useState<Tag[]>([]);
const [tagName, setTagName] = useState("");
const [tagStatus, setTagStatus] = useState("");
  const [catalog, setCatalog] = useState<Section[]>([]);
  const [query, setQuery] = useState("");
  const [clients, setClients] = useState<ClientUser[]>([]);
const [clientLogin, setClientLogin] = useState("");
const [clientPassword, setClientPassword] = useState("");
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
const [isImporting, setIsImporting] = useState(false);
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
    `Готово. Строк: ${data.processed}, тегов создано: ${data.tagsCreated}, тегов назначено: ${data.tagsLinked}, характеристик обновлено: ${data.attributesUpdated}.`
  );

  setImportFile(null);
  setIsImporting(false);

  await loadCatalog();
  await loadTags();
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
      `${section.section} ${article.article}`
        .toLowerCase()
        .includes(query.toLowerCase())
    ),
  }));
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
        <input
          className="mb-8 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 outline-none"
          placeholder="Поиск по разделу или артикулу..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="space-y-8">
          {filteredCatalog.map((section) => (
            <section key={section.section} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">{section.section}</h2>
                  <p className="text-sm text-neutral-500">
                    Артикулов: {section.articles.length}
                  </p>
                </div>

                <Link
                  href={`/section/${encodeURIComponent(section.section)}`}
                  className="rounded-xl bg-neutral-900 px-4 py-2 text-sm text-white"
                >
                  Открыть раздел
                </Link>
              </div>

              <div className="overflow-hidden rounded-xl border border-neutral-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-50 text-neutral-500">
                    <tr>
                      <th className="p-3">Артикул</th>
                      <th className="p-3">Фото</th>
                      <th className="p-3">Действия</th>
                    </tr>
                  </thead>

                  <tbody>
                    {section.articles.map((article) => (
                      <tr key={article.article} className="border-t border-neutral-200">
                        <td className="p-3 font-medium">{article.article}</td>
                        <td className="p-3 text-neutral-500">
                          {article.images.length}
                        </td>
                        <td className="flex gap-3 p-3">
  <Link
    href={`/admin/product/${encodeURIComponent(
  section.section
)}/${encodeURIComponent(article.article)}`}
    className="text-neutral-900 underline"
  >
    Открыть
  </Link>

  <button
    onClick={() => deleteArticle(section.section, article.article)}
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
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}