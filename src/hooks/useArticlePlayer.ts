import { useState, useCallback, useRef, useEffect } from "react";
import { Article, PlaybackSpeed, Language, UnifiedVoice, ContentMode, SavedArticle } from "../types";
import { extractArticle, summarizeArticle } from "../services/gemini";
import * as SpeechService from "../services/speech";
import * as GoogleTts from "../services/googleTts";
import { loadApiKey } from "../services/apiKeyStorage";
import { loadGeminiApiKey } from "../services/geminiKeyStorage";
import {
  loadVoicePreferences,
  saveVoiceForLanguage,
} from "../services/voiceStorage";
import * as ArticleStorage from "../services/articleStorage";

interface UseArticlePlayerState {
  url: string;
  article: Article | null;
  isLoading: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  speed: PlaybackSpeed;
  currentChunkIndex: number;
  totalChunks: number;
  error: string | null;
  language: Language;
  voices: UnifiedVoice[];
  selectedVoiceId: string | null;
  voicesLoading: boolean;
  useGoogleTts: boolean;
  contentMode: ContentMode;
  geminiApiKey: string | null;
  savedArticles: SavedArticle[];
  isSaved: boolean;
  isSaving: boolean;
  saveProgress: { current: number; total: number } | null;
}

interface UseArticlePlayerActions {
  setUrl: (url: string) => void;
  extract: () => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  setSpeed: (speed: PlaybackSpeed) => void;
  skipForward: () => void;
  skipBack: () => void;
  setLanguage: (language: Language) => void;
  setSelectedVoiceId: (voiceId: string) => void;
  setApiKey: (apiKey: string | null) => void;
  setContentMode: (mode: ContentMode) => void;
  setGeminiApiKey: (apiKey: string | null) => void;
  loadSavedArticle: (saved: SavedArticle) => void;
  deleteSavedArticle: (id: string) => Promise<void>;
  saveCurrentArticle: () => Promise<void>;
}

type UseArticlePlayerReturn = UseArticlePlayerState & UseArticlePlayerActions;

