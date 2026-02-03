import * as Speech from "expo-speech";
import { PlaybackSpeed, Language } from "../types";

const CHUNK_SIZE = 500;

export interface Voice {
  identifier: string;
  name: string;
  language: string;
}

export const splitIntoChunks = (text: string): string[] => {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);

  let currentChunk = "";

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > CHUNK_SIZE && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

export const getAvailableVoices = async (): Promise<Voice[]> => {
  const voices = await Speech.getAvailableVoicesAsync();
  return voices.map((v) => ({
    identifier: v.identifier,
    name: v.name,
    language: v.language,
  }));
};

export const getVoicesForLanguage = async (language: Language): Promise<Voice[]> => {
  const voices = await getAvailableVoices();
  const langPrefix = language === 'en' ? 'en' : 'sv';
  return voices.filter((v) => v.language.toLowerCase().startsWith(langPrefix));
};

export const speak = async (
  text: string,
  options: {
    rate?: PlaybackSpeed;
    voiceId?: string;
    language?: Language;
    onDone?: () => void;
    onStopped?: () => void;
  } = {}
): Promise<void> => {
  const speechLang = options.language === 'sv' ? 'sv-SE' : 'en-US';

  return new Promise((resolve) => {
    Speech.speak(text, {
      language: speechLang,
      voice: options.voiceId,
      rate: options.rate || 1,
      pitch: 1.0,
      onDone: () => {
        options.onDone?.();
        resolve();
      },
      onStopped: () => {
        options.onStopped?.();
        resolve();
      },
      onError: (error) => {
        console.error("Speech error:", error);
        resolve();
      },
    });
  });
};

export const stop = async (): Promise<void> => {
  await Speech.stop();
};

export const pause = async (): Promise<void> => {
  await Speech.pause();
};

export const resume = async (): Promise<void> => {
  await Speech.resume();
};

export const isSpeaking = async (): Promise<boolean> => {
  return Speech.isSpeakingAsync();
};
