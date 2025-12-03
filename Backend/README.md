# InterviewX - Backend

InterviewX Backend is a **Python-based AI engine** that powers completely offline mock interviews. It combines three state-of-the-art AI models (LLM, STT, TTS) into a unified FastAPI server with real-time WebSocket audio streaming.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [System Requirements](#system-requirements)
- [Required Model Files](#required-model-files)
- [Installation](#installation)
- [Model Setup Guide](#model-setup-guide)
- [Frontend Setup (Required)](#-frontend-setup-required)
- [Configuration](#configuration)
- [Running the Backend](#running-the-backend)
- [API Endpoints](#api-endpoints)
- [How It Works](#how-it-works)
- [Platform-Specific Notes](#platform-specific-notes)

## 🎯 Overview

The InterviewX Backend is the brain of the offline AI interviewer system. It provides:

- **Real-time AI Conversation** - Natural interview dialogue using a 4B parameter language model
- **Speech Recognition** - Advanced STT with voice activity detection and audio classification
- **Natural Speech Synthesis** - High-quality TTS for AI interviewer responses
- **Performance Analysis** - LLM-powered evaluation and feedback generation
- **WebSocket Streaming** - Low-latency bidirectional audio communication
- **100% Offline** - All processing happens locally, no internet required after setup

## 🏗 Architecture

### Core Components

1. **LLM Engine (`llm_engine.py`)**
   - **Model**: Qwen3-4B (4 billion parameter quantized model)
   - **Framework**: llama-cpp-python for efficient CPU inference
   - **Purpose**: Generates interview questions, responses, evaluations, and ratings
   - **Format**: GGUF Q4_K_M (4-bit quantization for ~2.5 GB size)
   - **Context**: 6144 tokens

2. **STT Engine (`stt_engine.py`)**
   - **Model**: OpenAI Whisper `small` (~500 MB)
   - **VAD**: WebRTC Voice Activity Detection
   - **Classifier**: MediaPipe Audio Classifier with YAMNet
   - **Purpose**: Converts user speech to text with human voice filtering
   - **Accuracy**: High-quality transcription with noise filtering

3. **TTS Engine (`tts_engine.py`)**
   - **Primary (macOS)**: Kokoro ONNX v1.0 neural TTS
   - **Fallback**: Platform-native TTS (SAPI on Windows, `say` on macOS, espeak on Linux)
   - **Purpose**: Converts AI text responses to natural speech
   - **Features**: Multi-voice support, adjustable speech rate

4. **Backend Server (`backend_engine.py`)**
   - **Framework**: FastAPI with CORS middleware
   - **WebSockets**: 2 bidirectional audio streaming endpoints
   - **Endpoints**: 5 HTTP endpoints for session management
   - **Communication**: Queue-based inter-process/thread messaging
   - **Frontend Integration**: Serves static files and auto-opens browser

### Data Flow

```
User Speech → [WebSocket] → STT Engine → Text → LLM Engine → Response Text → TTS Engine → Audio → [WebSocket] → User Hears
```

## ✅ System Requirements

### Operating System
- **Windows** 10/11 (64-bit)
- **macOS** 10.15+ (Intel or Apple Silicon)
- **Linux** (Ubuntu 20.04+, Debian 11+, or equivalent)

### Hardware
- **CPU**: Multi-core processor (4+ cores recommended)
- **RAM**: Minimum 8 GB, **16 GB recommended** for smooth LLM inference
- **Storage**: ~6-7 GB free space for all models
- **GPU**: Optional (CPU-only operation fully supported)
- **Microphone**: Required for voice input
- **Speakers/Headphones**: Required for audio output

### Software
- **Python**: 3.9, 3.10, or 3.11 (3.12+ may have compatibility issues)
- **pip**: Latest version recommended
- **Visual C++ Redistributable** (Windows only) - for pyaudio and some dependencies

## 📦 Required Model Files

> [!IMPORTANT]
> **All models must be downloaded and placed in the `Backend/` directory before running the application.**

### 1. LLM Model (Required)

**File**: `Qwen3-4B-Q4_K_M.gguf`  
**Size**: ~2.5 GB  
**Location**: `Backend/Qwen3-4B-Q4_K_M.gguf`

**Download Instructions:**
- Search for "Qwen 3 4B GGUF" on Hugging Face
- Look for the Q4_K_M quantized version
- Download the `.gguf` file
- Place it directly in the `Backend/` directory

### 2. STT Models

#### Whisper Model (Auto-downloaded)
**Model**: `ggml-small.bin`  
**Size**: ~466 MB  
**Location**: `Backend/wisper/` (auto-created on first run)

**Setup**: The Whisper model will be **automatically downloaded** the first time you run the application. No manual setup required.

#### YAMNet Audio Classifier (Included)
**File**: `yamnet.tflite`  
**Size**: 4.1 MB  
**Location**: `Backend/yamnet.tflite`

**Setup**: This file is already included in the repository. Verify it exists in the `Backend/` directory.

### 3. TTS Models (macOS Primary)

> [!NOTE]
> **macOS users**: Kokoro TTS provides the best quality. Windows/Linux will use platform-native TTS as fallback.

**Files**:
- `kokoro-v1.0.onnx` (~50-100 MB)
- `voices-v1.0.bin` (~10-20 MB)

**Location**: `Backend/kokoro-v1.0.onnx` and `Backend/voices-v1.0.bin`

**Download Instructions:**
- Search for "Kokoro TTS ONNX" or visit the Kokoro TTS repository
- Download both the model (`.onnx`) and voices (`.bin`) files
- Place both files in the `Backend/` directory

**Windows/Linux**: If Kokoro models are not present, the system will automatically use SAPI (Windows) or espeak (Linux) for TTS.

### Storage Summary

| Component | Size | Status |
|-----------|------|--------|
| Qwen3-4B LLM | ~2.5 GB | Manual download required |
| Whisper STT | ~466 MB | Auto-downloads on first run |
| YAMNet | 4.1 MB | Included in repo |
| Kokoro TTS | ~60-120 MB | Optional (macOS recommended) |
| **Total** | **~3-3.2 GB** | - |

## 🚀 Installation

### 1. Prerequisites Check

Verify Python installation:
```bash
python --version
# Should output: Python 3.9.x, 3.10.x, or 3.11.x
```

### 2. Navigate to Backend Directory

```bash
cd Backend
```

### 3. Create Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 4. Install Python Dependencies

**Option 1 - Using pip directly** (if requirements.txt doesn't exist):
```bash
pip install fastapi uvicorn websockets llama-cpp-python pywhispercpp mediapipe webrtcvad pyaudio sounddevice soundfile numpy
```

**macOS users add**:
```bash
pip install kokoro-onnx
```

**Windows users may need**:
```bash
pip install pywin32 comtypes
```

### 5. Download Model Files

Follow the [Model Setup Guide](#model-setup-guide) section below to download and place all required model files.

## 📚 Model Setup Guide

### Step 1: Download LLM Model

1. Visit Hugging Face and search for **"Qwen 3 4B GGUF Q4_K_M"**
2. Download the file named `Qwen3-4B-Q4_K_M.gguf` (approximately 2.5 GB)
3. Move the downloaded file to the `Backend/` directory
4. Verify the file path: `Backend/Qwen3-4B-Q4_K_M.gguf`

**Verification:**
```bash
# Windows
dir Qwen3-4B-Q4_K_M.gguf

# macOS/Linux
ls -lh Qwen3-4B-Q4_K_M.gguf
```

Expected output should show a file size of approximately 2.4-2.6 GB.

### Step 2: Verify YAMNet Model

Check that `yamnet.tflite` exists in the Backend directory:

```bash
# Windows
dir yamnet.tflite

# macOS/Linux
ls -lh yamnet.tflite
```

Expected size: ~4.1 MB (4,126,810 bytes)

### Step 3: Configure Whisper (Auto-download)

The Whisper model will download automatically on first run. To pre-download:

```bash
# The model will be downloaded to Backend/wisper/ directory
# First run may take 2-5 minutes to download
```

### Step 4: Download Kokoro TTS Models (Optional but Recommended for macOS)

1. Search for **"Kokoro TTS ONNX v1.0"** on GitHub or model repositories
2. Download `kokoro-v1.0.onnx` and `voices-v1.0.bin`
3. Place both files in the `Backend/` directory

**If skipped**: System will use platform default TTS (quality may be lower)

### Verification Checklist

Before running, ensure these files exist in `Backend/`:

- [x] `Qwen3-4B-Q4_K_M.gguf` (~2.5 GB)
- [x] `yamnet.tflite` (4.1 MB)
- [x] `kokoro-v1.0.onnx` (optional, ~50-100 MB)
- [x] `voices-v1.0.bin` (optional, ~10-20 MB)

## 🎨 Frontend Setup (Required)

> [!IMPORTANT]
> **The backend serves the frontend UI from the `static/` directory. You must build the Frontend and copy the files before running the backend.**

### Step 1: Build the Frontend

Navigate to the Frontend directory and build the application:

**Windows:**
```bash
cd ..\Frontend
npm install
npm run build
```

**macOS/Linux:**
```bash
cd ../Frontend
npm install
npm run build
```

This creates an optimized production build in `Frontend/dist/`.

### Step 2: Copy Build to Backend

Copy the entire `dist/` folder contents to `Backend/static/`:

**Windows:**
```bash
# From Backend directory
xcopy /E /I /Y ..\Frontend\dist static
```

**macOS/Linux:**
```bash
# From Backend directory
cp -r ../Frontend/dist/* static/
```

### Step 3: Verify Static Files

Ensure the `Backend/static/` directory contains:
- `index.html`
- `assets/` folder with JavaScript and CSS files

**Verification:**
```bash
# Windows
dir static\index.html
dir static\assets

# macOS/Linux
ls static/index.html
ls static/assets/
```

> [!NOTE]
> **Future Frontend Updates**: If you modify the Frontend code, you must rebuild and re-copy the `dist/` files to `Backend/static/` for changes to take effect.

## ⚙️ Configuration

### LLM Configuration (`llm_engine.py`)

```python
class LLMConfig:
    model_path: str = "Qwen3-4B-Q4_K_M.gguf"
    n_ctx: int = 6144  # Context window size
    n_gpu_layers: int = -1  # -1 = all GPU, 0 = CPU only
    verbose: bool = False
```

**Adjustments:**
- **GPU Usage**: Set `n_gpu_layers = 0` to force CPU-only inference
- **Context Size**: Reduce `n_ctx` if experiencing memory issues
- **System Prompt**: Customize interview behavior in `system_prompt` variable

### STT Configuration (`stt_engine.py`)

```python
class STTConfig:
    RATE: int = 16_000  # Audio sample rate
    WHISPER_MODEL: str = "small"  # Options: tiny, base, small, medium, large
    SILENCE_TIMEOUT_MS: int = 2_000  # Stop recording after 2s silence
    CLASSIFIER_THRESHOLD: float = 0.5  # Voice detection sensitivity
```

**Adjustments:**
- **Whisper Model**: Change to `"tiny"` for faster (less accurate) or `"medium"` for slower (more accurate)
- **Silence Timeout**: Adjust timeout for different speaking patterns

### TTS Configuration (`tts_engine.py`)

```python
class TTSConfig:
    KOKORO_MODEL_PATH: str = "kokoro-v1.0.onnx"
    KOKORO_VOICES_PATH: str = "voices-v1.0.bin"
    SAVE_WAV: bool = False  # Save TTS audio files
```

## ▶️ Running the Backend

> [!WARNING]  
> **Prerequisite**: Ensure you have completed the [Frontend Setup](#-frontend-setup-required) before running the backend. The server will fail to serve the UI if `Backend/static/` is empty.

### Start the Server

```bash
python main.py
```

**Expected Output:**
```
INFO: Starting backend engine...
INFO: LLM Engine initialized
INFO: STT Engine initialized
INFO: TTS Engine initialized
INFO: Uvicorn running on http://0.0.0.0:8000
INFO: Application startup complete
```

### Auto-launch Behavior

The backend will:
1. Start on `http://localhost:8000`
2. Automatically open your browser to the frontend
3. Speak an initial greeting: "Hello! Welcome. To begin the interview, please say 'start'."

### Stopping the Server

Press `Ctrl+C` in the terminal to gracefully shutdown all engines.

## 🔌 API Endpoints

### HTTP Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Serves the frontend HTML (from `static/`) |
| `POST` | `/start-call` | Initialize interview session |
| `POST` | `/end-call` | End interview and trigger AI analysis |
| `POST` | `/end-session` | Cleanup session data and reset engines |
| `POST` | `/report` | Request interview performance analysis (returns job ID) |
| `GET` | `/job-status/{job_id}` | Poll for analysis completion and rating |
| `POST` | `/audio-buffer-empty` | Notification that frontend audio buffer is clear |

### WebSocket Endpoints

| Endpoint | Direction | Purpose |
|----------|-----------|---------|
| `ws://localhost:8000/ws/audio_in` | Frontend → Backend | Streams user microphone audio (PCM int16, 16kHz, 30ms frames) to STT engine |
| `ws://localhost:8000/ws/audio_file` | Backend → Frontend | Streams AI interviewer audio (WAV files) from TTS engine to frontend |

### Example API Usage

**Starting an Interview:**
```javascript
POST http://localhost:8000/start-call
Response: { "message": "Call started status received" }
```

**Ending and Getting Rating:**
```javascript
// 1. End the call
POST http://localhost:8000/end-call
Body: { "status": 1 }

// 2. Request analysis
POST http://localhost:8000/report
Response: { "job_id": "uuid", "status_url": "/job-status/uuid" }

// 3. Poll for results
GET http://localhost:8000/job-status/{job_id}
Response: { "number": 2 }  // 1=poor, 2=average, 3=good
```

## 🔧 How It Works

### Interview Pipeline

1. **User Speaks** → Microphone captures audio
2. **WebSocket Streaming** → Audio sent to backend via `/ws/audio_in`
3. **STT Processing**:
   - WebRTC VAD detects voice activity
   - MediaPipe classifier filters human speech
   - Whisper transcribes to text
4. **LLM Generation**:
   - Transcript sent to Qwen3 model
   - Model generates contextual interview response
   - Response buffered into sentences
5. **TTS Synthesis**:
   - Text converted to audio via Kokoro/platform TTS
   - WAV files generated
6. **Audio Playback** → Audio streamed to frontend via `/ws/audio_file`

### Queue-Based Communication

```
┌─────────┐    text     ┌─────────┐   response   ┌─────────┐
│   STT   │ ──────────> │   LLM   │ ───────────> │   TTS   │
└─────────┘             └─────────┘              └─────────┘
     ↑                                                 ↓
     │                                                 │
  audio_in                                        audio_file
  (WebSocket)                                     (WebSocket)
```

### Post-Interview Analysis

When user clicks "End Call":
1. `call_end_event` triggered
2. LLM generates spoken feedback from conversation history
3. LLM generates rating (1-3 scale) as JSON
4. Rating stored in `rank_queue`
5. Frontend polls `/report` → `/job-status/{id}` for rating

## 🖥 Platform-Specific Notes

### Windows

**TTS**: Uses SAPI (Microsoft Speech API) via COM
- **Fallback**: PowerShell System.Speech if COM fails
- **Requirement**: Visual C++ Redistributable for pyaudio

**Audio**: PyAudio requires compiled binaries (pip should handle this)

### macOS

**TTS**: Kokoro ONNX (primary), `say` command (fallback)
- **Best Experience**: Download Kokoro models for natural speech
- **Voice**: Uses "af_heart" voice for Kokoro, or system default

**Audio**: Native CoreAudio support via sounddevice

### Linux

**TTS**: espeak (system default)
- **Installation**: `sudo apt-get install espeak` (if not present)
- **Quality**: Lower than Kokoro but functional

**Audio**: ALSA/PulseAudio via sounddevice and pyaudio
