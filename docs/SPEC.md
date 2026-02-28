# aidiff — Side-by-Side AI Model Comparison CLI

## Implementation Specification for Claude Code

> **This document is the complete implementation spec for `aidiff`, a CLI tool that runs prompts against multiple AI models simultaneously and displays a beautiful side-by-side comparison of their outputs in the terminal. Build exactly what's described here.**

---

## 1. Project Overview

### What It Does
`aidiff` takes a prompt (via argument, stdin, or file), sends it to 2+ AI models in parallel, and displays the results in a rich terminal UI with:
- Side-by-side output comparison
- Syntax-highlighted code blocks
- Timing, token usage, and cost per model
- Optional AI judge that picks a winner
- Saved results history for later review

### Why It Exists
Every developer working with LLMs constantly wonders "which model is better for this task?" Currently, the workflow is: open ChatGPT in one tab, Claude in another, paste the same prompt, wait, manually compare. `aidiff` makes this a one-liner.

### Design Philosophy
- **Zero config to start** — `npx aidiff "your prompt" -m claude-sonnet -m gpt-4o` should just work
- **Beautiful by default** — terminal output should be screenshot-worthy
- **Fast** — stream responses in parallel, show results as they arrive
- **Cheap** — show cost per comparison so users stay aware
- **Shareable** — export comparisons as markdown, HTML, or images

---

## 2. Tech Stack

```
Language:        TypeScript (strict mode)
Runtime:         Node.js >= 20
Package Manager: pnpm
Build:           tsup (fast, simple bundler)
CLI Framework:   Commander.js
Terminal UI:     Ink (React for CLI) + ink-table + chalk
AI SDKs:        Vercel AI SDK (unified interface to all providers)
Streaming:       Vercel AI SDK streaming support
Config:          cosmiconfig (reads .aidiffrc, aidiff.config.ts, etc.)
Testing:         Vitest
Linting:         Biome
```

### Why Vercel AI SDK?
It provides a unified interface (`generateText`, `streamText`) across all major providers (Anthropic, OpenAI, Google, Mistral, Groq, Ollama, etc.). This means we don't need to write provider-specific code. Adding a new provider is just adding a model string.

### Why Ink?
Ink lets us build the terminal UI with React components, which makes the side-by-side layout, streaming updates, and interactive elements much easier to build and maintain than raw ANSI escape codes.

---

## 3. Installation & Usage

### Install
```bash
# Run directly (no install)
npx aidiff "explain quicksort" -m claude-sonnet -m gpt-4o

# Global install
npm install -g aidiff

# Or clone and build
git clone https://github.com/[user]/aidiff.git
cd aidiff && pnpm install && pnpm build
```

### API Key Setup
```bash
# Set API keys via environment variables
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...
export GOOGLE_GENERATIVE_AI_API_KEY=...

# Or use a .env file in current directory or ~/.aidiff/.env
# Or configure via: aidiff config set openai-key sk-...
```

### CLI Interface

```
USAGE:
  aidiff [options] [prompt]

ARGUMENTS:
  prompt                    The prompt to send to all models (can also be piped via stdin)

OPTIONS:
  -m, --model <model...>    Models to compare (at least 2, repeatable)
                            Examples: claude-sonnet, gpt-4o, gemini-pro, llama3
  -s, --system <message>    System prompt to use for all models
  -f, --file <path>         Read prompt from a file
  -t, --temperature <n>     Temperature for all models (default: 0)
  --max-tokens <n>          Max tokens per response (default: 2048)
  
  --judge                   Use an AI judge to evaluate & pick a winner
  --judge-model <model>     Model to use as judge (default: claude-sonnet)
  --judge-criteria <text>   Custom judging criteria
  
  --stream                  Show streaming output in real-time (default: true)
  --no-stream               Wait for all responses before displaying
  
  --json                    Output raw JSON results
  --markdown                Output as formatted Markdown
  --html                    Output as self-contained HTML file
  --save [name]             Save results to ~/.aidiff/history/
  
  --cost                    Show cost breakdown (default: true)
  --no-cost                 Hide cost information
  
  --repeat <n>              Run the comparison n times (for consistency testing)
  --timeout <seconds>       Timeout per model (default: 60)
  
  -v, --verbose             Show debug info (API calls, timings)
  --version                 Show version
  -h, --help                Show help

COMMANDS:
  aidiff config             Manage configuration
  aidiff history            Browse saved comparisons  
  aidiff models             List available models and their pricing
  aidiff bench <file>       Run a benchmark suite from a YAML file

MODEL ALIASES:
  claude-sonnet     → claude-sonnet-4-20250514
  claude-haiku      → claude-haiku-4-5-20251001
  claude-opus       → claude-opus-4-6
  gpt-4o            → gpt-4o
  gpt-4o-mini       → gpt-4o-mini
  gpt-4.1           → gpt-4.1
  gpt-4.1-mini      → gpt-4.1-mini
  gpt-4.1-nano      → gpt-4.1-nano
  gemini-pro        → gemini-2.0-pro
  gemini-flash      → gemini-2.0-flash
  llama3            → llama-3.1-70b (via Groq)
  deepseek          → deepseek-chat (via DeepSeek API)
  mistral-large     → mistral-large-latest
  local:*           → Ollama models (e.g., local:llama3.2)
```

### Usage Examples

```bash
# Basic comparison
aidiff "Write a Python fibonacci function" -m claude-sonnet -m gpt-4o

# Pipe from stdin
echo "Explain the CAP theorem simply" | aidiff -m claude-sonnet -m gemini-pro

# Read from file with system prompt
aidiff -f ./prompt.txt -s "You are an expert code reviewer" -m claude-sonnet -m gpt-4o

# Compare 3 models with AI judge
aidiff "Optimize this SQL query: SELECT * FROM users WHERE..." \
  -m claude-sonnet -m gpt-4o -m gemini-pro --judge

# Benchmark mode — run a suite of prompts
aidiff bench ./my-benchmarks.yaml

# Save and review later
aidiff "Explain monads" -m claude-sonnet -m gpt-4o --save monads
aidiff history show monads

# Compare local models via Ollama
aidiff "Write a haiku about coding" -m local:llama3.2 -m local:mistral
```

---

## 4. Project Structure

