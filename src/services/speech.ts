import * as Speech from "expo-speech";
import { PlaybackSpeed } from "../types";

const CHUNK_SIZE = 500; // Characters per chunk for better control

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

export const speak = async (
  text: string,
  options: {
    rate?: PlaybackSpeed;
    onDone?: () => void;
    onStopped?: () => void;
  } = {}
): Promise<void> => {
  return new Promise((resolve) => {
    Speech.speak(text, {
      language: "en-US",
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

export const testVoice = (): void => {
  Speech.speak("Hello! This is a test of the text to speech system.", {
    language: "en-US",
    rate: 1,
    pitch: 1,
  });
};

export const getAvailableVoices = async () => {
  return Speech.getAvailableVoicesAsync();
};
