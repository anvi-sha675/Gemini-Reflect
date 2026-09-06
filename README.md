# Gemini Reflect
### Secure AI-Powered Personal Journal

Gemini Reflect is a secure AI-powered journal built for the **“Build a Secure Personal Gemini Journal”** Ideathon. It combines private journaling with real multi-turn Gemini conversations, personalized insights, and AI-powered growth tracking.

## Core Technologies

```text
React · Vite · Tailwind CSS · Framer Motion
Node.js · Express · Firebase Auth · Firestore
Gemini API (@google/genai) · Secret Manager · Cloud Run
````

## Security

```text
Firebase Auth
     ↓
Verified ID Token
     ↓
Trusted UID from backend
     ↓
UID-scoped Firestore
     ↓
Secret Manager → Gemini API
```

* Backend never trusts client-supplied UIDs.
* Firestore data is isolated per user.
* Gemini API keys never reach the browser.
* Messages are persisted only after successful Gemini responses.
* Delete-all verifies complete data removal.

See [`docs/SECURITY.md`](docs/SECURITY.md).

## AI Features

* **Multi-turn Gemini Conversations** — real conversational context with retry-safe persistence.
* **AI Personal Insights** — recurring themes, challenges, growth signals, and suggested focus.
* **AI Growth Timeline** — journal entries analyzed for reflection stage, growth signals, and focus.
* **Automatic Session Summaries** — themes, mood, takeaways, and action items.

## Features

* Email/password & Google authentication
* Protected routes and onboarding
* Multi-turn AI journaling
* Searchable journal history
* AI insights and growth timeline
* Data export
* Delete individual or all journal data
* Responsive animated UI

## Architecture

```text
React/Vite
    ↓
Firebase Authentication
    ↓
Cloud Run / Express
    ├── Firestore
    ├── Secret Manager
    └── Gemini API
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Firestore Structure

```text
users/{uid}
 ├── journals/{journalId}
 │    └── messages/{messageId}
 ├── insights/{insightId}
 ├── timelines/{timelineId}
 └── settings/{settingId}
```

## Local Development

### Backend

```bash
cd backend
npm install
cp ../.env.example .env
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp ../.env.example .env
npm run dev
```

Keep Gemini credentials **server-side only**. For local development, use `GEMINI_API_KEY_LOCAL_DEV_ONLY` in `backend/.env`.

## Testing

### Backend

```bash
cd backend
npm test
```

The test suite covers authentication, authorization boundaries, Firestore isolation, message persistence, Gemini failure handling, deletion verification, and validation.

### Frontend

```bash
cd frontend
npm run build
```

## Gemini SDK

Gemini Reflect uses Google's current `@google/genai` SDK for Gemini API integration.

## Deployment

Designed for deployment on **Google Cloud Run**, with:

* Firebase Authentication
* Cloud Firestore
* Google Cloud Secret Manager
* Gemini API
* Docker

The Gemini API key is retrieved server-side from Secret Manager and is never exposed to the frontend.

## Project Structure

```text
Gemini-Reflect/
├── backend/
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── package-lock.json
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SECURITY.md
│   └── AI_STUDIO_CUSTOM_INSTRUCTIONS.md
│
├── .env.example
├── .gitignore
├── .dockerignore
├── Dockerfile
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
└── README.md
```

## Challenge

Built for the Ideathon:

**Build a Secure Personal Gemini Journal**

Built with **Gemini, Firebase, and Google Cloud Run**. 🚀