```
aidiff/
├── src/
│   ├── cli/
│   │   ├── index.ts              # Entry point — Commander setup
│   │   ├── commands/
│   │   │   ├── compare.ts        # Main compare command (default)
│   │   │   ├── bench.ts          # Benchmark suite command
│   │   │   ├── config.ts         # Config management command
│   │   │   ├── history.ts        # History browsing command
│   │   │   └── models.ts         # List models command
│   │   └── options.ts            # CLI option parsing & validation
│   │
│   ├── core/
│   │   ├── runner.ts             # Orchestrates parallel model calls
│   │   ├── models.ts             # Model registry, aliases, pricing
│   │   ├── judge.ts              # AI judge logic
│   │   ├── cost.ts               # Cost calculation
│   │   └── types.ts              # Core TypeScript types
│   │
│   ├── providers/
│   │   ├── registry.ts           # Provider setup & model resolution
│   │   ├── anthropic.ts          # Anthropic provider config
│   │   ├── openai.ts             # OpenAI provider config
│   │   ├── google.ts             # Google provider config
│   │   ├── groq.ts               # Groq provider config
│   │   ├── ollama.ts             # Ollama (local) provider config
│   │   └── deepseek.ts           # DeepSeek provider config
│   │
│   ├── ui/
│   │   ├── App.tsx               # Root Ink component
│   │   ├── components/
│   │   │   ├── Header.tsx        # Prompt display & config summary
│   │   │   ├── ModelColumn.tsx   # Single model's output (streaming)
│   │   │   ├── SideBySide.tsx    # Side-by-side layout container
│   │   │   ├── Stats.tsx         # Timing, tokens, cost bar
│   │   │   ├── Judge.tsx         # Judge verdict display
│   │   │   ├── Spinner.tsx       # Loading indicator
│   │   │   ├── CodeBlock.tsx     # Syntax-highlighted code
│   │   │   ├── DiffView.tsx      # Character-level diff highlighting
│   │   │   └── Summary.tsx       # Final summary bar
│   │   ├── hooks/
│   │   │   ├── useModelStream.ts # Hook for streaming model responses
│   │   │   └── useTerminalSize.ts# Hook for responsive layout
│   │   └── theme.ts              # Color scheme & styling constants
│   │
│   ├── output/
│   │   ├── markdown.ts           # Markdown export
│   │   ├── html.ts               # HTML export (self-contained)
│   │   ├── json.ts               # JSON export
│   │   └── image.ts              # Terminal screenshot (future)
│   │
│   ├── storage/
│   │   ├── config.ts             # Config file management (cosmiconfig)
│   │   ├── history.ts            # Comparison history (saved results)
│   │   └── keys.ts               # API key storage (keychain)
│   │
│   ├── bench/
│   │   ├── runner.ts             # Benchmark suite runner
│   │   ├── parser.ts             # YAML benchmark file parser
│   │   └── report.ts             # Benchmark results report
│   │
│   └── utils/
│       ├── tokens.ts             # Token counting (tiktoken)
│       ├── format.ts             # Text formatting helpers
│       ├── diff.ts               # Text diffing utilities
│       └── logger.ts             # Debug logging
│
├── benchmarks/
│   ├── coding.yaml               # Built-in coding benchmark
│   ├── reasoning.yaml            # Built-in reasoning benchmark
│   └── writing.yaml              # Built-in writing benchmark
│
├── tests/
│   ├── core/
│   │   ├── runner.test.ts
│   │   ├── judge.test.ts
│   │   └── cost.test.ts
│   ├── providers/
│   │   └── registry.test.ts
│   ├── ui/
│   │   └── SideBySide.test.ts
│   └── fixtures/
│       ├── responses.json        # Cached model responses for testing
│       └── benchmarks.yaml
│
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── biome.json
├── vitest.config.ts
├── LICENSE                       # MIT
├── CONTRIBUTING.md
└── README.md
```

---

## 5. Core Types

```typescript
// src/core/types.ts

export interface ModelConfig {
  /** Display name (e.g., "Claude Sonnet") */
  name: string;
  /** Full model ID (e.g., "claude-sonnet-4-20250514") */
  modelId: string;
  /** Provider name (e.g., "anthropic", "openai") */
  provider: string;
  /** Alias used in CLI (e.g., "claude-sonnet") */
  alias: string;
  /** Pricing per million tokens */
  pricing: {
    input: number;   // $ per 1M input tokens
    output: number;  // $ per 1M output tokens
  };
}

export interface ComparisonRequest {
  prompt: string;
  systemPrompt?: string;
  models: ModelConfig[];
  options: {
    temperature: number;
    maxTokens: number;
    stream: boolean;
    timeout: number;
  };
}

export interface ModelResponse {
  model: ModelConfig;
  output: string;
  timing: {
    startedAt: number;       // timestamp ms
    firstTokenAt?: number;   // timestamp ms (streaming only)
    completedAt: number;     // timestamp ms
    totalMs: number;
    timeToFirstToken?: number; // ms
  };
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  cost: {
    inputCost: number;   // USD
    outputCost: number;  // USD
    totalCost: number;   // USD
  };
  status: 'success' | 'error' | 'timeout';
  error?: string;
}

export interface ComparisonResult {
  id: string;                // ULID
  prompt: string;
  systemPrompt?: string;
  responses: ModelResponse[];
  judge?: JudgeVerdict;
  createdAt: string;         // ISO timestamp
  totalCost: number;
  totalTimeMs: number;
}

export interface JudgeVerdict {
  winner: string;           // model alias
  reasoning: string;
  scores: {
    model: string;
    score: number;          // 1-10
    strengths: string[];
    weaknesses: string[];
  }[];
  judgeModel: string;
  judgeCost: number;
}

export interface BenchmarkSuite {
  name: string;
  description?: string;
  models: string[];          // model aliases
  judge?: {
    enabled: boolean;
    model?: string;
    criteria?: string;
  };
  prompts: BenchmarkPrompt[];
}

export interface BenchmarkPrompt {
  name: string;
  prompt: string;
  system?: string;
  criteria?: string;         // specific judging criteria for this prompt
  expectedContains?: string[];  // output should contain these strings
  maxTokens?: number;
}

export interface BenchmarkReport {
  suite: string;
  results: ComparisonResult[];
  summary: {
    model: string;
    wins: number;
    avgScore: number;
    avgTimeMs: number;
    avgCost: number;
    totalCost: number;
  }[];
  totalCost: number;
  totalTimeMs: number;
}
```

---

## 6. Model Registry & Pricing

