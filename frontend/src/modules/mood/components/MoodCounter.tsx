import { useMoodStats } from '../hooks/useMoodStats';
import styles from './Mood.module.css';

const numberFormat = new Intl.NumberFormat('en');

// The counter is secondary: while loading or on failure it renders nothing instead of an error.
export const MoodCounter = () => {
  const { data: stats } = useMoodStats();
  if (!stats) return null;

  return (
    <p className={styles.counter}>
      <strong>{numberFormat.format(stats.total)}</strong>{' '}
      {stats.total === 1 ? 'analysis' : 'analyses'} so far
    </p>
  );
};
