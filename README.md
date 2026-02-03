# Speech My URL

Convert article URLs into spoken audio. Paste a URL, extract the content, and listen to it read aloud.

**Live app:** https://dist-phi-orpin-18.vercel.app

## Features

- URL input and article extraction (via Google Gemini API)
- Text-to-speech playback with controls
- Playback speed control (0.5x - 2x)
- Skip forward/back
- Language selection (English/Swedish)
- Voice selection
- Offline article storage

## Development

```bash
npm install
npx expo start
```

## Deployment

```bash
npx expo export --platform web
cd dist && npx vercel --yes
cd dist && npx vercel --prod --yes
```
