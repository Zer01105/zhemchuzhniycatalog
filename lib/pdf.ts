import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

const PREVIEW_ROOT = "/data/catalog-previews";
const IMAGE_RE = /\.(jpg|jpeg|png|webp)$/i;

export type PdfProduct = {
  section: string;
  article: string;
  productKey?: string;
  title: string;
  imageFile?: string;
  previewUrl?: string;
};

type PdfAttribute = {
  name: string;
  value: string;
};

function getFontPath() {
  const candidates = [
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
    "/usr/local/share/fonts/DejaVuSans.ttf",
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function getPreviewFileFromUrl(previewUrl?: string) {
  if (!previewUrl) return "";

  try {
    const url = new URL(previewUrl, "http://catalog.local");
    return url.searchParams.get("file") || "";
  } catch {
    return "";
  }
}

function getPreviewPath(product: PdfProduct) {
  const file = product.imageFile || getPreviewFileFromUrl(product.previewUrl);
  if (!file) return "";

  const previewFile = file.replace(IMAGE_RE, ".jpg");
  const safePath = path.normalize(
    path.join(PREVIEW_ROOT, product.section, product.article, previewFile)
  );

  if (!safePath.startsWith(PREVIEW_ROOT)) return "";
  if (!fs.existsSync(safePath)) return "";

  return safePath;
}

async function loadAttributes(product: PdfProduct): Promise<PdfAttribute[]> {
  try {
    const productKey = product.productKey || "";
    const productAttributes = await prisma.articleAttribute.findMany({
      where: {
        section: product.section,
        article: product.article,
        productKey,
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    if (productAttributes.length > 0 || !product.productKey) {
      return productAttributes.map((item) => ({
        name: item.name,
        value: item.value,
      }));
    }

    const modelAttributes = await prisma.articleAttribute.findMany({
      where: {
        section: product.section,
        article: product.article,
        productKey: "",
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    return modelAttributes.map((item) => ({
      name: item.name,
      value: item.value,
    }));
  } catch (error) {
    console.error("PDF attributes read error", error);
    return [];
  }
}

function writeProductPage(
  doc: PDFKit.PDFDocument,
  product: PdfProduct,
  attributes: PdfAttribute[]
) {
  const imagePath = getPreviewPath(product);
  const pageWidth = doc.page.width;
  const margin = 48;

  doc.fontSize(22).text(product.title || product.article, margin, 42, {
    width: pageWidth - margin * 2,
  });

  doc.moveDown(0.6);
  doc.fontSize(11).fillColor("#666666");
  doc.text(`Раздел: ${product.section}`);
  doc.text(`Артикул: ${product.article}`);

  if (product.productKey) {
    doc.text(`Изделие: ${product.productKey.replaceAll("-", ".")}`);
  }

  doc.fillColor("#111111");

  if (imagePath) {
    doc.image(imagePath, margin, 135, {
      fit: [pageWidth - margin * 2, 320],
      align: "center",
      valign: "center",
    });
  } else {
    doc
      .rect(margin, 135, pageWidth - margin * 2, 320)
      .stroke("#dddddd")
      .fontSize(12)
      .fillColor("#777777")
      .text("Нет фото", margin, 285, {
        width: pageWidth - margin * 2,
        align: "center",
      })
      .fillColor("#111111");
  }

  const detailsTop = 485;
  doc.fontSize(16).text("Характеристики", margin, detailsTop);
  doc.moveDown(0.5);

  if (attributes.length === 0) {
    doc.fontSize(11).fillColor("#777777").text("Характеристики не заполнены.");
    doc.fillColor("#111111");
    return;
  }

  doc.fontSize(10);

  for (const attribute of attributes) {
    const line = `${attribute.name}: ${attribute.value}`;
    doc.text(line, {
      width: pageWidth - margin * 2,
    });
  }
}

export async function renderProductsPdf(products: PdfProduct[]) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 48,
    autoFirstPage: false,
    info: {
      Title: "Каталог",
    },
  });

  const fontPath = getFontPath();
  if (fontPath) {
    doc.registerFont("CatalogFont", fontPath);
    doc.font("CatalogFont");
  }

  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));

  const finished = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  for (const product of products) {
    doc.addPage();
    const attributes = await loadAttributes(product);
    writeProductPage(doc, product, attributes);
  }

  if (products.length === 0) {
    doc.addPage();
    doc.fontSize(16).text("Нет изделий для PDF");
  }

  doc.end();
  return finished;
}
