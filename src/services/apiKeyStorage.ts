import AsyncStorage from "@react-native-async-storage/async-storage";

const API_KEY_STORAGE_KEY = "google_cloud_api_key";

export const saveApiKey = async (apiKey: string): Promise<void> => {
  await AsyncStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
};

export const loadApiKey = async (): Promise<string | null> => {
  return AsyncStorage.getItem(API_KEY_STORAGE_KEY);
};

export const clearApiKey = async (): Promise<void> => {
  await AsyncStorage.removeItem(API_KEY_STORAGE_KEY);
};
