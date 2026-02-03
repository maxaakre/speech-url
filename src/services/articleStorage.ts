import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { SavedArticle, Article, Language } from "../types";
import * as GoogleTts from "./googleTts";

const STORAGE_KEY = "saved_articles";
const AUDIO_DIR = `${FileSystem.documentDirectory}saved_audio/`;

export interface SaveProgress {
  current: number;
  total: number;
}

const ensureAudioDir = async (): Promise<void> => {
  const dirInfo = await FileSystem.getInfoAsync(AUDIO_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
  }
};

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const getSavedArticles = async (): Promise<SavedArticle[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to load saved articles:", err);
    return [];
  }
};

export const isArticleSaved = async (url: string): Promise<boolean> => {
  const articles = await getSavedArticles();
  return articles.some((a) => a.url === url);
};

export const saveArticle = async (
  article: Article,
  chunks: string[],
  voiceId: string,
  apiKey: string,
  onProgress?: (progress: SaveProgress) => void
): Promise<SavedArticle> => {
  await ensureAudioDir();

  const id = generateId();
  const articleDir = `${AUDIO_DIR}${id}/`;
  await FileSystem.makeDirectoryAsync(articleDir, { intermediates: true });

  const audioFiles: string[] = [];

  try {
    for (let i = 0; i < chunks.length; i++) {
      onProgress?.({ current: i + 1, total: chunks.length });

      const audioContent = await GoogleTts.synthesizeSpeech(
        chunks[i],
        voiceId,
        apiKey
      );

      const filePath = `${articleDir}chunk_${i}.mp3`;
      await FileSystem.writeAsStringAsync(filePath, audioContent, {
        encoding: FileSystem.EncodingType.Base64,
      });

      audioFiles.push(filePath);
    }

    const savedArticle: SavedArticle = {
      id,
      url: article.url,
      title: article.title,
      content: article.content,
      language: article.language,
      audioFiles,
      voiceId,
      savedAt: Date.now(),
    };

    const existing = await getSavedArticles();
    existing.unshift(savedArticle);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

    return savedArticle;
  } catch (err) {
    // Clean up partial files on error
    try {
      await FileSystem.deleteAsync(articleDir, { idempotent: true });
    } catch {
      // Ignore cleanup errors
    }
    throw err;
  }
};

export const deleteSavedArticle = async (id: string): Promise<void> => {
  const articles = await getSavedArticles();
  const article = articles.find((a) => a.id === id);

  if (article) {
    // Delete audio files
    const articleDir = `${AUDIO_DIR}${id}/`;
    try {
      await FileSystem.deleteAsync(articleDir, { idempotent: true });
    } catch {
      // Ignore deletion errors
    }

    // Remove from storage
    const updated = articles.filter((a) => a.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
};

export const loadSavedArticle = async (id: string): Promise<SavedArticle | null> => {
  const articles = await getSavedArticles();
  return articles.find((a) => a.id === id) || null;
};
