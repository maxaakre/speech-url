import AsyncStorage from "@react-native-async-storage/async-storage";

const GEMINI_API_KEY_STORAGE_KEY = "gemini_api_key";

export const saveGeminiApiKey = async (apiKey: string): Promise<void> => {
  await AsyncStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, apiKey);
};

export const loadGeminiApiKey = async (): Promise<string | null> => {
  return AsyncStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
};

export const clearGeminiApiKey = async (): Promise<void> => {
  await AsyncStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
};
