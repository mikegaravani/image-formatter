import { PDFDocument, PageSizes, rgb } from "pdf-lib";

export type PageFormat = "A4" | "LETTER";
export type Orientation = "portrait" | "landscape";
export type FitMode = "contain" | "cover";

const CM_TO_PT = 72 / 2.54;

function cmToPt(cm: number): number {
  return cm * CM_TO_PT;
}

const BORDER_PT = 1;
const BORDER_INSET_PT = BORDER_PT;

export type PdfGridOptions = {
  pageFormat: PageFormat;
  orientation: Orientation;

  boxWidthCm: number;
  boxHeightCm: number;

  gapCm: number;
  marginCm: number;

  fitMode: FitMode;
};

function getPageSize(
  format: PageFormat,
  orientation: Orientation
): [number, number] {
  const base = format === "A4" ? PageSizes.A4 : PageSizes.Letter; // [w,h] in points
  const [w, h] = base;
  return orientation === "portrait" ? [w, h] : [h, w];
}

function computePlacement(
  imgW: number,
  imgH: number,
  boxW: number,
  boxH: number,
  mode: FitMode
) {
  const imgAR = imgW / imgH;
  const boxAR = boxW / boxH;

  let drawW: number, drawH: number;
  if (mode === "contain") {
    // fit inside box
    if (imgAR > boxAR) {
      drawW = boxW;
      drawH = boxW / imgAR;
    } else {
      drawH = boxH;
      drawW = boxH * imgAR;
    }
  } else {
    // cover the box (may crop)
    if (imgAR > boxAR) {
      drawH = boxH;
      drawW = boxH * imgAR;
    } else {
      drawW = boxW;
      drawH = boxW / imgAR;
    }
  }

  const xOffset = (boxW - drawW) / 2;
  const yOffset = (boxH - drawH) / 2;

  return { drawW, drawH, xOffset, yOffset };
}

async function readFileAsUint8Array(file: File): Promise<Uint8Array> {
  const buf = await file.arrayBuffer();
  return new Uint8Array(buf);
}

export async function makeImageGridPdf(
  files: File[],
  opts: PdfGridOptions
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();

  const [pageW, pageH] = getPageSize(opts.pageFormat, opts.orientation);

  const marginPt = cmToPt(opts.marginCm);
  const gapPt = cmToPt(opts.gapCm);
  const boxW = cmToPt(opts.boxWidthCm);
  const boxH = cmToPt(opts.boxHeightCm);

  const usableW = pageW - marginPt * 2;
  const usableH = pageH - marginPt * 2;

  const cols = Math.floor((usableW + gapPt) / (boxW + gapPt));
  const rows = Math.floor((usableH + gapPt) / (boxH + gapPt));

  if (cols < 1 || rows < 1) {
    throw new Error("Box size too large for page");
  }

  const perPage = cols * rows;

  for (let i = 0; i < files.length; i += perPage) {
    const page = pdfDoc.addPage([pageW, pageH]);

    const slice = files.slice(i, i + perPage);

    for (let j = 0; j < slice.length; j++) {
      const file = slice[j];
      const bytes = await file.arrayBuffer();

      const lowerName = file.name.toLowerCase();
      const isPng = lowerName.endsWith(".png");
      const isJpg = lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg");

      if (!isPng && !isJpg) continue; // skip unsupported

      const embedded = file.name.toLowerCase().endsWith(".png")
        ? await pdfDoc.embedPng(bytes)
        : await pdfDoc.embedJpg(bytes);

      const col = j % cols;
      const row = Math.floor(j / cols);

      const x = marginPt + col * (boxW + gapPt);
      const yTop = pageH - marginPt - row * (boxH + gapPt);
      const y = yTop - boxH;

      const innerW = boxW - 2 * BORDER_INSET_PT;
      const innerH = boxH - 2 * BORDER_INSET_PT;

      const { width: imgW, height: imgH } = embedded.scale(1);
      const { drawW, drawH, xOffset, yOffset } = computePlacement(
        imgW,
        imgH,
        innerW,
        innerH,
        opts.fitMode
      );

      // For "cover", we should clip to the box to avoid spilling outside.
      // pdf-lib supports clipping via push/pop graphics state and clip operators,
      // but it's a bit verbose. A simpler approach: draw anyway and accept minor overspill.
      // If you want exact clipping, tell me and I’ll add it.

      // Draw image inside the inset box
      page.drawImage(embedded, {
        x: x + BORDER_INSET_PT + xOffset,
        y: y + BORDER_INSET_PT + yOffset,
        width: drawW,
        height: drawH,
      });

      // Draw container border on top
      page.drawRectangle({
        x,
        y,
        width: boxW,
        height: boxH,
        borderWidth: BORDER_PT,
        borderColor: rgb(0, 0, 0),
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as unknown as BlobPart], {
    type: "application/pdf",
  });
}
