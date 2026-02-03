import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import { SavedArticle, Article } from "../types";
import * as GoogleTts from "./googleTts";

const STORAGE_KEY = "saved_articles";
const AUDIO_DIR = Platform.OS !== "web" ? `${FileSystem.documentDirectory}saved_audio/` : "";
const IDB_NAME = "speech-my-url-audio";
const IDB_STORE = "audio";

// IndexedDB helpers for web
const openIDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
  });
};

const idbSet = async (key: string, value: string[]): Promise<void> => {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    const request = store.put(value, key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

const idbGet = async (key: string): Promise<string[] | null> => {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const store = tx.objectStore(IDB_STORE);
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
};

const idbDelete = async (key: string): Promise<void> => {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    const request = store.delete(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export interface SaveProgress {
  current: number;
  total: number;
}

const ensureAudioDir = async (): Promise<void> => {
  if (Platform.OS === "web") return;
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
  const id = generateId();
  const audioFiles: string[] = [];

  // On web, we store audio as base64 in a separate storage key
  // On native, we store audio files in the file system
  const isWeb = Platform.OS === "web";

  if (!isWeb) {
    await ensureAudioDir();
    const articleDir = `${AUDIO_DIR}${id}/`;
    await FileSystem.makeDirectoryAsync(articleDir, { intermediates: true });

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
    } catch (err) {
      // Clean up partial files on error
      try {
        await FileSystem.deleteAsync(articleDir, { idempotent: true });
      } catch {
        // Ignore cleanup errors
      }
      throw err;
    }
  } else {
    // On web, synthesize and store audio in IndexedDB (larger storage than localStorage)
    const audioData: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      onProgress?.({ current: i + 1, total: chunks.length });

      const audioContent = await GoogleTts.synthesizeSpeech(
        chunks[i],
        voiceId,
        apiKey
      );
      audioData.push(audioContent);
    }
    // Store audio data in IndexedDB
    await idbSet(id, audioData);
  }

  const savedArticle: SavedArticle = {
    id,
    url: article.url,
    title: article.title,
    content: article.content,
    language: article.language,
    audioFiles, // Empty on web, paths on native
    voiceId,
    savedAt: Date.now(),
  };

  const existing = await getSavedArticles();
  existing.unshift(savedArticle);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

  return savedArticle;
};

export const deleteSavedArticle = async (id: string): Promise<void> => {
  const articles = await getSavedArticles();
  const article = articles.find((a) => a.id === id);

  if (article) {
    if (Platform.OS === "web") {
      // Delete web audio data from IndexedDB
      try {
        await idbDelete(id);
      } catch {
        // Ignore deletion errors
      }
    } else {
      // Delete native audio files
      const articleDir = `${AUDIO_DIR}${id}/`;
      try {
        await FileSystem.deleteAsync(articleDir, { idempotent: true });
      } catch {
        // Ignore deletion errors
      }
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

export const getWebAudioData = async (id: string): Promise<string[] | null> => {
  if (Platform.OS !== "web") return null;
  try {
    return await idbGet(id);
  } catch {
    return null;
  }
};
