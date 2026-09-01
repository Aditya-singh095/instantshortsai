import * as webllm from "@mlc-ai/web-llm";

export type ProgressCallback = (report: { text: string; progress: number }) => void;

let engineInstance: webllm.MLCEngineInterface | null = null;
let isInitializing = false;

export const DEFAULT_MODEL = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";

export async function isWebGPUSupported(): Promise<boolean> {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return "gpu" in navigator;
}

export async function getWebLLMEngine(onProgress?: ProgressCallback): Promise<webllm.MLCEngineInterface> {
  if (engineInstance) return engineInstance;
  if (isInitializing) {
    while (isInitializing) {
      await new Promise(res => setTimeout(res, 200));
    }
    if (engineInstance) return engineInstance;
  }

  isInitializing = true;
  try {
    const hasGPU = await isWebGPUSupported();
    if (!hasGPU) {
      throw new Error("WebGPU is not supported on this browser/device.");
    }

    const initProgressCallback: webllm.InitProgressCallback = (report) => {
      if (onProgress) {
        onProgress({ text: report.text, progress: report.progress });
      }
    };

    engineInstance = await webllm.CreateMLCEngine(DEFAULT_MODEL, {
      initProgressCallback,
      logLevel: "WARN",
    });

    return engineInstance;
  } finally {
    isInitializing = false;
  }
}

// Stream script tokens smoothly for fallback or fast templates
async function streamFallbackTokens(
  scriptText: string,
  onTokenChunk?: (chunk: string, fullText: string) => void
): Promise<string> {
  if (!onTokenChunk) return scriptText;
  const words = scriptText.split(" ");
  let stream = "";
  for (let i = 0; i < words.length; i++) {
    stream += (i === 0 ? "" : " ") + words[i];
    onTokenChunk(words[i], stream);
    await new Promise(r => setTimeout(r, 20));
  }
  return scriptText;
}

