import { useState } from 'react';
import { analyzeMood } from '../../../api/mood';
import { getErrorMessage } from '../../../api/client';
import type { MoodAnalysis } from '../types';

export const useMood = () => {
  const [result, setResult] = useState<MoodAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (text: string) => {
    setError(null);
    setLoading(true);
    try {
      const result = await analyzeMood(text);
      setResult(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { result, loading, error, analyze, reset };
};
