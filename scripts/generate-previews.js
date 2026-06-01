const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SOURCE_ROOT = "/data/catalog/B2B_Фото";
const PREVIEW_ROOT = "/data/catalog-previews";

const IMAGE_RE = /\.(jpg|jpeg|png|webp)$/i;

async function processFile(sourcePath, previewPath) {
  if (fs.existsSync(previewPath)) return;

  fs.mkdirSync(path.dirname(previewPath), { recursive: true });

  await sharp(sourcePath)
    .rotate()
    .trim({
      background: "#ffffff",
      threshold: 20,
    })
    .resize({
      width: 700,
      height: 700,
      fit: "contain",
      background: "#ffffff",
      withoutEnlargement: false,
    })
    .jpeg({ quality: 85 })
    .toFile(previewPath);
}

async function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith("._") || entry.name === ".DS_Store") {

  continue;

}
    const sourcePath = path.join(dir, entry.name);
    const relativePath = path.relative(SOURCE_ROOT, sourcePath);
    const previewPath = path.join(
      PREVIEW_ROOT,
      relativePath.replace(/\.(jpg|jpeg|png|webp)$/i, ".jpg")
    );

    if (entry.isDirectory()) {
      await walk(sourcePath);
    } else if (entry.isFile() && IMAGE_RE.test(entry.name)) {
      console.log("preview:", relativePath);
      try {

  await processFile(sourcePath, previewPath);

} catch (err) {

  console.error("skip broken image:", relativePath, err.message);

}
    }
  }
}

walk(SOURCE_ROOT)
  .then(() => console.log("Done"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
