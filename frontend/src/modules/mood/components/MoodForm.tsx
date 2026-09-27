import { useState, type SubmitEvent } from 'react';
import type { MoodInputMode } from '../types';
import { releaseScreenshots, type Screenshot } from '../utils/screenshots';
import { ScreenshotPicker } from './ScreenshotPicker';
import styles from './Mood.module.css';

type MoodFormProps = {
  disabled: boolean;
  hasAnalysis: boolean;
  onSubmitText: (text: string) => void;
  onSubmitScreenshots: (images: File[]) => void;
  onReset: () => void;
};

const MODES: { mode: MoodInputMode; label: string }[] = [
  { mode: 'text', label: 'Text' },
  { mode: 'screenshots', label: 'Screenshots' },
];

export const MoodForm = ({
  disabled,
  hasAnalysis,
  onSubmitText,
  onSubmitScreenshots,
  onReset,
}: MoodFormProps) => {
  const [mode, setMode] = useState<MoodInputMode>('text');
  const [value, setValue] = useState('');
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [processing, setProcessing] = useState(false);
  const busy = disabled || processing;

  const getSubmitLabel = () => {
    if (disabled) return mode === 'text' ? 'Analyzing...' : 'Reading screenshots...';
    if (processing) return 'Preparing screenshots...';
    return 'Analyze';
  };
  const submitLabel = getSubmitLabel();

  const hasInput = mode === 'text' ? !!value.trim() : screenshots.length > 0;

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!hasInput || busy) return;
    if (mode === 'text') {
      onSubmitText(value.trim());
    } else {
      onSubmitScreenshots(screenshots.map(({ file }) => file));
    }
  };

  const handleReset = () => {
    releaseScreenshots(screenshots);
    setScreenshots([]);
    setValue('');
    onReset();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.modes} role="tablist">
        {MODES.map((item) => (
          <button
            key={item.mode}
            type="button"
            role="tab"
            aria-selected={mode === item.mode}
            className={styles.modeTab}
            disabled={busy}
            onClick={() => setMode(item.mode)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {mode === 'text' ? (
        <textarea
          name="conversations"
          className={styles.textarea}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Paste a chat conversation or an email..."
          rows={10}
          autoFocus
        />
      ) : (
        <ScreenshotPicker
          screenshots={screenshots}
          disabled={disabled}
          processing={processing}
          onChange={setScreenshots}
          onProcessingChange={setProcessing}
        />
      )}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.reset}
          onClick={handleReset}
          disabled={busy || (!value && !screenshots.length && !hasAnalysis)}
        >
          Reset
        </button>
        <button type="submit" className={styles.submit} disabled={busy || !hasInput}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
};
