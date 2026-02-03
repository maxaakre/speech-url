import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, VoicePreferences } from '../types';

const STORAGE_KEY = 'voice_preferences';

const DEFAULT_PREFERENCES: VoicePreferences = {
  en: null,
  sv: null,
};

export const loadVoicePreferences = async (): Promise<VoicePreferences> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_PREFERENCES;
    }
    return JSON.parse(stored);
  } catch {
    return DEFAULT_PREFERENCES;
  }
};

export const saveVoiceForLanguage = async (
  language: Language,
  voiceId: string
): Promise<void> => {
  const current = await loadVoicePreferences();
  const updated = { ...current, [language]: voiceId };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const clearVoicePreferences = async (): Promise<void> => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};
