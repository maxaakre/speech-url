import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { ContentMode } from "../types";

interface ContentModeSelectorProps {
  value: ContentMode;
  onChange: (mode: ContentMode) => void;
  disabled?: boolean;
  summaryDisabled?: boolean;
  summaryDisabledHint?: string;
}

export const ContentModeSelector = ({
  value,
  onChange,
  disabled,
  summaryDisabled,
  summaryDisabledHint,
}: ContentModeSelectorProps) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <TouchableOpacity
          style={[
            styles.option,
            value === "full" && styles.optionActive,
            disabled && styles.disabled,
          ]}
          onPress={() => onChange("full")}
          disabled={disabled}
        >
          <Text
            style={[styles.optionText, value === "full" && styles.optionTextActive]}
          >
            Full Article
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.option,
            value === "summary" && styles.optionActive,
            (disabled || summaryDisabled) && styles.disabled,
          ]}
          onPress={() => onChange("summary")}
          disabled={disabled || summaryDisabled}
        >
          <Text
            style={[
              styles.optionText,
              value === "summary" && styles.optionTextActive,
            ]}
          >
            Summary
          </Text>
        </TouchableOpacity>
      </View>
      {summaryDisabled && summaryDisabledHint && (
        <Text style={styles.hint}>{summaryDisabledHint}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: 4,
  },
  container: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 4,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  hint: {
    fontSize: 11,
    color: "#999",
  },
});
