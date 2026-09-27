import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from 'react';
import type { Screenshot } from '../utils/screenshots';
import styles from './Mood.module.css';

type ScreenshotPreviewProps = {
  screenshots: Screenshot[];
  index: number;
  locked: boolean;
  onIndexChange: (index: number) => void;
  onMove: (from: number, to: number) => void;
  onClose: () => void;
};

export const ScreenshotPreview = ({
  screenshots,
  index,
  locked,
  onIndexChange,
  onMove,
  onClose,
}: ScreenshotPreviewProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const screenshot = screenshots[index];
  const isFirst = index === 0;
  const isLast = index === screenshots.length - 1;

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === 'ArrowLeft' && !isFirst) onIndexChange(index - 1);
    if (e.key === 'ArrowRight' && !isLast) onIndexChange(index + 1);
  };

  // A click on the dialog element itself (not its content) means the backdrop was clicked.
  const handleClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!screenshot) return null;

  return (
    <dialog
      ref={dialogRef}
      className={styles.preview}
      aria-label={`Screenshot ${index + 1} of ${screenshots.length}`}
      onClose={onClose}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
    >
      <div className={styles.previewBody}>
        <div className={styles.previewHeader}>
          <span>
            Screenshot {index + 1} / {screenshots.length}
          </span>
          <button type="button" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>

        <img src={screenshot.previewUrl} alt={`Screenshot ${index + 1}`} />

        <div className={styles.previewActions}>
          <button type="button" disabled={isFirst} onClick={() => onIndexChange(index - 1)}>
            ‹ Previous
          </button>
          <button
            type="button"
            disabled={locked || isFirst}
            onClick={() => onMove(index, index - 1)}
          >
            Move earlier
          </button>
          <button
            type="button"
            disabled={locked || isLast}
            onClick={() => onMove(index, index + 1)}
          >
            Move later
          </button>
          <button type="button" disabled={isLast} onClick={() => onIndexChange(index + 1)}>
            Next ›
          </button>
        </div>
      </div>
    </dialog>
  );
};
