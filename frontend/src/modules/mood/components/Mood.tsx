import { useMood } from '../hooks/useMood';
import { MoodForm } from './MoodForm';
import { MoodResult } from './MoodResult';
import styles from './Mood.module.css';

export const Mood = () => {
  const { result, loading, error, analyze, reset } = useMood();

  return (
    <section className={styles.mood}>
      <MoodForm
        disabled={loading}
        hasAnalysis={!!result || !!error}
        onSubmit={analyze}
        onReset={reset}
      />
      {error && <p className={styles.error}>Error: {error}</p>}
      {result && <MoodResult result={result} />}
    </section>
  );
};