```typescript
// src/core/models.ts

export const MODEL_REGISTRY: Record<string, ModelConfig> = {
  // Anthropic
  'claude-sonnet': {
    name: 'Claude Sonnet',
    modelId: 'claude-sonnet-4-20250514',
    provider: 'anthropic',
    alias: 'claude-sonnet',
    pricing: { input: 3.0, output: 15.0 },
  },
  'claude-haiku': {
    name: 'Claude Haiku',
    modelId: 'claude-haiku-4-5-20251001',
    provider: 'anthropic',
    alias: 'claude-haiku',
    pricing: { input: 0.80, output: 4.0 },
  },
  'claude-opus': {
    name: 'Claude Opus',
    modelId: 'claude-opus-4-6',
    provider: 'anthropic',
    alias: 'claude-opus',
    pricing: { input: 15.0, output: 75.0 },
  },

  // OpenAI
  'gpt-4o': {
    name: 'GPT-4o',
    modelId: 'gpt-4o',
    provider: 'openai',
    alias: 'gpt-4o',
    pricing: { input: 2.5, output: 10.0 },
  },
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    modelId: 'gpt-4o-mini',
    provider: 'openai',
    alias: 'gpt-4o-mini',
    pricing: { input: 0.15, output: 0.6 },
  },
  'gpt-4.1': {
    name: 'GPT-4.1',
    modelId: 'gpt-4.1',
    provider: 'openai',
    alias: 'gpt-4.1',
    pricing: { input: 2.0, output: 8.0 },
  },
  'gpt-4.1-mini': {
    name: 'GPT-4.1 Mini',
    modelId: 'gpt-4.1-mini',
    provider: 'openai',
    alias: 'gpt-4.1-mini',
    pricing: { input: 0.40, output: 1.6 },
  },
  'gpt-4.1-nano': {
    name: 'GPT-4.1 Nano',
    modelId: 'gpt-4.1-nano',
    provider: 'openai',
    alias: 'gpt-4.1-nano',
    pricing: { input: 0.10, output: 0.40 },
  },
  'o3-mini': {
    name: 'o3-mini',
    modelId: 'o3-mini',
    provider: 'openai',
    alias: 'o3-mini',
    pricing: { input: 1.10, output: 4.40 },
  },

  // Google
  'gemini-pro': {
    name: 'Gemini 2.0 Pro',
    modelId: 'gemini-2.0-pro',
    provider: 'google',
    alias: 'gemini-pro',
    pricing: { input: 1.25, output: 10.0 },
  },
  'gemini-flash': {
    name: 'Gemini 2.0 Flash',
    modelId: 'gemini-2.0-flash',
    provider: 'google',
    alias: 'gemini-flash',
    pricing: { input: 0.10, output: 0.40 },
  },

  // Groq (fast inference for open models)
  'llama3': {
    name: 'Llama 3.1 70B',
    modelId: 'llama-3.1-70b-versatile',
    provider: 'groq',
    alias: 'llama3',
    pricing: { input: 0.59, output: 0.79 },
  },

  // DeepSeek
  'deepseek': {
    name: 'DeepSeek Chat',
    modelId: 'deepseek-chat',
    provider: 'deepseek',
    alias: 'deepseek',
    pricing: { input: 0.14, output: 0.28 },
  },

  // Mistral
  'mistral-large': {
    name: 'Mistral Large',
    modelId: 'mistral-large-latest',
    provider: 'mistral',
    alias: 'mistral-large',
    pricing: { input: 2.0, output: 6.0 },
  },
};

/**
 * Resolve a model alias (or full model ID) to a ModelConfig.
 * Supports:
 *   - Registry aliases: "claude-sonnet" → Claude Sonnet config
 *   - Local models: "local:llama3.2" → Ollama config
 *   - Full model IDs: "claude-sonnet-4-20250514" → lookup by modelId
 */
export function resolveModel(input: string): ModelConfig {
  // Check for local (Ollama) prefix
  if (input.startsWith('local:')) {
    const modelName = input.slice(6);
    return {
      name: `Ollama: ${modelName}`,
      modelId: modelName,
      provider: 'ollama',
      alias: input,
      pricing: { input: 0, output: 0 }, // local = free
    };
  }

  // Check alias registry
  if (MODEL_REGISTRY[input]) {
    return MODEL_REGISTRY[input];
  }

  // Check by full model ID
  const byModelId = Object.values(MODEL_REGISTRY).find(m => m.modelId === input);
  if (byModelId) return byModelId;

  throw new Error(
    `Unknown model: "${input}". Run "aidiff models" to see available models.`
  );
}
```

---

## 7. Core Runner — Parallel Model Execution

```typescript
// src/core/runner.ts

import { generateText, streamText } from 'ai';
import { getProvider } from '../providers/registry';
import type { ComparisonRequest, ComparisonResult, ModelResponse } from './types';
import { calculateCost } from './cost';
import { ulid } from 'ulid';

export interface StreamCallbacks {
  onToken: (modelAlias: string, token: string) => void;
  onComplete: (modelAlias: string, response: ModelResponse) => void;
  onError: (modelAlias: string, error: Error) => void;
}

/**
 * Run a prompt against multiple models in parallel.
 * Supports both streaming and non-streaming modes.
 */
export async function runComparison(
  request: ComparisonRequest,
  callbacks?: StreamCallbacks
): Promise<ComparisonResult> {
  const startTime = Date.now();
  
  const responsePromises = request.models.map(model =>
    runSingleModel(model, request, callbacks)
  );

  // Run all models in parallel, catch individual errors
  const responses = await Promise.all(
    responsePromises.map(p =>
      p.catch(error => ({
        error: error.message,
        status: 'error' as const,
      }))
    )
  );

  const validResponses = responses.filter(
    (r): r is ModelResponse => r.status !== undefined
  );

  return {
    id: ulid(),
    prompt: request.prompt,
    systemPrompt: request.systemPrompt,
    responses: validResponses,
    createdAt: new Date().toISOString(),
    totalCost: validResponses.reduce((sum, r) => sum + (r.cost?.totalCost ?? 0), 0),
    totalTimeMs: Date.now() - startTime,
  };
}

async function runSingleModel(
  model: ModelConfig,
  request: ComparisonRequest,
  callbacks?: StreamCallbacks
): Promise<ModelResponse> {
  const provider = getProvider(model.provider);
  const startedAt = Date.now();
  let firstTokenAt: number | undefined;

  try {
    if (request.options.stream && callbacks) {
      // Streaming mode
      const result = await streamText({
        model: provider(model.modelId),
        prompt: request.prompt,
        system: request.systemPrompt,
        temperature: request.options.temperature,
        maxTokens: request.options.maxTokens,
        abortSignal: AbortSignal.timeout(request.options.timeout * 1000),
      });

      let fullText = '';
      for await (const chunk of result.textStream) {
        if (!firstTokenAt) firstTokenAt = Date.now();
        fullText += chunk;
        callbacks.onToken(model.alias, chunk);
      }

      const usage = await result.usage;
      const completedAt = Date.now();
      const cost = calculateCost(model, usage.promptTokens, usage.completionTokens);

      const response: ModelResponse = {
        model,
        output: fullText,
        timing: {
          startedAt,
          firstTokenAt,
          completedAt,
          totalMs: completedAt - startedAt,
          timeToFirstToken: firstTokenAt ? firstTokenAt - startedAt : undefined,
        },
        usage: {
          inputTokens: usage.promptTokens,
          outputTokens: usage.completionTokens,
          totalTokens: usage.promptTokens + usage.completionTokens,
        },
        cost,
        status: 'success',
      };

      callbacks.onComplete(model.alias, response);
      return response;

    } else {
      // Non-streaming mode
      const result = await generateText({
        model: provider(model.modelId),
        prompt: request.prompt,
        system: request.systemPrompt,
        temperature: request.options.temperature,
        maxTokens: request.options.maxTokens,
        abortSignal: AbortSignal.timeout(request.options.timeout * 1000),
      });

      const completedAt = Date.now();
      const cost = calculateCost(model, result.usage.promptTokens, result.usage.completionTokens);

      return {
        model,
        output: result.text,
        timing: {
          startedAt,
          completedAt,
          totalMs: completedAt - startedAt,
        },
        usage: {
          inputTokens: result.usage.promptTokens,
          outputTokens: result.usage.completionTokens,
          totalTokens: result.usage.promptTokens + result.usage.completionTokens,
        },
        cost,
        status: 'success',
      };
    }
  } catch (error) {
    const completedAt = Date.now();
    const response: ModelResponse = {
      model,
      output: '',
      timing: {
        startedAt,
        completedAt,
        totalMs: completedAt - startedAt,
      },
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
      status: error.name === 'AbortError' ? 'timeout' : 'error',
      error: error.message,
    };
    callbacks?.onError(model.alias, error);
    return response;
  }
}
```

---

## 8. Provider Registry

