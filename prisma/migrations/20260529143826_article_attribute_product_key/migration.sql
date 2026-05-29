-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ArticleAttribute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "section" TEXT NOT NULL,
    "article" TEXT NOT NULL,
    "productKey" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ArticleAttribute" ("article", "createdAt", "id", "name", "section", "sortOrder", "updatedAt", "value") SELECT "article", "createdAt", "id", "name", "section", "sortOrder", "updatedAt", "value" FROM "ArticleAttribute";
DROP TABLE "ArticleAttribute";
ALTER TABLE "new_ArticleAttribute" RENAME TO "ArticleAttribute";
CREATE UNIQUE INDEX "ArticleAttribute_section_article_productKey_name_key" ON "ArticleAttribute"("section", "article", "productKey", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
