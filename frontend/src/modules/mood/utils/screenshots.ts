// Keep in sync with backend/src/modules/mood/screenshots.schema.ts.
export const SCREENSHOTS_MAX_COUNT = 10;
export const SCREENSHOT_MAX_BYTES = 5 * 1024 * 1024;
export const SCREENSHOT_MEDIA_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export type Screenshot = {
  file: File;
  previewUrl: string;
};

export function isValidScreenshotFile(file: File): boolean {
  return SCREENSHOT_MEDIA_TYPES.includes(file.type) && file.size <= SCREENSHOT_MAX_BYTES;
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
