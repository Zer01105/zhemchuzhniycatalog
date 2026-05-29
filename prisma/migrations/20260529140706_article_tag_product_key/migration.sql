-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ArticleTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "section" TEXT NOT NULL,
    "article" TEXT NOT NULL,
    "productKey" TEXT NOT NULL DEFAULT '',
    "tagId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArticleTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ArticleTag" ("article", "createdAt", "id", "section", "tagId") SELECT "article", "createdAt", "id", "section", "tagId" FROM "ArticleTag";
DROP TABLE "ArticleTag";
ALTER TABLE "new_ArticleTag" RENAME TO "ArticleTag";
CREATE UNIQUE INDEX "ArticleTag_section_article_productKey_tagId_key" ON "ArticleTag"("section", "article", "productKey", "tagId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
