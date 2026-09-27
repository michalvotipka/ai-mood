import { useState, type CSSProperties } from 'react';
import type { MoodAnalysis } from '../types';
import { getSentiment, getSentimentColor, SCALE_MAX } from '../utils/sentiment';
import styles from './Mood.module.css';

type MoodResultProps = {
  result: MoodAnalysis;
};

type ScaleProps = {
  label: string;
  value: number;
};

const Scale = ({ label, value }: ScaleProps) => (
  <div
    className={styles.scale}
    style={{ '--sentiment': getSentimentColor(value) } as CSSProperties}
  >
    <div className={styles.scaleHeader}>
      <span>{label}</span>
      <strong>
        {value}/{SCALE_MAX}
      </strong>
    </div>
    <div className={styles.track}>
      <div className={styles.fill} style={{ width: `${(value / SCALE_MAX) * 100}%` }} />
    </div>
  </div>
);

export const MoodResult = ({ result }: MoodResultProps) => {
  const [showEnglish, setShowEnglish] = useState(false);
  const canTranslate = result.language.toLowerCase() !== 'english';
  const sentiment = getSentiment(result.tone);

  return (
    <div className={styles.result} style={{ '--sentiment': sentiment.color } as CSSProperties}>
      <div className={styles.meta}>
        <span className={styles.kind}>
          {result.kind === 'conversation' ? 'Conversation' : 'Message'}
        </span>
        <span className={styles.badge}>{sentiment.label}</span>
        <span
          className={styles.quality}
          title={
            result.transcript
              ? 'Combines how legible the screenshots were with how clear and coherent the recognized text was'
              : 'How clear and coherent the input was for the analysis'
          }
        >
          Input quality: {Math.round(result.inputQuality * 100)}%
        </span>
      </div>
      <Scale label="Tone" value={result.tone} />
      {result.dynamics !== null && <Scale label="Dynamics" value={result.dynamics} />}
      <p className={styles.summary}>{showEnglish ? result.summaryEn : result.summary}</p>
      {canTranslate && (
        <button
          type="button"
          className={styles.translate}
          onClick={() => setShowEnglish((v) => !v)}
        >
          {showEnglish ? `Show original (${result.language})` : 'Show in English'}
        </button>
      )}
      {result.transcript && (
        <details className={styles.transcript}>
          <summary>Recognized text</summary>
          <pre>{result.transcript}</pre>
        </details>
      )}
    </div>
  );
};
