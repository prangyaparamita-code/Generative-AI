import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

const NVIDIA_DEFAULT_BASE_URL = 'https://integrate.api.nvidia.com/v1';

// Available model registry
export const AVAILABLE_MODELS = [
  {
    id: 'meta/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct',
    provider: 'nvidia' as const,
    developer: 'Meta / NVIDIA NIM',
    description: 'Flagship open-weights model with 128k context, state-of-the-art general intelligence and coding.',
    contextLength: '128k',
    capabilities: ['general', 'code', 'multilingual'] as const,
    recommended: true,
  },
  {
    id: 'deepseek-ai/deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'nvidia' as const,
    developer: 'DeepSeek / NVIDIA NIM',
    description: 'Groundbreaking reasoning and mathematical proof model with step-by-step thinking traces.',
    contextLength: '64k',
    capabilities: ['reasoning', 'code'] as const,
    recommended: true,
  },
  {
    id: 'nvidia/llama-3.1-nemotron-70b-instruct',
    name: 'Nemotron 70B Instruct',
    provider: 'nvidia' as const,
    developer: 'NVIDIA',
    description: 'Specially fine-tuned by NVIDIA for unmatched instruction following, complex math, and technical tasks.',
    contextLength: '128k',
    capabilities: ['code', 'general', 'reasoning'] as const,
  },
  {
    id: 'mistralai/mistral-large-2-instruct',
    name: 'Mistral Large 2',
    provider: 'nvidia' as const,
    developer: 'Mistral AI / NVIDIA NIM',
    description: 'Top-tier European foundation model with exceptional multilingual abilities and code fluency.',
    contextLength: '128k',
    capabilities: ['general', 'multilingual', 'code'] as const,
  },
  {
    id: 'qwen/qwen2.5-72b-instruct',
    name: 'Qwen 2.5 72B Instruct',
    provider: 'nvidia' as const,
    developer: 'Alibaba / NVIDIA NIM',
    description: 'Benchmark-leading model across mathematics, long-form structured generation, and system design.',
    contextLength: '128k',
    capabilities: ['code', 'multilingual', 'general'] as const,
  },
  {
    id: 'meta/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B Instruct',
    provider: 'nvidia' as const,
    developer: 'Meta / NVIDIA NIM',
    description: 'Lightweight, ultra-fast model delivering instant responses for quick queries and edits.',
    contextLength: '128k',
    capabilities: ['fast', 'general'] as const,
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'gemini' as const,
    developer: 'Google',
    description: 'High-speed multimodal AI designed for real-time responsiveness and comprehensive domain knowledge.',
    contextLength: '1M',
    capabilities: ['fast', 'general', 'multilingual'] as const,
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro Preview',
    provider: 'gemini' as const,
    developer: 'Google',
    description: 'Google’s premier reasoning model for deep analysis, intricate coding, and scientific problem-solving.',
    contextLength: '1M',
    capabilities: ['reasoning', 'code', 'general'] as const,
  },
];

// Status endpoint
app.get('/api/status', (req: Request, res: Response) => {
  const nvidiaKey = process.env.NVIDIA_API_KEY?.trim() || '';
  const geminiKey = process.env.GEMINI_API_KEY?.trim() || '';
  const nvidiaBaseUrl = process.env.NVIDIA_BASE_URL?.trim() || NVIDIA_DEFAULT_BASE_URL;

  const hasNvidiaKey = nvidiaKey.length > 0 && !nvidiaKey.includes('YOUR_NVIDIA_API_KEY');
  const hasGeminiKey = geminiKey.length > 0 && !geminiKey.includes('MY_GEMINI_API_KEY');

  res.json({
    nvidiaAvailable: hasNvidiaKey,
    nvidiaBaseUrl,
    geminiAvailable: hasGeminiKey,
    activeProvider: hasNvidiaKey ? 'nvidia' : (hasGeminiKey ? 'gemini' : 'nvidia'),
    serverEnvDetected: {
      hasNvidiaKey,
      hasGeminiKey,
    },
  });
});

// Models list endpoint
app.get('/api/models', (req: Request, res: Response) => {
  res.json(AVAILABLE_MODELS);
});

