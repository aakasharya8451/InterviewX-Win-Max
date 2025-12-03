# InterviewX

**Offline AI-Powered Mock Interview Agent**

InterviewX is a completely offline mock interview platform that simulates realistic interview conversations using state-of-the-art AI models. Practice your interview skills privately without any data leaving your computer.

## ✨ Key Features

- 🔒 **100% Offline** - All processing happens locally, no internet required after setup
- 🤖 **AI-Powered Conversation** - Natural interview dialogue using Qwen3-4B (4 billion parameter model)
- 🎤 **Real-Time Speech Recognition** - Advanced STT with Whisper and voice activity detection
- 🔊 **Natural Voice Synthesis** - High-quality text-to-speech using Kokoro TTS
- 📊 **Performance Feedback** - AI-generated evaluation and rating after each session
- 💼 **Professional Interface** - Clean, modern web UI with video conferencing experience
- 🖥️ **Cross-Platform** - Runs on Windows, macOS, and Linux

## 📁 Project Structure

```
InterviewX-Win-Max/
├── Frontend/          # React + TypeScript web interface
│   ├── src/          # React components, hooks, and types
│   └── README.md     # Frontend setup and development guide
├── Backend/          # Python AI engine and API server
│   ├── llm_engine.py    # Qwen3-4B conversation model
│   ├── stt_engine.py    # Whisper speech-to-text
│   ├── tts_engine.py    # Kokoro text-to-speech
│   ├── backend_engine.py # FastAPI server
│   └── README.md     # Backend setup and model guide
└── README.md         # This file
```

## 🛠 Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Communication**: WebSocket for real-time audio streaming

### Backend
- **Language**: Python 3.9+
- **Web Framework**: FastAPI with WebSocket support
- **AI Models**:
  - **LLM**: Qwen3-4B (GGUF Q4_K_M, ~2.5 GB)
  - **STT**: OpenAI Whisper small (~466 MB)
  - **TTS**: Kokoro ONNX v1.0 (~60-120 MB)

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9, 3.10, or 3.11
- **RAM**: 16 GB recommended for smooth LLM inference
- **Storage**: ~7 GB free space for AI models
- **Hardware**: Microphone and speakers/headphones

### Setup Steps

1. **Download AI Models**
   
   The backend requires several AI model files (~3-3.2 GB total). See detailed instructions in the [Backend README](Backend/README.md#required-model-files).

2. **Setup Backend**
   
   ```bash
   cd Backend
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   
   pip install fastapi uvicorn websockets llama-cpp-python pywhispercpp mediapipe webrtcvad pyaudio sounddevice soundfile numpy
   ```
   
   For detailed backend setup including model configuration, see [Backend README](Backend/README.md).

3. **Setup Frontend**
   
   ```bash
   cd Frontend
   npm install
   npm run build
   ```
   
   Then copy the build to Backend static folder:
   
   ```bash
   # Windows (from Backend directory)
   xcopy /E /I /Y ..\Frontend\dist static
   
   # macOS/Linux (from Backend directory)
   cp -r ../Frontend/dist/* static/
   ```
   
   For detailed frontend setup, see [Frontend README](Frontend/README.md).

4. **Run the Application**
   
   ```bash
   cd Backend
   python main.py
   ```
   
   The backend server starts on `http://localhost:8000` and automatically opens your browser to the interview interface.

## 📖 Documentation

- **[Frontend Documentation](Frontend/README.md)** - React UI setup, development, and architecture
- **[Backend Documentation](Backend/README.md)** - AI engines, model setup, and API reference

## ⚙️ System Requirements

- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **Memory**: Minimum 8 GB RAM, **16 GB recommended**
- **Storage**: ~7 GB for all AI models
- **GPU**: Optional (CPU-only operation fully supported)

## 🔧 How It Works

```
┌─────────────┐
│ User Speaks │
└──────┬──────┘
       │ Audio
       ▼
┌─────────────────┐
│ STT Engine      │ Whisper + VAD
│ (Speech-to-Text)│
└──────┬──────────┘
       │ Text
       ▼
┌─────────────────┐
│ LLM Engine      │ Qwen3-4B generates
│ (Interview AI)  │ interview questions
└──────┬──────────┘
       │ Response Text
       ▼
┌─────────────────┐
│ TTS Engine      │ Kokoro converts
│ (Text-to-Speech)│ text to speech
└──────┬──────────┘
       │ Audio
       ▼
┌─────────────┐
│ User Hears  │
└─────────────┘
```

**End of Interview**: The LLM analyzes the entire conversation and provides spoken feedback plus a performance rating (1-3 scale).

## 🎯 Usage

1. **Start Interview** - Click "Start Meeting" button
2. **Grant Permissions** - Allow microphone and camera access
3. **Begin Interview** - Say "start" or introduce yourself
4. **Answer Questions** - Respond naturally to AI interviewer's questions
5. **End Interview** - Click "End Call" when finished
6. **Get Feedback** - Receive AI-generated performance rating and feedback

## 📝 License

This project uses various AI models and frameworks, each with their own licenses:
- **Qwen3**: Alibaba Cloud (Apache 2.0)
- **Whisper**: OpenAI (MIT)
- **Kokoro TTS**: Community contributors
- **FastAPI**: Sebastián Ramírez (MIT)

---

**Made with ❤️ for offline AI-powered interview practice**
