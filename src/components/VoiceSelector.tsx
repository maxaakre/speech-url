import { View, Text, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Voice } from "../services/speech";

interface VoiceSelectorProps {
  voices: Voice[];
  selectedVoiceId: string | null;
  onVoiceChange: (voiceId: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export const VoiceSelector = ({
  voices,
  selectedVoiceId,
  onVoiceChange,
  disabled,
  loading,
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
          selectedValue={selectedVoiceId || voices[0]?.identifier}
          onValueChange={onVoiceChange}
          enabled={!disabled}
          style={styles.picker}
        >
          {voices.map((voice) => (
            <Picker.Item
              key={voice.identifier}
              label={voice.name}
              value={voice.identifier}
            />
          ))}
        </Picker>
      </View>
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
  pickerContainer: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    minWidth: 200,
    overflow: "hidden",
  },
  picker: {
    height: 44,
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
});
