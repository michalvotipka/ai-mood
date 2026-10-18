import { useQuery } from '@tanstack/react-query';
import { getMoodStats } from '../../../api/mood';

export const moodStatsKey = ['mood', 'stats'] as const;

export const useMoodStats = () => useQuery({ queryKey: moodStatsKey, queryFn: getMoodStats });
