import { View, Text, StyleSheet, Platform } from "react-native";
import { Picker } from "@react-native-picker/picker";
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
        <Text style={styles.label}>Voice:</Text>
        <Text style={styles.loadingText}>Loading voices...</Text>
      </View>
    );
  }

  if (voices.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Voice:</Text>
        <Text style={styles.noVoicesText}>No voices available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Voice:</Text>
      <View style={[styles.pickerContainer, disabled && styles.disabled]}>
        <Picker
          selectedValue={selectedVoiceId || voices[0]?.id}
          onValueChange={onVoiceChange}
          enabled={!disabled}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          {voices.map((voice) => (
            <Picker.Item
              key={voice.id}
              label={voice.name}
              value={voice.id}
            />
          ))}
        </Picker>
      </View>
      {useGoogleTts && (
        <Text style={styles.sourceIndicator}>Using Google Cloud TTS</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 4,
  },
  label: {
    fontSize: 14,
    color: "#666",
  },
  pickerContainer: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    minWidth: 200,
    overflow: "hidden",
  },
  picker: {
    height: Platform.OS === "ios" ? 80 : 44,
    width: 200,
  },
  pickerItem: {
    fontSize: 14,
    color: "#333",
  },
  disabled: {
    opacity: 0.5,
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
    marginTop: 2,
  },
});