```typescript
// src/providers/registry.ts

import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOllama } from 'ollama-ai-provider';
import { getConfig } from '../storage/config';

type ProviderFactory = (modelId: string) => any;

const providers: Record<string, () => ProviderFactory> = {
  anthropic: () => {
    const key = process.env.ANTHROPIC_API_KEY || getConfig().keys?.anthropic;
    if (!key) throw new Error('ANTHROPIC_API_KEY not set. Run: export ANTHROPIC_API_KEY=sk-ant-...');
    return createAnthropic({ apiKey: key });
  },

  openai: () => {
    const key = process.env.OPENAI_API_KEY || getConfig().keys?.openai;
    if (!key) throw new Error('OPENAI_API_KEY not set. Run: export OPENAI_API_KEY=sk-...');
    return createOpenAI({ apiKey: key });
  },

  google: () => {
    const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY || getConfig().keys?.google;
    if (!key) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not set.');
    return createGoogleGenerativeAI({ apiKey: key });
  },

  groq: () => {
    const key = process.env.GROQ_API_KEY || getConfig().keys?.groq;
    if (!key) throw new Error('GROQ_API_KEY not set.');
    // Groq uses OpenAI-compatible API
    return createOpenAI({ apiKey: key, baseURL: 'https://api.groq.com/openai/v1' });
  },

  deepseek: () => {
    const key = process.env.DEEPSEEK_API_KEY || getConfig().keys?.deepseek;
    if (!key) throw new Error('DEEPSEEK_API_KEY not set.');
    return createOpenAI({ apiKey: key, baseURL: 'https://api.deepseek.com' });
  },

  mistral: () => {
    const key = process.env.MISTRAL_API_KEY || getConfig().keys?.mistral;
    if (!key) throw new Error('MISTRAL_API_KEY not set.');
    return createOpenAI({ apiKey: key, baseURL: 'https://api.mistral.ai/v1' });
  },

  ollama: () => {
    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    return createOllama({ baseURL: baseUrl });
  },
};

// Cache initialized providers
const cache = new Map<string, ProviderFactory>();

export function getProvider(providerName: string): ProviderFactory {
  if (!providers[providerName]) {
    throw new Error(`Unknown provider: ${providerName}`);
  }

  if (!cache.has(providerName)) {
    cache.set(providerName, providers[providerName]());
  }

  return cache.get(providerName)!;
}

/**
 * Check which providers have valid API keys configured.
 * Used by the `aidiff models` command.
 */
export function getAvailableProviders(): string[] {
  const available: string[] = [];
  for (const [name, factory] of Object.entries(providers)) {
    try {
      factory();
      available.push(name);
    } catch {
      // Key not set — skip
    }
  }
  // Ollama is always "available" — we check connectivity separately
  if (!available.includes('ollama')) available.push('ollama');
  return available;
}
```

---

## 9. AI Judge

```typescript
// src/core/judge.ts

import { generateText } from 'ai';
import { getProvider } from '../providers/registry';
import { resolveModel } from './models';
import { calculateCost } from './cost';
import type { ComparisonResult, JudgeVerdict, ModelResponse } from './types';

const DEFAULT_JUDGE_MODEL = 'claude-sonnet';

const JUDGE_SYSTEM_PROMPT = `You are an expert AI output evaluator. You will be given a prompt and responses from multiple AI models. Your job is to evaluate each response objectively and pick a winner.

Evaluate on these criteria (unless the user specifies different criteria):
1. **Correctness**: Is the response factually accurate and logically sound?
2. **Completeness**: Does it fully address the prompt?
3. **Clarity**: Is it well-written, organized, and easy to understand?
4. **Conciseness**: Does it avoid unnecessary verbosity?
5. **Code Quality** (if applicable): Is the code correct, idiomatic, well-structured?

Be fair and objective. Do not favor any model brand. Focus only on output quality.

Respond in this exact JSON format:
{
  "winner": "<model_alias>",
  "reasoning": "<2-3 sentence explanation of why the winner was chosen>",
  "scores": [
    {
      "model": "<model_alias>",
      "score": <1-10>,
      "strengths": ["<strength1>", "<strength2>"],
      "weaknesses": ["<weakness1>"]
    }
  ]
}`;

export async function judgeComparison(
  result: ComparisonResult,
  options: {
    judgeModel?: string;
    criteria?: string;
  } = {}
): Promise<JudgeVerdict> {
  const judgeModelConfig = resolveModel(options.judgeModel || DEFAULT_JUDGE_MODEL);
  const provider = getProvider(judgeModelConfig.provider);

  // Build the comparison prompt for the judge
  const responseSections = result.responses
    .filter(r => r.status === 'success')
    .map(r => `### Model: ${r.model.alias}\n\n${r.output}`)
    .join('\n\n---\n\n');

  const customCriteria = options.criteria
    ? `\n\nUSER'S CUSTOM EVALUATION CRITERIA:\n${options.criteria}\n\nUse these criteria INSTEAD of the default criteria.`
    : '';

  const judgePrompt = `## Original Prompt\n\n${result.prompt}\n\n## Model Responses\n\n${responseSections}${customCriteria}\n\nEvaluate the responses and return your verdict as JSON.`;

  const judgeResult = await generateText({
    model: provider(judgeModelConfig.modelId),
    system: JUDGE_SYSTEM_PROMPT,
    prompt: judgePrompt,
    temperature: 0,
    maxTokens: 1024,
  });

  // Parse the judge's response
  const jsonMatch = judgeResult.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Judge did not return valid JSON');
  }

  const verdict = JSON.parse(jsonMatch[0]) as JudgeVerdict;
  verdict.judgeModel = judgeModelConfig.alias;
  verdict.judgeCost = calculateCost(
    judgeModelConfig,
    judgeResult.usage.promptTokens,
    judgeResult.usage.completionTokens
  ).totalCost;

  return verdict;
}
```

---

## 10. Terminal UI (Ink Components)

### App Root

```tsx
// src/ui/App.tsx

import React, { useState, useEffect } from 'react';
import { Box, Text, render } from 'ink';
import { Header } from './components/Header';
import { SideBySide } from './components/SideBySide';
import { Stats } from './components/Stats';
import { Judge } from './components/Judge';
import { Summary } from './components/Summary';
import { Spinner } from './components/Spinner';
import { runComparison } from '../core/runner';
import { judgeComparison } from '../core/judge';
import type { ComparisonRequest, ComparisonResult, JudgeVerdict } from '../core/types';

interface AppProps {
  request: ComparisonRequest;
  showJudge: boolean;
  judgeModel?: string;
  judgeCriteria?: string;
}

export function App({ request, showJudge, judgeModel, judgeCriteria }: AppProps) {
  const [streams, setStreams] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [verdict, setVerdict] = useState<JudgeVerdict | null>(null);
  const [judging, setJudging] = useState(false);
  const [completedModels, setCompletedModels] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Initialize empty streams
    const initial: Record<string, string> = {};
    request.models.forEach(m => { initial[m.alias] = ''; });
    setStreams(initial);

    // Run comparison with streaming callbacks
    runComparison(request, {
      onToken: (alias, token) => {
        setStreams(prev => ({ ...prev, [alias]: (prev[alias] || '') + token }));
      },
      onComplete: (alias, _response) => {
        setCompletedModels(prev => new Set([...prev, alias]));
      },
      onError: (alias, error) => {
        setStreams(prev => ({ ...prev, [alias]: `ERROR: ${error.message}` }));
        setCompletedModels(prev => new Set([...prev, alias]));
      },
    }).then(async (comparisonResult) => {
      setResult(comparisonResult);

      // Run judge if requested
      if (showJudge) {
        setJudging(true);
        try {
          const judgeVerdict = await judgeComparison(comparisonResult, {
            judgeModel,
            criteria: judgeCriteria,
          });
          setVerdict(judgeVerdict);
        } catch (err) {
          // Judge failed — show comparison without verdict
        }
        setJudging(false);
      }
    });
  }, []);

  const allComplete = completedModels.size === request.models.length;

  return (
    <Box flexDirection="column" padding={1}>
      <Header prompt={request.prompt} models={request.models} />

      <SideBySide
        models={request.models}
        streams={streams}
        completedModels={completedModels}
      />

      {allComplete && result && (
        <>
          <Stats responses={result.responses} />
          
          {judging && (
            <Box marginTop={1}>
              <Spinner label="Judge is evaluating responses..." />
            </Box>
          )}
          
          {verdict && <Judge verdict={verdict} />}
          
          <Summary result={result} verdict={verdict} />
        </>
      )}
    </Box>
  );
}

