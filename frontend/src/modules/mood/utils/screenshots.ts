// Keep in sync with backend/src/modules/mood/screenshots.schema.ts.
export const SCREENSHOTS_MAX_COUNT = 10;
export const SCREENSHOT_MAX_BYTES = 5 * 1024 * 1024;
export const SCREENSHOT_MEDIA_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

// Largest file accepted from the user; it's resized below SCREENSHOT_MAX_BYTES before upload.
export const SCREENSHOT_SOURCE_MAX_BYTES = 20 * 1024 * 1024;
// Limit the width, not the longer side: phone screenshots are tall and the text must stay legible.
// High enough to keep phone (1170–1290 px) and regular desktop screenshots at full size — Gemini
// bills per image, not per pixel, and downscaling a desktop screenshot to 1000 px cost diacritics.
const SCREENSHOT_RESIZE_MAX_WIDTH = 1600;
const SCREENSHOT_RESIZE_QUALITY = 0.85;

export type Screenshot = {
  file: File;
  previewUrl: string;
};

export function isSupportedScreenshotFile(file: File): boolean {
  return SCREENSHOT_MEDIA_TYPES.includes(file.type) && file.size <= SCREENSHOT_SOURCE_MAX_BYTES;
}

// Downscales to SCREENSHOT_RESIZE_MAX_WIDTH and re-encodes to WebP (JPEG where the browser can't
// encode WebP). Smaller upload; models that bill by pixels (OpenAI, Claude) also get cheaper —
// Gemini 2.5 bills a fixed amount per image. Falls back to the original file on any failure.
export async function resizeScreenshot(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, SCREENSHOT_RESIZE_MAX_WIDTH / bitmap.width);
    // Small enough and already compressed: nothing to gain.
    if (scale === 1 && file.type !== 'image/png') {
      bitmap.close();
      return file;
    }

    const canvas = new OffscreenCanvas(
      Math.round(bitmap.width * scale),
      Math.round(bitmap.height * scale),
    );
    const context = canvas.getContext('2d');
    if (!context) {
      bitmap.close();
      return file;
    }
    // White background so transparent PNGs don't turn black in JPEG.
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    let blob = await canvas.convertToBlob({
      type: 'image/webp',
      quality: SCREENSHOT_RESIZE_QUALITY,
    });
    // Browsers that can't encode WebP (older Safari) silently return PNG.
    if (blob.type !== 'image/webp') {
      blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: SCREENSHOT_RESIZE_QUALITY });
    }
    if (blob.size >= file.size) {
      return file;
    }

    const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
    // Keep the base name, the chronological sort in toScreenshots relies on it.
    return new File([blob], `${file.name.replace(/\.\w+$/, '')}.${extension}`, {
      type: blob.type,
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}

// Screenshot file names usually contain a timestamp or a counter, so a natural sort
// puts a batch picked from a folder into chronological order.
export function toScreenshots(files: File[]): Screenshot[] {
  return [...files]
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
}

export function releaseScreenshots(screenshots: Screenshot[]): void {
  screenshots.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) {
    return items;
  }

  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);

  return next;
}
