# 🚀 Instant Shorts AI

> **No-Cost, Client-Side Faceless Video Generator for YouTube Shorts, Instagram Reels & TikTok**

- ⚡ **Live Production Site**: [https://instantshortsai.vercel.app](https://instantshortsai.vercel.app)
- 🌐 **Cloudflare Mirror**: [https://instantshortsai.instantshortsai.workers.dev](https://instantshortsai.instantshortsai.workers.dev)
- 🐙 **GitHub Repository**: [https://github.com/Aditya-singh095/instantshortsai](https://github.com/Aditya-singh095/instantshortsai)

![Instant Shorts AI Studio](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80)

---

## ✨ Features

- **🎵 Custom Audio Upload & Trimmer**:
  - Upload any `.mp3`, `.wav`, or `.m4a` audio file as background music.
  - Interactive audio trimming panel (Trim Start, Duration, Volume, Speed/Pitch control, and Solo Audio Preview).
  - Voiceover-only mode for clean narration without background music.

- **🖼️ Multi-Clip Images & Videos Sequence Timeline**:
  - Upload multiple images and video clips into a single continuous sequence.
  - Individual clip duration editor, filter shaders (*Ken Burns Zoom*, *Noir Grayscale*, *Vintage Warmth*, *Vibrant Neon*, *Soft Blur*), clip reordering (`▲`/`▼`), and deletion (`🗑️`).
  - One-click preset footage packs (**Minecraft Parkour**, **ASMR**, **GTA Ramp Jump**, **Space**, **Cyberpunk**, **Luxury**).

- **🧠 Google Gemini & Web-LLM Script Generation Engine**:
  - Direct integration with Google Gemini AI (`gemini-3.5-flash-lite`).
  - In-browser quantized Web-LLM engine fallback (via WebGPU) for 100% offline generation.
  - BYOK (Bring Your Own Key) modal supporting Google Gemini, Groq (Llama-3.3-70B), and OpenAI (GPT-4o-mini).

- **🎨 High-Retention Subtitle Animation Engine**:
  - Real-time word-by-word active caption highlighting with CapCut-style effects.
  - Presets: *MrBeast Yellow*, *Hormozi Glow*, *Neon Cyber*, and *Geist Minimal*.
  - Camera shake, transition flashes, and RGB split glow on export.

- **📹 Real 1080p Canvas Exporter**:
  - Composites 1080×1920 30FPS vertical `.webm` video clips directly in the browser using HTML5 Canvas and MediaRecorder API.

---

## 🛠️ Technology Stack

- **Framework**: [Astro](https://astro.build/) (Static Site Generation)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **LLM Engine**: Google Gemini API & [@mlc-ai/web-llm](https://webllm.mlc.ai/) (In-Browser WebGPU)
- **Voiceover Synthesis**: Web Speech API
- **Canvas Video Exporter**: Native Canvas 2D Rendering & MediaRecorder API
- **Deployment**: Vercel (primary) + Cloudflare Workers (mirror)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Aditya-singh095/instantshortsai.git
   cd instantshortsai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Set up Environment Variables:
   Create a `.env` file in the project root:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Run local development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:4321` in your browser.

---

## 📦 Building & Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel (Recommended)

Push to GitHub and Vercel will auto-deploy via the connected Git integration.

### Deploy to Cloudflare Workers (Mirror)

```bash
CLOUDFLARE_API_TOKEN=your_token npx wrangler pages deploy dist --project-name=instantshortsai
```

---

## 🛡️ License

MIT License © 2026 Instant Shorts AI