export function renderApp(props: AppProps) {
  render(<App {...props} />);
}
```

### Side-by-Side Layout

```tsx
// src/ui/components/SideBySide.tsx

import React from 'react';
import { Box, Text } from 'ink';
import { useTerminalSize } from '../hooks/useTerminalSize';
import { ModelColumn } from './ModelColumn';
import type { ModelConfig } from '../../core/types';

interface Props {
  models: ModelConfig[];
  streams: Record<string, string>;
  completedModels: Set<string>;
}

export function SideBySide({ models, streams, completedModels }: Props) {
  const { columns } = useTerminalSize();
  
  // Calculate column width: terminal width / num models - padding/borders
  const numModels = models.length;
  const borderChars = numModels + 1;  // │ between each + edges
  const padding = numModels * 2;       // 1 char padding each side
  const availableWidth = columns - borderChars - padding;
  const colWidth = Math.floor(availableWidth / numModels);

  return (
    <Box flexDirection="row" borderStyle="single" marginTop={1}>
      {models.map((model, i) => (
        <React.Fragment key={model.alias}>
          {i > 0 && (
            <Box width={1}>
              <Text dimColor>│</Text>
            </Box>
          )}
          <ModelColumn
            model={model}
            content={streams[model.alias] || ''}
            isComplete={completedModels.has(model.alias)}
            width={colWidth}
          />
        </React.Fragment>
      ))}
    </Box>
  );
}
```

### Model Column

```tsx
// src/ui/components/ModelColumn.tsx

import React from 'react';
import { Box, Text } from 'ink';
import { Spinner } from './Spinner';
import type { ModelConfig } from '../../core/types';

// Color assignments for up to 6 models
const MODEL_COLORS = ['cyan', 'green', 'yellow', 'magenta', 'blue', 'red'] as const;

interface Props {
  model: ModelConfig;
  content: string;
  isComplete: boolean;
  width: number;
}

export function ModelColumn({ model, content, isComplete, width }: Props) {
  const colorIndex = 0; // Will be passed from parent based on index
  
  return (
    <Box flexDirection="column" width={width} paddingX={1}>
      {/* Model name header */}
      <Box marginBottom={1}>
        <Text bold color="cyan">
          {model.name}
        </Text>
        {!isComplete && <Spinner />}
        {isComplete && <Text color="green"> ✓</Text>}
      </Box>

      {/* Response content */}
      <Box flexDirection="column">
        <Text wrap="wrap">
          {content || (isComplete ? '(empty response)' : '')}
        </Text>
      </Box>
    </Box>
  );
}
```

### Stats Bar

```tsx
// src/ui/components/Stats.tsx

import React from 'react';
import { Box, Text } from 'ink';
import type { ModelResponse } from '../../core/types';

interface Props {
  responses: ModelResponse[];
}

export function Stats({ responses }: Props) {
  return (
    <Box flexDirection="column" marginTop={1} borderStyle="single" paddingX={1}>
      <Text bold underline>Performance</Text>
      
      <Box flexDirection="row" marginTop={1}>
        {/* Column headers */}
        <Box width={20}><Text bold>Model</Text></Box>
        <Box width={12}><Text bold>Time</Text></Box>
        <Box width={10}><Text bold>TTFT</Text></Box>
        <Box width={12}><Text bold>Tokens</Text></Box>
        <Box width={12}><Text bold>Tok/sec</Text></Box>
        <Box width={10}><Text bold>Cost</Text></Box>
      </Box>

      {responses.map(r => {
        const tokPerSec = r.timing.totalMs > 0
          ? ((r.usage.outputTokens / r.timing.totalMs) * 1000).toFixed(1)
          : '-';
        
        // Determine if this model was fastest
        const fastest = responses.reduce((min, resp) =>
          resp.timing.totalMs < min.timing.totalMs ? resp : min
        );
        const isFastest = r.model.alias === fastest.model.alias;

        return (
          <Box flexDirection="row" key={r.model.alias}>
            <Box width={20}>
              <Text color={isFastest ? 'green' : undefined}>
                {r.model.name}
                {isFastest ? ' ⚡' : ''}
              </Text>
            </Box>
            <Box width={12}>
              <Text>{(r.timing.totalMs / 1000).toFixed(2)}s</Text>
            </Box>
            <Box width={10}>
              <Text>
                {r.timing.timeToFirstToken
                  ? `${r.timing.timeToFirstToken}ms`
                  : '-'}
              </Text>
            </Box>
            <Box width={12}>
              <Text>{r.usage.inputTokens}→{r.usage.outputTokens}</Text>
            </Box>
            <Box width={12}>
              <Text>{tokPerSec} t/s</Text>
            </Box>
            <Box width={10}>
              <Text color="yellow">${r.cost.totalCost.toFixed(4)}</Text>
            </Box>
          </Box>
        );
      })}

      {/* Total cost */}
      <Box marginTop={1}>
        <Text dimColor>
          Total cost: ${responses.reduce((s, r) => s + r.cost.totalCost, 0).toFixed(4)}
        </Text>
      </Box>
    </Box>
  );
}
```

### Judge Verdict Display

```tsx
// src/ui/components/Judge.tsx

import React from 'react';
import { Box, Text } from 'ink';
import type { JudgeVerdict } from '../../core/types';

interface Props {
  verdict: JudgeVerdict;
}

export function Judge({ verdict }: Props) {
  return (
    <Box flexDirection="column" marginTop={1} borderStyle="double" paddingX={1} borderColor="yellow">
      <Text bold color="yellow">🏆 Judge Verdict (by {verdict.judgeModel})</Text>
      
      <Box marginTop={1}>
        <Text>
          Winner: <Text bold color="green">{verdict.winner}</Text>
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text wrap="wrap">{verdict.reasoning}</Text>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        {verdict.scores.map(s => (
          <Box key={s.model} flexDirection="row" gap={2}>
            <Box width={20}>
              <Text bold>{s.model}</Text>
            </Box>
            <Box width={8}>
              <Text color={s.score >= 8 ? 'green' : s.score >= 5 ? 'yellow' : 'red'}>
                {s.score}/10
              </Text>
            </Box>
            <Text dimColor>
              +{s.strengths.join(', ')}
              {s.weaknesses.length > 0 ? ` | -${s.weaknesses.join(', ')}` : ''}
            </Text>
          </Box>
        ))}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Judge cost: ${verdict.judgeCost.toFixed(4)}</Text>
      </Box>
    </Box>
  );
}
```

---

## 11. CLI Entry Point

```typescript
// src/cli/index.ts

#!/usr/bin/env node

import { Command } from 'commander';
import { renderApp } from '../ui/App';
import { resolveModel } from '../core/models';
import { readFileSync } from 'fs';
import { version } from '../../package.json';

const program = new Command();

