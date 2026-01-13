export interface Article {
  title: string;
  author?: string;
  content: string;
  url: string;
}

export type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;

export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  speed: PlaybackSpeed;
  currentChunkIndex: number;
}
