# 🚀 Instant Shorts AI

> **No-Cost, Client-Side Faceless Video Generator for YouTube Shorts, Instagram Reels & TikTok**

- ⚡ **Live Vercel Production Site**: [https://instantshortsai.vercel.app](https://instantshortsai.vercel.app)
- 🌐 **Cloudflare Backup Mirror**: [https://instantshortsai.instantshortsai.workers.dev](https://instantshortsai.instantshortsai.workers.dev)
- 🐙 **GitHub Repository**: [https://github.com/Aditya-singh095/instantshortsai](https://github.com/Aditya-singh095/instantshortsai)

![Instant Shorts AI Studio](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80)

---

## ✨ Features

- **🔥 Instagram Trending Sounds & Music Trimmer**:
  - Select viral Instagram Reels audio tracks (*Legacy Slowed & Reverb*, *Pixy Slowed*, *Brazil Funk / Phonk*, *Memory Reboot*, *GigaChad Theme*).
  - Custom audio file uploader (`.mp3`, `.wav`, `.m4a`).
  - Interactive audio trimming panel (Trim Start, Duration, Volume, Speed/Pitch control, and Solo Audio Preview).

- **🖼️ Multi-Clip Images & Videos Sequence Timeline**:
  - Upload multiple images and video clips into a single continuous sequence.
  - Individual clip duration editor, filter shaders (*Ken Burns Zoom*, *Noir Grayscale*, *Vintage Warmth*, *Vibrant Neon*, *Soft Blur*), clip reordering (`▲`/`▼`), and deletion (`🗑️`).
  - One-click viral preset footage packs (**Minecraft Parkour**, **ASMR**, **GTA Ramp Jump**, **Space**, **Cyberpunk**, **Luxury**).

- **🧠 Google Gemini & Web-LLM Script Generation Engine**:
  - Direct integration with Google Gemini AI (`gemini-3.5-flash-lite`).
  - In-browser quantized Web-LLM engine fallback (via WebGPU) for 100% offline generation.
  - BYOK (Bring Your Own Key) modal supporting Google Gemini, Groq (Llama-3.3-70B), and OpenAI (GPT-4o-mini).

- **🎨 High-Retention Subtitle Animation Engine**:
  - Real-time word-by-word active caption highlighting.
  - Presets: *MrBeast Yellow*, *Hormozi Glow*, *Neon Cyber*, and *Geist Minimal*.

- **📹 Real 1080p Canvas Exporter**:
  - Composites 1080x1920 60FPS vertical `.webm` video clips directly in the browser using HTML5 Canvas and MediaRecorder API.

---

## 🛠️ Technology Stack

- **Framework**: [Astro](https://astro.build/) (Static Site Generation & Fast SSR Engine)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **LLM Engine**: Google Gemini API & [@mlc-ai/web-llm](https://webllm.mlc.ai/) (In-Browser WebGPU)
- **Voiceover Synthesis**: Web Speech API & Custom Audio Synthesis Engine
- **Canvas Video Exporter**: Native Canvas 2D Rendering & MediaRecorder API
- **Deployment**: Cloudflare Pages / Workers

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/junior-tony/instantshortsai.git
   cd instantshortsai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Environment Variables:
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

### Deploy to Cloudflare Pages / Workers

```bash
CLOUDFLARE_API_TOKEN=your_cloudflare_token npx wrangler pages deploy dist --project-name=instantshortsai
```

Live Demo: [https://instantshortsai.instantshortsai.workers.dev](https://instantshortsai.instantshortsai.workers.dev)

---

## 🛡️ License

MIT License © 2026 Instant Shorts AI
