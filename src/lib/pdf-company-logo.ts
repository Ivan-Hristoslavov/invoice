import type jsPDF from "jspdf";

const LOG_PREFIX = "[pdf-company-logo]";

function detectImageMimeFromBuffer(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return "image/gif";
  }
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }
  const prefix = buffer.slice(0, 256).toString("utf8").trimStart();
  if (prefix.startsWith("<svg") || prefix.startsWith("<?xml")) {
    return "image/svg+xml";
  }
  return null;
}

/**
 * Maps Content-Type (or detected mime) to jsPDF `addImage` format string.
 */
export function mimeTypeToJspdfFormat(mime: string): string | null {
  const main = mime.split(";")[0].trim().toLowerCase();
  switch (main) {
    case "image/jpeg":
    case "image/jpg":
      return "JPEG";
    case "image/png":
      return "PNG";
    case "image/webp":
      return "WEBP";
    case "image/gif":
      return "GIF";
    case "image/svg+xml":
      return null;
    default:
      return null;
  }
}

function logoUrlLooksLikeSvg(url: string): boolean {
  const lower = url.split("?")[0]?.toLowerCase() ?? "";
  return lower.endsWith(".svg") || lower.includes(".svg?");
}

export type EmbedCompanyLogoLayout = {
  x: number;
  y: number;
  maxW: number;
  maxH: number;
};

/**
 * Scales intrinsic pixel size to fit inside maxW×maxH (mm) without distortion.
 */
export function fitLogoDimensionsToBox(
  intrinsicW: number,
  intrinsicH: number,
  maxW: number,
  maxH: number
): { drawW: number; drawH: number } {
  if (
    !Number.isFinite(intrinsicW) ||
    !Number.isFinite(intrinsicH) ||
    intrinsicW <= 0 ||
    intrinsicH <= 0 ||
    maxW <= 0 ||
    maxH <= 0
  ) {
    return { drawW: maxW, drawH: maxH };
  }
  const imageAspect = intrinsicW / intrinsicH;
  const boxAspect = maxW / maxH;
  if (imageAspect > boxAspect) {
    return { drawW: maxW, drawH: maxW / imageAspect };
  }
  return { drawW: maxH * imageAspect, drawH: maxH };
}

/**
 * Fetches a public company logo URL and embeds it in the PDF.
 * @returns The height used (mm), or 0 if skipped/failed.
 */
export async function embedCompanyLogoInPdf(
  doc: jsPDF,
  logoUrl: string,
  layout: EmbedCompanyLogoLayout,
  context: string
): Promise<number> {
  const trimmed = logoUrl.trim();
  if (!trimmed) {
    return 0;
  }

  if (logoUrlLooksLikeSvg(trimmed)) {
    console.warn(
      `${LOG_PREFIX} (${context}) skipping logo: SVG is not embedded in PDFs; use PNG or JPEG for print.`
    );
    return 0;
  }

  try {
    const logoResponse = await fetch(trimmed);
    if (!logoResponse.ok) {
      console.warn(
        `${LOG_PREFIX} (${context}) fetch failed: ${logoResponse.status} ${logoResponse.statusText}`
      );
      return 0;
    }

    const logoArrayBuffer = await logoResponse.arrayBuffer();
    const logoBuffer = Buffer.from(logoArrayBuffer);
    const headerType = logoResponse.headers.get("content-type");
    let mime = headerType?.split(";")[0].trim().toLowerCase() ?? "";
    if (!mime || mime === "application/octet-stream" || mime === "binary/octet-stream") {
      mime = detectImageMimeFromBuffer(logoBuffer) ?? "";
    }
    if (mime === "image/svg+xml") {
      console.warn(
        `${LOG_PREFIX} (${context}) skipping logo: SVG is not embedded in PDFs; use PNG or JPEG for print.`
      );
      return 0;
    }

    let imageFormat = mime ? mimeTypeToJspdfFormat(mime) : null;
    if (!imageFormat) {
      const detected = detectImageMimeFromBuffer(logoBuffer);
      imageFormat = detected ? mimeTypeToJspdfFormat(detected) : null;
    }
    if (!imageFormat) {
      console.warn(
        `${LOG_PREFIX} (${context}) skipping logo: unsupported image type (${mime || "unknown"})`
      );
      return 0;
    }

    const logoBase64 = logoBuffer.toString("base64");

    let drawW = layout.maxW;
    let drawH = layout.maxH;
    try {
      const props = doc.getImageProperties(logoBase64);
      const fitted = fitLogoDimensionsToBox(
        props.width,
        props.height,
        layout.maxW,
        layout.maxH
      );
      drawW = fitted.drawW;
      drawH = fitted.drawH;
    } catch {
      /* keep max box if dimensions cannot be read */
    }

    doc.addImage(logoBase64, imageFormat, layout.x, layout.y, drawW, drawH);
    return drawH;
  } catch (error) {
    console.warn(`${LOG_PREFIX} (${context}) could not embed logo:`, error);
    return 0;
  }
}
