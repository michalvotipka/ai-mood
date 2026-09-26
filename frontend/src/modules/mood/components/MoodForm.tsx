import { useState, type SubmitEvent } from 'react';
import styles from './Mood.module.css';

type MoodFormProps = {
  disabled: boolean;
  hasAnalysis: boolean;
  onSubmit: (text: string) => void;
  onReset: () => void;
};

export const MoodForm = ({ disabled, hasAnalysis, onSubmit, onReset }: MoodFormProps) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSubmit(text);
  };

  const handleReset = () => {
    setValue('');
    onReset();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <textarea
        name="conversations"
        className={styles.textarea}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Paste a chat conversation or an email..."
        rows={10}
        autoFocus
      />
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.reset}
          onClick={handleReset}
          disabled={disabled || (!value && !hasAnalysis)}
        >
          Reset
        </button>
        <button type="submit" className={styles.submit} disabled={disabled || !value.trim()}>
          {disabled ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>
    </form>
  );
};
