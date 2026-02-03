import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { UnifiedVoice } from "../types";

interface VoiceSelectorProps {
  voices: UnifiedVoice[];
  selectedVoiceId: string | null;
  onVoiceChange: (voiceId: string) => void;
  disabled?: boolean;
  loading?: boolean;
  useGoogleTts?: boolean;
}

export const VoiceSelector = ({
  voices,
  selectedVoiceId,
  onVoiceChange,
  disabled,
  loading,
  useGoogleTts,
}: VoiceSelectorProps) => {
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Voice</Text>
        <Text style={styles.loadingText}>Loading voices...</Text>
      </View>
    );
  }

  if (voices.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Voice</Text>
        <Text style={styles.noVoicesText}>No voices available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Voice</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {voices.map((voice) => {
          const isSelected = voice.id === selectedVoiceId;
          return (
            <TouchableOpacity
              key={voice.id}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
                disabled && styles.chipDisabled,
              ]}
              onPress={() => onVoiceChange(voice.id)}
              disabled={disabled}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                ]}
              >
                {voice.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {useGoogleTts && (
        <Text style={styles.sourceIndicator}>Google Cloud TTS</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: "#666",
  },
  chipsContainer: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 4,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  chipSelected: {
    backgroundColor: "#2196f3",
    borderColor: "#2196f3",
  },
  chipDisabled: {
    opacity: 0.5,
  },
  chipText: {
    fontSize: 14,
    color: "#333",
  },
  chipTextSelected: {
    color: "#fff",
    fontWeight: "500",
  },
  loadingText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
  noVoicesText: {
    fontSize: 14,
    color: "#c62828",
  },
  sourceIndicator: {
    fontSize: 12,
    color: "#4caf50",
    marginTop: 4,
  },
});
