import { useEffect, useEffectEvent, useState, type ChangeEvent, type DragEvent } from 'react';
import {
  isSupportedScreenshotFile,
  moveItem,
  resizeScreenshot,
  SCREENSHOT_MAX_BYTES,
  SCREENSHOT_MEDIA_TYPES,
  SCREENSHOT_SOURCE_MAX_BYTES,
  SCREENSHOTS_MAX_COUNT,
  toScreenshots,
  type Screenshot,
} from '../utils/screenshots';
import styles from './Mood.module.css';
import { ScreenshotPreview } from './ScreenshotPreview';

type ScreenshotPickerProps = {
  screenshots: Screenshot[];
  disabled: boolean;
  // Resizing is async; the picker and the form are locked meanwhile so `screenshots` can't change
  // under it and the form can't be submitted without the images being prepared.
  processing: boolean;
  onChange: (screenshots: Screenshot[]) => void;
  onProcessingChange: (processing: boolean) => void;
};

export const ScreenshotPicker = ({
  screenshots,
  disabled,
  processing,
  onChange,
  onProcessingChange,
}: ScreenshotPickerProps) => {
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const locked = disabled || processing;
  const isFull = screenshots.length >= SCREENSHOTS_MAX_COUNT;

  const addFiles = async (files: File[]) => {
    if (locked || !files.length) return;
    const supported = files.filter(isSupportedScreenshotFile);
    const accepted = supported.slice(0, SCREENSHOTS_MAX_COUNT - screenshots.length);

    onProcessingChange(true);
    const resized = await Promise.all(accepted.map(resizeScreenshot));
    onProcessingChange(false);
    // Resizing falls back to the original, which may still be over the upload limit.
    const uploadable = resized.filter((file) => file.size <= SCREENSHOT_MAX_BYTES);

    if (supported.length < files.length || uploadable.length < resized.length) {
      setNotice(
        `Skipped files that aren't PNG, JPEG or WebP up to ${SCREENSHOT_SOURCE_MAX_BYTES / 1024 / 1024} MB.`,
      );
    } else if (accepted.length < supported.length) {
      setNotice(`You can upload at most ${SCREENSHOTS_MAX_COUNT} screenshots.`);
    } else {
      setNotice(null);
    }
    if (uploadable.length) {
      onChange([...screenshots, ...toScreenshots(uploadable)]);
    }
  };

  // Paste a screenshot straight from the clipboard (Ctrl/Cmd+V) anywhere on the page.
  const handlePaste = useEffectEvent((e: ClipboardEvent) => {
    const files = [...(e.clipboardData?.files ?? [])];
    if (!files.length) return;
    e.preventDefault();
    addFiles(files);
  });

  useEffect(() => {
    const listener = (e: ClipboardEvent) => handlePaste(e);
    document.addEventListener('paste', listener);
    return () => document.removeEventListener('paste', listener);
  }, []);

  const handleSelect = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles([...(e.target.files ?? [])]);
    // Allow selecting the same file again after removing it.
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    addFiles([...e.dataTransfer.files]);
  };

  // The preview follows the moved screenshot so it stays on screen while being reordered.
  const handlePreviewMove = (from: number, to: number) => {
    onChange(moveItem(screenshots, from, to));
    setPreviewIndex(to);
  };

  const handleRemove = (screenshot: Screenshot) => {
    URL.revokeObjectURL(screenshot.previewUrl);
    onChange(screenshots.filter((s) => s !== screenshot));
    setNotice(null);
  };

  return (
    <div className={styles.picker}>
      <label
        className={`${styles.dropzone} ${dragging ? styles.dropzoneActive : ''}`}
        aria-disabled={locked || isFull}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className={styles.fileInput}
          accept={SCREENSHOT_MEDIA_TYPES.join(',')}
          multiple
          disabled={locked || isFull}
          onChange={handleSelect}
        />
        <strong>Choose screenshots</strong>Drop them here or paste with Ctrl/Cmd+V
        <span className={styles.hint}>
          {processing
            ? 'Preparing screenshots...'
            : `Up to ${SCREENSHOTS_MAX_COUNT} images, oldest part of the conversation first`}
        </span>
      </label>

      {notice && <p className={styles.notice}>{notice}</p>}

      {screenshots.length > 0 && (
        <ol className={styles.thumbs}>
          {screenshots.map((screenshot, index) => (
            <li key={screenshot.previewUrl} className={styles.thumb}>
              <button
                type="button"
                className={styles.thumbPreview}
                aria-label={`Show screenshot ${index + 1}`}
                onClick={() => setPreviewIndex(index)}
              >
                <img src={screenshot.previewUrl} alt={`Screenshot ${index + 1}`} />
              </button>
              <span className={styles.thumbIndex}>{index + 1}</span>
              <div className={styles.thumbActions}>
                <button
                  type="button"
                  aria-label="Move earlier"
                  disabled={locked || index === 0}
                  onClick={() => onChange(moveItem(screenshots, index, index - 1))}
                >
                  ←
                </button>
                <button
                  type="button"
                  aria-label="Remove"
                  disabled={locked}
                  onClick={() => handleRemove(screenshot)}
                >
                  ×
                </button>
                <button
                  type="button"
                  aria-label="Move later"
                  disabled={locked || index === screenshots.length - 1}
                  onClick={() => onChange(moveItem(screenshots, index, index + 1))}
                >
                  →
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {previewIndex !== null && (
        <ScreenshotPreview
          screenshots={screenshots}
          index={previewIndex}
          locked={locked}
          onIndexChange={setPreviewIndex}
          onMove={handlePreviewMove}
          onClose={() => setPreviewIndex(null)}
        />
      )}
    </div>
  );
};
