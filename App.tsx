import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useArticlePlayer } from "./src/hooks/useArticlePlayer";
import { UrlInput } from "./src/components/UrlInput";
import { PlaybackControls } from "./src/components/PlaybackControls";
import { LanguageSelector } from "./src/components/LanguageSelector";
import { VoiceSelector } from "./src/components/VoiceSelector";

export default function App() {
  const {
    url,
    article,
    isLoading,
    isPlaying,
    isPaused,
    speed,
    currentChunkIndex,
    totalChunks,
    error,
    language,
    voices,
    selectedVoiceId,
    voicesLoading,
    setUrl,
    extract,
    play,
    pause,
    resume,
    stop,
    setSpeed,
    skipForward,
    skipBack,
    setLanguage,
    setSelectedVoiceId,
  } = useArticlePlayer();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Text style={styles.title}>Speech My URL</Text>
          <Text style={styles.subtitle}>
            Paste an article URL and listen to it
          </Text>

          {/* URL Input */}
          <View style={styles.inputSection}>
            <UrlInput
              value={url}
              onChangeText={setUrl}
              onExtract={extract}
              isLoading={isLoading}
              disabled={isPlaying}
            />
          </View>

          {/* Error display */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Article info */}
          {article && (
            <View style={styles.articleInfo}>
              <Text style={styles.articleTitle}>{article.title}</Text>
              {article.author && (
                <Text style={styles.articleAuthor}>by {article.author}</Text>
              )}

              {/* Language selector */}
              <View style={styles.languageSection}>
                <Text style={styles.detectedText}>
                  Detected: {language === "en" ? "English" : "Swedish"}
                </Text>
                <LanguageSelector
                  value={language}
                  onChange={setLanguage}
                  disabled={isPlaying}
                />
              </View>

              <Text style={styles.readyText}>
                Ready to play ({totalChunks} chunks)
              </Text>
              <Text style={styles.volumeHint}>
                Make sure your device is not on silent mode
              </Text>
            </View>
          )}

          {/* Voice selector */}
          {article && (
            <View style={styles.voiceSection}>
              <VoiceSelector
                voices={voices}
                selectedVoiceId={selectedVoiceId}
                onVoiceChange={setSelectedVoiceId}
                disabled={isPlaying}
                loading={voicesLoading}
              />
            </View>
          )}

          {/* Playback controls */}
          <View style={styles.controlsSection}>
            <PlaybackControls
              isPlaying={isPlaying}
              isPaused={isPaused}
              speed={speed}
              currentChunk={currentChunkIndex}
              totalChunks={totalChunks}
              onPlay={play}
              onPause={pause}
              onResume={resume}
              onStop={stop}
              onSpeedChange={setSpeed}
              onSkipBack={skipBack}
              onSkipForward={skipForward}
              disabled={!article}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
  },
  inputSection: {
    marginBottom: 20,
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: "#c62828",
    textAlign: "center",
  },
  articleInfo: {
    backgroundColor: "#f5f5f5",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  articleAuthor: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  languageSection: {
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  detectedText: {
    fontSize: 12,
    color: "#999",
  },
  readyText: {
    fontSize: 14,
    color: "#4caf50",
    fontWeight: "500",
  },
  volumeHint: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
  },
  voiceSection: {
    marginBottom: 24,
    alignItems: "center",
  },
  controlsSection: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 40,
  },
});
