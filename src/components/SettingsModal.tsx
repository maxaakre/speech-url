import { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from "react-native";
import { loadApiKey, saveApiKey, clearApiKey } from "../services/apiKeyStorage";
import {
  loadGeminiApiKey,
  saveGeminiApiKey,
  clearGeminiApiKey,
} from "../services/geminiKeyStorage";
import { validateApiKey } from "../services/googleTts";

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onApiKeyChange: (apiKey: string | null) => void;
  onGeminiKeyChange: (apiKey: string | null) => void;
}

export const SettingsModal = ({
  visible,
  onClose,
  onApiKeyChange,
  onGeminiKeyChange,
}: SettingsModalProps) => {
  const [apiKey, setApiKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [status, setStatus] = useState<"none" | "valid" | "invalid">("none");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [geminiKey, setGeminiKey] = useState("");
  const [geminiStatus, setGeminiStatus] = useState<"none" | "saved">("none");

  useEffect(() => {
    if (visible) {
      loadApiKey().then((key) => {
        if (key) {
          setApiKey(key);
          setStatus("valid");
        } else {
          setApiKey("");
          setStatus("none");
        }
      });
      loadGeminiApiKey().then((key) => {
        if (key) {
          setGeminiKey(key);
          setGeminiStatus("saved");
        } else {
          setGeminiKey("");
          setGeminiStatus("none");
        }
      });
    }
  }, [visible]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      await clearApiKey();
      setStatus("none");
      onApiKeyChange(null);
      onClose();
      return;
    }

    setIsValidating(true);
    setErrorMessage(null);

    const result = await validateApiKey(apiKey.trim());

    if (result.valid) {
      await saveApiKey(apiKey.trim());
      setStatus("valid");
      onApiKeyChange(apiKey.trim());
      onClose();
    } else {
      setStatus("invalid");
      setErrorMessage(result.error || "Invalid API key");
    }

    setIsValidating(false);
  };

  const handleClear = async () => {
    await clearApiKey();
    setApiKey("");
    setStatus("none");
    onApiKeyChange(null);
  };

  const openDocs = () => {
    Linking.openURL(
      "https://cloud.google.com/text-to-speech/docs/before-you-begin"
    );
  };

  const handleGeminiSave = async () => {
    if (!geminiKey.trim()) {
      await clearGeminiApiKey();
      setGeminiStatus("none");
      onGeminiKeyChange(null);
      return;
    }
    await saveGeminiApiKey(geminiKey.trim());
    setGeminiStatus("saved");
    onGeminiKeyChange(geminiKey.trim());
  };

  const handleGeminiClear = async () => {
    await clearGeminiApiKey();
    setGeminiKey("");
    setGeminiStatus("none");
    onGeminiKeyChange(null);
  };

  const openGeminiDocs = () => {
    Linking.openURL("https://aistudio.google.com/app/apikey");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Google Cloud TTS</Text>
          <Text style={styles.description}>
            Add your API key to enable high-quality natural voices.
          </Text>

          <TextInput
            style={styles.input}
            value={apiKey}
            onChangeText={(text) => setApiKey(text.replace(/[\n\r\s]/g, ""))}
            placeholder="Paste your API key here..."
            secureTextEntry={true}
            autoCapitalize="none"
            autoCorrect={false}
            multiline={false}
          />

          {status === "valid" && (
            <Text style={styles.statusValid}>✓ Connected</Text>
          )}
          {status === "invalid" && (
            <Text style={styles.statusInvalid}>✗ {errorMessage}</Text>
          )}
          {status === "none" && (
            <Text style={styles.statusNone}>Using device voices</Text>
          )}

          <TouchableOpacity onPress={openDocs} style={styles.linkButton}>
            <Text style={styles.linkText}>How to get an API key →</Text>
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            {status === "valid" && (
              <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleSave}
              style={styles.saveButton}
              disabled={isValidating}
            >
              {isValidating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Gemini AI (Summarization)</Text>
          <Text style={styles.description}>
            Add your Gemini API key to enable article summarization.
          </Text>

          <TextInput
            style={styles.input}
            value={geminiKey}
            onChangeText={(text) => setGeminiKey(text.replace(/[\n\r\s]/g, ""))}
            placeholder="Paste your Gemini API key here..."
            secureTextEntry={true}
            autoCapitalize="none"
            autoCorrect={false}
            multiline={false}
          />

          {geminiStatus === "saved" && (
            <Text style={styles.statusValid}>✓ Saved</Text>
          )}
          {geminiStatus === "none" && (
            <Text style={styles.statusNone}>Summarization disabled</Text>
          )}

          <TouchableOpacity onPress={openGeminiDocs} style={styles.linkButton}>
            <Text style={styles.linkText}>Get a Gemini API key →</Text>
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            {geminiStatus === "saved" && (
              <TouchableOpacity onPress={handleGeminiClear} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleGeminiSave}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-start",
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 20,
    color: "#666",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  statusValid: {
    color: "#4caf50",
    fontSize: 14,
    marginBottom: 12,
  },
  statusInvalid: {
    color: "#c62828",
    fontSize: 14,
    marginBottom: 12,
  },
  statusNone: {
    color: "#999",
    fontSize: 14,
    marginBottom: 12,
  },
  linkButton: {
    marginBottom: 20,
  },
  linkText: {
    color: "#2196f3",
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  clearButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  clearButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#2196f3",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
