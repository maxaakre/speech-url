import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { PlaybackSpeed } from "../types";

interface PlaybackControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  speed: PlaybackSpeed;
  currentChunk: number;
  totalChunks: number;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  disabled?: boolean;
}

const SPEEDS: PlaybackSpeed[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const PlaybackControls = ({
  isPlaying,
  isPaused,
  speed,
  currentChunk,
  totalChunks,
  onPlay,
  onPause,
  onResume,
  onStop,
  onSpeedChange,
  onSkipBack,
  onSkipForward,
  disabled,
}: PlaybackControlsProps) => {
  const handlePlayPause = () => {
    if (!isPlaying) {
      onPlay();
    } else if (isPaused) {
      onResume();
    } else {
      onPause();
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress indicator */}
      {totalChunks > 0 && (
        <Text style={styles.progress}>
          {currentChunk + 1} / {totalChunks}
        </Text>
      )}

      {/* Main controls */}
      <View style={styles.mainControls}>
        <TouchableOpacity
          style={[styles.controlButton, disabled && styles.disabled]}
          onPress={onSkipBack}
          disabled={disabled}
        >
          <Text style={styles.controlText}>⏮</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.playButton, disabled && styles.disabled]}
          onPress={handlePlayPause}
          disabled={disabled}
        >
          <Text style={styles.playText}>
            {isPlaying && !isPaused ? "⏸" : "▶"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, disabled && styles.disabled]}
          onPress={onSkipForward}
          disabled={disabled}
        >
          <Text style={styles.controlText}>⏭</Text>
        </TouchableOpacity>
      </View>

      {/* Stop button */}
      {isPlaying && (
        <TouchableOpacity style={styles.stopButton} onPress={onStop}>
          <Text style={styles.stopText}>Stop</Text>
        </TouchableOpacity>
      )}

      {/* Speed selector */}
      <View style={styles.speedContainer}>
        <Text style={styles.speedLabel}>Speed:</Text>
        <View style={styles.speedButtons}>
          {SPEEDS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.speedButton,
                speed === s && styles.speedButtonActive,
              ]}
              onPress={() => onSpeedChange(s)}
            >
              <Text
                style={[
                  styles.speedButtonText,
                  speed === s && styles.speedButtonTextActive,
                ]}
              >
                {s}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 16,
  },
  progress: {
    fontSize: 14,
    color: "#666",
  },
  mainControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  controlText: {
    fontSize: 20,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  playText: {
    fontSize: 28,
    color: "#fff",
  },
  disabled: {
    opacity: 0.5,
  },
  stopButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#ff3b30",
    borderRadius: 8,
  },
  stopText: {
    color: "#fff",
    fontWeight: "600",
  },
  speedContainer: {
    alignItems: "center",
    gap: 8,
  },
  speedLabel: {
    fontSize: 14,
    color: "#666",
  },
  speedButtons: {
    flexDirection: "row",
    gap: 8,
  },
  speedButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
  },
  speedButtonActive: {
    backgroundColor: "#007AFF",
  },
  speedButtonText: {
    fontSize: 14,
    color: "#333",
  },
  speedButtonTextActive: {
    color: "#fff",
  },
});
