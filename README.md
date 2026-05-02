# TMT Trilingual Translator — Firefox Extension

A Firefox browser extension built for the **Google TMT Hackathon 2026**, organized by the Information and Language Processing Research Lab at Kathmandu University. The extension bridges the language gap between **English, Nepali, and Tamang** by bringing real-time translation directly into the browser — no copy-pasting, no switching tabs.

Built by team **Rendezvous**.

---

## Supported Language Directions

English ↔ Nepali · English ↔ Tamang · Nepali ↔ Tamang

---

## Architecture Overview

Firefox Extension  
↓  
Express Proxy Server (localhost:3000)  
↓  
TMT Translation API (tmt.ilprl.ku.edu.np)

The extension never talks to the TMT API directly. All requests go through a local Express proxy server which keeps the API token secure and handles retries and error management.

---

## Feature 1 — Highlight & Translate

Translate any text on any webpage instantly by simply selecting it.

- User highlights any text on any webpage
- A tooltip appears near the cursor showing the translation
- No clicking, no menus — just highlight and read
- Automatically retries up to 5 times if the API is slow or temporarily unavailable
- Tooltip dismisses when user clicks anywhere on the page

---

## Feature 2 — Text Box Translation

Translate text directly inside any input field on any website — comment boxes, search bars, forms, chat inputs, and more.

- User clicks into any text box on any website
- A small **TMT** button appears in the bottom right corner of the input
- User types their text, clicks **TMT** — text is instantly replaced with the translation
- Button changes to **↩** after translation — clicking it restores the original text
- If the user edits the translated text, button automatically resets back to **TMT**
- Supports standard textareas, input fields, and contenteditable divs (Gemini, ChatGPT, Gmail, etc.)

---

## Feature 3 — YouTube Transcript Translation

Translate the full transcript of any YouTube video into your language, synced to the video timeline.

- User opens any YouTube video with English captions
- A translate button appears in the extension — user selects their target language and clicks Translate
- The entire transcript is fetched, broken into natural sentences, and translated
- Translated subtitles appear as an overlay on the video, time-synced with the original audio
- Words are distributed proportionally across subtitle chunks based on duration — so captions stay in sync even when translated text is longer or shorter than the original

# System Design
┌─────────────────────────────────────────────────────────────┐
│                     Browser Extension                       │
│  - Detects active YouTube video                             │
│  - Sends videoId + target language to backend               │
│  - Renders translated captions as overlay subtitles         │
└───────────────────────┬─────────────────────────────────────┘
                        │ GET /translate?videoId=...&targetedLang=ne
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      Express Backend                        │
│                                                             │
│  1. extractCaption(videoId)                                 │
│     └─ YoutubeTranscript → raw timestamped chunks           │
│                                                             │
│  2. createTranscriptChunks(transcripts)                     │
│     └─ Groups chunks into natural sentences                 │
│        Handles [bracketed] and (parenthetical) cues         │
│                                                             │
│  3. translateSentences(sentenceGroups, targetLang)          │
│     └─ Calls Translation API per sentence                   │
│        Retries on 429 with exponential backoff              │
│                                                             │
│  4. distributeTranscripts(translatedGroups)                 │
│     └─ Maps translated words back to original timestamps    │
│        Proportional to each chunk's duration                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
             ┌─────────────────────┐
             │  Translation API    │
             │      (TMT )         │
             └─────────────────────┘
## Project Structure

tmt-extension/  
├── manifest.json # Extension config (Firefox MV2)  
├── background.js # Handles API calls and retries  
├── content.js # Injected into webpages — all UI logic  
├── popup/  
├── icons/  
└── backend/ # Express proxy server  
└── package.json

---

## Built With

- Firefox WebExtensions API (Manifest V2)
- Node.js + Express
- TMT Translation API — Google TMT, KU ILPRL

---

## Hackathon

**Google TMT Hackathon 2026**
Information and Language Processing Research Lab
Department of Computer Science and Engineering
Kathmandu University, Dhulikhel, Nepal

Track: Browser Plugin / Extension
Team: Rendezvous
