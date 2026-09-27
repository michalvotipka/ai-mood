import { useEffect, useEffectEvent, useState, type ChangeEvent, type DragEvent } from 'react';
import {
  isValidScreenshotFile,
  moveItem,
  SCREENSHOT_MAX_BYTES,
  SCREENSHOT_MEDIA_TYPES,
  SCREENSHOTS_MAX_COUNT,
  toScreenshots,
  type Screenshot,
} from '../utils/screenshots';
import styles from './Mood.module.css';

type ScreenshotPickerProps = {
  screenshots: Screenshot[];
  disabled: boolean;
  onChange: (screenshots: Screenshot[]) => void;
};

export const ScreenshotPicker = ({ screenshots, disabled, onChange }: ScreenshotPickerProps) => {
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const isFull = screenshots.length >= SCREENSHOTS_MAX_COUNT;

  const addFiles = (files: File[]) => {
    if (disabled || !files.length) return;
    const valid = files.filter(isValidScreenshotFile);
    const accepted = valid.slice(0, SCREENSHOTS_MAX_COUNT - screenshots.length);

    if (valid.length < files.length) {
      setNotice(
        `Skipped files that aren't PNG, JPEG or WebP up to ${SCREENSHOT_MAX_BYTES / 1024 / 1024} MB.`,
      );
    } else if (accepted.length < valid.length) {
      setNotice(`You can upload at most ${SCREENSHOTS_MAX_COUNT} screenshots.`);
    } else {
      setNotice(null);
    }
    if (accepted.length) {
      onChange([...screenshots, ...toScreenshots(accepted)]);
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

  const handleRemove = (screenshot: Screenshot) => {
    URL.revokeObjectURL(screenshot.previewUrl);
    onChange(screenshots.filter((s) => s !== screenshot));
    setNotice(null);
  };

  return (
    <div className={styles.picker}>
      <label
        className={`${styles.dropzone} ${dragging ? styles.dropzoneActive : ''}`}
        aria-disabled={disabled || isFull}
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
          disabled={disabled || isFull}
          onChange={handleSelect}
        />
        <strong>Choose screenshots</strong>, drop them here or paste with Ctrl/Cmd+V
        <span className={styles.hint}>
          Up to {SCREENSHOTS_MAX_COUNT} images, oldest part of the conversation first
        </span>
      </label>

      {notice && <p className={styles.notice}>{notice}</p>}

      {screenshots.length > 0 && (
        <ol className={styles.thumbs}>
          {screenshots.map((screenshot, index) => (
            <li key={screenshot.previewUrl} className={styles.thumb}>
              <img src={screenshot.previewUrl} alt={`Screenshot ${index + 1}`} />
              <span className={styles.thumbIndex}>{index + 1}</span>
              <div className={styles.thumbActions}>
                <button
                  type="button"
                  aria-label="Move earlier"
                  disabled={disabled || index === 0}
                  onClick={() => onChange(moveItem(screenshots, index, index - 1))}
                >
                  ←
                </button>
                <button
                  type="button"
                  aria-label="Remove"
                  disabled={disabled}
                  onClick={() => handleRemove(screenshot)}
                >
                  ×
                </button>
                <button
                  type="button"
                  aria-label="Move later"
                  disabled={disabled || index === screenshots.length - 1}
                  onClick={() => onChange(moveItem(screenshots, index, index + 1))}
                >
                  →
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};
