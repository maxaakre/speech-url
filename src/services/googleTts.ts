import { File, Paths } from "expo-file-system";
import { Audio } from "expo-av";
import { Language } from "../types";

export interface GoogleVoice {
  id: string;
  name: string;
  languageCode: string;
  gender: "male" | "female";
}

const SWEDISH_VOICES: GoogleVoice[] = [
  { id: "sv-SE-Wavenet-A", name: "Swedish Female 1", languageCode: "sv-SE", gender: "female" },
  { id: "sv-SE-Wavenet-B", name: "Swedish Female 2", languageCode: "sv-SE", gender: "female" },
  { id: "sv-SE-Wavenet-C", name: "Swedish Female 3", languageCode: "sv-SE", gender: "female" },
  { id: "sv-SE-Wavenet-D", name: "Swedish Male 1", languageCode: "sv-SE", gender: "male" },
  { id: "sv-SE-Wavenet-E", name: "Swedish Male 2", languageCode: "sv-SE", gender: "male" },
];

const ENGLISH_VOICES: GoogleVoice[] = [
  { id: "en-US-Wavenet-A", name: "English Male 1", languageCode: "en-US", gender: "male" },
  { id: "en-US-Wavenet-B", name: "English Male 2", languageCode: "en-US", gender: "male" },
  { id: "en-US-Wavenet-C", name: "English Female 1", languageCode: "en-US", gender: "female" },
  { id: "en-US-Wavenet-D", name: "English Male 3", languageCode: "en-US", gender: "male" },
  { id: "en-US-Wavenet-E", name: "English Female 2", languageCode: "en-US", gender: "female" },
  { id: "en-US-Wavenet-F", name: "English Female 3", languageCode: "en-US", gender: "female" },
];

export const getGoogleVoicesForLanguage = (language: Language): GoogleVoice[] => {
  return language === "sv" ? SWEDISH_VOICES : ENGLISH_VOICES;
};

export const synthesizeSpeech = async (
  text: string,
  voiceId: string,
  apiKey: string
): Promise<string> => {
  const voice = [...SWEDISH_VOICES, ...ENGLISH_VOICES].find((v) => v.id === voiceId);
  if (!voice) {
    throw new Error(`Voice not found: ${voiceId}`);
  }

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: voice.languageCode,
          name: voiceId,
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: 1.0,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to synthesize speech");
  }

  const data = await response.json();
  return data.audioContent; // base64 encoded MP3
};

let currentSound: Audio.Sound | null = null;
let currentTempFile: File | null = null;

export const playAudio = async (
  base64Audio: string,
  onDone?: () => void
): Promise<void> => {
  // Stop any existing playback
  if (currentSound) {
    await currentSound.unloadAsync();
    currentSound = null;
  }

  // Clean up previous temp file
  if (currentTempFile) {
    try {
      await currentTempFile.delete();
    } catch {
      // Ignore cleanup errors
    }
    currentTempFile = null;
  }

  // Write to temp file using new expo-file-system API
  const tempFile = new File(Paths.cache, `tts_audio_${Date.now()}.mp3`);
  await tempFile.write(base64Audio, { encoding: "base64" });
  currentTempFile = tempFile;

  // Play the audio
  const { sound } = await Audio.Sound.createAsync(
    { uri: tempFile.uri },
    { shouldPlay: true }
  );
  currentSound = sound;

  // Set up completion callback
  sound.setOnPlaybackStatusUpdate((status) => {
    if (status.isLoaded && status.didJustFinish) {
      sound.unloadAsync();
      if (currentTempFile) {
        try {
          currentTempFile.delete();
        } catch {
          // Ignore cleanup errors
        }
        currentTempFile = null;
      }
      currentSound = null;
      onDone?.();
    }
  });
};

export const stopAudio = async (): Promise<void> => {
  if (currentSound) {
    await currentSound.stopAsync();
    await currentSound.unloadAsync();
    currentSound = null;
  }
  if (currentTempFile) {
    try {
      await currentTempFile.delete();
    } catch {
      // Ignore cleanup errors
    }
    currentTempFile = null;
  }
};

export const pauseAudio = async (): Promise<void> => {
  if (currentSound) {
    await currentSound.pauseAsync();
  }
};

export const resumeAudio = async (): Promise<void> => {
  if (currentSound) {
    await currentSound.playAsync();
  }
};

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    // Try a minimal API call to validate the key
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/voices?key=${apiKey}`
    );
    return response.ok;
  } catch {
    return false;
  }
};
