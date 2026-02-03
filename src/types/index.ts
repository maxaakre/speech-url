export type Language = 'en' | 'sv';

export type ContentMode = 'full' | 'summary';

export interface VoicePreferences {
  en: string | null;
  sv: string | null;
}

export interface Article {
  title: string;
  author?: string;
  content: string;
  url: string;
  language: Language;
}

export type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;

export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  speed: PlaybackSpeed;
  currentChunkIndex: number;
}

export interface UnifiedVoice {
  id: string;
  name: string;
  source: "device" | "google";
}

export interface SavedArticle {
  id: string;
  url: string;
  title: string;
  content: string;
  language: Language;
  audioFiles: string[];
  voiceId: string;
  savedAt: number;
}
