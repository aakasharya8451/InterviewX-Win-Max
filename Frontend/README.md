# InterviewX - Frontend

InterviewX is an **offline AI-powered mock interview agent** that provides realistic interview practice completely offline. The frontend is a modern, responsive React application that communicates with a local Python backend for real-time AI-driven interview conversations.

## 📋 Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [How It Works](#how-it-works)

## 🎯 Overview

InterviewX simulates a realistic interview experience with an AI interviewer. The application:
- Runs **completely offline** - no internet connection required after setup
- Provides **real-time audio conversation** with AI interviewer
- Offers **video conferencing interface** with mic/camera controls
- Generates **performance feedback and ratings** after each session

## 🛠 Technology Stack

- **React 19** - Modern UI framework with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **WebSocket** - Real-time bidirectional communication
- **Web Audio API** - Audio processing and streaming

### Key Dependencies

- `react` & `react-dom` (v19.0.0)
- `react-router-dom` (v7.5.0) - Routing
- `axios` (v1.9.0) - HTTP client
- `lucide-react` - Icon library
- `@radix-ui/react-*` - UI components (Avatar, Dialog, Button)

## ✅ Prerequisites

Before setting up the frontend, ensure you have:

1. **Node.js** - Version 18 or higher
2. **npm** - Comes with Node.js
3. **Backend Running** - The Python backend must be running on `localhost:8000`
   - See the Backend README for setup instructions
   - Backend provides WebSocket endpoints for audio streaming
   - Backend includes STT (Speech-to-Text), TTS (Text-to-Speech), and LLM engines

## 🚀 Setup & Installation

1. **Navigate to the Frontend directory:**
   ```bash
   cd Frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Ensure the backend is configured and ready:**
   - The frontend expects the backend to be available at `http://localhost:8000`
   - WebSocket endpoints: `ws://localhost:8000/ws/audio_in` and `ws://localhost:8000/ws/audio_file`

## ▶️ Running the Application

### Development Mode

Start the development server with hot module replacement:

```bash
npm run dev
```

The application will open at `http://localhost:5173` (default Vite port).

### Build for Production

Create an optimized production build:

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

### Linting

Run ESLint to check code quality:

```bash
npm run lint
```

## 📁 Project Structure

```
Frontend/
├── src/
│   ├── components/          # React components
│   │   ├── components/      # Specialized components
│   │   │   ├── connection-status.tsx
│   │   │   ├── feedback-overlay.tsx
│   │   │   └── meeting-controls.tsx
│   │   ├── ui/              # Radix UI wrapper components
│   │   ├── start-screen.tsx
│   │   ├── meeting-screen.tsx
│   │   └── thank-you-screen.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── use-audio-websocket.ts
│   │   ├── use-media-devices.ts
│   │   └── use-report-polling.ts
│   ├── types/               # TypeScript type definitions
│   │   └── meeting.types.ts
│   ├── lib/                 # Utility functions
│   ├── App.tsx              # Root component
│   ├── Home.tsx             # Main application logic
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── index.html               # HTML template
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
└── tailwind.config.js       # Tailwind CSS configuration
```

## ✨ Key Features

### 1. **Real-Time AI Interview Simulation**
- Live audio conversation with AI interviewer
- Natural language processing for realistic responses
- Context-aware questioning based on your responses

### 2. **Professional Video Interface**
- Clean, modern meeting interface
- Self-view with video preview
- AI interviewer avatar with audio indicators

### 3. **Full Media Controls**
- Toggle microphone on/off
- Toggle camera on/off
- Device selection for microphone and speakers
- Settings dialog for audio device management

### 4. **Offline Operation**
- All processing happens locally
- No data sent to external servers
- Complete privacy and security

### 5. **Performance Feedback**
- Post-interview rating system
- Performance analysis (powered by backend LLM)
- Detailed feedback on interview responses

### 6. **Responsive Design**
- Works on desktop and tablet devices
- Mobile-friendly interface
- Graceful degradation for different screen sizes

## 🔧 How It Works

### Application Flow

1. **Start Screen** → User clicks "Start Meeting"
   - Requests camera/microphone permissions
   - Sends POST to `/start-call` endpoint
   - Navigates to meeting screen

2. **Meeting Screen** → Real-time interview session
   - Opens WebSocket connections for bidirectional audio
   - `ws://localhost:8000/ws/audio_in` - Sends user's microphone audio (STT)
   - `ws://localhost:8000/ws/audio_file` - Receives AI interviewer audio (TTS)
   - Audio processing via Web Audio API
   - LLM generates interview questions and responses

3. **End Call** → User clicks "End Call" button
   - Stops microphone and camera
   - Sends POST to `/end-call` endpoint
   - Backend processes interview data
   - Shows feedback overlay

4. **Thank You Screen** → Post-interview feedback
   - Polls `/report` endpoint for performance rating
   - Displays final rating and feedback
   - Option to exit session

### WebSocket Communication

- **Audio Input (`/ws/audio_in`)**: Streams user's microphone audio as PCM data (16-bit, 16kHz) to the backend's STT engine
- **Audio Output (`/ws/audio_file`)**: Receives AI interviewer's audio responses as WAV files from the TTS engine
- **Connection Status**: Visual indicators show connection state (connecting/connected)

### Backend Integration

The frontend relies on the Python backend for:
- **STT Engine**: Converts user speech to text
- **LLM Engine**: Generates interview questions and evaluates responses
- **TTS Engine**: Converts AI responses to natural speech
- **Performance Analysis**: Evaluates interview performance and generates ratings