export async function generateViralScriptWithWebLLM(
  topic: string,
  niche: string,
  onTokenChunk?: (chunk: string, fullText: string) => void,
  onProgress?: ProgressCallback
): Promise<string> {
  const templateBank: Record<string, string[]> = {
    stoicism: [
      `Did you know Marcus Aurelius wrote: 'You have power over your mind - not outside events.' Here are 3 stoic rules to master ${topic} today: Rule 1: Control what you can, ignore the rest. Rule 2: Embrace obstacles as fuel. Rule 3: Remember death is inevitable, act with urgency today.`,
      `Here is the ancient secret to unshakeable focus for ${topic}: Epictetus taught that we suffer more in imagination than reality. Stop overthinking what might happen and take your next immediate action right now.`
    ],
    space: [
      `There is a terrifying truth about ${topic} in deep space. Temperatures reach thousands of degrees and time dilates near gravitational singularities. Space is not just vast—it is dangerously extreme.`,
      `Did you know that space is expanding faster than light? When investigating ${topic}, remember that distant galaxies are moving away so fast their light will never reach Earth again.`
    ],
    money: [
      `Here is the wealth rule that 99% of people learn too late about ${topic}: Never trade time for money indefinitely. Build automated digital assets, leverage compounding index funds, and earn 24/7 while you sleep.`,
      `The fastest way to achieve financial freedom with ${topic} is understanding leverage: code, media, and capital work without permission. Master your focus and eliminate liabilities today.`
    ],
    crime: [
      `In the most shocking unsolved mystery surrounding ${topic}, investigators found evidence that defied forensic logic. Decades later, unreleased files suggest the official story was completely manufactured.`,
      `The case of ${topic} remains classified for one reason: the key witness vanished minutes before trial. To this day, nobody knows the full truth.`
    ],
    quiz: [
      `Interactive trivia quiz! Can you answer this question about ${topic} in under 5 seconds? Keep your score and drop your answer in the comments right now!`,
      `Here is a mind-bending puzzle about ${topic}: 90% of people get this wrong on their first try. Think carefully before the timer hits zero!`
    ],
    tech: [
      `By the end of 2026, autonomous AI models will completely transform ${topic}. Here is how to stay ahead: master local open models, automate repetitive editing, and build your digital audience today.`
    ]
  };

  const pool = templateBank[niche] || templateBank.stoicism;
  const fallbackChoice = pool[Math.floor(Math.random() * pool.length)];

  // 1. Check Google Gemini API key securely from environment variable or localStorage
  const envGeminiKey = (import.meta.env.GEMINI_API_KEY as string) || (import.meta.env.GOOGLE_API_KEY as string) || "";
  
  if (envGeminiKey && envGeminiKey.trim().length > 5) {
    try {
      if (onProgress) onProgress({ text: "Generating viral script with Google Gemini AI...", progress: 0.3 });
      const promptText = `Write a viral 30-second spoken YouTube Short / Instagram Reel script about "${topic}" in the "${niche}" category. Output 40-50 spoken words max with a strong hook. Do not include sound effects or visual directions in brackets, output spoken text only.`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${envGeminiKey.trim()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: promptText }]
          }]
        })
      });

      if (res.ok) {
        const data = await res.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (generatedText && generatedText.length > 10) {
          return streamFallbackTokens(generatedText, onTokenChunk);
        }
      }
    } catch (e) {
      console.warn("Google Gemini API note, trying BYOK / Web-LLM fallback:", e);
    }
  }

  // 2. Check for BYOK API key in localStorage (Google / Groq / OpenAI)
  if (typeof window !== "undefined") {
    const customKey = localStorage.getItem("byok_api_key");
    const provider = localStorage.getItem("byok_provider") || "google";
    if (customKey && customKey.trim().length > 5) {
      try {
        if (onProgress) onProgress({ text: `Generating with BYOK (${provider.toUpperCase()})...`, progress: 0.5 });
        
        if (provider === "google") {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${customKey.trim()}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: `Write a viral 30-second spoken YouTube Short / Reel script about "${topic}" in the "${niche}" category. Output 40-50 spoken words only.` }]
              }]
            })
          });
          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (text) return streamFallbackTokens(text, onTokenChunk);
          }
        } else {
          const endpoint = provider === "openai" 
            ? "https://api.openai.com/v1/chat/completions"
            : "https://api.groq.com/openai/v1/chat/completions";
          const model = provider === "openai" ? "gpt-4o-mini" : "llama-3.3-70b-versatile";

          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${customKey.trim()}`
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: "You are an expert viral YouTube Short scriptwriter. Output spoken text only (40-50 words max)." },
                { role: "user", content: `Write a viral 30-second spoken short video script about "${topic}" in the "${niche}" niche.` }
              ],
              max_tokens: 120,
              temperature: 0.7
            })
          });

          if (res.ok) {
            const data = await res.json();
            const text = data.choices?.[0]?.message?.content?.trim();
            if (text) return streamFallbackTokens(text, onTokenChunk);
          }
        }
      } catch (e) {
        console.warn("BYOK API note, falling back:", e);
      }
    }
  }

  // 3. Try WebGPU generation with MLC engine
  try {
    const hasGPU = await isWebGPUSupported();
    if (hasGPU) {
      if (onProgress) onProgress({ text: "Loading WebGPU LLM Engine...", progress: 0.1 });
      
      const enginePromise = getWebLLMEngine(onProgress);
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));
      const engine = await Promise.race([enginePromise, timeoutPromise]);

      if (engine) {
        if (onProgress) onProgress({ text: "Generating viral script...", progress: 0.9 });
        const prompt = `Write a viral 30-second spoken YouTube Short / Instagram Reel script about "${topic}" in the "${niche}" niche. Output 40-50 spoken words only with a punchy hook.`;
        const response = await engine.chat.completions.create({
          messages: [
            { role: "system", content: "You are an expert viral short video scriptwriter. Spoken text only." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 120,
          stream: true
        });

        let fullText = "";
        for await (const chunk of response) {
          const delta = chunk.choices[0]?.delta?.content || "";
          fullText += delta;
          if (onTokenChunk) {
            onTokenChunk(delta, fullText.trim());
          }
        }

        if (fullText.trim().length > 15) {
          return fullText.trim();
        }
      }
    }
  } catch (err) {
    console.warn("Web-LLM inference note, using instant local engine fallback:", err);
  }

  return streamFallbackTokens(fallbackChoice, onTokenChunk);
}