program
  .name('aidiff')
  .description('Compare AI model outputs side-by-side in your terminal')
  .version(version)
  .argument('[prompt...]', 'The prompt to send to all models')
  .option('-m, --model <models...>', 'Models to compare (at least 2)')
  .option('-s, --system <message>', 'System prompt for all models')
  .option('-f, --file <path>', 'Read prompt from file')
  .option('-t, --temperature <n>', 'Temperature', parseFloat, 0)
  .option('--max-tokens <n>', 'Max tokens per response', parseInt, 2048)
  .option('--judge', 'Use AI judge to evaluate responses')
  .option('--judge-model <model>', 'Model for judging', 'claude-sonnet')
  .option('--judge-criteria <text>', 'Custom judging criteria')
  .option('--no-stream', 'Disable streaming')
  .option('--json', 'Output as JSON')
  .option('--markdown', 'Output as Markdown')
  .option('--html', 'Output as HTML')
  .option('--save [name]', 'Save results to history')
  .option('--timeout <seconds>', 'Timeout per model', parseInt, 60)
  .option('-v, --verbose', 'Show debug info')
  .action(async (promptParts, options) => {
    // Resolve prompt from args, file, or stdin
    let prompt: string;
    
    if (options.file) {
      prompt = readFileSync(options.file, 'utf-8').trim();
    } else if (promptParts.length > 0) {
      prompt = promptParts.join(' ');
    } else if (!process.stdin.isTTY) {
      // Read from stdin (piped input)
      const chunks: Buffer[] = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk);
      }
      prompt = Buffer.concat(chunks).toString('utf-8').trim();
    } else {
      console.error('Error: No prompt provided. Use aidiff "your prompt" or pipe via stdin.');
      process.exit(1);
    }

    // Validate models
    if (!options.model || options.model.length < 2) {
      console.error('Error: At least 2 models required. Use -m model1 -m model2');
      process.exit(1);
    }

    const models = options.model.map(resolveModel);

    // Check for API keys upfront
    for (const model of models) {
      try {
        const { getProvider } = await import('../providers/registry');
        getProvider(model.provider);
      } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    }

    const request = {
      prompt,
      systemPrompt: options.system,
      models,
      options: {
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        stream: options.stream !== false,
        timeout: options.timeout,
      },
    };

    // Handle non-interactive output formats
    if (options.json || options.markdown || options.html) {
      const { runComparison } = await import('../core/runner');
      const result = await runComparison(request);
      
      if (options.judge) {
        const { judgeComparison } = await import('../core/judge');
        result.judge = await judgeComparison(result, {
          judgeModel: options.judgeModel,
          criteria: options.judgeCriteria,
        });
      }

      if (options.json) {
        const { formatJSON } = await import('../output/json');
        console.log(formatJSON(result));
      } else if (options.markdown) {
        const { formatMarkdown } = await import('../output/markdown');
        console.log(formatMarkdown(result));
      } else if (options.html) {
        const { formatHTML } = await import('../output/html');
        console.log(formatHTML(result));
      }

      if (options.save) {
        const { saveResult } = await import('../storage/history');
        await saveResult(result, typeof options.save === 'string' ? options.save : undefined);
      }
      return;
    }

    // Interactive terminal UI
    renderApp({
      request,
      showJudge: !!options.judge,
      judgeModel: options.judgeModel,
      judgeCriteria: options.judgeCriteria,
    });
  });

// Subcommands
program
  .command('models')
  .description('List available models and pricing')
  .action(async () => {
    const { listModels } = await import('./commands/models');
    await listModels();
  });

program
  .command('history')
  .description('Browse saved comparisons')
  .argument('[action]', 'show, list, or clear')
  .argument('[name]', 'comparison name')
  .action(async (action, name) => {
    const { handleHistory } = await import('./commands/history');
    await handleHistory(action, name);
  });

program
  .command('config')
  .description('Manage configuration')
  .argument('<action>', 'set, get, or list')
  .argument('[key]', 'config key')
  .argument('[value]', 'config value')
  .action(async (action, key, value) => {
    const { handleConfig } = await import('./commands/config');
    await handleConfig(action, key, value);
  });

program
  .command('bench')
  .description('Run a benchmark suite')
  .argument('<file>', 'path to benchmark YAML file')
  .option('--save [name]', 'Save benchmark results')
  .action(async (file, options) => {
    const { runBenchmark } = await import('./commands/bench');
    await runBenchmark(file, options);
  });

program.parse();
```

---

## 12. Benchmark System

### Benchmark YAML Format

```yaml
# benchmarks/coding.yaml

name: "Coding Benchmark"
description: "Compare models on common coding tasks"

models:
  - claude-sonnet
  - gpt-4o
  - gemini-pro

judge:
  enabled: true
  model: claude-sonnet
  criteria: "Focus on code correctness, efficiency, and readability"

prompts:
  - name: "Merge sorted lists"
    prompt: "Write a Python function to merge two sorted lists into one sorted list. Include type hints and handle edge cases."
    expectedContains: ["def merge", "List"]
    
  - name: "Binary search"
    prompt: "Implement binary search in TypeScript. The function should return the index or -1 if not found."
    expectedContains: ["function", "number"]

  - name: "SQL optimization"
    prompt: |
      Optimize this SQL query for a users table with 10M rows:
      SELECT * FROM users WHERE email LIKE '%@gmail.com' AND created_at > '2024-01-01' ORDER BY created_at DESC LIMIT 100;
    criteria: "Evaluate on query optimization knowledge and practical advice"

  - name: "Debug this code"
    prompt: |
      Find and fix the bug in this Python code:
      
      def flatten(lst):
          result = []
          for item in lst:
              if isinstance(item, list):
                  result.extend(flatten(item))
              else:
                  result.append(item)
              return result
    criteria: "Must correctly identify the indentation bug (return inside loop)"

  - name: "System design"
    prompt: "Design a URL shortener service. Include the API design, database schema, and how you'd handle high traffic."
    maxTokens: 4096
    criteria: "Evaluate on completeness, scalability considerations, and practical trade-offs"
```

### Benchmark Runner

```typescript
// src/bench/runner.ts

import { readFileSync } from 'fs';
import { parse as parseYAML } from 'yaml';
import { runComparison } from '../core/runner';
import { judgeComparison } from '../core/judge';
import { resolveModel } from '../core/models';
import type { BenchmarkSuite, BenchmarkReport, ComparisonResult } from '../core/types';