export const useArticlePlayer = (): UseArticlePlayerReturn => {
  const [url, setUrl] = useState("");
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeedState] = useState<PlaybackSpeed>(1);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguageState] = useState<Language>("en");
  const [voices, setVoices] = useState<UnifiedVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceIdState] = useState<string | null>(null);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [useGoogleTts, setUseGoogleTts] = useState(false);
  const [contentMode, setContentModeState] = useState<ContentMode>("full");
  const [geminiApiKey, setGeminiApiKeyState] = useState<string | null>(null);
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<{ current: number; total: number } | null>(null);

  const chunksRef = useRef<string[]>([]);
  const audioFilesRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const currentIndexRef = useRef(0);
  const speedRef = useRef<PlaybackSpeed>(1);
  const languageRef = useRef<Language>("en");
  const voiceIdRef = useRef<string | null>(null);
  const apiKeyRef = useRef<string | null>(null);
  const contentModeRef = useRef<ContentMode>("full");
  const geminiApiKeyRef = useRef<string | null>(null);

  // Load voices for current language
  const loadVoicesForLanguage = useCallback(async (lang: Language, currentApiKey: string | null) => {
    setVoicesLoading(true);
    try {
      let availableVoices: UnifiedVoice[];

      if (currentApiKey) {
        // Use Google Cloud TTS voices
        const googleVoices = GoogleTts.getGoogleVoicesForLanguage(lang);
        availableVoices = googleVoices.map((v) => ({
          id: v.id,
          name: v.name,
          source: "google" as const,
        }));
        setUseGoogleTts(true);
      } else {
        // Use device voices
        const deviceVoices = await SpeechService.getVoicesForLanguage(lang);
        availableVoices = deviceVoices.map((v) => ({
          id: v.identifier,
          name: v.name,
          source: "device" as const,
        }));
        setUseGoogleTts(false);
      }

      setVoices(availableVoices);

      // Load saved preference
      const prefs = await loadVoicePreferences();
      const savedVoiceId = prefs[lang];

      // Check if saved voice is still available
      const voiceExists = availableVoices.some((v) => v.id === savedVoiceId);
      const voiceToUse = voiceExists ? savedVoiceId : availableVoices[0]?.id || null;

      setSelectedVoiceIdState(voiceToUse);
      voiceIdRef.current = voiceToUse;
    } catch (err) {
      console.error("Failed to load voices:", err);
      setVoices([]);
      setSelectedVoiceIdState(null);
      voiceIdRef.current = null;
    } finally {
      setVoicesLoading(false);
    }
  }, []);

  // Initial load - check for API keys and load saved articles
  useEffect(() => {
    loadApiKey().then((key) => {
      setApiKeyState(key);
      apiKeyRef.current = key;
      loadVoicesForLanguage("en", key);
    });
    loadGeminiApiKey().then((key) => {
      setGeminiApiKeyState(key);
      geminiApiKeyRef.current = key;
    });
    ArticleStorage.getSavedArticles().then(setSavedArticles);
  }, [loadVoicesForLanguage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      SpeechService.stop();
      GoogleTts.stopAudio();
    };
  }, []);

  const setLanguage = useCallback(
    async (newLanguage: Language) => {
      setLanguageState(newLanguage);
      languageRef.current = newLanguage;
      await loadVoicesForLanguage(newLanguage, apiKeyRef.current);
    },
    [loadVoicesForLanguage]
  );

  const setSelectedVoiceId = useCallback(
    async (voiceId: string) => {
      setSelectedVoiceIdState(voiceId);
      voiceIdRef.current = voiceId;
      await saveVoiceForLanguage(languageRef.current, voiceId);
    },
    []
  );

  const setApiKey = useCallback(
    async (newApiKey: string | null) => {
      setApiKeyState(newApiKey);
      apiKeyRef.current = newApiKey;
      await loadVoicesForLanguage(languageRef.current, newApiKey);
    },
    [loadVoicesForLanguage]
  );

  const setContentMode = useCallback((mode: ContentMode) => {
    setContentModeState(mode);
    contentModeRef.current = mode;
  }, []);

  const setGeminiApiKey = useCallback((newApiKey: string | null) => {
    setGeminiApiKeyState(newApiKey);
    geminiApiKeyRef.current = newApiKey;
  }, []);

  const extract = useCallback(async () => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    setIsLoading(true);
    setError(null);
    setArticle(null);
    setTotalChunks(0);

    try {
      const extractedArticle = await extractArticle(url);

      // Set detected language and load appropriate voices
      await setLanguage(extractedArticle.language);

      // Determine content to use based on mode
      let contentToSpeak = extractedArticle.content;
      if (contentModeRef.current === "summary" && geminiApiKeyRef.current) {
        contentToSpeak = await summarizeArticle(
          extractedArticle.content,
          extractedArticle.language,
          geminiApiKeyRef.current
        );
      }

      // Store the article with potentially summarized content for display
      setArticle({
        ...extractedArticle,
        content: contentToSpeak,
      });

      const chunks = SpeechService.splitIntoChunks(contentToSpeak);
      chunksRef.current = chunks;
      setTotalChunks(chunks.length);
      setCurrentChunkIndex(0);
      currentIndexRef.current = 0;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract article");
    } finally {
      setIsLoading(false);
    }
  }, [url, setLanguage]);

  const playFromIndex = useCallback(async (startIndex: number) => {
    if (!chunksRef.current.length) return;

    isPlayingRef.current = true;
    setIsPlaying(true);
    setIsPaused(false);

    for (let i = startIndex; i < chunksRef.current.length; i++) {
      if (!isPlayingRef.current) break;

      currentIndexRef.current = i;
      setCurrentChunkIndex(i);

      const text = chunksRef.current[i];
      const voiceId = voiceIdRef.current;

      if (apiKeyRef.current && voiceId) {
        // Use Google Cloud TTS
        try {
          const audioContent = await GoogleTts.synthesizeSpeech(
            text,
            voiceId,
            apiKeyRef.current
          );
          await new Promise<void>((resolve) => {
            GoogleTts.playAudio(audioContent, resolve);
          });
        } catch (err) {
          console.error("Google TTS error:", err);
          break;
        }
      } else {
        // Use device voices
        await SpeechService.speak(text, {
          rate: speedRef.current,
          voiceId: voiceId || undefined,
          language: languageRef.current,
        });
      }
    }

    if (isPlayingRef.current) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setCurrentChunkIndex(0);
      currentIndexRef.current = 0;
    }
  }, []);

  const play = useCallback(async () => {
    await playFromIndex(currentIndexRef.current);
  }, [playFromIndex]);

  const pause = useCallback(async () => {
    if (apiKeyRef.current) {
      await GoogleTts.pauseAudio();
    } else {
      await SpeechService.pause();
    }
    setIsPaused(true);
  }, []);

  const resume = useCallback(async () => {
    if (apiKeyRef.current) {
      await GoogleTts.resumeAudio();
    } else {
      await SpeechService.resume();
    }
    setIsPaused(false);
  }, []);

  const stop = useCallback(async () => {
    isPlayingRef.current = false;
    if (apiKeyRef.current) {
      await GoogleTts.stopAudio();
    } else {
      await SpeechService.stop();
    }
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  const setSpeed = useCallback(
    (newSpeed: PlaybackSpeed) => {
      speedRef.current = newSpeed;
      setSpeedState(newSpeed);

      if (isPlayingRef.current && !isPaused) {
        SpeechService.stop().then(() => {
          playFromIndex(currentIndexRef.current);
        });
      }
    },
    [isPaused, playFromIndex]
  );

  const skipForward = useCallback(() => {
    const newIndex = Math.min(
      currentIndexRef.current + 1,
      chunksRef.current.length - 1
    );
    if (isPlayingRef.current) {
      if (apiKeyRef.current) {
        GoogleTts.stopAudio().then(() => {
          playFromIndex(newIndex);
        });
      } else {
        SpeechService.stop().then(() => {
          playFromIndex(newIndex);
        });
      }
    } else {
      currentIndexRef.current = newIndex;
      setCurrentChunkIndex(newIndex);
    }
  }, [playFromIndex]);

  const skipBack = useCallback(() => {
    const newIndex = Math.max(currentIndexRef.current - 1, 0);
    if (isPlayingRef.current) {
      if (apiKeyRef.current) {
        GoogleTts.stopAudio().then(() => {
          playFromIndex(newIndex);
        });
      } else {
        SpeechService.stop().then(() => {
          playFromIndex(newIndex);
        });
      }
    } else {
      currentIndexRef.current = newIndex;
      setCurrentChunkIndex(newIndex);
    }
  }, [playFromIndex]);

  const loadSavedArticle = useCallback((saved: SavedArticle) => {
    const loadedArticle: Article = {
      title: saved.title,
      content: saved.content,
      url: saved.url,
      language: saved.language,
    };

    setArticle(loadedArticle);
    setUrl(saved.url);
    setLanguageState(saved.language);
    languageRef.current = saved.language;

    const chunks = SpeechService.splitIntoChunks(saved.content);
    chunksRef.current = chunks;
    audioFilesRef.current = saved.audioFiles;
    setTotalChunks(chunks.length);
    setCurrentChunkIndex(0);
    currentIndexRef.current = 0;
    setIsSaved(true);
    setError(null);
  }, []);

  const deleteSavedArticle = useCallback(async (id: string) => {
    await ArticleStorage.deleteSavedArticle(id);
    const updated = await ArticleStorage.getSavedArticles();
    setSavedArticles(updated);
  }, []);

  const saveCurrentArticle = useCallback(async () => {
    if (!article || !apiKeyRef.current || !voiceIdRef.current) {
      setError("Cannot save: need article and Google TTS API key");
      return;
    }

    setIsSaving(true);
    setSaveProgress({ current: 0, total: chunksRef.current.length });

    try {
      const saved = await ArticleStorage.saveArticle(
        article,
        chunksRef.current,
        voiceIdRef.current,
        apiKeyRef.current,
        (progress) => setSaveProgress(progress)
      );
      audioFilesRef.current = saved.audioFiles;
      setIsSaved(true);
      const updated = await ArticleStorage.getSavedArticles();
      setSavedArticles(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save article");
    } finally {
      setIsSaving(false);
      setSaveProgress(null);
    }
  }, [article]);

  return {
    url,
    article,
    isLoading,
    isPlaying,
    isPaused,
    speed,
    currentChunkIndex,
    totalChunks,
    error,
    language,
    voices,
    selectedVoiceId,
    voicesLoading,
    useGoogleTts,
    contentMode,
    geminiApiKey,
    savedArticles,
    isSaved,
    isSaving,
    saveProgress,
    setUrl,
    extract,
    play,
    pause,
    resume,
    stop,
    setSpeed,
    skipForward,
    skipBack,
    setLanguage,
    setSelectedVoiceId,
    setApiKey,
    setContentMode,
    setGeminiApiKey,
    loadSavedArticle,
    deleteSavedArticle,
    saveCurrentArticle,
  };
};
