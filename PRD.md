# PRD: Speech My URL

## Problem Statement

Reading long articles on mobile devices is time-consuming and not always practical. Users want to consume article content while doing other activities (commuting, exercising, cooking) but copying text into separate TTS apps is cumbersome.

## Solution

A React Native app that converts any article URL into spoken audio with one tap. Paste a URL, tap play, and listen.

## Target Users

- Commuters who want to "read" articles during travel
- Multitaskers who prefer audio content
- Users with visual fatigue or accessibility needs

## Tech Stack

- **Framework:** Expo (React Native) with TypeScript
- **Platforms:** iOS and Android
- **Content Extraction:** Gemini API (parse URL, extract clean article text)
- **Text-to-Speech:** `expo-speech` (native device TTS)

## Core Features (MVP)

### 1. URL Input
- Single text input field for pasting article URLs
- URL validation before processing
- Clear/paste button for convenience

### 2. Article Extraction
- Send URL to Gemini API
- Extract article title, author (if available), and body text
- Strip ads, navigation, and irrelevant content
- Display extracted title before playback

### 3. Text-to-Speech Playback
- Play/Pause toggle button
- Speed control (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x)
- Skip forward/back (±15 seconds or by paragraph)
- Progress indicator showing current position

### 4. Basic UI
- Clean, minimal interface
- Loading state while extracting content
- Error handling for invalid URLs or failed extraction

## User Flow

```
1. Open app
2. Paste URL into input field
3. Tap "Extract" or auto-extract on paste
4. See article title + "Ready to play"
5. Tap Play → Audio starts
6. Use controls to pause, adjust speed, or skip
7. Audio completes → Return to ready state
```

## Technical Considerations

### Gemini API Integration
- Use Gemini to fetch and parse webpage content
- Prompt engineering to extract only article text
- Handle rate limits and API errors gracefully

### TTS Implementation
- Use `expo-speech` for native TTS
- Queue text in chunks for better control
- Handle interruptions (phone calls, other audio)

### State Management
- Track: URL, extracted text, playback state, position, speed
- Consider Zustand or React Context for simplicity

## Out of Scope (v1)

- User accounts / authentication
- Article history or favorites
- Cloud TTS voices
- Offline article caching
- Background audio playback (evaluate for v1.1)
- Multiple languages (start with English)

## Success Metrics

- Successfully extracts content from 90%+ of common article sites
- TTS playback works reliably on both platforms
- App feels responsive (extraction < 5 seconds for typical articles)

## Open Questions

1. Should background audio be in MVP? (users may expect it)
2. How to handle paywalled articles? (likely just show error)
3. Rate limiting strategy for Gemini API?

## API Key Management

- Gemini API key stored securely (not hardcoded)
- Use environment variables or secure storage
- Consider rate limiting on client side