// Test connection endpoint
app.post('/api/test-connection', async (req: Request, res: Response) => {
  const provider = req.body.provider || 'nvidia';
  const startTime = Date.now();

  try {
    if (provider === 'nvidia') {
      const nvidiaKey = (req.headers['x-nvidia-api-key'] as string) || process.env.NVIDIA_API_KEY || '';
      const baseUrl = (req.body.baseUrl as string) || process.env.NVIDIA_BASE_URL || NVIDIA_DEFAULT_BASE_URL;

      if (!nvidiaKey || nvidiaKey.includes('YOUR_NVIDIA_API_KEY')) {
        res.json({
          success: false,
          error: 'NVIDIA API Key is missing. Set NVIDIA_API_KEY in your environment or Secrets.',
          latencyMs: 0,
        });
        return;
      }

      // Ping NVIDIA models endpoint or a simple test completion
      const response = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${nvidiaKey.trim()}`,
          Accept: 'application/json',
        },
      });

      const latencyMs = Date.now() - startTime;
      if (response.ok) {
        res.json({ success: true, latencyMs, statusText: 'Connected to NVIDIA NIM' });
      } else {
        const errorText = await response.text();
        res.json({ success: false, latencyMs, error: `NVIDIA returned HTTP ${response.status}: ${errorText.slice(0, 200)}` });
      }
    } else {
      // Test Gemini
      const geminiKey = process.env.GEMINI_API_KEY || '';
      if (!geminiKey || geminiKey.includes('MY_GEMINI_API_KEY')) {
        res.json({
          success: false,
          error: 'GEMINI_API_KEY is not set.',
          latencyMs: 0,
        });
        return;
      }
      const ai = new GoogleGenAI();
      await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'ping',
      });
      const latencyMs = Date.now() - startTime;
      res.json({ success: true, latencyMs, statusText: 'Connected to Gemini API' });
    }
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    res.json({ success: false, latencyMs, error: error.message || 'Connection test failed' });
  }
});

// Chat SSE streaming endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  const {
    messages,
    model: requestedModel = 'meta/llama-3.3-70b-instruct',
    systemPrompt = '',
    temperature = 0.7,
    topP = 0.9,
    maxTokens = 4096,
    customBaseUrl,
  } = req.body;

  // Determine target provider based on model ID
  const selectedModelMeta = AVAILABLE_MODELS.find(m => m.id === requestedModel);
  const provider = selectedModelMeta ? selectedModelMeta.provider : (requestedModel.startsWith('gemini') ? 'gemini' : 'nvidia');

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendSSE = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const startTime = Date.now();

  try {
    if (provider === 'nvidia') {
      const userHeaderKey = req.headers['x-nvidia-api-key'] as string;
      const envKey = process.env.NVIDIA_API_KEY?.trim() || '';
      const apiKey = (userHeaderKey && userHeaderKey.trim()) || envKey;
      const baseUrl = customBaseUrl?.trim() || process.env.NVIDIA_BASE_URL?.trim() || NVIDIA_DEFAULT_BASE_URL;

      if (!apiKey || apiKey.includes('YOUR_NVIDIA_API_KEY')) {
        // Helpful diagnostic message streamed back
        const helpMessage = `⚠️ **NVIDIA NIM API Key Required**\n\n` +
          `To chat with **${selectedModelMeta?.name || requestedModel}**, an NVIDIA API key is needed.\n\n` +
          `### How to enable NVIDIA NIM:\n` +
          `1. Go to [build.nvidia.com](https://build.nvidia.com) to generate a free API key (starts with \`nvapi-...\`).\n` +
          `2. Add it to your project environment or secrets as:\n` +
          `   \`\`\`bash\n   NVIDIA_API_KEY="nvapi-your-key-here"\n   \`\`\`\n` +
          `3. Alternatively, you can select **Gemini 3.8 Flash** from the model dropdown at the top to chat right away!\n\n` +
          `*NexusAI is fully prepared to stream from NVIDIA NIM as soon as the key is configured.*`;

        sendSSE({ type: 'chunk', content: helpMessage });
        sendSSE({ type: 'done', latencyMs: Date.now() - startTime });
        res.end();
        return;
      }

      // Format messages for NVIDIA NIM (OpenAI ChatCompletions format)
      const formattedMessages: { role: string; content: string }[] = [];

      if (systemPrompt && systemPrompt.trim()) {
        formattedMessages.push({
          role: 'system',
          content: systemPrompt.trim(),
        });
      }

      for (const msg of messages || []) {
        let content = msg.content || '';
        // If attachments exist, format text attachment into the message content
        if (msg.attachments && msg.attachments.length > 0) {
          const attachmentNotes = msg.attachments
            .filter((a: any) => a.textContent)
            .map((a: any) => `\n[Attached File: ${a.name}]\n\`\`\`\n${a.textContent}\n\`\`\``)
            .join('\n');
          if (attachmentNotes) {
            content += attachmentNotes;
          }
        }
        formattedMessages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content,
        });
      }

      const nvidiaPayload = {
        model: requestedModel,
        messages: formattedMessages,
        temperature: Math.max(0.0, Math.min(2.0, Number(temperature) || 0.7)),
        top_p: Math.max(0.01, Math.min(1.0, Number(topP) || 0.9)),
        max_tokens: Math.max(64, Math.min(8192, Number(maxTokens) || 4096)),
        stream: true,
      };

      const upstreamResponse = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(nvidiaPayload),
      });

      if (!upstreamResponse.ok) {
        const errorText = await upstreamResponse.text();
        let parsedError = errorText;
        try {
          const parsed = JSON.parse(errorText);
          parsedError = parsed.message || parsed.error?.message || errorText;
        } catch {
          // keep as text
        }
        sendSSE({
          type: 'error',
          error: `NVIDIA API Error (${upstreamResponse.status}): ${parsedError}`,
        });
        res.end();
        return;
      }

      if (!upstreamResponse.body) {
        sendSSE({ type: 'error', error: 'No response body received from NVIDIA NIM' });
        res.end();
        return;
      }

      const reader = upstreamResponse.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.slice(5).trim();
          if (dataStr === '[DONE]') {
            continue;
          }

          try {
            const parsed = JSON.parse(dataStr);
            const choice = parsed.choices?.[0];
            const delta = choice?.delta;

            if (delta) {
              const content = delta.content || '';
              // DeepSeek-R1 or Nemotron might supply reasoning in reasoning_content or delta.reasoning
              const reasoning = delta.reasoning_content || delta.reasoning || '';
              if (content || reasoning) {
                sendSSE({
                  type: 'chunk',
                  content,
                  reasoning,
                });
              }
            }
          } catch {
            // Ignore partial parse
          }
        }
      }

      sendSSE({ type: 'done', latencyMs: Date.now() - startTime });
      res.end();
    } else {
      // Gemini provider flow
      const geminiKey = process.env.GEMINI_API_KEY?.trim() || '';
      if (!geminiKey || geminiKey.includes('MY_GEMINI_API_KEY')) {
        sendSSE({
          type: 'error',
          error: 'GEMINI_API_KEY is not configured on the server.',
        });
        res.end();
        return;
      }

      const ai = new GoogleGenAI();
      const geminiModel = requestedModel.startsWith('gemini') ? requestedModel : 'gemini-3.8-flash';

      // Build Gemini contents
      const contents: any[] = [];
      for (const msg of messages || []) {
        const role = msg.role === 'assistant' ? 'model' : 'user';
        let text = msg.content || '';
        if (msg.attachments && msg.attachments.length > 0) {
          const attachmentNotes = msg.attachments
            .filter((a: any) => a.textContent)
            .map((a: any) => `\n[Attached File: ${a.name}]\n\`\`\`\n${a.textContent}\n\`\`\``)
            .join('\n');
          text += attachmentNotes;
        }
        contents.push({
          role,
          parts: [{ text }],
        });
      }

      const config: any = {
        temperature: Math.max(0.0, Math.min(2.0, Number(temperature) || 0.7)),
      };
      if (systemPrompt && systemPrompt.trim()) {
        config.systemInstruction = systemPrompt.trim();
      }

      const stream = await ai.models.generateContentStream({
        model: geminiModel,
        contents,
        config,
      });

      for await (const chunk of stream) {
        const text = chunk.text || '';
        if (text) {
          sendSSE({ type: 'chunk', content: text });
        }
      }

      sendSSE({ type: 'done', latencyMs: Date.now() - startTime });
      res.end();
    }
  } catch (error: any) {
    sendSSE({
      type: 'error',
      error: formatErrorMessage(error),
    });
    res.end();
  }
});

function formatErrorMessage(err: any): string {
  if (!err) return 'An unexpected error occurred.';
  const raw = err.message || (typeof err === 'string' ? err : JSON.stringify(err));
  try {
    const parsed = JSON.parse(raw);
    if (parsed.error?.message) {
      try {
        const inner = JSON.parse(parsed.error.message);
        return inner.error?.message || inner.message || parsed.error.message;
      } catch {
        return parsed.error.message;
      }
    }
    return parsed.message || raw;
  } catch {
    return raw;
  }
}

// Setup Vite middleware in dev or static files in prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`NexusAI Platform server running on port ${PORT}`);
  });
}

startServer();
