import * as FileSystem from "expo-file-system/legacy";
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from "expo-av";
import { Platform } from "react-native";
import { Language } from "../types";

// Configure audio mode for playback
const configureAudio = async () => {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
};

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

  console.log("Synthesizing speech for:", text.substring(0, 50) + "...");

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
    console.error("TTS API error:", error);
    throw new Error(error.error?.message || "Failed to synthesize speech");
  }

  const data = await response.json();
  console.log("Got audio content, length:", data.audioContent?.length);
  return data.audioContent; // base64 encoded MP3
};

let currentSound: Audio.Sound | null = null;
let currentTempFile: string | null = null;
let currentWebAudio: HTMLAudioElement | null = null;

export const playAudio = async (
  base64Audio: string,
  onDone?: () => void
): Promise<void> => {
  console.log("playAudio called, base64 length:", base64Audio?.length);

  // Web-specific playback using HTML5 Audio
  if (Platform.OS === "web") {
    // Stop any existing web audio
    if (currentWebAudio) {
      currentWebAudio.pause();
      currentWebAudio = null;
    }

    const audio = new window.Audio(`data:audio/mp3;base64,${base64Audio}`);
    currentWebAudio = audio;

    audio.onended = () => {
      console.log("Web audio playback finished");
      currentWebAudio = null;
      onDone?.();
    };

    audio.onerror = (e) => {
      console.error("Web audio error:", e);
      currentWebAudio = null;
      onDone?.();
    };

    await audio.play();
    console.log("Web audio playing");
    return;
  }

  // Native playback using expo-av
  // Configure audio mode for playback (important for iOS)
  await configureAudio();

  // Stop any existing playback
  if (currentSound) {
    await currentSound.unloadAsync();
    currentSound = null;
  }

  // Clean up previous temp file
  if (currentTempFile) {
    try {
      await FileSystem.deleteAsync(currentTempFile, { idempotent: true });
    } catch {
      // Ignore cleanup errors
    }
    currentTempFile = null;
  }

  // Write to temp file using legacy expo-file-system API
  const tempFile = `${FileSystem.cacheDirectory}tts_audio_${Date.now()}.mp3`;
  console.log("Writing to temp file:", tempFile);

  await FileSystem.writeAsStringAsync(tempFile, base64Audio, {
    encoding: FileSystem.EncodingType.Base64,
  });
  currentTempFile = tempFile;

  console.log("File written, creating sound...");

  // Play the audio
  const { sound } = await Audio.Sound.createAsync(
    { uri: tempFile },
    { shouldPlay: true }
  );
  currentSound = sound;

  console.log("Sound created and playing");

  // Set up completion callback
  sound.setOnPlaybackStatusUpdate((status) => {
    if (status.isLoaded && status.didJustFinish) {
      console.log("Playback finished");
      sound.unloadAsync();
      if (currentTempFile) {
        FileSystem.deleteAsync(currentTempFile, { idempotent: true }).catch(() => {});
        currentTempFile = null;
      }
      currentSound = null;
      onDone?.();
    }
  });
};

export const stopAudio = async (): Promise<void> => {
  // Web audio
  if (currentWebAudio) {
    currentWebAudio.pause();
    currentWebAudio.currentTime = 0;
    currentWebAudio = null;
  }

  // Native audio
  if (currentSound) {
    await currentSound.stopAsync();
    await currentSound.unloadAsync();
    currentSound = null;
  }
  if (currentTempFile) {
    try {
      await FileSystem.deleteAsync(currentTempFile, { idempotent: true });
    } catch {
      // Ignore cleanup errors
    }
    currentTempFile = null;
  }
};

export const pauseAudio = async (): Promise<void> => {
  if (currentWebAudio) {
    currentWebAudio.pause();
  }
  if (currentSound) {
    await currentSound.pauseAsync();
  }
};

export const resumeAudio = async (): Promise<void> => {
  if (currentWebAudio) {
    await currentWebAudio.play();
  }
  if (currentSound) {
    await currentSound.playAsync();
  }
};

export const validateApiKey = async (apiKey: string): Promise<{ valid: boolean; error?: string }> => {
  try {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/voices?key=${apiKey}`
    );
    if (response.ok) {
      return { valid: true };
    }
    const data = await response.json();
    return {
      valid: false,
      error: data.error?.message || `Error ${response.status}`
    };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "Network error"
    };
  }
};
