# CLAUDE.md — aidiff Project

## What This Is
`aidiff` is a CLI tool that compares AI model outputs side-by-side in the terminal. Users provide a prompt and 2+ model names, and the tool runs them in parallel, displays streaming results side-by-side, shows performance stats (timing, tokens, cost), and optionally uses an AI judge to pick a winner.

## Implementation Spec
The complete implementation specification is in `docs/SPEC.md`. **Read it fully before writing any code.** It contains:
- Full project structure
- All TypeScript types
- Complete API design for every module
- Model registry with pricing
- UI component specs
- Build order and phasing

## Tech Stack (do not deviate)
- **Runtime:** Node.js >= 20, TypeScript (strict mode)
- **Build:** tsup
- **CLI Framework:** Commander.js
- **Terminal UI:** Ink 5 (React for CLI) + chalk
- **AI SDK:** Vercel AI SDK (`ai` package) with provider packages (@ai-sdk/anthropic, @ai-sdk/openai, @ai-sdk/google, ollama-ai-provider)
- **Config:** cosmiconfig
- **Testing:** Vitest
- **Linting:** Biome
- **Package Manager:** pnpm

## Project Structure
```
aidiff/
├── src/
│   ├── cli/              # CLI entry point + subcommands
│   │   ├── index.ts      # Commander setup, main entry
│   │   └── commands/     # bench, config, history, models
│   ├── core/             # Core logic (no UI dependencies)
│   │   ├── types.ts      # All TypeScript interfaces
│   │   ├── runner.ts     # Parallel model execution + streaming
│   │   ├── models.ts     # Model registry, aliases, pricing
│   │   ├── judge.ts      # AI judge logic
│   │   └── cost.ts       # Cost calculation
│   ├── providers/        # AI provider setup
│   │   └── registry.ts   # Provider factory (Anthropic, OpenAI, Google, Groq, Ollama, DeepSeek, Mistral)
│   ├── ui/               # Ink terminal UI
│   │   ├── App.tsx       # Root component
│   │   └── components/   # Header, SideBySide, ModelColumn, Stats, Judge, Summary, Spinner
│   ├── output/           # Export formats
│   │   ├── markdown.ts
│   │   ├── html.ts
│   │   └── json.ts
│   ├── storage/          # Config + history persistence
│   │   ├── config.ts
│   │   └── history.ts
│   └── bench/            # Benchmark system
│       ├── runner.ts
│       └── parser.ts
├── benchmarks/           # Built-in benchmark YAML files
├── tests/
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── biome.json
```

## Build Order (follow this sequence)

### Phase 1: Foundation
1. Initialize project: pnpm init, install all dependencies, configure tsup/tsconfig/biome
2. `src/core/types.ts` — all interfaces (ComparisonRequest, ModelResponse, ComparisonResult, JudgeVerdict, etc.)
3. `src/core/models.ts` — model registry with aliases and pricing for all providers
4. `src/core/cost.ts` — cost calculation from token usage + pricing
5. `src/providers/registry.ts` — provider factory using Vercel AI SDK

### Phase 2: Core Runner
6. `src/core/runner.ts` — parallel model execution with streaming callbacks (streamText + generateText from Vercel AI SDK)
7. `src/cli/index.ts` — Commander setup with all options, stdin support, basic console.log output first

### Phase 3: Terminal UI
8. `src/ui/components/` — build each Ink component: Header, ModelColumn, SideBySide, Stats, Spinner
9. `src/ui/App.tsx` — wire up streaming state management with React hooks
10. Test the full flow: `node dist/cli/index.js "hello" -m claude-sonnet -m gpt-4o`

### Phase 4: Judge + Export
11. `src/core/judge.ts` — AI judge with structured JSON output
12. `src/ui/components/Judge.tsx` — judge verdict display
13. `src/output/json.ts`, `src/output/markdown.ts`, `src/output/html.ts`
14. `src/storage/config.ts` + `src/storage/history.ts`

### Phase 5: Benchmarks + Polish
15. `src/bench/` — YAML benchmark parser + runner
16. `benchmarks/` — built-in coding/reasoning/writing suites
17. CLI subcommands: models, history, config, bench
18. Error handling polish, edge cases, help text

## Key Implementation Notes

### Vercel AI SDK Usage
```typescript
// Streaming
import { streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const result = await streamText({
  model: anthropic('claude-sonnet-4-20250514'),
  prompt: 'hello',
});
for await (const chunk of result.textStream) { /* ... */ }

// Non-streaming
import { generateText } from 'ai';
const result = await generateText({ model: anthropic('claude-sonnet-4-20250514'), prompt: 'hello' });
```

### Ink Components
- Use Ink 5 with React 18
- All UI in TSX files
- Use `render()` from ink to mount the App
- Use `useStdout()` for terminal width detection
- Use `Box` for layout, `Text` for styled text

### CLI Entry Point
- Must have `#!/usr/bin/env node` shebang
- Use Commander.js for arg parsing
- Support prompt as positional arg, --file, and stdin pipe
- At least 2 models required (-m flag, repeatable)

### Provider Keys
- Read from env vars first: ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, GROQ_API_KEY, DEEPSEEK_API_KEY, MISTRAL_API_KEY
- Fall back to ~/.aidiff/config.json
- Ollama needs no key (local)
- Fail fast with helpful error message if key is missing

### Model Aliases (important — map these exactly)
- claude-sonnet → claude-sonnet-4-20250514
- claude-haiku → claude-haiku-4-5-20251001
- claude-opus → claude-opus-4-6
- gpt-4o → gpt-4o
- gpt-4o-mini → gpt-4o-mini
- gpt-4.1 → gpt-4.1
- gpt-4.1-mini → gpt-4.1-mini
- gemini-pro → gemini-2.0-pro
- gemini-flash → gemini-2.0-flash
- llama3 → llama-3.1-70b-versatile (via Groq)
- deepseek → deepseek-chat
- local:* → Ollama models

## Testing
- Use Vitest
- Mock API calls in tests (don't hit real APIs in CI)
- Test the core runner, cost calculation, model resolution, judge JSON parsing
- Use ink-testing-library for UI component tests

## What NOT to Do
- Don't use LangChain or any other heavy framework
- Don't add a database — use flat JSON files for history
- Don't over-engineer auth — simple API key check is fine
- Don't build a web UI — this is a terminal tool
- Don't use chalk for the main UI — use Ink components (chalk is fine for non-Ink output like --json mode)

