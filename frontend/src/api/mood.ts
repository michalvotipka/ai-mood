import type { MoodAnalysis } from '../modules/mood';
import { api } from './client';

export const analyzeMood = async (text: string): Promise<MoodAnalysis> => {
  const { data } = await api.post<MoodAnalysis>('/mood', { text });
  return data;
};

export const analyzeMoodScreenshots = async (images: File[]): Promise<MoodAnalysis> => {
  const form = new FormData();
  images.forEach((image) => form.append('images', image));
  // Overrides the client's JSON default. The browser then fills in the multipart boundary.
  const { data } = await api.post<MoodAnalysis>('/mood/screenshots', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};
