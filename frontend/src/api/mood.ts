import type { MoodAnalysis } from '../modules/mood/types';
import { api } from './client';

export const analyzeMood = async (text: string): Promise<MoodAnalysis> => {
  const { data } = await api.post<MoodAnalysis>('/mood', { text });
  return data;
};
