import { useMutation, useQueryClient } from '@tanstack/react-query';
import { analyzeMood, analyzeMoodScreenshots } from '../../../api/mood';
import { getErrorMessage } from '../../../api/client';
import { moodStatsKey } from './useMoodStats';

type MoodInput = { mode: 'text'; text: string } | { mode: 'screenshots'; images: File[] };

export const useMood = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: MoodInput) =>
      input.mode === 'text' ? analyzeMood(input.text) : analyzeMoodScreenshots(input.images),
    // Every successful analysis is stored, so the counter is out of date.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moodStatsKey }),
  });

  const analyze = (text: string) => mutation.mutate({ mode: 'text', text });

  const analyzeScreenshots = (images: File[]) => mutation.mutate({ mode: 'screenshots', images });

  return {
    result: mutation.data ?? null,
    loading: mutation.isPending,
    error: mutation.error ? getErrorMessage(mutation.error) : null,
    analyze,
    analyzeScreenshots,
    reset: mutation.reset,
  };
};