export async function runBenchmarkSuite(filePath: string): Promise<BenchmarkReport> {
  const raw = readFileSync(filePath, 'utf-8');
  const suite: BenchmarkSuite = parseYAML(raw);
  
  const models = suite.models.map(resolveModel);
  const results: ComparisonResult[] = [];
  
  console.log(`\n🏁 Running benchmark: ${suite.name}`);
  console.log(`   ${suite.prompts.length} prompts × ${models.length} models\n`);

  for (let i = 0; i < suite.prompts.length; i++) {
    const benchPrompt = suite.prompts[i];
    console.log(`  [${i + 1}/${suite.prompts.length}] ${benchPrompt.name}...`);

    const result = await runComparison({
      prompt: benchPrompt.prompt,
      systemPrompt: benchPrompt.system,
      models,
      options: {
        temperature: 0,
        maxTokens: benchPrompt.maxTokens || 2048,
        stream: false,
        timeout: 120,
      },
    });

    // Run judge if configured
    if (suite.judge?.enabled) {
      try {
        result.judge = await judgeComparison(result, {
          judgeModel: suite.judge.model,
          criteria: benchPrompt.criteria || suite.judge.criteria,
        });
        console.log(`    Winner: ${result.judge.winner}`);
      } catch (err) {
        console.log(`    Judge failed: ${err.message}`);
      }
    }

    // Check expectedContains if provided
    if (benchPrompt.expectedContains) {
      for (const response of result.responses) {
        const missing = benchPrompt.expectedContains.filter(
          s => !response.output.includes(s)
        );
        if (missing.length > 0) {
          console.log(`    ⚠ ${response.model.alias} missing: ${missing.join(', ')}`);
        }
      }
    }

    results.push(result);
  }

  // Generate summary
  const modelStats = models.map(model => {
    const modelResults = results.map(r => ({
      response: r.responses.find(resp => resp.model.alias === model.alias),
      judgeScore: r.judge?.scores.find(s => s.model === model.alias),
      isWinner: r.judge?.winner === model.alias,
    }));

    return {
      model: model.alias,
      wins: modelResults.filter(r => r.isWinner).length,
      avgScore: modelResults.reduce((sum, r) => sum + (r.judgeScore?.score || 0), 0) / modelResults.length,
      avgTimeMs: modelResults.reduce((sum, r) => sum + (r.response?.timing.totalMs || 0), 0) / modelResults.length,
      avgCost: modelResults.reduce((sum, r) => sum + (r.response?.cost.totalCost || 0), 0) / modelResults.length,
      totalCost: modelResults.reduce((sum, r) => sum + (r.response?.cost.totalCost || 0), 0),
    };
  });

  return {
    suite: suite.name,
    results,
    summary: modelStats.sort((a, b) => b.wins - a.wins),
    totalCost: results.reduce((sum, r) => sum + r.totalCost, 0),
    totalTimeMs: results.reduce((sum, r) => sum + r.totalTimeMs, 0),
  };
}
```

---

## 13. Output Exporters

### Markdown Export

```typescript
// src/output/markdown.ts

import type { ComparisonResult } from '../core/types';

export function formatMarkdown(result: ComparisonResult): string {
  let md = `# AI Model Comparison\n\n`;
  md += `**Prompt:** ${result.prompt}\n\n`;
  md += `**Date:** ${result.createdAt}\n\n`;
  md += `---\n\n`;

  for (const response of result.responses) {
    md += `## ${response.model.name}\n\n`;
    md += `| Metric | Value |\n|--------|-------|\n`;
    md += `| Time | ${(response.timing.totalMs / 1000).toFixed(2)}s |\n`;
    md += `| TTFT | ${response.timing.timeToFirstToken || '-'}ms |\n`;
    md += `| Tokens | ${response.usage.inputTokens} in / ${response.usage.outputTokens} out |\n`;
    md += `| Cost | $${response.cost.totalCost.toFixed(4)} |\n\n`;
    md += `### Response\n\n${response.output}\n\n---\n\n`;
  }

  if (result.judge) {
    md += `## 🏆 Judge Verdict\n\n`;
    md += `**Winner: ${result.judge.winner}**\n\n`;
    md += `${result.judge.reasoning}\n\n`;
    md += `| Model | Score | Strengths | Weaknesses |\n|-------|-------|-----------|------------|\n`;
    for (const s of result.judge.scores) {
      md += `| ${s.model} | ${s.score}/10 | ${s.strengths.join(', ')} | ${s.weaknesses.join(', ')} |\n`;
    }
  }

  md += `\n---\n*Generated by [aidiff](https://github.com/[user]/aidiff)*\n`;
  return md;
}
```

### HTML Export

```typescript
// src/output/html.ts

import type { ComparisonResult } from '../core/types';

