import { useState } from 'react';
import { analyzeMood, analyzeMoodScreenshots } from '../../../api/mood';
import { getErrorMessage } from '../../../api/client';
import type { MoodAnalysis } from '../types';

export const useMood = () => {
  const [result, setResult] = useState<MoodAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (request: () => Promise<MoodAnalysis>) => {
    setError(null);
    setLoading(true);
    try {
      const result = await request();
      setResult(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const analyze = (text: string) => run(() => analyzeMood(text));

  const analyzeScreenshots = (images: File[]) => run(() => analyzeMoodScreenshots(images));

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { result, loading, error, analyze, analyzeScreenshots, reset };
};
