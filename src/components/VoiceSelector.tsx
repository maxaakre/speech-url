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
        <Text style={styles.loadingText}>Loading voices...</Text>
      </View>
    );
  }

  if (voices.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noVoicesText}>No voices available</Text>
      </View>
    );
  }

  const selectedVoice = voices.find(v => v.id === selectedVoiceId) || voices[0];

  return (
    <View style={styles.container}>
      <View style={[styles.pickerWrapper, disabled && styles.disabled]}>
        <Picker
          selectedValue={selectedVoiceId || voices[0]?.id}
          onValueChange={onVoiceChange}
          enabled={!disabled}
          style={styles.picker}
          dropdownIconColor="#666"
        >
          {voices.map((voice) => (
            <Picker.Item
              key={voice.id}
              label={voice.name}
              value={voice.id}
              style={styles.pickerItem}
            />
          ))}
        </Picker>
      </View>
      {useGoogleTts && (
        <Text style={styles.sourceIndicator}>Google Cloud TTS</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 4,
  },
  pickerWrapper: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
    height: Platform.OS === "ios" ? 85 : 48,
    justifyContent: "center",
  },
  picker: {
    height: Platform.OS === "ios" ? 180 : 48,
    width: 220,
    marginTop: Platform.OS === "ios" ? -40 : 0,
  },
  pickerItem: {
    fontSize: 15,
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
    fontSize: 11,
    color: "#4caf50",
  },
});