export function formatHTML(result: ComparisonResult): string {
  // Generate a self-contained HTML file with embedded CSS
  // that shows a beautiful side-by-side comparison
  // Include syntax highlighting via highlight.js CDN
  // Include a copy button for each response
  // Make it responsive for sharing on social media
  
  const responses = result.responses
    .map(r => `
      <div class="model-card">
        <div class="model-header">
          <h2>${r.model.name}</h2>
          <span class="status ${r.status}">${r.status === 'success' ? '✓' : '✗'}</span>
        </div>
        <div class="stats">
          <span>⏱ ${(r.timing.totalMs / 1000).toFixed(2)}s</span>
          <span>📊 ${r.usage.outputTokens} tokens</span>
          <span>💰 $${r.cost.totalCost.toFixed(4)}</span>
        </div>
        <div class="response">
          <pre><code>${escapeHtml(r.output)}</code></pre>
        </div>
      </div>
    `).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>aidiff — Model Comparison</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0d1117; color: #e6edf3; padding: 2rem; }
    .prompt { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; }
    .prompt h1 { font-size: 1rem; color: #8b949e; margin-bottom: 0.5rem; }
    .prompt p { font-size: 1.1rem; white-space: pre-wrap; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem; }
    .model-card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; overflow: hidden; }
    .model-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid #30363d; }
    .model-header h2 { font-size: 1.1rem; }
    .stats { display: flex; gap: 1rem; padding: 0.75rem 1.5rem; background: #0d1117; font-size: 0.85rem; color: #8b949e; }
    .response { padding: 1.5rem; }
    .response pre { white-space: pre-wrap; word-wrap: break-word; font-size: 0.9rem; line-height: 1.6; }
    .judge { background: #1c1c0e; border: 2px solid #d4a72c; border-radius: 8px; padding: 1.5rem; margin-top: 2rem; }
    .judge h2 { color: #d4a72c; margin-bottom: 1rem; }
    .winner { font-size: 1.3rem; font-weight: bold; color: #3fb950; }
    .footer { text-align: center; margin-top: 2rem; color: #484f58; font-size: 0.8rem; }
    .footer a { color: #58a6ff; text-decoration: none; }
  </style>
</head>
<body>
  <div class="prompt">
    <h1>Prompt</h1>
    <p>${escapeHtml(result.prompt)}</p>
  </div>
  
  <div class="grid">${responses}</div>

  ${result.judge ? `
  <div class="judge">
    <h2>🏆 Judge Verdict</h2>
    <p class="winner">Winner: ${result.judge.winner}</p>
    <p style="margin-top: 1rem;">${escapeHtml(result.judge.reasoning)}</p>
  </div>
  ` : ''}

  <div class="footer">
    Generated by <a href="https://github.com/[user]/aidiff">aidiff</a> on ${result.createdAt}
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script>hljs.highlightAll();</script>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
```

---

## 14. Configuration & Storage

```typescript
// src/storage/config.ts

import { cosmiconfig } from 'cosmiconfig';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(homedir(), '.aidiff');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export interface AidiffConfig {
  defaultModels?: string[];
  defaultJudgeModel?: string;
  keys?: {
    anthropic?: string;
    openai?: string;
    google?: string;
    groq?: string;
    deepseek?: string;
    mistral?: string;
  };
  ollamaBaseUrl?: string;
  defaults?: {
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
    stream?: boolean;
  };
}

export function getConfig(): AidiffConfig {
  ensureConfigDir();
  
  if (existsSync(CONFIG_FILE)) {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
  }
  return {};
}

export function setConfig(key: string, value: string): void {
  ensureConfigDir();
  const config = getConfig();
  
  // Handle nested keys like "keys.openai"
  const parts = key.split('.');
  let obj: any = config;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!obj[parts[i]]) obj[parts[i]] = {};
    obj = obj[parts[i]];
  }
  obj[parts[parts.length - 1]] = value;
  
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function ensureConfigDir(): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
}
```

```typescript
// src/storage/history.ts

import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { ComparisonResult } from '../core/types';

const HISTORY_DIR = join(homedir(), '.aidiff', 'history');

export function saveResult(result: ComparisonResult, name?: string): string {
  mkdirSync(HISTORY_DIR, { recursive: true });
  
  const filename = name || result.id;
  const filepath = join(HISTORY_DIR, `${filename}.json`);
  writeFileSync(filepath, JSON.stringify(result, null, 2));
  
  return filepath;
}

export function loadResult(name: string): ComparisonResult | null {
  const filepath = join(HISTORY_DIR, `${name}.json`);
  if (!existsSync(filepath)) return null;
  return JSON.parse(readFileSync(filepath, 'utf-8'));
}

export function listResults(): string[] {
  if (!existsSync(HISTORY_DIR)) return [];
  return readdirSync(HISTORY_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));
}
```

---

## 15. Cost Calculation

```typescript
// src/core/cost.ts

import type { ModelConfig } from './types';

/**
 * Calculate the cost of a model call based on token usage.
 * Pricing is per 1M tokens.
 */
export function calculateCost(
  model: ModelConfig,
  inputTokens: number,
  outputTokens: number
): { inputCost: number; outputCost: number; totalCost: number } {
  const inputCost = (inputTokens / 1_000_000) * model.pricing.input;
  const outputCost = (outputTokens / 1_000_000) * model.pricing.output;
  
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}

/**
 * Format cost as a human-readable string.
 */
export function formatCost(cost: number): string {
  if (cost === 0) return 'free';
  if (cost < 0.001) return `$${(cost * 100).toFixed(3)}¢`;
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(3)}`;
}
```

---

## 16. Package.json

```json
{
  "name": "aidiff",
  "version": "0.1.0",
  "description": "Compare AI model outputs side-by-side in your terminal",
  "bin": {
    "aidiff": "./dist/cli/index.js"
  },
  "main": "./dist/core/index.js",
  "types": "./dist/core/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "dev": "tsup --watch",
    "build": "tsup",
    "start": "node dist/cli/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "biome check .",
    "lint:fix": "biome check --fix .",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "pnpm build"
  },
  "dependencies": {
    "@ai-sdk/anthropic": "^1.0.0",
    "@ai-sdk/google": "^1.0.0",
    "@ai-sdk/openai": "^1.0.0",
    "ai": "^4.0.0",
    "chalk": "^5.3.0",
    "commander": "^12.0.0",
    "cosmiconfig": "^9.0.0",
    "ink": "^5.0.0",
    "ollama-ai-provider": "^1.0.0",
    "react": "^18.3.0",
    "ulid": "^2.3.0",
    "yaml": "^2.4.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^18.3.0",
    "biome": "^0.5.0",
    "ink-testing-library": "^4.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.6.0",
    "vitest": "^2.0.0"
  },
  "engines": {
    "node": ">=20"
  },
  "keywords": [
    "ai",
    "llm",
    "comparison",
    "benchmark",
    "cli",
    "claude",
    "gpt",
    "gemini",
    "diff"
  ],
  "license": "MIT"
}
```

---

## 17. Build Config

```typescript
// tsup.config.ts

import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'cli/index': 'src/cli/index.ts',
    'core/index': 'src/core/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  target: 'node20',
  banner: {
    js: '#!/usr/bin/env node',
  },
  external: ['react', 'ink'],
});
```

---

## 18. MVP Build Order

### Week 1: Core CLI (make it work)

**Day 1-2:**
- [ ] Project scaffolding (package.json, tsconfig, tsup, biome)
- [ ] Core types (`src/core/types.ts`)
- [ ] Model registry with aliases and pricing (`src/core/models.ts`)
- [ ] Provider registry with Anthropic + OpenAI (`src/providers/`)
- [ ] Cost calculation (`src/core/cost.ts`)

**Day 3-4:**
- [ ] Core runner — parallel execution, non-streaming first (`src/core/runner.ts`)
- [ ] Basic CLI entry point with Commander (`src/cli/index.ts`)
- [ ] Simple console.log output (before Ink UI)
- [ ] Test with real API calls: `aidiff "hello" -m claude-sonnet -m gpt-4o`

**Day 5-6:**
- [ ] Add streaming support to runner
- [ ] Basic Ink UI: SideBySide component with streaming text
- [ ] Stats bar (timing, tokens, cost)
- [ ] Error handling (missing keys, timeouts, API errors)

**Day 7:**
- [ ] AI Judge implementation
- [ ] Judge verdict display
- [ ] `--json` output format
- [ ] First working release! Tag v0.1.0

### Week 2: Polish & Ship (make it beautiful)

**Day 8-9:**
- [ ] Beautiful terminal UI polish (colors, borders, layout)
- [ ] Responsive layout (handle narrow terminals, 3+ models)
- [ ] Google + Groq + Ollama providers
- [ ] `aidiff models` command

**Day 10-11:**
- [ ] Markdown and HTML export
- [ ] History save/load (`--save`, `aidiff history`)
- [ ] Config management (`aidiff config`)
- [ ] Stdin pipe support

**Day 12-13:**
- [ ] Benchmark system (YAML parser, runner, report)
- [ ] Built-in benchmark suites (coding, reasoning, writing)
- [ ] `aidiff bench` command

**Day 14:**
- [ ] README with GIF demos
- [ ] CONTRIBUTING.md
- [ ] GitHub Actions CI (lint, typecheck, test)
- [ ] Publish to npm
- [ ] Post on Twitter/HN/Reddit

---

## 19. README Structure (critical for virality)

The README is arguably the most important file. Here's the structure:

```markdown
# aidiff ⚡

> Compare AI models side-by-side in your terminal. See which one is actually better.

[hero GIF showing a real comparison with streaming + judge verdict]

## Quick Start

\`\`\`bash
npx aidiff "Write a Python fibonacci function" -m claude-sonnet -m gpt-4o
\`\`\`

[screenshot of output]

## Features

- 🔀 **Side-by-side** streaming output comparison
- 🏆 **AI Judge** — let a model evaluate the others
- ⚡ **Parallel execution** — all models run simultaneously  
- 💰 **Cost tracking** — see exactly what each comparison costs
- 📊 **Benchmarks** — run suites of prompts, get aggregate stats
- 🏠 **Local models** — compare Ollama models for free
- 📤 **Export** — Markdown, HTML, JSON output formats
- 💾 **History** — save and revisit past comparisons

## Install

[install instructions]

## Usage

[examples covering main use cases]

## Supported Models

[table of all models with pricing]

## Benchmarks

[explanation + example with built-in suites]

## Why aidiff?

Every developer working with LLMs constantly switches between ChatGPT 
and Claude, pasting the same prompt to see which gives a better answer. 
aidiff makes this a one-liner with real metrics.

## Contributing

[link to CONTRIBUTING.md]
```

**Critical: record a high-quality terminal GIF** (using `vhs` or `asciinema`) that shows:
1. Running a comparison with streaming
2. The judge picking a winner
3. Cost breakdown

This GIF is what gets retweeted. Make it beautiful.

---

## 20. Growth & Distribution Strategy

1. **npm / npx** — zero-install usage via `npx aidiff`
2. **Product Hunt** — launch with a polished demo
3. **Hacker News** — "Show HN: I built a CLI to compare AI models side-by-side"
4. **Twitter/X** — post comparison screenshots (they're inherently viral)
5. **Reddit** — r/programming, r/MachineLearning, r/LocalLLaMA
6. **YouTube** — short demo video
7. **Built-in benchmarks** — publish results, people will argue and contribute
8. **GitHub trending** — good README + star velocity gets you there

