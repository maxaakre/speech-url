import { useState, useCallback, useRef } from "react";
import { Article, PlaybackSpeed } from "../types";
import { extractArticle } from "../services/gemini";
import * as SpeechService from "../services/speech";

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

  const chunksRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const currentIndexRef = useRef(0);
  const speedRef = useRef<PlaybackSpeed>(1);

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
      setArticle(extractedArticle);
      const chunks = SpeechService.splitIntoChunks(extractedArticle.content);
      chunksRef.current = chunks;
      setTotalChunks(chunks.length);
      setCurrentChunkIndex(0);
      currentIndexRef.current = 0;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract article");
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  const playFromIndex = useCallback(async (startIndex: number) => {
    if (!chunksRef.current.length) return;

    isPlayingRef.current = true;
    setIsPlaying(true);
    setIsPaused(false);

    for (let i = startIndex; i < chunksRef.current.length; i++) {
      if (!isPlayingRef.current) break;

      currentIndexRef.current = i;
      setCurrentChunkIndex(i);

      await SpeechService.speak(chunksRef.current[i], {
        rate: speedRef.current,
      });
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
    await SpeechService.pause();
    setIsPaused(true);
  }, []);

  const resume = useCallback(async () => {
    await SpeechService.resume();
    setIsPaused(false);
  }, []);

  const stop = useCallback(async () => {
    isPlayingRef.current = false;
    await SpeechService.stop();
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  const setSpeed = useCallback(
    (newSpeed: PlaybackSpeed) => {
      speedRef.current = newSpeed;
      setSpeedState(newSpeed);

      // If currently playing, restart from current chunk with new speed
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
      SpeechService.stop().then(() => {
        playFromIndex(newIndex);
      });
    } else {
      currentIndexRef.current = newIndex;
      setCurrentChunkIndex(newIndex);
    }
  }, [playFromIndex]);

  const skipBack = useCallback(() => {
    const newIndex = Math.max(currentIndexRef.current - 1, 0);
    if (isPlayingRef.current) {
      SpeechService.stop().then(() => {
        playFromIndex(newIndex);
      });
    } else {
      currentIndexRef.current = newIndex;
      setCurrentChunkIndex(newIndex);
    }
  }, [playFromIndex]);

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
    setUrl,
    extract,
    play,
    pause,
    resume,
    stop,
    setSpeed,
    skipForward,
    skipBack,
  };
};
