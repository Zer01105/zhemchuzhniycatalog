-- CreateTable
CREATE TABLE "ProductSetItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "setKey" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "article" TEXT NOT NULL,
    "productKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductSetItem_setKey_section_article_productKey_key" ON "ProductSetItem"("setKey", "section", "article", "productKey");
