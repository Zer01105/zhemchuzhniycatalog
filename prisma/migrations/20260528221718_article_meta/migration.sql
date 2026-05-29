-- CreateTable
CREATE TABLE "ArticleMeta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "section" TEXT NOT NULL,
    "article" TEXT NOT NULL,
    "weight" TEXT,
    "price" TEXT,
    "material" TEXT,
    "description" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ArticleMeta_section_article_key" ON "ArticleMeta"("section", "article");
