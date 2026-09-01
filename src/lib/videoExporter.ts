export interface MediaClip {
  id: string;
  url: string;
  type: "image" | "video";
  name: string;
  durationSec: number;
  filterEffect?: "none" | "kenburns" | "noir" | "vintage" | "vibrant" | "blur";
  trimStartSec?: number;
  trimEndSec?: number;
}

export interface AudioTrackOptions {
  trackId: string; // "legacy_slowed", "pixy_slowed", "phonk_drift", "memory_reboot", "gigachad_slowed", "lofi", "ambient", "energy", "custom", "none"
  customAudioUrl?: string | null;
  trimStartSec?: number;
  trimDurationSec?: number;
  volume?: number; // 0.0 to 1.0
  speedRate?: number; // 0.5 to 1.5
}

export interface RenderOptions {
  topic: string;
  script: string;
  mediaClips?: MediaClip[];
  bgImageUrl?: string;
  bgMediaType?: "image" | "video";
  captionStyle: string;
  musicTrack?: string;
  audioTrackOptions?: AudioTrackOptions;
  durationSec?: number;
  onProgress?: (pct: number, step: string) => void;
}

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
}

export async function renderAndExportShortVideo(options: RenderOptions): Promise<Blob> {
  const {
    topic,
    script,
    mediaClips: providedMediaClips,
    bgImageUrl,
    bgMediaType = "image",
    captionStyle,
    musicTrack = "lofi",
    audioTrackOptions,
    durationSec = 15,
    onProgress
  } = options;

  if (onProgress) onProgress(10, "Initializing 9:16 HD 1080x1920 Canvas...");

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context");

  // Build unified media clips list
  let clips: MediaClip[] = [];
  if (providedMediaClips && providedMediaClips.length > 0) {
    clips = [...providedMediaClips];
  } else if (bgImageUrl) {
    clips = [
      {
        id: "default_1",
        url: bgImageUrl,
        type: bgMediaType,
        name: "Background Media",
        durationSec: durationSec,
        filterEffect: "kenburns"
      }
    ];
  } else {
    clips = [
      {
        id: "default_fallback",
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
        type: "image",
        name: "Minecraft Preset",
        durationSec: durationSec,
        filterEffect: "kenburns"
      }
    ];
  }

  if (onProgress) onProgress(25, `Loading ${clips.length} media asset(s)...`);

  // Preload all media clip elements (Images & Videos)
  const loadedElementsMap = new Map<string, HTMLImageElement | HTMLVideoElement>();

  await Promise.all(
    clips.map(async (clip) => {
      if (clip.type === "video") {
        const v = document.createElement("video");
        v.crossOrigin = "anonymous";
        v.muted = true;
        v.playsInline = true;
        v.loop = true;
        v.src = clip.url;

        await new Promise<void>((resolve) => {
          v.onloadeddata = () => resolve();
          v.onerror = () => resolve();
          v.load();
          setTimeout(resolve, 3500); // Fallback timeout
        });
        try {
          await v.play();
        } catch (_) {}
        loadedElementsMap.set(clip.id, v);
      } else {
        const img = new Image();
        if (clip.url.startsWith("http://") || clip.url.startsWith("https://")) {
          img.crossOrigin = "anonymous";
        }
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => {
            if (img.crossOrigin) {
              img.removeAttribute("crossOrigin");
              img.onload = () => resolve();
              img.onerror = () => resolve();
              img.src = clip.url;
            } else {
              resolve();
            }
          };
          img.src = clip.url;
        });
        loadedElementsMap.set(clip.id, img);
      }
    })
  );

  if (onProgress) onProgress(40, "Configuring audio engine & trending tracks...");

  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  let audioStreamNode: MediaStreamAudioDestinationNode | null = null;
  let audioCtx: AudioContext | null = null;

  const activeAudioTrackId = audioTrackOptions?.trackId || musicTrack;
  const audioVolume = audioTrackOptions?.volume ?? 0.8;
  const audioSpeedRate = audioTrackOptions?.speedRate ?? 1.0;
  const audioTrimStart = audioTrackOptions?.trimStartSec ?? 0;

  if (AudioContextClass && activeAudioTrackId !== "none") {
    try {
      audioCtx = new AudioContextClass();
      audioStreamNode = audioCtx.createMediaStreamDestination();

      if (activeAudioTrackId === "custom" || activeAudioTrackId) {
        // Custom user audio file playback
        let trackUrl = audioTrackOptions?.customAudioUrl || "";
        if (!trackUrl && activeAudioTrackId && activeAudioTrackId !== "none") {
          trackUrl = `/audio/${activeAudioTrackId}.mp3`;
        }

        if (trackUrl) {
          const audioEl = new Audio(trackUrl);
          audioEl.crossOrigin = "anonymous";
          audioEl.currentTime = audioTrimStart;
          audioEl.playbackRate = audioSpeedRate;
          audioEl.volume = audioVolume;

          const mediaSource = audioCtx.createMediaElementSource(audioEl);
          const gainNode = audioCtx.createGain();
          gainNode.gain.value = audioVolume;
          mediaSource.connect(gainNode);
          gainNode.connect(audioStreamNode);
          audioEl.play().catch((err) => {
            console.warn("Exporter MP3 audio play note:", err);
          });
        }
      }
    } catch (e) {
      console.warn("Audio exporter note:", e);
    }
  }

  const canvasStream = canvas.captureStream(30);
  let combinedStream = canvasStream;

  if (audioStreamNode && audioStreamNode.stream.getAudioTracks().length > 0) {
    const audioTrack = audioStreamNode.stream.getAudioTracks()[0];
    combinedStream.addTrack(audioTrack);
  }

  const mimeTypes = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4"
  ];
  const supportedMime = mimeTypes.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) || "";

  const recordedChunks: Blob[] = [];
  let recorder: MediaRecorder | null = null;

  if (typeof MediaRecorder !== "undefined") {
    try {
      recorder = new MediaRecorder(combinedStream, supportedMime ? { mimeType: supportedMime } : undefined);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };
      recorder.start(100);
    } catch (e) {
      console.warn("MediaRecorder initialization note:", e);
    }
  }

  // Calculate total sequence duration from clips if not overridden
  const totalClipsDuration = clips.reduce((sum, c) => sum + (c.durationSec || 5), 0);
  const safeDuration = Math.max(3, durationSec || totalClipsDuration);
  const totalFrames = safeDuration * 30;
  let currentFrame = 0;

  const words = script.split(/\s+/).filter(Boolean);

  if (onProgress) onProgress(55, `Compositing multi-clip 1080x1920 timeline...`);

  return new Promise<Blob>((resolve) => {
    const renderFrame = () => {
      const progressRatio = currentFrame / totalFrames;
      const currentTimeSec = progressRatio * safeDuration;
      const pct = Math.min(98, Math.round(55 + progressRatio * 43));

      if (onProgress && currentFrame % 15 === 0) {
        onProgress(pct, `Compositing frame ${currentFrame} of ${totalFrames} (${currentTimeSec.toFixed(1)}s)...`);
      }

      // Base dark canvas
      ctx.fillStyle = "#0a0a0c";
      ctx.fillRect(0, 0, 1080, 1920);

      // Determine active media clip from sequence
      let accumulatedTime = 0;
      let activeClip = clips[0];
      let clipStartTimeSec = 0;

      for (let i = 0; i < clips.length; i++) {
        const clipDur = clips[i].durationSec || (safeDuration / clips.length);
        if (currentTimeSec >= accumulatedTime && currentTimeSec < accumulatedTime + clipDur) {
          activeClip = clips[i];
          clipStartTimeSec = accumulatedTime;
          break;
        }
        accumulatedTime += clipDur;
      }

      const activeEl = loadedElementsMap.get(activeClip.id);
      const clipTimeSec = currentTimeSec - clipStartTimeSec;
      const clipDurationSec = activeClip.durationSec || 5;
      const clipProgress = Math.min(1, Math.max(0, clipTimeSec / clipDurationSec));

      // Apply Visual Filter Effect on Context
      const filterEffect = activeClip.filterEffect || "kenburns";
      if (filterEffect === "noir") {
        ctx.filter = "grayscale(100%) contrast(130%) brightness(90%)";
      } else if (filterEffect === "vintage") {
        ctx.filter = "sepia(70%) saturate(140%) contrast(110%)";
      } else if (filterEffect === "vibrant") {
        ctx.filter = "saturate(200%) contrast(115%) hue-rotate(10deg)";
      } else if (filterEffect === "blur") {
        ctx.filter = "blur(6px) brightness(80%)";
      } else {
        ctx.filter = "none";
      }

      // Fallback background frame fill
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, 1080, 1920);

      // Draw Image or Video frame
      if (activeClip.type === "video" && activeEl instanceof HTMLVideoElement && activeEl.readyState >= 2) {
        const vW = activeEl.videoWidth || 1080;
        const vH = activeEl.videoHeight || 1920;
        const scale = Math.max(1080 / vW, 1920 / vH);
        const w = vW * scale;
        const h = vH * scale;
        const x = (1080 - w) / 2;
        const y = (1920 - h) / 2;

        const trimStart = activeClip.trimStartSec || 0;
        const targetVideoTime = trimStart + clipTimeSec;
        if (activeEl.duration && targetVideoTime < activeEl.duration) {
          activeEl.currentTime = targetVideoTime;
        }

        ctx.drawImage(activeEl, x, y, w, h);
      } else if (activeEl instanceof HTMLImageElement && activeEl.complete && activeEl.naturalWidth > 0) {
        const zoom = filterEffect === "kenburns" ? 1.0 + clipProgress * 0.12 : 1.05;
        const w = 1080 * zoom;
        const h = 1920 * zoom;
        const x = (1080 - w) / 2 - clipProgress * 15;
        const y = (1920 - h) / 2 - clipProgress * 10;
        ctx.drawImage(activeEl, x, y, w, h);
      }

      // Reset CSS filter
      ctx.filter = "none";

      // Dark Vignette Overlays
      const grad = ctx.createLinearGradient(0, 0, 0, 1920);
      grad.addColorStop(0, "rgba(0, 0, 0, 0.75)");
      grad.addColorStop(0.25, "rgba(0, 0, 0, 0.25)");
      grad.addColorStop(0.75, "rgba(0, 0, 0, 0.25)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0.88)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1920);

      // CapCut Visual Effect 1: CapCut Transition Flash & Camera Bounce
      const isWordPopFrame = currentFrame % 10 === 0;
      const isClipTransition = currentFrame % Math.max(1, Math.floor(totalFrames / clips.length)) === 0;
      
      const shakeX = isWordPopFrame ? (Math.random() - 0.5) * 14 : 0;
      const shakeY = isWordPopFrame ? (Math.random() - 0.5) * 14 : 0;

      // CapCut Visual Effect 2: Screen Flash Overlay on transition
      if (isClipTransition || (isWordPopFrame && currentFrame > 0)) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
        ctx.fillRect(0, 0, 1080, 1920);
      }

      // Active Subtitle Word Engine (CapCut Style Pop & Shake)
      const wordIndex = Math.min(words.length - 1, Math.floor(progressRatio * words.length));
      const activeWord = (words[wordIndex] || "INSTANT SHORTS").toUpperCase();
      const nextWord = (words[wordIndex + 1] || words[wordIndex] || "").toUpperCase();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const wordCenterX = 540 + shakeX;
      const wordCenterY = 960 + shakeY;

      if (captionStyle === "mrbeast") {
        ctx.font = "900 88px sans-serif";
        // CapCut Black Outline + Yellow Pop
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 22;
        ctx.strokeText(activeWord, wordCenterX, wordCenterY);
        
        ctx.shadowColor = "rgba(253, 224, 71, 0.8)";
        ctx.shadowBlur = 30;
        ctx.fillStyle = "#FDE047";
        ctx.fillText(activeWord, wordCenterX, wordCenterY);
        ctx.shadowBlur = 0;

        if (nextWord) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
          ctx.beginPath();
          drawRoundRect(ctx, wordCenterX - 280, wordCenterY + 100, 560, 80, 20);
          ctx.fill();

          ctx.font = "bold 44px sans-serif";
          ctx.fillStyle = "#ffffff";
          ctx.fillText(`'${nextWord}'`, wordCenterX, wordCenterY + 140);
        }
      } else if (captionStyle === "hormozi") {
        // CapCut Neon Cyan Glow
        ctx.font = "900 84px sans-serif";
        ctx.shadowColor = "#22d3ee";
        ctx.shadowBlur = 36;
        ctx.fillStyle = "#38bdf8";
        ctx.fillText(activeWord, wordCenterX, wordCenterY);
        ctx.shadowBlur = 0;
      } else if (captionStyle === "cyberpunk") {
        // CapCut Cyber RGB Split
        ctx.font = "900 86px sans-serif";
        ctx.fillStyle = "rgba(34, 211, 238, 0.7)";
        ctx.fillText(activeWord, wordCenterX - 6, wordCenterY - 4);
        
        ctx.shadowColor = "#ec4899";
        ctx.shadowBlur = 35;
        ctx.fillStyle = "#f43f5e";
        ctx.fillText(activeWord, wordCenterX, wordCenterY);
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
        ctx.beginPath();
        drawRoundRect(ctx, wordCenterX - 320, wordCenterY - 60, 640, 120, 20);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.font = "bold 58px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(activeWord, wordCenterX, wordCenterY);
      }

      currentFrame++;

      if (currentFrame < totalFrames) {
        setTimeout(renderFrame, 1000 / 30);
      } else {
        if (onProgress) onProgress(100, "1080x1920 HD Video Export Complete!");
        clips.forEach((c) => {
          const el = loadedElementsMap.get(c.id);
          if (el instanceof HTMLVideoElement) {
            try {
              el.pause();
            } catch (_) {}
          }
        });
        if (recorder && recorder.state === "recording") {
          recorder.onstop = () => {
            if (audioCtx) {
              try {
                audioCtx.close();
              } catch (_) {}
            }
            const blob = new Blob(recordedChunks, { type: supportedMime || "video/webm" });
            resolve(blob);
          };
          recorder.stop();
        } else {
          canvas.toBlob((b) => {
            resolve(b || new Blob(["video"], { type: "video/webm" }));
          }, "image/png");
        }
      }
    };

    renderFrame();
  });
}
