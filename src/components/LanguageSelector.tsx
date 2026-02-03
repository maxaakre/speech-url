import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Language } from "../types";

interface LanguageSelectorProps {
  value: Language;
  onChange: (language: Language) => void;
  disabled?: boolean;
}

export const LanguageSelector = ({
  value,
  onChange,
  disabled,
}: LanguageSelectorProps) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.option,
          value === "en" && styles.optionActive,
          disabled && styles.disabled,
        ]}
        onPress={() => onChange("en")}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Select English language"
        accessibilityState={{ selected: value === "en" }}
      >
        <Text
          style={[styles.optionText, value === "en" && styles.optionTextActive]}
        >
          English
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.option,
          value === "sv" && styles.optionActive,
          disabled && styles.disabled,
        ]}
        onPress={() => onChange("sv")}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Select Swedish language"
        accessibilityState={{ selected: value === "sv" }}
      >
        <Text
          style={[styles.optionText, value === "sv" && styles.optionTextActive]}
        >
          Svenska
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 4,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
  },
  optionActive: {
    backgroundColor: "#007AFF",
  },
  optionText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  optionTextActive: {
    color: "#fff",
  },
  disabled: {
    opacity: 0.5,
  },
});
